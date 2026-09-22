const API_BASE = "https://api.wheel-size.com/v2";

function getApiKey(): string {
  const key = process.env.WHEEL_SIZE_API_KEY;
  if (!key) throw new Error("WHEEL_SIZE_API_KEY not configured");
  return key;
}

async function wsGet(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${API_BASE}${path}`);
  url.searchParams.set("user_key", getApiKey());
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wheel-Size API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function getMakes() {
  return wsGet("/makes/");
}

export async function getModels(make: string) {
  return wsGet("/models/", { make });
}

export async function getYears(make: string, model: string) {
  return wsGet("/years/", { make, model });
}

export async function getGenerations(make: string, model: string, year: string) {
  return wsGet("/generations/", { make, model, year });
}

export async function getModifications(make: string, model: string, year: string, generation?: string) {
  const params: Record<string, string> = { make, model, year };
  if (generation) params.generation = generation;
  return wsGet("/modifications/", params);
}

export async function searchByModel(make: string, model: string, year: string, modification?: string, generation?: string, region?: string) {
  const params: Record<string, string> = { make, model, year };
  if (modification) params.modification = modification;
  if (generation) params.generation = generation;
  if (!modification) params.region = region || "eudm";
  return wsGet("/search/by_model/", params);
}

export async function getRegions() {
  return wsGet("/regions/");
}
