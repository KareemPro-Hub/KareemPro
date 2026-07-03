import "./globals.css";

export const metadata = {
  title: "Kareem Pro — بوابة العملاء",
  description: "بوابة متابعة المشاريع والمراحل — Kareem Pro",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
