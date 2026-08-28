import "./globals.css";

const TITLE = "Kareem Pro — بوابة الدخول";
const DESCRIPTION = "بوابة متابعة المشاريع والمراحل — Kareem Pro";

// Explicitly tells any browser / in-app webview (email apps, etc.) that this
// site is light-only and should never be auto-dark-moded. Some in-app
// browsers (e.g. mail clients' built-in webview when the app itself is in
// Dark Mode) apply their own forced "night mode" filter to pages that don't
// declare a color-scheme — this stops that from happening here.
export const viewport = {
  colorScheme: "light",
};

export const metadata = {
  metadataBase: new URL("https://kareempro.com"),
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: false, follow: false },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "https://kareempro.com",
    siteName: "Kareem Pro",
    images: [{ url: "/og-banner-v2.png", width: 1200, height: 630, alt: "Kareem Pro" }],
    locale: "ar_SA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-banner-v2.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
