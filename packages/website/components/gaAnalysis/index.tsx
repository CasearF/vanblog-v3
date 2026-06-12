import Script from "next/script";
export default function (props: { id: string }) {
  return (
    <>
      {props.id != "" && (
        <>
          <Script
            strategy="lazyOnload"
            src={`https://www.googletagmanager.com/gtag/js?id=${props.id}`}
          ></Script>
          <Script id="google-analytics" strategy="lazyOnload">
            {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${props.id}');
        `}
          </Script>
        </>
      )}
    </>
  );
}
