import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Puck Multi-Tenant Demo",
  description: "Stateless Next.js multi-tenant rendering demo with Puck",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
