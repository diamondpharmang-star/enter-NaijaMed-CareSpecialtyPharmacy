# Diamond Pharma Care — Checkout, Auth, Navigation & Content Updates

## Context
A batch of improvements to checkout trust/UX, signup security, navigation simplification, and new merchandising/content pages. Email sending (order copies to admin, customer confirmations, status updates) is explicitly **out of scope** per user decision — no email provider is connected in this project, so those three requests will not be implemented in this pass.

## Confirmed decisions
- Skip all email-sending work (no admin copy email, no customer confirmation email, no status-progress email).
- Double password confirmation on **both** retail Sign Up and B2B Wholesale signup.
- Bank transfer account details shown **both** immediately at checkout (when "Bank Transfer" is selected) **and** on the order confirmation page.
- Best Sellers: add a `is_best_seller` boolean toggle per product in Admin so the list is manageable going forward, seeded initially with the exact 26 items provided (matched by name in the `products` table; unmatched items reported back, not invented).
- Replace "Request quote on WhatsApp" button copy with "Buy on WhatsApp" everywhere it appears (ProductCard, ProductDetail, and any other reuse of `whatsappQuoteLink`).
- Collapse category links (Oncology / Rare Drugs / Diabetes / Others) out of the top nav bar into a single "Shop" dropdown/entry; add a new "Best Sellers" top-level link.
- Add a "Return & Refund Policy" static section/page linked from the footer.

## 1. Double password confirmation (Signup + B2B Signup)
**Files:** `src/pages/Signup.tsx`, `src/pages/B2BSignup.tsx`
- Add a `confirm_password` field to each form's state.
- Add a "Confirm password" input (type password, required, minLength 6) directly under the existing password field.
- On submit, validate `password === confirm_password` before calling `supabase.auth.signUp`; show a toast error and abort if they don't match.

## 2. Bank transfer details revealed at checkout
**Files:** `src/pages/Checkout.tsx`, `src/lib/nigeria.ts`
- Update `BANK_TRANSFER_DETAILS` in `lib/nigeria.ts` to the new real account:
  - Account Number: `4002437816`
  - Account Name: `Diamond Global Alliance Services Ltd`
  - Bank: `Moniepoint MFB`
- In `Checkout.tsx`, when `paymentMethod === "bank_transfer"` is selected, render an inline panel under the radio option (reusing the same detail layout as `OrderConfirmation.tsx`) showing Bank / Account Name / Account Number with a copy-to-clipboard button.
- `OrderConfirmation.tsx` keeps showing the same details after order placement (no change needed there besides picking up the updated constant).

## 3. Collapse category nav into "Shop"; add "Best Sellers" link
**File:** `src/components/pharmacy/SiteHeader.tsx`
- Remove the `...categories.map(...)` spread from `navLinks` (no more separate Oncology/Rare Drugs/Diabetes/Others top-level links).
- Convert "Shop" into a `DropdownMenu` (reuse existing dropdown-menu component already imported for the account menu) containing: "All Products" (→ `/shop`) and each category (→ `/shop?category=key`), fed by `useCategories()`.
- Add a new "Best Sellers" link (→ `/best-sellers`) next to Shop.
- Mirror the same collapsed structure in the mobile `Sheet` menu (Shop as a small header with indented category links, plus Best Sellers as its own link).
- `SiteFooter.tsx`'s "Shop" column keeps listing categories individually (footers commonly show full sitemaps) — no change requested there, leaving as-is unless flagged.

## 4. Best Sellers page
**DB:** migration to add `is_best_seller boolean not null default false` to `products`.
- Seed: `update products set is_best_seller = true where slug in (<27 matched slugs>)`. Two items from the user's list didn't have exact existing rows: "Darzalex Faspro 1800mg Injection" exists but has no price (already in catalog, price-on-request) — still flag as best seller since it's explicitly listed. All 26 requested lines matched existing catalog rows (Mounjaro x15, Ozempic x3, Rybelsus x2, Aldara, Darzalex Faspro, Actilyse, Botox, Zytiga, Lynparza 150mg) — 26 total.
- **New file:** `src/pages/BestSellers.tsx` — same visual pattern as `Shop.tsx` (hero strip + grid of `ProductCard`), querying `products` where `is_best_seller = true and is_active = true`, no category filter UI needed (just a simple grid, optionally with a search box for consistency).
- **Route:** add `/best-sellers` to `router.tsx`.
- **Admin:** in `AdminOrders.tsx` "Manage Products" tab, add a "Best Seller" switch/checkbox column next to existing photo/price controls, using the existing per-row update pattern (`ProductPriceEditCell`-style component: `ProductBestSellerToggle`).

## 5. "Buy on WhatsApp" copy change
**Files:** `src/components/pharmacy/ProductCard.tsx`, `src/pages/ProductDetail.tsx`
- Change button label from "Request quote on WhatsApp" / "Request price quote on WhatsApp" to "Buy on WhatsApp" (keep the same `whatsappQuoteLink` behavior — opens WhatsApp with a pre-filled message for that product).

## 6. Return & Refund Policy
**New file:** `src/pages/ReturnRefundPolicy.tsx` — static content page written for a Nigerian specialty/oncology pharmacy (addresses non-returnable prescription/cold-chain medication, defective/incorrect item exceptions, refund timelines for bank transfer vs Paystack, contact via WhatsApp/email for return requests).
- **Route:** add `/return-refund-policy` to `router.tsx`.
- **Footer:** add a link to it in `SiteFooter.tsx` under a new "Legal" column (or appended to "Why trust us"/"Account" column) at the bottom of the page.

## Verification
1. Sign up as a new retail customer with mismatched confirm-password → see error, not submitted. Matching passwords → account created.
2. Repeat on B2B signup form.
3. At checkout, select "Bank Transfer" → Moniepoint account details appear inline immediately; place a bank-transfer order → same details appear on confirmation page.
4. Header on desktop: only Home / Shop (dropdown with categories) / Best Sellers / Request Quote / Wholesale (B2B) show as top-level items; mobile sheet mirrors this.
5. Visit `/best-sellers` → only the 26 flagged products display; toggling "Best Seller" off a product in Admin removes it from the page (and vice versa for a new product).
6. Any product without a price shows a "Buy on WhatsApp" button (was "Request quote on WhatsApp").
7. Footer has a working link to `/return-refund-policy` rendering the written policy.
8. Lint/build passes with no errors.
