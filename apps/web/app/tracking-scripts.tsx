import Script from "next/script";
import type { TenantConfig } from "@ble/tenant-schema";

type TrackingScriptsProps = {
  tenant: TenantConfig;
};

export function TrackingScripts({ tenant }: TrackingScriptsProps) {
  const gtmId = tenant.tracking.gtmContainerId;
  const metaPixelId = tenant.tracking.metaPixelId;
  const googleAdsId = tenant.tracking.googleAdsConversionId;
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  return (
    <>
      {gtmId ? (
        <Script id="gtm-loader" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
            (function(w,d,s,l,i){var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!="dataLayer"?"&l="+l:"";j.async=true;j.src="https://www.googletagmanager.com/gtm.js?id="+i+dl;f.parentNode.insertBefore(j,f);})(window,document,"script","dataLayer","${gtmId}");
          `}
        </Script>
      ) : null}
      {metaPixelId ? (
        <Script id="meta-pixel-loader" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=true;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=true;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,"script","https://connect.facebook.net/en_US/fbevents.js");
            fbq("init", "${metaPixelId}");
            fbq("track", "PageView");
          `}
        </Script>
      ) : null}
      {googleAdsId ? (
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`} strategy="afterInteractive" />
      ) : null}
      {googleAdsId ? (
        <Script id="google-ads-loader" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag("js", new Date());
            gtag("config", "${googleAdsId}");
          `}
        </Script>
      ) : null}
      <Script id="ble-client-fallback-events" strategy="afterInteractive">
        {`
          window.addEventListener("ble:tracking", function(event) {
            var detail = event.detail || {};
            var mappings = detail.payload && detail.payload.eventMappings ? detail.payload.eventMappings : {};
            var mapped = mappings[detail.eventName] || {};
            var metaEvent = mapped.meta || detail.eventName;
            var googleEvent = mapped.googleAds || detail.eventName;
            var gtmEvent = mapped.gtm || detail.eventName;
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({ event: gtmEvent, payload: detail.payload });
            if (window.fbq) window.fbq("track", metaEvent, detail.payload || {});
            if (window.gtag) window.gtag("event", googleEvent, detail.payload || {});
          });
        `}
      </Script>
      {turnstileSiteKey ? (
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      ) : null}
    </>
  );
}
