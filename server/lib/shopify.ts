async function shopifyFetch<T>(query: string, variables: Record<string, any> = {}): Promise<T> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN || "";
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || "";

  if (!domain || !token) {
    throw new Error("Shopify credentials not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN.");
  }

  const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const url = `https://${cleanDomain}/api/2024-01/graphql.json`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    });
  } catch (err: any) {
    throw new Error(`Cannot reach Shopify at ${cleanDomain}: ${err.message}`);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify API error ${res.status}: ${text}`);
  }

  const json = await res.json();

  if (json.errors) {
    throw new Error(`Shopify GraphQL errors: ${JSON.stringify(json.errors)}`);
  }

  return json.data;
}

// ─── COLLECTIONS ────────────────────────────────────────────────

const COLLECTION_FRAGMENT = `
  fragment CollectionFields on Collection {
    id
    title
    handle
    description
    image {
      url
      altText
      width
      height
    }
  }
`;

const PRODUCT_CARD_FRAGMENT = `
  fragment ProductCard on Product {
    id
    title
    handle
    description
    availableForSale
    productType
    tags
    collections(first: 10) {
      edges {
        node {
          handle
        }
      }
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    images(first: 50) {
      edges {
        node {
          url
          altText
          width
          height
        }
      }
    }
    variants(first: 50) {
      edges {
        node {
          id
          title
          availableForSale
          quantityAvailable
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
          selectedOptions {
            name
            value
          }
          image {
            url
            altText
            width
            height
          }
        }
      }
    }
  }
`;

export async function getAllCollections() {
  const query = `
    ${COLLECTION_FRAGMENT}
    query AllCollections {
      collections(first: 50) {
        edges {
          node {
            ...CollectionFields
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<any>(query);
  return data.collections.edges.map((e: any) => e.node);
}

// All wheel collection handles (verified from Shopify)
// Note: handles are NOT sequential — the -copy suffix is the real size collection
// 15→"15-inch-wheels", 16→"15-inch-wheels-copy", 17→"16-inch-wheels-copy",
// 18→"17-inch-wheels-copy", 19→"18-inch-wheels-copy", 20→"19-inch-wheels-copy"
const WHEEL_COLLECTION_HANDLES = [
  "15-inch-wheels",
  "15-inch-wheels-copy",
  "16-inch-wheels-copy",
  "17-inch-wheels-copy",
  "18-inch-wheels-copy",
  "19-inch-wheels-copy",
];

export async function getAllWheels(): Promise<any[]> {
  // Fetch every inch collection in parallel
  const results = await Promise.allSettled(
    WHEEL_COLLECTION_HANDLES.map((h) => getCollectionByHandle(h, 250))
  );
  const seen = new Set<string>();
  const products: any[] = [];
  for (const result of results) {
    if (result.status !== "fulfilled" || !result.value) continue;
    const edges = result.value.products?.edges || [];
    for (const { node } of edges) {
      if (!seen.has(node.id)) {
        seen.add(node.id);
        products.push(node);
      }
    }
  }
  return products;
}

export async function getCollectionByHandle(handle: string, first = 50, sortKey = "BEST_SELLING", reverse = false) {
  const query = `
    ${COLLECTION_FRAGMENT}
    ${PRODUCT_CARD_FRAGMENT}
    query CollectionByHandle($handle: String!, $first: Int!, $sortKey: ProductCollectionSortKeys!, $reverse: Boolean!) {
      collection(handle: $handle) {
        ...CollectionFields
        products(first: $first, sortKey: $sortKey, reverse: $reverse) {
          edges {
            node {
              ...ProductCard
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<any>(query, { handle, first, sortKey, reverse });
  return data.collection;
}

// ─── PAGINATED COLLECTION (for large catalogs like BC Racing) ───

const paginatedCollectionCache = new Map<string, { data: any[]; ts: number }>();
const PAGINATED_TTL = 60 * 60 * 1000; // 1 hour

export async function getAllCollectionProductsPaginated(handle: string): Promise<any[]> {
  const cached = paginatedCollectionCache.get(handle);
  if (cached && Date.now() - cached.ts < PAGINATED_TTL) return cached.data;

  const LEAN_FRAGMENT = `
    fragment LeanProduct on Product {
      id
      title
      handle
      availableForSale
      priceRange {
        minVariantPrice { amount currencyCode }
      }
      compareAtPriceRange {
        minVariantPrice { amount currencyCode }
      }
      images(first: 1) {
        edges { node { url altText width height } }
      }
    }
  `;

  const PAGE_QUERY = `
    ${LEAN_FRAGMENT}
    query CollectionPage($handle: String!, $after: String) {
      collection(handle: $handle) {
        products(first: 250, after: $after, sortKey: TITLE) {
          edges { node { ...LeanProduct } }
          pageInfo { hasNextPage endCursor }
        }
      }
    }
  `;

  const products: any[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const data = await shopifyFetch<any>(PAGE_QUERY, { handle, after: cursor });
    const page = data?.collection?.products;
    if (!page) break;
    for (const { node } of page.edges) products.push(node);
    hasNextPage = page.pageInfo.hasNextPage;
    cursor = page.pageInfo.endCursor;
  }

  paginatedCollectionCache.set(handle, { data: products, ts: Date.now() });
  return products;
}

// ─── ADMIN API: ALL BC RACING PRODUCTS (including drafts) ────────
// Falls back to Storefront collection query if Admin API token is invalid.

export async function getAllBcRacingProductsAdmin(): Promise<any[]> {
  const CACHE_KEY = "__bc_racing_admin__";
  const cached = paginatedCollectionCache.get(CACHE_KEY);
  if (cached && Date.now() - cached.ts < PAGINATED_TTL) return cached.data;

  const domain = (process.env.SHOPIFY_STORE_DOMAIN || "")
    .replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const token = process.env.SHOPIFY_ACCESS_TOKEN || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";

  if (!domain || !token) throw new Error("Admin credentials not configured.");

  const PAGE_QUERY = `
    query BcRacingAll($after: String) {
      products(first: 250, after: $after, query: "title:BC Racing") {
        edges {
          node {
            id
            title
            handle
            status
            priceRangeV2 {
              minVariantPrice { amount currencyCode }
            }
            compareAtPriceRange {
              minVariantPrice { amount currencyCode }
            }
            images(first: 1) {
              edges { node { url altText width height } }
            }
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  `;

  const products: any[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const res = await fetch(`https://${domain}/admin/api/2024-01/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
      body: JSON.stringify({ query: PAGE_QUERY, variables: { after: cursor } }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Admin API ${res.status}: ${txt}`);
    }

    const json = await res.json();
    if (json.errors) throw new Error(`Admin GraphQL: ${JSON.stringify(json.errors)}`);

    const page = json.data?.products;
    if (!page) break;

    for (const { node } of page.edges) {
      // Normalise to same shape as Storefront API response
      products.push({
        id: node.id,
        title: node.title,
        handle: node.handle,
        availableForSale: true, // treat all as available (made-to-order dropship)
        priceRange: {
          minVariantPrice: node.priceRangeV2?.minVariantPrice ?? { amount: "0", currencyCode: "EUR" },
        },
        compareAtPriceRange: node.compareAtPriceRange ?? null,
        images: node.images,
      });
    }

    hasNextPage = page.pageInfo.hasNextPage;
    cursor = page.pageInfo.endCursor;
  }

  paginatedCollectionCache.set(CACHE_KEY, { data: products, ts: Date.now() });
  return products;
}

// ─── PRODUCTS ───────────────────────────────────────────────────

export async function getProductByHandle(handle: string) {
  const query = `
    ${PRODUCT_CARD_FRAGMENT}
    query ProductByHandle($handle: String!) {
      product(handle: $handle) {
        ...ProductCard
        descriptionHtml
        seo {
          title
          description
        }
      }
    }
  `;

  const data = await shopifyFetch<any>(query, { handle });
  return data.product;
}

export async function getProducts(first = 100, sortKey = "CREATED_AT", reverse = true) {
  const query = `
    ${PRODUCT_CARD_FRAGMENT}
    query Products($first: Int!, $sortKey: ProductSortKeys!, $reverse: Boolean!) {
      products(first: $first, sortKey: $sortKey, reverse: $reverse) {
        edges {
          node {
            ...ProductCard
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<any>(query, { first, sortKey, reverse });
  return data.products.edges.map((e: any) => e.node);
}

export async function getAllProductsForSitemap(): Promise<{ handle: string }[]> {
  const query = `
    query AllProductHandles($first: Int!, $after: String) {
      products(first: $first, after: $after) {
        edges {
          node {
            handle
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  const products: { handle: string }[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const data = await shopifyFetch<any>(query, { first: 250, after: cursor });
    const page = data.products;
    if (!page) break;
    for (const { node } of page.edges) {
      products.push({ handle: node.handle });
    }
    hasNextPage = page.pageInfo.hasNextPage;
    cursor = page.pageInfo.endCursor;
  }

  return products;
}

// ─── CART ────────────────────────────────────────────────────────

const CART_FRAGMENT = `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      totalAmount {
        amount
        currencyCode
      }
      subtotalAmount {
        amount
        currencyCode
      }
    }
    lines(first: 100) {
      edges {
        node {
          id
          quantity
          attributes {
            key
            value
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
          }
          merchandise {
            ... on ProductVariant {
              id
              title
              price {
                amount
                currencyCode
              }
              image {
                url
                altText
                width
                height
              }
              product {
                title
                handle
              }
              selectedOptions {
                name
                value
              }
            }
          }
        }
      }
    }
  }
`;

function fixCheckoutUrl(cart: any) {
  if (!cart?.checkoutUrl) return cart;
  const domain = process.env.SHOPIFY_STORE_DOMAIN || "";
  const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const myshopifyDomain = cleanDomain.endsWith(".myshopify.com")
    ? cleanDomain
    : null;

  try {
    const url = new URL(cart.checkoutUrl);
    if (!url.hostname.endsWith(".myshopify.com")) {
      if (myshopifyDomain) {
        url.hostname = myshopifyDomain;
      } else {
        const match = cleanDomain.match(/^([^.]+)/);
        if (match) {
          url.hostname = `${match[1]}.myshopify.com`;
        }
      }
      url.protocol = "https:";
      cart.checkoutUrl = url.toString();
    }
  } catch {
    if (myshopifyDomain) {
      cart.checkoutUrl = cart.checkoutUrl.replace(
        /^https?:\/\/[^/]+/,
        `https://${myshopifyDomain}`
      );
    }
  }
  return cart;
}

function checkUserErrors(userErrors: any[]) {
  if (userErrors && userErrors.length > 0) {
    const msg = userErrors.map((e: any) => e.message).join("; ");
    throw new Error(`Shopify cart error: ${msg}`);
  }
}

export async function createCart() {
  const query = `
    ${CART_FRAGMENT}
    mutation CreateCart {
      cartCreate {
        cart {
          ...CartFields
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await shopifyFetch<any>(query);
  checkUserErrors(data.cartCreate?.userErrors);
  return fixCheckoutUrl(data.cartCreate.cart);
}

export async function getCart(cartId: string) {
  const query = `
    ${CART_FRAGMENT}
    query GetCart($cartId: ID!) {
      cart(id: $cartId) {
        ...CartFields
      }
    }
  `;

  const data = await shopifyFetch<any>(query, { cartId });
  return fixCheckoutUrl(data.cart);
}

export async function addToCart(cartId: string, lines: { merchandiseId: string; quantity: number; attributes?: { key: string; value: string }[] }[]) {
  const query = `
    ${CART_FRAGMENT}
    mutation AddToCart($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          ...CartFields
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await shopifyFetch<any>(query, { cartId, lines });
  checkUserErrors(data.cartLinesAdd?.userErrors);
  if (!data.cartLinesAdd?.cart) {
    throw new Error("Failed to add items to cart — cart may have expired");
  }
  return fixCheckoutUrl(data.cartLinesAdd.cart);
}

export async function updateCartLines(cartId: string, lines: { id: string; quantity: number }[]) {
  const query = `
    ${CART_FRAGMENT}
    mutation UpdateCartLines($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart {
          ...CartFields
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await shopifyFetch<any>(query, { cartId, lines });
  checkUserErrors(data.cartLinesUpdate?.userErrors);
  if (!data.cartLinesUpdate?.cart) {
    throw new Error("Failed to update cart — cart may have expired");
  }
  return fixCheckoutUrl(data.cartLinesUpdate.cart);
}

export async function removeFromCart(cartId: string, lineIds: string[]) {
  const query = `
    ${CART_FRAGMENT}
    mutation RemoveFromCart($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart {
          ...CartFields
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const data = await shopifyFetch<any>(query, { cartId, lineIds });
  checkUserErrors(data.cartLinesRemove?.userErrors);
  if (!data.cartLinesRemove?.cart) {
    throw new Error("Failed to remove items from cart — cart may have expired");
  }
  return fixCheckoutUrl(data.cartLinesRemove.cart);
}

// ─── PAGES ──────────────────────────────────────────────────────

export async function getAllPages() {
  const query = `
    query AllPages {
      pages(first: 50) {
        edges {
          node {
            id
            title
            handle
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<any>(query);
  return data.pages.edges.map((e: any) => e.node);
}

export async function getPageByHandle(handle: string) {
  const query = `
    query PageByHandle($handle: String!) {
      page(handle: $handle) {
        id
        title
        handle
        body
        bodySummary
        seo {
          title
          description
        }
      }
    }
  `;

  const data = await shopifyFetch<any>(query, { handle });
  return data.page;
}

// ─── ADMIN API (Orders) ─────────────────────────────────────────

async function shopifyAdminFetch<T>(query: string, variables: Record<string, any> = {}): Promise<T> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN || "";
  const token = process.env.SHOPIFY_ACCESS_TOKEN || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "";

  if (!domain || !token) {
    throw new Error("Shopify Admin API credentials not configured.");
  }

  const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const url = `https://${cleanDomain}/admin/api/2024-01/graphql.json`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify Admin API error ${res.status}: ${text}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(`Shopify Admin GraphQL errors: ${JSON.stringify(json.errors)}`);
  }

  return json.data;
}

export async function getOrdersByEmail(email: string, first = 20) {
  const query = `
    query OrdersByEmail($query: String!, $first: Int!) {
      orders(first: $first, query: $query, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id
            name
            email
            createdAt
            displayFinancialStatus
            displayFulfillmentStatus
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            subtotalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            totalShippingPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            lineItems(first: 20) {
              edges {
                node {
                  name
                  quantity
                  originalTotalSet {
                    shopMoney {
                      amount
                      currencyCode
                    }
                  }
                  image {
                    url
                    altText
                  }
                  variant {
                    title
                  }
                }
              }
            }
            shippingAddress {
              city
              country
            }
          }
        }
      }
    }
  `;

  const data = await shopifyAdminFetch<any>(query, {
    query: `email:${email}`,
    first,
  });

  return data.orders.edges.map((e: any) => {
    const node = e.node;
    return {
      id: node.id,
      name: node.name,
      email: node.email,
      createdAt: node.createdAt,
      financialStatus: node.displayFinancialStatus,
      fulfillmentStatus: node.displayFulfillmentStatus,
      totalPrice: node.totalPriceSet?.shopMoney,
      subtotalPrice: node.subtotalPriceSet?.shopMoney,
      shippingPrice: node.totalShippingPriceSet?.shopMoney,
      shippingCity: node.shippingAddress?.city,
      shippingCountry: node.shippingAddress?.country,
      lineItems: node.lineItems.edges.map((li: any) => ({
        name: li.node.name,
        quantity: li.node.quantity,
        totalPrice: li.node.originalTotalSet?.shopMoney,
        imageUrl: li.node.image?.url,
        variantTitle: li.node.variant?.title,
      })),
    };
  });
}

// ─── SEARCH ─────────────────────────────────────────────────────

export async function searchProducts(searchQuery: string, first = 20, productType?: string) {
  // Append product_type predicate if a category filter is requested
  const fullQuery = productType
    ? `${searchQuery} product_type:${productType}`
    : searchQuery;

  const query = `
    ${PRODUCT_CARD_FRAGMENT}
    query SearchProducts($query: String!, $first: Int!) {
      search(query: $query, first: $first, types: [PRODUCT]) {
        edges {
          node {
            ... on Product {
              ...ProductCard
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<any>(query, { query: fullQuery, first });
  return data.search.edges.map((e: any) => e.node);
}

// ─── SHOP INFO (for analytics) ──────────────────────────────────

let cachedShopId: string | null = null;

export async function getShopId(): Promise<string> {
  if (cachedShopId) return cachedShopId;
  const domain = (process.env.SHOPIFY_STORE_DOMAIN || "").replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const res = await fetch(`https://${domain}/meta.json`);
  if (!res.ok) throw new Error(`Failed to fetch shop meta: ${res.status}`);
  const meta = await res.json();
  cachedShopId = String(meta.id || "");
  return cachedShopId;
}

export async function sendAnalyticsToShopify(events: any[]): Promise<boolean> {
  try {
    const now = Date.now();
    const batch = {
      metadata: { event_sent_at_ms: now },
      events: events.map((e: any) => ({
        schema_id: e.schema_id || e.schemaId,
        payload: e.payload,
        metadata: { event_created_at_ms: now },
      })),
    };
    const res = await fetch("https://monorail-edge.shopifysvc.com/unstable/produce_batch", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(batch),
    });
    if (res.status !== 207 && !res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`Shopify analytics rejected (${res.status}):`, text.slice(0, 200));
      return false;
    }
    return true;
  } catch (err: any) {
    console.error("Shopify analytics send error:", err.message);
    return false;
  }
}
