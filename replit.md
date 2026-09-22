# Juju Wheels — Premium JDM Wheel Storefront

## Overview
Juju Wheels is a modern, premium Shopify-headless storefront specializing in JDM wheels. The project aims to provide a sophisticated e-commerce experience for purchasing custom and multi-piece wheels, including advanced configurators for customization, fitment verification, and visualizers. The platform integrates vehicle fitment data, offering a comprehensive solution for wheel enthusiasts.

## User Preferences
- Dark theme, sharp corners (border-radius: 0px)
- Fonts: Archivo Black (headings), Asap (body)
- Colors: Primary yellow #E9D355 (Juju Yellow), background #000000

## System Architecture
The storefront is built with a React frontend (Vite, Tailwind CSS, wouter, TanStack Query) and an Express backend, which acts as a proxy for the Shopify Storefront API (GraphQL). Authentication is managed via Replit Auth (OpenID Connect) with PostgreSQL for session and user data, including saved specifications.

**Key Features:**
- **Product Catalog:** Extensive Shopify integration for collections, products, and pages.
- **Cart System:** Shopify Cart API integration with a slide-out drawer and localStorage persistence.
- **Customization & Configuration:**
    - **Spacer Configurator:** Detailed options for PCD, threads, and custom inputs, with dynamic notes and specs.
    - **Parts Configurator:** Redesigned form-based selector with dynamic image previews for outer lips and inner barrels.
    - **3-Piece Wheel Spec Calculator:** Calculates width and offset changes for multi-piece wheels with an SVG cross-section diagram.
    - **Wheel Visualizer:** Allows image uploads, color changes, brake disc/caliper toggles, zoom, pan, and share/download functionality.
- **Fitment Tools:**
    - **Vehicle Fitment Page:** Integrates with Wheel-Size.com API for cascading vehicle lookups (Make, Model, Year, Trim) to provide PCD, bore, and factory wheel specs.
    - **Per-product Fitment Checker:** Checks wheel compatibility against selected vehicles on product pages.
    - **Wheel Fitment Calculator:** Compares existing vs. new wheel/tire setups with visual diagrams and detailed metrics.
- **User Accounts:**
    - **My Account:** Displays profile information, saved vehicle specifications, and order history (fetched from Shopify Admin API).
    - **My Garage:** Allows authenticated users to save vehicles and view compatible wheels.
    - **Profile Completion:** Mandatory phone number and marketing email collection post-signup.
- **SEO & Performance:** Dynamic canonical URLs, meta tags, JSON-LD structured data, robots.txt, sitemap generation, image optimization, and lazy loading.
- **Internationalization:** Full multi-language support (EN, NL, DE, ES, FR) with IP-based auto-detection and a comprehensive translation key system.
- **Upsells & Services:** Integrated refinishing and chroming services, and outer lip upsells for multi-piece wheels, dynamically updating cart contents.

## External Dependencies
- **Shopify Storefront API (GraphQL):** For product, collection, cart, and page data.
- **Shopify Admin API:** For fetching order history.
- **Wheel-Size.com API:** For vehicle fitment data (Make, Model, Year, Trim, PCD, etc.).
- **Replit Auth:** OpenID Connect for user authentication and session management.
- **PostgreSQL:** Database for user data, sessions, and saved specifications, managed with Drizzle ORM.
- **ipapi.co:** For IP-based language auto-detection.