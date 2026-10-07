"use client";

import { useEffect } from "react";
import Script from "next/script";
import {
  GA_INITIALIZATION_SCRIPT,
  GA_MEASUREMENT_ID,
  formLinkParameters,
  trackAnalyticsEvent,
} from "@/lib/google-analytics";

// Mounted only by the public production layout. GA's enhanced measurement owns
// page views (including browser-history changes); do not also send them manually.
export default function GoogleAnalytics() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link) return;
      const parameters = formLinkParameters(link.href, window.location.origin);
      if (parameters) trackAnalyticsEvent("form_link_click", parameters);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <>
      <Script
        id="google-analytics-script"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics-config" strategy="afterInteractive">
        {GA_INITIALIZATION_SCRIPT}
      </Script>
    </>
  );
}
