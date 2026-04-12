# Directus CMS Scope And Content Inventory

## Decision Summary

Directus should own editorial and merchandising content for the storefront, but it should not become the system of record for commerce data or transaction logic.

The existing Spring backend in `/Users/freddycooper/Documents/eshop` remains the source of truth for catalog entities, inventory, carts, customers, orders, payments, shipments, and admin operations. Directus should supply content blocks, page copy, SEO defaults, and curated references to backend entities where needed.

## Current Codebase Signals

Frontend content surfaces are currently hardcoded or stored in temporary localStorage-based admin screens:

- Homepage copy and hero configuration: `src/pages/Home.js`, `src/data/homeHeroDefaults.js`, `src/pages/AdminMainPage.js`
- Announcement banner and ad hoc content settings: `src/pages/AdminContent.js`, `src/pages/AdminSettings.js`
- Header and footer content: `src/components/Header.js`, `src/components/Footer.js`, `src/components/header/useHeaderState.js`
- Static info pages: `src/pages/DeliveryInfoPage.js`, `src/pages/PaymentInfoPage.js`, `src/pages/BonusesInfoPage.js`, `src/pages/ProductionInfoPage.js`, `src/pages/LegalInfoPage.js`
- Legal document rendering and metadata: `src/pages/legal/LegalDocumentPage.js`, `src/data/legal/constants.js`
- SEO defaults and metadata plumbing: `src/components/Seo.js`

Backend commerce ownership is explicit in the module structure:

- Catalog: `catalog/*`, `api/.../catalog/*`, `api/.../inventory/*`
- Cart: `cart/*`, `api/.../cart/*`
- Customer: `customer/*`, `api/.../customer/*`
- Orders: `order/*`, `api/.../order/*`
- Payments: `payment/*`, `api/.../payment/*`
- Shipments and delivery: `shipment/*`, `api/.../shipment/*`, `api/.../delivery/*`

## CMS-Managed Content

These are the pieces that should move into Directus.

| Area | Current Source | Directus Ownership | Notes |
| --- | --- | --- | --- |
| Homepage announcement banner | `src/pages/Home.js`, `src/pages/AdminContent.js`, `src/pages/AdminSettings.js` | Yes | Simple publishable banner with text, enabled flag, start/end dates later if needed. |
| Homepage hero | `src/pages/Home.js`, `src/data/homeHeroDefaults.js`, `src/pages/AdminMainPage.js` | Yes | Manage badge, title, accent, subtitle, CTA labels/links, featured label, and featured product reference. |
| Homepage trust highlights | `src/pages/Home.js`, `src/data/trustLinks.js` | Yes | Content block copy and links are editorial. |
| Homepage promo banners | `src/pages/Home.js` | Yes | Banner title, body, CTA, styling token, and destination should be CMS-managed. |
| Homepage brand intro | `src/pages/Home.js` | Yes | Brand story headline, description, and value cards belong in CMS. |
| Homepage newsletter CTA copy | `src/components/home/NewsletterForm.js` | Yes | Only the copy and form labels belong in CMS. Subscription submission does not. |
| Navigation editorial links | `src/components/Footer.js`, temporary `adminMenuLinks` in `src/pages/AdminContent.js` | Yes, partially | Manual links and service links can live in CMS. Product/category taxonomy must not. |
| Footer groups and contact copy | `src/components/Footer.js` | Yes | Footer columns, phone/email display, seller summary, payment badges, social links if added later. |
| Info pages: delivery, payment, bonuses, production | `src/pages/DeliveryInfoPage.js`, `src/pages/PaymentInfoPage.js`, `src/pages/BonusesInfoPage.js`, `src/pages/ProductionInfoPage.js` | Yes | Rich text / modular content pages with SEO fields. |
| Legal hub page | `src/pages/LegalInfoPage.js` | Yes | Intro copy, document cards, and seller-facing display text can be CMS-managed. |
| Legal documents and assets | `src/pages/legal/LegalDocumentPage.js`, `public/legal/*`, `public/legal-docs/*` | Yes, with approval workflow | Store published document content or attached files in Directus, but treat this as versioned legal content with explicit sign-off. |
| SEO defaults | `src/components/Seo.js` | Yes, partially | Global title/description fallbacks, OG defaults, page-level overrides for editorial pages, and future blog/news entries. |
| FAQ | Not implemented | Optional new CMS collection | Safe CMS scope. No current frontend route exists yet. |
| Blog / news | Not implemented | Optional new CMS collection | Separate phase. No current storefront module exists. |
| Brand/about page | `src/pages/AboutPage.js` exists but is not routed | Optional | Can be added later as a CMS-managed landing page if the route is restored. |

## Backend-Owned Commerce Content

These must stay owned by the existing backend and should not be migrated into Directus as authoritative data.

| Domain | Backend Signals | Keep Out Of CMS Because |
| --- | --- | --- |
| Products, variants, brands, categories | `catalog/domain/*`, `api/.../catalog/*` | They drive SKU identity, routing, filtering, inventory, images, and admin operations. |
| Product descriptions, specifications, category descriptions, slugs, active flags | `CatalogController`, `CategoryController`, catalog domain entities | Even though some of this looks editorial, it is already embedded in catalog workflows and storefront behavior. Treat catalog data as backend-owned in phase 1. |
| Stock and inventory adjustments | `InventoryController`, `StockAdjustment`, `InventoryService` | Inventory is transactional and idempotent. |
| Cart state | `Cart`, `CartItem`, `CartController` | Session and checkout state must remain operational data. |
| Orders and checkout | `Order`, `OrderItem`, `OrderCheckoutAttempt`, `OrderController` | Order lifecycle and checkout idempotency are transactional invariants. |
| Payments and saved payment methods | `Payment`, `PaymentRefund`, `SavedPaymentMethod`, `PaymentController`, `PaymentService` | Payment status, refunds, provider webhooks, and saved methods are sensitive operational records. |
| Delivery quotes, request IDs, shipment status, pickup logic | `YandexDeliveryController`, `YandexDeliveryService`, `ShipmentController`, `ShipmentService` | These are live integration results, not editorial content. |
| Customers, profiles, marketing consent state | `Customer`, `CustomerController` | Customer identity and consent evidence must stay in backend systems. |
| Promotions, coupon validity, loyalty balances, referrals | current UI prototypes in `src/pages/AdminPromotions.js`, account logic in `src/pages/AccountPage.js` | These affect pricing and entitlements, so they cannot be CMS-owned. |
| Admin analytics, security, roles, auth | `admin/*`, Keycloak integration, admin pages | Operational control plane data belongs to backend/auth systems. |
| Site URL, canonical host, environment-specific public URLs | `src/data/legal/constants.js`, backend `app.public-base-url`, deployment env | These are deployment/runtime settings, not editorial content. |

## Mixed Boundaries And Rules

These areas have both content and commerce concerns. The boundary should stay explicit.

- Featured products, featured categories, and homepage collections may be selected in Directus, but only as references to backend records by ID or slug. Do not duplicate product data in CMS.
- Header and footer link labels can be CMS-managed, but the category tree and search scopes should continue to come from backend category data.
- Payment and delivery info pages can be CMS-managed as explanatory content, but actual enabled methods, delivery quotes, PVZ lists, fees, and provider modes must come from backend APIs and environment config.
- Newsletter blocks, consent callouts, and subscription CTAs can be CMS-managed, but the actual subscriber record and consent state must be stored in backend or ESP/CRM systems.
- Legal text can be published through Directus, but legal approval, version history, and effective-date discipline are required before production use.
- SEO copy defaults can live in Directus, but canonical origin, site host, robots policy defaults tied to deployment, and any environment-specific noindex behavior should stay in code or env.

## Provisional Content Owner Map

Stakeholder confirmation is still needed, but the likely ownership split is:

- Marketing / brand: homepage, navigation labels, footer marketing copy, SEO defaults, blog/news, FAQ.
- Customer support / operations: delivery, payment, bonuses, service explainer pages.
- Legal / compliance: legal pages, seller details, privacy/cookie/consent texts, document approvals.
- Merchandising / ecommerce manager: curated homepage placements and featured product/category references.
- Commerce engineering: all backend-owned domains listed above.

## Directus Phase Recommendation

Phase 1 should cover the minimum useful editorial surface:

1. Global site settings used by the storefront.
2. Homepage modular content.
3. Footer and manual navigation links.
4. Delivery, payment, bonuses, production, and legal landing pages.
5. Legal document entries with versioning.
6. Global SEO defaults plus page-level SEO for CMS pages.

Phase 2 can add:

1. FAQ.
2. Blog / news.
3. Restored About/brand landing pages.
4. More sophisticated scheduling, localization, or approval workflows.

## Explicit Non-Goals For The Initial CMS Rollout

- Replacing the catalog admin for products, categories, variants, brands, stock, or pricing.
- Replacing checkout, payment, shipment, or customer profile flows.
- Making Directus responsible for auth, consent evidence, or transactional state.
- Using the current localStorage admin pages as a production architecture reference. They are only temporary UI prototypes.

## Production Deployment Impact For This Task

No production deployment changes are required for this inventory task.

- No Yandex Cloud changes.
- No Docker changes.
- No production `.env` changes.
- No nginx changes.

Those will become relevant only when we actually add Directus services, storage, networking, secrets, and reverse-proxy rules in later tasks.
