import { readFileSync } from "node:fs";
import { join } from "node:path";

/** App stylesheet with the Tailwind entry import removed so it is valid in a browser. */
export function readAppCss(): string {
  return readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8")
    .replace(/^@import\s+["']tailwindcss["'];?\s*/m, "")
    .replace(/<\/style/gi, "<\\/style");
}
