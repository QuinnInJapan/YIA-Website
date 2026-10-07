// Measurement IDs are public identifiers, not credentials.
export const GA_MEASUREMENT_ID = "G-5XYKT7ST20";

export const GA_INITIALIZATION_SCRIPT = `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${GA_MEASUREMENT_ID}');
`;

export type AnalyticsEvent =
  | "document_open"
  | "form_link_click"
  | "language_change"
  | "generate_lead"
  | "contact_click"
  | "section_navigation"
  | "scroll_depth"
  | "video_open"
  | "contact_form_start"
  | "contact_form_submit"
  | "contact_form_error";
export type AnalyticsParameters = Record<string, string | number>;
type AnalyticsWindow = Window & { gtag?: (...args: unknown[]) => void };

export function trackAnalyticsEvent(event: AnalyticsEvent, parameters: AnalyticsParameters) {
  if (typeof window === "undefined") return;
  const gtag = (window as AnalyticsWindow).gtag;
  if (typeof gtag !== "function") return;

  // Telemetry must never interrupt navigation, translation, or form submission.
  try {
    const pathname = window.location?.pathname;
    gtag("event", event, {
      ...(pathname ? { page_path: pathname } : {}),
      ...parameters,
      send_to: GA_MEASUREMENT_ID,
    });
  } catch {
    // Collection is optional (for example, a privacy extension may block it).
  }
}

// Only call this with public content labels, never input values or form answers.
export function analyticsLabel(value: string): string {
  return value
    .replace(/https?:\/\/\S+/gi, (url) => url.split(/[?#]/)[0])
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

export function documentOpenParameters(href: string, origin: string) {
  if (!href.trim()) return null;
  try {
    const url = new URL(href, origin);
    if (!/^https?:$/.test(url.protocol)) return null;
    const filename = url.pathname.split("/").pop() || "file";
    return {
      file_name: filename.slice(0, 100),
      file_extension: filename.includes(".") ? filename.split(".").pop()!.toLowerCase() : "unknown",
    };
  } catch {
    return null;
  }
}

export function formLinkParameters(href: string, origin: string) {
  try {
    const url = new URL(href, origin);
    if (!/^https?:$/.test(url.protocol)) return null;
    const isGoogleForm =
      url.hostname === "forms.gle" ||
      (url.hostname === "docs.google.com" && /^\/forms\/(?:d|u)\//.test(url.pathname));
    if (!isGoogleForm) return null;
    // Query strings can contain prefilled answers; never include them in custom events.
    return { link_domain: url.hostname, form_path: url.pathname.slice(0, 100) };
  } catch {
    return null;
  }
}

interface AnalyticsLink {
  href: string;
  label: string;
  placement: string;
  documentHref?: string;
  sectionId?: string;
}

export function linkAnalyticsEvents(link: AnalyticsLink, origin: string) {
  const events: { event: AnalyticsEvent; parameters: AnalyticsParameters }[] = [];
  const context = { link_placement: link.placement };
  // Record contact intent without transmitting the recipient or phone number.
  if (/^(mailto|tel):/i.test(link.href)) {
    events.push({
      event: "contact_click",
      parameters: { ...context, method: /^mailto:/i.test(link.href) ? "email" : "phone" },
    });
    return events;
  }

  const label = analyticsLabel(link.label);
  const form = formLinkParameters(link.href, origin);
  if (form)
    events.push({
      event: "form_link_click",
      parameters: { ...form, ...context, link_label: label },
    });

  const document = documentOpenParameters(link.documentHref ?? link.href, origin);
  if (
    document &&
    (link.documentHref ||
      /^(pdf|docx?|xlsx?|pptx?|csv|txt|jpe?g|png|gif|webp|avif)$/i.test(document.file_extension))
  ) {
    events.push({
      event: "document_open",
      parameters: { ...document, ...context, document_label: label },
    });
  }

  if (link.sectionId) {
    events.push({
      event: "section_navigation",
      parameters: { section_id: analyticsLabel(link.sectionId), section_label: label },
    });
  }
  return events;
}

export function createScrollDepthTracker() {
  const sent = new Set<number>();
  return (scrollTop: number, viewportHeight: number, pageHeight: number): number[] => {
    if (pageHeight <= viewportHeight || viewportHeight <= 0) return [];
    const percent = Math.min(100, ((Math.max(0, scrollTop) + viewportHeight) / pageHeight) * 100);
    const reached = [25, 50, 75, 90].filter(
      (threshold) => percent >= threshold && !sent.has(threshold),
    );
    reached.forEach((threshold) => sent.add(threshold));
    return reached;
  };
}
