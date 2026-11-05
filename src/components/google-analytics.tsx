import Script from "next/script";

/** Production GA4 Measurement ID (public). Override via NEXT_PUBLIC_GA_MEASUREMENT_ID. */
const DEFAULT_GA_MEASUREMENT_ID = "G-LKBLX98BC2";

const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || DEFAULT_GA_MEASUREMENT_ID;

/**
 * Loads GA4 via the standard gtag.js snippet (afterInteractive).
 * Measurement ID mirrors SITE_URL: env-driven with a documented production default.
 */
export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-gtag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
