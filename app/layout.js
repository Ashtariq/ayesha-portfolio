import "./globals.css";

export const metadata = {
  title: "Ayesha Tariq - Full Stack Developer",
  description:
    "Portfolio of Ayesha Tariq: live WordPress websites, custom plugins and full stack web apps.",
};

export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: browser extensions (Grammarly, password managers, dark-mode
    // tools...) add attributes to <html>/<body> before React loads and cause false warnings.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Errors thrown by browser extensions (chrome-extension://...) are not bugs in this site.
            Ignore them so the Next.js dev overlay does not show them. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){function ext(x){return typeof x==="string"&&x.indexOf("-extension://")>-1}
window.addEventListener("error",function(e){if(ext(e.filename)||(e.error&&ext(e.error.stack))){e.stopImmediatePropagation();e.preventDefault()}},true);
window.addEventListener("unhandledrejection",function(e){if(e.reason&&ext(e.reason.stack)){e.stopImmediatePropagation();e.preventDefault()}},true)})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;800&family=Inter:wght@400;500;600&display=swap"
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
