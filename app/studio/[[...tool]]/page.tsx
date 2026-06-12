"use client";

import { NextStudio } from "next-sanity/studio";
import config from "@/sanity.config";
import "../studio-overrides.css";
import "@/app/blog.css";

export default function StudioPage() {
  // Controlled scheme with no onSchemeChange = studio locked to light mode
  return <NextStudio config={config} scheme="light" />;
}
