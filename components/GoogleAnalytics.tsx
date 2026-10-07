"use client";

import { useEffect } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import {
  GA_INITIALIZATION_SCRIPT,
  GA_MEASUREMENT_ID,
  createScrollDepthTracker,
  linkAnalyticsEvents,
  trackAnalyticsEvent,
} from "@/lib/google-analytics";

// Mounted only by the public production layout. GA's enhanced measurement owns
// page views (including browser-history changes); do not also send them manually.
export default function GoogleAnalytics() {
  const pathname = usePathname();
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.type === "click" ? event.button !== 0 : event.button !== 1) return;
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link) return;
      const placement =
        link.dataset.analyticsPlacement ||
        (link.closest("header")
          ? "header"
          : link.closest("footer")
            ? "footer"
            : link.closest("aside, .ann-toc")
              ? "sidebar"
              : "content");
      const events = linkAnalyticsEvents(
        {
          href: link.href,
          label: link.dataset.analyticsLabel || link.textContent || "",
          placement,
          documentHref: link.dataset.analyticsDocumentUrl,
          sectionId: link.dataset.analyticsSectionId,
        },
        window.location.origin,
      );
      events.forEach(({ event, parameters }) => trackAnalyticsEvent(event, parameters));
    }

    document.addEventListener("click", handleClick);
    document.addEventListener("auxclick", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("auxclick", handleClick);
    };
  }, []);

  useEffect(() => {
    const reachedMilestones = createScrollDepthTracker();
    let frame: number | null = null;
    function handleScroll() {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        const height = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
        reachedMilestones(window.scrollY, window.innerHeight, height).forEach((percent) => {
          trackAnalyticsEvent("scroll_depth", { percent_scrolled: percent });
        });
      });
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

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
