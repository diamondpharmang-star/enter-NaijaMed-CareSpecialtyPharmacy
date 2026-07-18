# Plan: B2B copy update, separate Admin login, and Admin Dashboard redesign

## 1. Update B2B messaging on the sign-in page
- In `src/pages/Login.tsx`, replace the current link text/line:
  `Register as a B2B customer`
  with the new copy:
  `Create a business account and request bulk pricing for your Pharmacy, Clinics, Hospitals or NGO`
  (still linking to `/b2b/signup`).

## 2. Separate "Admin" access from customer sign-in
- Remove the "Admin Dashboard" item from the customer account dropdown in `SiteHeader.tsx` (admins will use the dedicated entry point instead).
- Add a new minimal **Admin Login** page at `src/pages/AdminLogin.tsx`:
  - Staff-only sign-in form (email/password via `supabase.auth.signInWithPassword`), no links to customer signup or B2B signup.
  - On success, verify `profile.role === 'admin'` (fetch profile after login); if not admin, sign out and show an error ("This login is for administrators only"). If admin, navigate to `/admin`.
  - Simple centered card layout consistent with `Login.tsx` styling, with a small "Back to store" link to `/`.
- Register route `/admin-login` → `AdminLogin` in `router.tsx`.
- On `Login.tsx` (customer sign-in page), add a small, visually separated link at the very bottom of the page (outside/below the main card, e.g. muted small text with a Lock/ShieldCheck icon) labeled **"Admin"** linking to `/admin-login`. This keeps it distinct from customer signup/B2B flows.

## 3. Redirect existing `/admin/orders` and add `/admin` landing route
- Rename the dashboard "landing" concept: add new route `/admin` → new `AdminDashboard` landing page (icon-grid). Keep `/admin/orders` etc. as sub-routes for each section so deep-linking and back-navigation both work:
  - `/admin` — icon-grid landing page
  - `/admin/orders` — Orders table (existing logic)
  - `/admin/quotes` — Quote Requests table
  - `/admin/products` — Manage Products table
  - `/admin/categories` — Categories table
  - `/admin/payment-methods` — Payment Methods panel
- All these admin pages share one `AdminLayout` wrapper that includes the admin-only guard (`profile.role === 'admin'`, else redirect), a top bar with "Back to Dashboard" (link to `/admin`) + page title, and reuses `PharmacyLayout` (site header/footer) for consistency.

## 4. Split `AdminOrders.tsx` into focused files
Given the file is already ~1400 lines, break it up for maintainability:
- `src/pages/admin/AdminDashboard.tsx` — icon-grid landing page. Fetches lightweight counts (orders, quotes, products, categories) for badges on each card. Cards: Orders, Quote Requests, Manage Products, Categories, Payment Methods — each an icon (Package, MessageCircle/FileQuestion, Pill, Tags, CreditCard) + title + short description + live count, linking to its sub-route.
- `src/pages/admin/AdminOrdersPage.tsx` — Orders table (moved from current TabsContent "orders").
- `src/pages/admin/AdminQuotesPage.tsx` — Quote Requests table.
- `src/pages/admin/AdminProductsPage.tsx` — Manage Products table + all its sub-components (`ProductImageUploadCell`, `ProductPriceEditCell`, `ProductBestSellerToggle`, `ProductNameEditCell`, `DeleteProductButton`, `AddProductDialog`, `ProductCategorySelect`).
- `src/pages/admin/AdminCategoriesPage.tsx` — Categories table + `AddCategoryForm`, `CategoryLabelEditCell`, `DeleteCategoryButton`.
- `src/pages/admin/AdminPaymentMethodsPage.tsx` — wraps existing `PaymentMethodsPanel` logic.
- `src/components/admin/AdminLayout.tsx` — shared guard + header ("← Back to Dashboard", page title) wrapping `PharmacyLayout`.
- Remove `src/pages/AdminOrders.tsx` (fully superseded) and remove the search bar's "switch active tab" logic since each page is now separate — replace with a simple per-page search input filtering that page's own list (keeps existing search behavior, scoped per section instead of a shared cross-tab search).

## 5. Router updates (`src/router.tsx`)
- Remove old `/admin/orders` → `AdminOrders` entry.
- Add:
  - `/admin` → `AdminDashboard`
  - `/admin/orders` → `AdminOrdersPage`
  - `/admin/quotes` → `AdminQuotesPage`
  - `/admin/products` → `AdminProductsPage`
  - `/admin/categories` → `AdminCategoriesPage`
  - `/admin/payment-methods` → `AdminPaymentMethodsPage`
  - `/admin-login` → `AdminLogin`

## 6. Data fetching approach
- Each sub-page fetches only the data it needs on mount (orders page fetches orders, products page fetches products + categories, etc.) rather than one large `Promise.all` — simpler, faster initial loads, consistent with splitting the file.
- `AdminDashboard` landing page fetches lightweight counts via `select('id', { count: 'exact', head: true })` for orders, quote requests, and products, plus category count via existing `useCategories` hook.

## What stays the same
- All existing admin functionality (editing orders/products/categories, payment method toggles, image upload, search-filter within a table) is preserved — just reorganized into separate routed pages with a landing menu.
- `usePaymentSettings` hook, `payment_settings` table, and existing RLS/migrations are untouched.
- Customer-facing flows (Signup, B2BSignup, Checkout) are untouched except the one copy change in `Login.tsx`.

## Out of scope
- No changes to the underlying database schema.
- No changes to non-admin, non-login pages.
