import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GetFlightForce | 2026 Flight Compensation & Refund Tool",
  description: "Generate legal demand letters for delayed or cancelled flights under EC 261/2004 and US DOT mandates. Reclaim up to €600.",
  keywords: "flight delay compensation, airline refund, EC 261 demand letter, 2026 flight rights",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GetFlightForce",
  },
};

export const viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased bg-slate-50">
      <body className="min-h-full flex flex-col safe-pt safe-pb">
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registration successful');
                  }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
        <div className="flex-1 flex flex-col">
          {children}
        </div>

      </body>
    </html>
  );
}
