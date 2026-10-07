// Measurement IDs are public identifiers, not credentials.
export const GA_MEASUREMENT_ID = "G-5XYKT7ST20";

export const GA_INITIALIZATION_SCRIPT = `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${GA_MEASUREMENT_ID}');
`;

type AnalyticsEvent = "document_open" | "form_link_click" | "language_change" | "generate_lead";
type AnalyticsWindow = Window & { gtag?: (...args: unknown[]) => void };

export function trackAnalyticsEvent(event: AnalyticsEvent, parameters: Record<string, string>) {
  if (typeof window === "undefined") return;
  const gtag = (window as AnalyticsWindow).gtag;
  if (typeof gtag !== "function") return;

  // Telemetry must never interrupt navigation, translation, or form submission.
  try {
    gtag("event", event, { ...parameters, send_to: GA_MEASUREMENT_ID });
  } catch {
    // Collection is optional (for example, a privacy extension may block it).
  }
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
