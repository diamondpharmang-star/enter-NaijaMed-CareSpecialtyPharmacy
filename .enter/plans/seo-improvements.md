# Plan: Make /shop products & prices eligible for Google rich results

## Context
You want products and prices from `https://diamondpharma.ng/shop` to show up in Google Search (ideally as rich results with price/availability). The site already has:
- Per-product `Product` + `Offer` JSON-LD (price in NGN, stock availability, brand, seller, return policy) — done in an earlier turn, no changes needed.
- Per-page `<title>`, meta description, canonical URL, Open Graph/Twitter tags via the `Seo` component — done, no changes needed.
- A static `public/robots.txt` that allows all crawlers, but **no sitemap** is referenced, so Google has to discover all ~100 product pages by following links alone (slow, unreliable).

The missing piece for pages to reliably get crawled, indexed, and eligible to "pop up" is a **sitemap.xml** listing every real URL (home, shop, categories, best sellers, and all 100 product detail pages) with your real domain, plus telling Google about it via `robots.txt`. I'll also add lightweight `ItemList` structured data to the Shop page so Google better understands it's a product listing/collection page.

Since this is a client-rendered SPA with no server build step that talks to the database, the sitemap will be generated as a **static file** from the current product catalog (same approach as the existing static `robots.txt`). It reflects products at generation time — if you add/remove many products later, ask to regenerate it.

## Implementation checklist
- [ ] Read `public/robots.txt` and confirm current crawler rules (already allows all).
- [ ] Query all active product slugs, all category keys, and confirm route list from `src/router.tsx` (already gathered: 100 active products, 4 categories, static pages `/`, `/shop`, `/best-sellers`, `/request-quote`, `/return-refund-policy`, `/b2b/signup`).
- [ ] Create `public/sitemap.xml` with absolute URLs on `https://diamondpharma.ng`, including:
  - [ ] `/` (homepage)
  - [ ] `/shop` and `/shop?category=<key>` for each of the 4 categories
  - [ ] `/best-sellers`
  - [ ] `/request-quote`
  - [ ] `/return-refund-policy`
  - [ ] `/b2b/signup`
  - [ ] `/product/<slug>` for every currently active product (100 URLs)
  - [ ] Exclude private/transactional/admin routes (cart, checkout, order-confirmation, login, signup, account, admin/*) — these are already `noindex` and must not appear in the sitemap.
- [ ] Update `public/robots.txt` to add a `Sitemap: https://diamondpharma.ng/sitemap.xml` line so crawlers can find it automatically.
- [ ] Add `ItemList` JSON-LD to `src/pages/Shop.tsx` (via the existing `Seo` component's `jsonLd` prop) listing the currently displayed products (name + url) so Google has an explicit signal this is a product collection page. Guard so it only renders once products have loaded (non-empty list).
- [ ] Do not change `Seo` component's dynamic canonical/OG logic (`window.location.origin`) — it already becomes correct automatically once `diamondpharma.ng` is the live domain; only the static sitemap needs the domain hardcoded since it can't be computed at request time.

## Verification checklist
- [ ] `public/sitemap.xml` is valid XML (proper `<urlset>` root, `xmlns` namespace, one `<url><loc>...</loc></url>` per page, no `noindex` pages included).
- [ ] `public/robots.txt` still allows Googlebot/Bingbot/etc. and now includes the `Sitemap:` line.
- [ ] Visiting `/shop` in the running app still renders normally with no console errors, and includes `ItemList` JSON-LD only after products load (empty state doesn't emit broken JSON-LD).
- [ ] Lint passes with no errors on `src/pages/Shop.tsx`.
- [ ] Confirm to the user that after this ships, they still need to manually: (a) verify domain ownership and submit `https://diamondpharma.ng/sitemap.xml` in Google Search Console, and (b) allow time for Google to crawl/index — this cannot be automated from our side.

## Out of scope
- No server-side rendering / prerendering changes (would be needed for non-JS crawlers like some social bots to see per-page tags, but Googlebot itself renders JS fine).
- No Google Merchant Center product feed / Shopping ads setup — that's a separate, opt-in product feed integration, not standard organic Search SEO. Flag as a possible future request.
- Sitemap will not auto-regenerate when products are added/removed later; it's a point-in-time static file, consistent with the existing static `robots.txt` approach.
