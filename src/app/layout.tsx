import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bank Statement Converter Kyriba",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-inter antialiased">{children}</body>
    </html>
  );
}
