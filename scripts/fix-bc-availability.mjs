import { readFileSync } from "fs";

const domain = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, "").replace(/\/+$/, "");
const token = process.env.SHOPIFY_ACCESS_TOKEN || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

if (!domain || !token) {
  console.error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_ACCESS_TOKEN");
  process.exit(1);
}

const ADMIN_URL = `https://${domain}/admin/api/2024-01/graphql.json`;

async function adminFetch(query, variables = {}) {
  const res = await fetch(ADMIN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

// Get variant IDs for a batch of product IDs
async function getVariantIds(numericIds) {
  const gids = numericIds.map(id => `gid://shopify/Product/${id}`);
  const data = await adminFetch(`
    query getVariants($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on Product {
          id
          availableForSale
          variants(first: 5) {
            edges { node { id inventoryPolicy } }
          }
        }
      }
    }
  `, { ids: gids });

  const variants = [];
  for (const node of (data.nodes || [])) {
    if (!node || node.availableForSale) continue; // skip already-available
    for (const edge of (node.variants?.edges || [])) {
      if (edge.node.inventoryPolicy !== "CONTINUE") {
        variants.push(edge.node.id);
      }
    }
  }
  return variants;
}

// Update a batch of variant IDs to CONTINUE (using aliased mutations)
async function patchVariants(variantIds) {
  if (variantIds.length === 0) return [];
  const aliases = variantIds.map((id, i) => `
    v${i}: productVariantUpdate(input: { id: "${id}", inventoryPolicy: CONTINUE }) {
      productVariant { id inventoryPolicy }
      userErrors { field message }
    }
  `).join("\n");
  const data = await adminFetch(`mutation { ${aliases} }`);
  return Object.values(data).map(r => r?.userErrors || []).flat();
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

const allIds = JSON.parse(readFileSync("/tmp/unavail_ids.json", "utf8"));
console.log(`Processing ${allIds.length} unavailable products...`);

let totalFixed = 0;
let totalErrors = 0;
const BATCH = 50; // products per variant-fetch call
const PATCH_BATCH = 10; // variants per mutation call

for (let i = 0; i < allIds.length; i += BATCH) {
  const chunk = allIds.slice(i, i + BATCH);
  let variantIds;
  try {
    variantIds = await getVariantIds(chunk);
  } catch (e) {
    console.error(`  Fetch error at batch ${i}:`, e.message);
    await sleep(2000);
    continue;
  }

  // Patch in sub-batches of 10
  for (let j = 0; j < variantIds.length; j += PATCH_BATCH) {
    const patchChunk = variantIds.slice(j, j + PATCH_BATCH);
    try {
      const errors = await patchVariants(patchChunk);
      if (errors.length > 0) {
        console.error("  Errors:", errors);
        totalErrors += errors.length;
      }
      totalFixed += patchChunk.length;
    } catch (e) {
      console.error("  Patch error:", e.message);
      await sleep(2000);
    }
    await sleep(200); // ~5 req/sec, well within Shopify limits
  }

  if ((i / BATCH) % 10 === 0) {
    console.log(`  ${i + BATCH}/${allIds.length} products processed, ${totalFixed} variants fixed`);
  }
}

console.log(`\nDone. Fixed ${totalFixed} variants. Errors: ${totalErrors}`);
