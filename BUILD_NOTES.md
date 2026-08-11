# Build Notes — Purelane Shopify Sections

## Sections Delivered

| Section file | Maps to | Status |
|---|---|---|
| `purelane-hero.liquid` | Hero + Nav + Ticker + Scenes | Complete |
| `purelane-reviews.liquid` | Review marquee rail | Complete |
| `purelane-shop.liquid` | Bestsellers product grid | Complete |
| `purelane-combos.liquid` | Best-selling combos rail | Complete |
| `purelane-bundles.liquid` | Bundle tier grid | Complete |
| `assets/purelane-base.css` | Shared design tokens + utilities | Complete |
| `assets/purelane-scenes.js` | Scroll scenes, reveal, cart handler | Complete |

## Flagged Issues in Source HTML

### 1. Product images are base64-embedded CSS backgrounds
The prototype uses base64-encoded SVG/PNG product images as CSS `background-image` properties in classes like `.p-tap`, `.p-kitchen`, `.p-dish`. These are:
- Not maintainable (locked in the stylesheet)
- Not linked to real Shopify products

**Fix:** Sections use `product.featured_image | image_url | image_tag` from Shopify's CDN. Merchants need real product images uploaded to Shopify.

### 2. All prices and product data are hardcoded
Every price, rating, review count, and product name in the prototype is a static string (e.g. "₹200", "★ 4.8", "237 reviews").

**Fix:** Shop section pulls live prices from `product.price` and `product.compare_at_price`. Rating display reads from `product.metafields.reviews.rating`. Combos and bundles use schema-editable text fields so merchants can update without touching code.

### 3. Review content is static and duplicated
The marquee duplicates the `.revtrack` HTML twice (100% → -50% animation). All review text is hardcoded.

**Fix:** Reviews section uses Liquid `{% for block in section.blocks %}` with up to 10 block entries, then outputs the track twice for the seamless loop.

### 4. Navigation links are anchor links to section IDs
The prototype nav uses `href="#shop"`, `href="#combos"` etc.

**Fix:** In Shopify, these become relative page links. Nav links are schema-editable so merchants can point to actual collection pages.

### 5. Backdrop-filter (`backdrop-filter: blur`) fallback
Not supported in some older Android WebViews. Added `@supports` progressive enhancement with a solid `rgba` background fallback.

## Code Changes from Source

- Removed inline JavaScript scroll-scene logic (moved to `purelane-scenes.js`)
- Replaced CSS `animation: tick 30s linear infinite` ticker with Liquid-rendered content
- Cart "Add to cart" buttons wired to Shopify Cart API (`/cart/add.js`) via `data-atc` + `data-variant-id` delegation in scenes.js
- All element IDs prefixed with `{{ section.id }}` to prevent conflicts when multiple sections exist on the same page
- Water cinematic layers preserved in hero section exactly as designed

## Store Setup Required (manual steps)

1. Create Shopify Partner account at partners.shopify.com
2. Create development store, install Dawn theme
3. Upload `assets/purelane-base.css` and `assets/purelane-scenes.js` to theme Assets
4. Upload all 5 `sections/*.liquid` files to theme Sections
5. Create 8+ test products including: sold-out product, product with no image, product with very long title, product with no compare-at price
6. Create a "Bestsellers" collection and assign products to it
7. Add `reviews.rating` metafield definition (type: rating) for products if using rating display
8. Add sections to homepage via theme editor in this order: Hero → Reviews → Shop → Combos → Bundles

## Time Breakdown

- Analysis of source HTML: ~30 min
- CSS extraction + token documentation: ~20 min
- Section code generation (5 sections + 2 assets): ~90 min
- Schema design for theme editor: ~30 min
- Testing and review: ~20 min

**Total: ~3.5 hours**

## Known Gaps (time-constrained)

- **No dev store URL** — store setup requires manual Shopify Partner account creation (not automatable)
- **No metaobject definitions** — combo and bundle data would ideally be metaobjects, not just schema settings, for richer merchant control; current implementation uses schema blocks which is functional but less scalable
- **Ticker content** is hardcoded in hero schema defaults (easy to make editable, opted for simplicity)
- **Mobile sticky CTA bar** (visible in original at <960px) not implemented — would be a 6th section or a snippet
- The animated water SVG paths are inline in the hero section; ideally these become an `assets/purelane-water.svg` sprite

## AI Workflow Notes

**What was delegated to AI:**
- All Liquid section code generation (given exact design specs, CSS, and HTML structure)
- Schema block design for each section
- JavaScript observer/cart handler logic

**What required human judgment:**
- Deciding which product data to pull from Shopify objects vs. schema settings
- Choosing `blocks` vs `metaobjects` for combo/bundle data (chose blocks for simplicity given time)
- Flagging the base64-image issue and deciding on the fallback approach

**Failures encountered:**
- Initial Groq API tool-call failure when attempting to pass full file content as a tool argument — resolved by switching to text-extraction approach
- First CSS token pass missed `--sec-y` and `.glass-2` variant — caught on review and corrected

**Systematisation opportunity:**
For a full agency workflow, this prompt → Liquid generation pipeline could be systematised into a CLI tool that takes any brand's CSS tokens + HTML prototype and outputs a starter Shopify section pack, drastically reducing first-draft time on new brand builds.
