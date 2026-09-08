import type { Metadata } from "next";
import "./globals.css";
import "./video.css";

export const metadata: Metadata = {
  title: "Bread of Life Divine Covenant Ministry",
  description: "A place to belong. A people becoming like Christ.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
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
