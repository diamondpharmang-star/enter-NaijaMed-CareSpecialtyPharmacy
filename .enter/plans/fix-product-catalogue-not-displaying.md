# Fix: product catalogue not displaying

## Context

The storefront loads medication straight from the backend at render time (`/, /shop, /best-sellers, /admin/products`). Right now those requests are failing, so the catalogue renders empty.

Evidence collected:

- Runtime network log: `GET /rest/v1/products?...&is_active=eq.true` returns **401**, `GET /rest/v1/categories` returns **401**. Earlier in the log the same calls returned `Status: 0 / Failed to fetch` for ~3 seconds before eventually succeeding with `200` — the classic cold-start / paused-instance pattern.
- Database introspection: `instance is paused: instance status is paused, please resume first`.
- Data is intact: `products` holds **100 rows, all `is_active = true`**; RLS is `Anyone can view active products (SELECT)` and `Anyone can view categories (SELECT)`, so this is not an RLS or data problem.

The second half of the bug is in the code: every catalogue fetch ignores the `error` field and falls back to an empty array, so a failed request is rendered as "No products found." That is why the catalogue silently disappears instead of telling the user something went wrong.

Example (`src/pages/Shop.tsx:34-41`):

```ts
query.order(...).then(({ data }) => {
  setProducts(data ?? []);   // error is dropped
  setIsLoading(false);
});
```

Same pattern in `Index.tsx:39-47`, `BestSellers.tsx:14-25`, `useCategories.ts:9-18`, `AdminProductsPage.tsx:708-717`.

## Fix

### 1. Restore data flow (backend)

Resume / reconnect the paused backend instance for this project so `products` and `categories` serve reads again. Confirm with a count query returning 100 rows before touching UI code.

### 2. Make catalogue loading resilient and honest (code)

**New `src/hooks/useProducts.ts`** — single source of truth for product fetching, mirroring the existing `useCategories` hook style:

- Options: `{ category?, bestSellerOnly?, limit?, order?: "price" | "name" }`.
- State: `products`, `isLoading`, `error`, `refetch`.
- Always resets `error` before a fetch; on failure, retries once (short delay) to absorb a cold start, then sets `error` and keeps any previously loaded products on screen instead of blanking the grid.
- Shared by Shop, Best Sellers and the homepage featured grid so the three call sites stop duplicating query logic.

**Update `src/hooks/useCategories.ts`** — capture `error` from the query, retry once, expose `error` + `refetch` (nav dropdown and product card badges depend on this list).

**New `src/components/pharmacy/DataStateNotice.tsx`** — small presentational component with three variants used by every catalogue surface, built on the existing design system (semantic tokens only, no raw colors) and lucide icons:

- `error`: destructive-toned notice, message + "Try again" `Button` calling `onRetry`.
- `empty`: muted text, optional action.
- `loading`: muted text (replaces the ad-hoc `<p>Loading products...</p>` strings).

**Update call sites:**

- `src/pages/Shop.tsx` — replace the inline `supabase` query with `useProducts({ category })`; render `loading` → skeleton text, `error` → notice with retry, `empty` → "No products match your search." Keep the existing `ItemList` JSON-LD rule (only emit when the visible list is non-empty).
- `src/pages/BestSellers.tsx` — `useProducts({ bestSellerOnly: true })` + the same three states.
- `src/pages/Index.tsx` — featured section uses `useProducts({ limit: 4 })`; on failure show the retry notice instead of an empty grid.
- `src/pages/admin/AdminProductsPage.tsx` — surface `error` with retry instead of falling through to "No products yet."

No database schema, RLS or data changes. No changes to cart, checkout, auth or admin editing behaviour.

## Files

| File | Change |
| --- | --- |
| `src/hooks/useProducts.ts` | new hook (fetch + retry + error) |
| `src/components/pharmacy/DataStateNotice.tsx` | new shared loading/empty/error notice |
| `src/hooks/useCategories.ts` | capture error, retry once, expose `refetch` |
| `src/pages/Shop.tsx` | consume hook, distinct loading/error/empty states |
| `src/pages/BestSellers.tsx` | consume hook, distinct states |
| `src/pages/Index.tsx` | featured grid uses hook + retry notice |
| `src/pages/admin/AdminProductsPage.tsx` | error + retry instead of silent empty table |

## Implementation checklist

- [ ] Backend instance resumed and `select count(*) from products` returns 100.
- [ ] `src/hooks/useProducts.ts` created with `category`, `bestSellerOnly`, `limit`, `order` options, `error`, `refetch`, and one automatic retry.
- [ ] `useProducts` never clears already-loaded products when a refetch fails.
- [ ] `useCategories` exposes `error` and `refetch` and retries once.
- [ ] `DataStateNotice` supports `error` (with retry button), `empty`, `loading` using semantic tokens and lucide icons only.
- [ ] `Shop` renders error notice with retry, keeps "No products match your search." for a filtered empty result.
- [ ] `Shop` emits `ItemList` JSON-LD only when products are loaded and the visible list is non-empty.
- [ ] `BestSellers` renders error notice with retry instead of "No best sellers yet." on fetch failure.
- [ ] `Index` featured section renders retry notice on failure instead of an empty grid.
- [ ] `AdminProductsPage` renders retry notice on failure instead of "No products yet."

## Verification checklist

- [ ] `supabase_read_query` count on `products` returns 100 (positive control: backend serving again).
- [ ] `/shop` screenshot at `desktop_1280` shows the 4-column product grid with images, prices and category badges.
- [ ] `/shop` screenshot at `mobile_390` shows a single-column grid with no horizontal overflow.
- [ ] `/shop?category=oncology` shows only oncology products; category pill is active.
- [ ] `/shop?search=zzzz` shows the empty-state message, not the error notice.
- [ ] `/best-sellers` shows best-seller cards; `/` featured grid shows 4 cards.
- [ ] Catalog nav dropdown (desktop) and mobile sheet list the categories from the backend.
- [ ] `pnpm run lint` and `pnpm run build` pass.
- [ ] Console has no 401 responses for `products`/`categories` after the resume.
