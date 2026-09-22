import express, { type Express, type Request, type Response } from "express";
import fs from "fs";
import path from "path";

const BASE_URL = "https://jujuwheels.com";

// All valid SPA route patterns (must stay in sync with client/src/App.tsx)
const KNOWN_ROUTE_PATTERNS: RegExp[] = [
  /^\/$/,
  /^\/collections\/[^/]+$/,
  /^\/products\/[^/]+$/,
  /^\/pages\/[^/]+$/,
  /^\/fitment-calculator$/,
  /^\/wheel-spec-calculator$/,
  /^\/my-account$/,
  /^\/powdercoating$/,
  /^\/wheel-rebuilding$/,
  /^\/fitment-calculation$/,
  /^\/fender-rolling$/,
  /^\/login$/,
  /^\/authenticity$/,
  /^\/knowledge$/,
  /^\/about$/,
  /^\/vehicle-fitment$/,
  /^\/my-garage$/,
  /^\/sale$/,
  /^\/pre-order$/,
  /^\/parts-configurator$/,
  /^\/stanceparts$/,
  /^\/bc-racing$/,
  /^\/search$/,
  /^\/wheel-visualizer$/,
];

function isKnownRoute(pathname: string): boolean {
  return KNOWN_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  const indexPath = path.resolve(distPath, "index.html");
  const indexHtml = fs.readFileSync(indexPath, "utf-8");

  app.use("/assets", express.static(path.join(distPath, "assets"), {
    maxAge: "1y",
    immutable: true,
  }));

  app.use("/images", express.static(path.join(distPath, "images"), {
    maxAge: "30d",
  }));

  app.use(express.static(distPath, {
    maxAge: "1h",
  }));

  app.use("/{*path}", (req: Request, res: Response) => {
    const pathname = req.path;
    const known = isKnownRoute(pathname);

    // Normalise: strip trailing slash except for root
    const canonicalPath = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
    const canonicalUrl = `${BASE_URL}${canonicalPath}`;

    let html = indexHtml;

    if (known) {
      // Replace the placeholder canonical with the route-specific one
      html = html.replace(
        /<!--canonical-placeholder-->/,
        `<link rel="canonical" href="${canonicalUrl}" />`,
      );
      // Inject og:url just before </head>
      html = html.replace(
        "</head>",
        `  <meta property="og:url" content="${canonicalUrl}" />\n  </head>`,
      );
      res.status(200).send(html);
    } else {
      // Unknown route: proper 404 + noindex (no canonical)
      html = html
        .replace(/<!--canonical-placeholder-->/, "")
        .replace(
          /<meta name="robots" content="index, follow" \/>/,
          '<meta name="robots" content="noindex, nofollow" />',
        );
      res.status(404).send(html);
    }
  });
}
