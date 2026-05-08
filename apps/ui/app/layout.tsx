import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "skills-repo ui",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <div className="mx-auto max-w-3xl p-6">{children}</div>
      </body>
    </html>
  );
}
