import dotenv from "dotenv";
import { defineCliConfig } from "sanity/cli";

dotenv.config({ path: ".env.local", quiet: true });

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

if (!projectId || !dataset) {
  throw new Error(
    "Sanity CLI requires NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET.",
  );
}

export default defineCliConfig({
  api: {
    projectId,
    dataset,
  },
});
