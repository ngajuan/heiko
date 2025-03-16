import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Heikō",
  description: "A day planner with a multiple view comparison function",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}