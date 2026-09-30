import { readAppCss } from "@/lib/app-css";

export const dynamic = "force-dynamic";

// Plain URL on purpose. The dev bundler serves CSS from a path that contains
// brackets, and a registered service worker must not intercept /api/*.
export function GET() {
  return new Response(readAppCss(), {
    headers: {
      "Content-Type": "text/css; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
