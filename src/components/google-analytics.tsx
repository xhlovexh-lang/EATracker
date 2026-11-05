import Script from "next/script";

const GA_ID_PATTERN = /^G-[A-Z0-9]+$/i;

function resolveGaMeasurementId(): string | null {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  if (!id || !GA_ID_PATTERN.test(id)) return null;
  return id;
}

/**
 * Loads GA4 via the standard gtag.js snippet (afterInteractive).
 * Injects only when NEXT_PUBLIC_GA_MEASUREMENT_ID is a valid G-… ID.
 */
export function GoogleAnalytics() {
  const measurementId = resolveGaMeasurementId();
  if (!measurementId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-gtag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
