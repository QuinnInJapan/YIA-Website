import { defineEnableDraftMode } from "next-sanity/draft-mode";
import { client, token } from "@/lib/sanity/client";

export const { GET } = defineEnableDraftMode({
  client: client.withConfig({ token }),
});
