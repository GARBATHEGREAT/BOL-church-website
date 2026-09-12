import type { Metadata } from "next";
import "./globals.css";
import "./video.css";

export const metadata: Metadata = {
  title: "Bread of Life Divine Covenant Ministry",
  description: "A place to belong. A people becoming like Christ.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-48.png", type: "image/png", sizes: "48x48" },
      { url: "/favicon-192.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
