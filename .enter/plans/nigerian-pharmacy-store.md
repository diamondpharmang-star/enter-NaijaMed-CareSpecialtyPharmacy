# Diamond Pharma Care — Nigerian Online Pharmacy Store (Oncology, Rare Drugs, Weight Loss)

## Context
Build a real e-commerce pharmacy site named **Diamond Pharma Care** for the Nigerian market specializing in Oncology, Rare Drugs, and Weight Loss medication, with live checkout (Paystack + manual bank transfer), optional retail customer accounts, and a full B2B (wholesale) account with bulk pricing/quote requests. Persisted products/orders and secure payment verification require a backend, so **Enter Cloud (Supabase) must be enabled** before implementation, followed by adding the Paystack secret key.

Confirmed decisions from user:
- Payment: Paystack (card/bank/USSD) **and** manual bank transfer option.
- No prescription upload requirement (skip verification for now).
- Customer login/signup optional — guest checkout supported.
- Dedicated B2B signup with **full account** (business profile + bulk pricing/quote requests).

## Backend (Enter Cloud / Supabase)
Steps performed after plan approval:
1. Call `supabase_enable` (backend needed for products, orders, auth, payments).
2. Call `supabase_add_secret` to collect `PAYSTACK_SECRET_KEY` from the user.

### Tables
- `profiles` — id (FK auth.users), email, full_name, phone, account_type (`retail`|`b2b`), business_name, business_license_number, role (`customer`|`admin`, default customer), created_at. RLS: user manages own row; admin reads all.
- `products` — id, name, slug, description, category (`oncology`|`rare_drugs`|`weight_loss`), price (numeric, NGN), image_url, stock_quantity, is_active, created_at. RLS: public read where is_active; admin write.
- `orders` — id, user_id (nullable, guest allowed), customer_name, email, phone, delivery_address, city, state, payment_method (`paystack`|`bank_transfer`), payment_status (`pending`|`paid`|`failed`), order_status (`processing`|`shipped`|`delivered`|`cancelled`), total_amount, paystack_reference, created_at. RLS: public insert; select limited to owning user (`user_id = auth.uid()`) or admin.
- `order_items` — id, order_id (FK), product_id, product_name, unit_price, quantity. RLS mirrors orders.
- `b2b_quote_requests` — id, business_name, contact_name, email, phone, license_number, products_needed, estimated_quantity, message, status (default `new`), created_at. RLS: public insert; select admin only.

### Edge Functions
- `paystack-initialize`: creates order + order_items rows, calls Paystack `POST /transaction/initialize` with `PAYSTACK_SECRET_KEY`, returns `authorization_url` for redirect.
- `paystack-verify`: called from the order confirmation page with `?reference=`, calls Paystack `GET /transaction/verify/:reference`, updates `orders.payment_status`/`order_status`.

Bank transfer flow needs no edge function: order is inserted directly with `payment_method='bank_transfer'`, `payment_status='pending'`, and the confirmation page shows static bank account details + order reference for the customer to complete transfer manually; admin updates status later from the admin dashboard.

## Frontend Structure
New routes added to `src/router.tsx`:
- `/` — Home: hero, trust badges (NAFDAC-style messaging, nationwide delivery), category highlights, featured products.
- `/shop` — Product catalog with category filter (Oncology / Rare Drugs / Weight Loss) + search.
- `/product/:slug` — Product detail, add to cart.
- `/cart` — Cart review page.
- `/checkout` — Guest or logged-in checkout form (contact + delivery info, payment method choice).
- `/order-confirmation` — Reads `?reference=` (Paystack) or order id (bank transfer), shows status + bank details if applicable.
- `/login`, `/signup` — Retail customer auth (Supabase auth, email/password).
- `/b2b/signup` — Business account signup (business info) + bulk quote request form.
- `/account/orders` — Order history for logged-in users.
- `/admin/orders` — Role-gated (profiles.role = 'admin') simple table to view orders and manually mark bank-transfer orders as paid / update order status.

### Key new modules
- `src/contexts/CartContext.tsx` — cart state + localStorage persistence (add/remove/update qty, totals in ₦).
- `src/contexts/AuthContext.tsx` — wraps Supabase auth session + profile fetch.
- `src/integrations/supabase/client.ts` — Supabase client (standard Enter Cloud setup).
- `src/components/pharmacy/*` — ProductCard, CategoryBadge, CartDrawer, OrderSummary, etc.
- `src/pages/` — Home, Shop, ProductDetail, Cart, Checkout, OrderConfirmation, Login, Signup, B2BSignup, AccountOrders, AdminOrders (replacing current placeholder `Index.tsx`).

### Design
- Use `designer` skill/approach translated into Tailwind tokens in `index.css`/`tailwind.config.ts`: medical-trust palette (deep teal/blue primary, clean white surfaces, accent for CTAs), semantic tokens only (no raw `text-white`/`bg-white`).
- Category color coding for Oncology / Rare Drugs / Weight Loss badges.
- Prices displayed in ₦ (Naira) formatting.
- Generate a small set of product/hero images via `image_generation` tool (generic pharmaceutical packaging/pill imagery — no real brand names or misleading medical claims).

## Verification
1. Enable Enter Cloud, add Paystack secret, confirm tables/RLS created without errors.
2. Browse `/shop`, filter by each category, open a product, add to cart.
3. Checkout as guest with bank transfer → order created, confirmation shows bank details + reference.
4. Checkout with Paystack (test mode) → redirected to Paystack, return to `/order-confirmation`, order marked paid via `paystack-verify`.
5. Sign up as retail customer, place an order, verify it appears in `/account/orders`.
6. Sign up via `/b2b/signup`, submit a bulk quote request, confirm row appears in `b2b_quote_requests`.
7. Manually set a profile's `role` to `admin` in DB, confirm `/admin/orders` lists all orders and status updates persist.
8. Lint/build passes with no errors.
