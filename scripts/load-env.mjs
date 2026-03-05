/**
 * Load .env.local into process.env.
 *
 * Next.js handles .env.local automatically, but standalone Node scripts need
 * to load it themselves. Import this at the top of any script that needs env vars.
 *
 * Usage: import "./load-env.mjs";
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");

try {
  const envFile = readFileSync(envPath, "utf8");
  for (const line of envFile.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      if (!(key in process.env)) {
        process.env[key] = match[2].trim();
      }
    }
  }
} catch {
  // .env.local is optional — env vars may be set externally
}
