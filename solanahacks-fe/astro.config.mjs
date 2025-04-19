import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";

// No @astrojs/content needed here
export default defineConfig({
  integrations: [mdx()],
});
