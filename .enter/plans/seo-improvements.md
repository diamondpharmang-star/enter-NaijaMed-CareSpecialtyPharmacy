# Plan: On-page SEO (titles, meta descriptions, social previews, structured data)

## Scope (per your selections)
1. Per-page titles, meta descriptions, and social sharing previews (Open Graph + Twitter Card) for every public page.
2. Structured data (JSON-LD) for Google rich results: business/organization info sitewide, and Product schema (price, currency, availability) on product pages.
- Not in scope: sitemap.xml / robots.txt changes (not selected).

## Approach: no extra dependency needed
React 19 natively hoists `<title>`, `<meta>`, and `<link>` tags to `<head>` no matter where they're rendered in the component tree — so a small custom `Seo` component (rendered inside each page) is enough. This avoids `react-helmet-async`, which currently has React 19 peer-dependency friction. JSON-LD `<script type="application/ld+json">` doesn't need to live in `<head>` for crawlers to read it, so it renders inline in the page body via the same component.

### Domain handling (no custom domain yet)
Canonical URLs and `og:url` will be built from `window.location.origin` at render time — this requires no hardcoded placeholder domain and will automatically be correct once a custom domain is connected later. The default social preview image will reuse the existing hero image already hosted on the CDN.

## New files
- `src/lib/seo.ts` — constants: `SITE_NAME` ("Diamond Pharma Care"), `DEFAULT_DESCRIPTION`, `DEFAULT_OG_IMAGE` (existing hero image URL), and a helper `buildOrganizationJsonLd()` for the sitewide business schema (Pharmacy/LocalBusiness type, name, address, phone/WhatsApp, url).
- `src/components/seo/Seo.tsx` — reusable component with props `{ title, description, path?, image?, noindex?, jsonLd? }`:
  - Renders `<title>`, `<meta name="description">`, `<link rel="canonical">` (using `window.location.origin + (path ?? location.pathname)`), `og:title/description/image/url/type`, `twitter:card/title/description/image`.
  - If `noindex` is true, renders `<meta name="robots" content="noindex,nofollow">` (for cart/checkout/account/admin/auth pages).
  - If `jsonLd` is provided (object or array), renders one or more `<script type="application/ld+json">` tags.

## Sitewide structured data
- Add the Organization/Pharmacy JSON-LD once in `PharmacyLayout.tsx` (wraps every page), so every crawled page carries consistent business info: name, description, url, logo, contact (WhatsApp number from `lib/pharmacy.ts`), address (from `SiteFooter`'s existing `STORE_ADDRESS`/`SUPPORT_EMAIL` — will centralize these two constants into `lib/seo.ts` or reuse in place, minimal change), sameAs (social links, once real URLs exist — currently empty, so omitted from schema until populated).

## Per-page changes (add `<Seo>` near the top of each page's JSX)
- `Index.tsx` (home): title "Diamond Pharma Care | Oncology, Rare Disease & Diabetes Medication in Nigeria", descriptive meta description, default OG image.
- `Shop.tsx`: dynamic title reflecting active category/search (e.g. "Shop Oncology Medication | Diamond Pharma Care"), noindex not needed (public, useful for SEO).
- `ProductDetail.tsx`: dynamic per-product title/description from `product.name`/`product.description`, product image as OG image, plus **Product JSON-LD** (name, description, image, sku/id, offers: price in NGN, availability based on stock, url).
- `BestSellers.tsx`: title "Best Selling Medication | Diamond Pharma Care".
- `RequestQuote.tsx`: title "Request a Medication Price Quote | Diamond Pharma Care".
- `ReturnRefundPolicy.tsx`: title "Return & Refund Policy | Diamond Pharma Care".
- `B2BSignup.tsx`: title "Wholesale & B2B Registration | Diamond Pharma Care".
- `Login.tsx`, `Signup.tsx`: basic titles, `noindex` (auth pages shouldn't rank).
- `Cart.tsx`, `Checkout.tsx`, `OrderConfirmation.tsx`, `AccountOrders.tsx`: basic titles, `noindex` (transactional/private, no SEO value, avoids duplicate/thin content).
- `AdminLogin.tsx` and everything under `pages/admin/*`: `noindex` (private dashboard, must never be indexed).
- `NotFound.tsx`: title "Page Not Found | Diamond Pharma Care", `noindex`.

## index.html fallback tags
Update the static `<title>` and `<meta name="description">`, `og:title/description/image` in `index.html` to sensible Diamond Pharma Care defaults (currently generic "Enter" placeholder text) — this is what crawlers/link-unfurlers see before JS runs, and acts as the fallback if a page's `Seo` component hasn't mounted yet.

## Out of scope / unchanged
- No sitemap.xml or robots.txt changes.
- No i18n/localization changes to SEO tags (single-locale for now, matches current site).
- No changes to routing structure.
