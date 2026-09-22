# SEO Strategy

## In scope
- Public marketing pages
- Product pages
- Collection pages
- Public utility pages (fitment, calculators, service pages)
- Brand landing pages

## Out of scope
- Authenticated dashboard and account surfaces (`/my-account`, `/my-garage`)
- Login flow (`/login`)
- API routes (`/api/**`) except where they affect crawlability or public SEO behavior

## Target audience
- JDM wheel buyers in Europe and internationally
- Enthusiasts researching authentic wheels, fitment, rebuilding, and suspension upgrades

## Primary keywords
- Unknown — inferred likely targets include JDM wheels, authentic wheels, wheel fitment, wheel rebuilding, BC Racing, and StanceParts.

## Technical notes
- The public storefront currently behaves as a Vite + React SPA served through a shared `client/index.html` shell.
- Route-specific titles, descriptions, canonicals, Open Graph tags, Twitter tags, robots directives, and JSON-LD are currently applied client-side after hydration.
- Future SEO scans should treat non-home public routes as requiring SSR, SSG, or prerendered HTML for full social-bot and AI-crawler visibility.

## Dismissed categories
- (None yet)
