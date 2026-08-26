import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ToastContext";
import { ConfirmProvider } from "@/components/ConfirmContext";

export const metadata: Metadata = {
  title: "MisterSK Infotech - SEO Traffic Dashboard",
  description: "Premium SEO analytics tracking dashboard: sessions, organic traffic, and conversions.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
    apple: ["/favicon.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <ConfirmProvider>
            {children}
          </ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
