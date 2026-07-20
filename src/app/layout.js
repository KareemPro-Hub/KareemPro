import "./globals.css";

const TITLE = "Kareem Pro — بوابة الدخول";
const DESCRIPTION = "بوابة متابعة المشاريع والمراحل — Kareem Pro";

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
    images: [{ url: "/og-banner.png", width: 1200, height: 630, alt: "Kareem Pro" }],
    locale: "ar_SA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-banner.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
