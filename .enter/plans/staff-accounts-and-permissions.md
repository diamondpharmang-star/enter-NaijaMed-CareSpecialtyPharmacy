# Plan: Staff accounts with per-feature dashboard permissions

## Goal
Allow full Admins to create staff login credentials and assign granular access to specific Admin Dashboard sections (Orders, Quote Requests, Manage Products, Categories, Payment Methods). Staff management itself stays Admin-only — never delegable.

## 1. Data model changes

### `profiles.role` — add `"staff"`
- Update `profiles_role_check` constraint to allow `'customer' | 'admin' | 'staff'`.
- Update `AuthContext.tsx` `Profile.role` type to `"customer" | "admin" | "staff"`.

### New table: `staff_permissions`
```sql
create table public.staff_permissions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  can_view_orders boolean not null default false,
  can_view_quotes boolean not null default false,
  can_manage_products boolean not null default false,
  can_manage_categories boolean not null default false,
  can_manage_payment_methods boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.staff_permissions enable row level security;
```
- RLS: Admins can manage (ALL) via `is_admin()`. Staff can `SELECT` their own row (`auth.uid() = user_id`) so the dashboard can read its own permissions client-side.

### Update `is_admin()` usage / add helper
- Keep `is_admin()` as-is (checks `role = 'admin'`).
- Add a new SQL helper `public.has_staff_permission(perm text)` (security definer) that returns true if the caller is an admin (full access) OR is staff with the specific permission flag true. This lets us write RLS policies like:
  `using (is_admin() or has_staff_permission('can_view_orders'))`
- Update RLS policies on `orders`, `medication_quote_requests`, `products`, `categories`, `payment_settings` to also allow staff with the matching permission (SELECT for view-only sections; ALL/UPDATE for manage sections), instead of `is_admin()` alone. Order/quote **update** policies also extend to staff with the relevant permission so they can change statuses if granted.

## 2. Staff creation (edge function, service-role only)
Creating another user's login credentials requires the Supabase Admin API (`auth.admin.createUser`), which needs the **service role key** — never exposed to the browser. So:

- New edge function `supabase/functions/create-staff-user/index.ts`:
  - Verifies the caller is an authenticated admin: reads the `Authorization` header, calls `supabase.auth.getUser(jwt)` using an anon-key client, then checks `profiles.role === 'admin'` for that uid using the service-role client. Rejects with 403 otherwise.
  - Accepts `{ email, password, full_name, permissions: {...} }`.
  - Uses `supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name, account_type: 'retail' } })` — the existing `handle_new_user` trigger will auto-create the `profiles` row (role defaults to `'customer'`).
  - Immediately updates that profile's `role` to `'staff'` (service-role client bypasses RLS).
  - Inserts a row into `staff_permissions` with the provided flags.
  - Returns the new user id on success.
- Frontend never touches the service role key; it only calls `supabase.functions.invoke('create-staff-user', { body: {...} })`.

## 3. Staff management UI
- New page `src/pages/admin/AdminStaffPage.tsx` at route `/admin/staff`, wrapped in `AdminLayout`, but additionally guarded so only `profile.role === 'admin'` (not staff) can view it — staff attempting to visit get redirected to `/admin`.
  - Lists existing staff (query `profiles` where `role = 'staff'`, join/select their `staff_permissions`).
  - "Add staff" dialog: full name, email, password, and checkboxes for each of the 5 permissions. Submits to the `create-staff-user` edge function.
  - Each staff row: editable permission checkboxes (updates `staff_permissions` directly via supabase client — allowed since caller is admin), and a "Remove" action (deletes the `auth.users` row via a second small edge function `delete-staff-user`, or simpler: deactivate by clearing permissions + setting a `profiles.is_disabled` — see decision below).
  - For simplicity and safety, "Remove staff" will call a `delete-staff-user` edge function that uses `auth.admin.deleteUser(id)` (service role), which cascades to `profiles` and `staff_permissions` via `ON DELETE CASCADE`.

## 4. Dashboard access changes
- `AdminDashboard.tsx`: fetch the signed-in user's permissions (admins implicitly have all; staff fetch their `staff_permissions` row). Only render cards the user has access to. Add a 6th card "Manage Staff" → `/admin/staff`, visible only to `role === 'admin'`.
- `AdminLayout.tsx`: extend the guard to allow `role === 'staff'` in addition to `'admin'`, but each individual admin page (`AdminOrdersPage`, `AdminQuotesPage`, `AdminProductsPage`, `AdminCategoriesPage`, `AdminPaymentMethodsPage`) additionally checks the specific permission flag for staff users (via a small shared hook `useStaffPermissions()`), redirecting to `/admin` with a toast if the staff member lacks that specific permission. Admins always pass.
- `AdminLogin.tsx`: update the post-login check to accept `role === 'admin' || role === 'staff'` (currently only allows `'admin'`), otherwise staff could never log in.

## 5. New hook: `useStaffPermissions`
```ts
// returns { isAdmin, permissions, isLoading }
// isAdmin = profile.role === 'admin' (implies full access to everything)
// permissions = staff_permissions row for profile.role === 'staff' (all false if admin/none found)
```
Used by `AdminDashboard` (to filter cards) and each admin sub-page (to gate access).

## Files to add
- `supabase/functions/create-staff-user/index.ts`
- `supabase/functions/delete-staff-user/index.ts`
- `src/hooks/useStaffPermissions.ts`
- `src/pages/admin/AdminStaffPage.tsx`
- 1 combined SQL migration (role enum update, `staff_permissions` table, `has_staff_permission()` function, updated RLS policies)

## Files to modify
- `src/contexts/AuthContext.tsx` (role type)
- `src/pages/AdminLogin.tsx` (allow staff login)
- `src/components/admin/AdminLayout.tsx` (allow staff role generally)
- `src/pages/admin/AdminDashboard.tsx` (permission-filtered cards + Manage Staff card for admins)
- `src/pages/admin/AdminOrdersPage.tsx`, `AdminQuotesPage.tsx`, `AdminProductsPage.tsx`, `AdminCategoriesPage.tsx`, `AdminPaymentMethodsPage.tsx` (per-page permission gate for staff)
- `src/router.tsx` (add `/admin/staff` route)

## Out of scope
- No changes to customer-facing signup/login flows.
- No change to existing Admin capabilities — admins retain full access to everything, including staff management.
