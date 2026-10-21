import type { Metadata, Viewport } from "next";
import { Oswald, Montserrat } from "next/font/google";
import "./globals.css";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Creamice — Nigerian streetwear",
    template: "%s | Creamice",
  },
  description:
    "Creamice is a Nigerian streetwear label. Shop hoodies, sweatshirts, joggers and more, delivered across Nigeria.",
  applicationName: "Creamice",
  openGraph: {
    title: "Creamice — Nigerian streetwear",
    description:
      "Shop hoodies, sweatshirts, joggers and more. Delivered across Nigeria.",
    siteName: "Creamice",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <html
      lang="en-NG"
      className={`${oswald.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-jet text-offwhite">{children}</body>
    </html>
  );
}
