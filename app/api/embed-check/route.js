import { NextResponse } from "next/server";
import { PROJECTS } from "@/lib/projects";

export const runtime = "nodejs";

// Which of your sites allow being shown inside an iframe? Sites can forbid it with
// X-Frame-Options or CSP frame-ancestors. We check once and cache the answer.
const ALLOWED = new Set(PROJECTS.map((p) => p.url));
const cache = new Map(); // url -> { ok, at }
const TTL = 12 * 60 * 60 * 1000;

async function check(url) {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: { "user-agent": "Mozilla/5.0 (compatible; PortfolioEmbedCheck/1.0)" },
    });
    res.body?.cancel().catch(() => {});
    const xfo = (res.headers.get("x-frame-options") || "").toLowerCase();
    const csp = (res.headers.get("content-security-policy") || "").toLowerCase();
    if (xfo.includes("deny") || xfo.includes("sameorigin")) return false;
    const fa = csp.match(/frame-ancestors([^;]*)/);
    if (fa && !/(\*|https:)/.test(fa[1])) return false;
    return true;
  } catch {
    return true; // could not check (slow/offline): let the visitor's browser try the live view
  }
}

export async function GET(req) {
  const url = new URL(req.url).searchParams.get("url") || "";
  if (!ALLOWED.has(url)) return NextResponse.json({ error: "Unknown URL" }, { status: 400 });
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < TTL) return NextResponse.json({ embeddable: hit.ok });
  const ok = await check(url);
  cache.set(url, { ok, at: Date.now() });
  return NextResponse.json({ embeddable: ok });
}
