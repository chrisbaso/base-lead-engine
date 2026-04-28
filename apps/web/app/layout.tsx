import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Base Lead Engine",
  description: "Reusable lead generation funnel chassis"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
