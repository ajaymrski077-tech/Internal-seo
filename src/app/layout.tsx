import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ToastContext";
import { ConfirmProvider } from "@/components/ConfirmContext";

export const metadata: Metadata = {
  title: "MisterSK Infotech - SEO Traffic Dashboard",
  description: "Premium SEO analytics tracking dashboard: sessions, organic traffic, and conversions.",
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
