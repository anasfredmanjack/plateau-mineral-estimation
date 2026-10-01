import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ac3prototype - Naraguta Grid",
  description: "Look up potassium, thorium, and uranium grid values from Naraguta Grid by location or coordinates.",
  keywords: ["mineral estimation", "tin mining", "Jos Plateau", "Nigeria", "machine learning", "geophysics", "radiometric"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
