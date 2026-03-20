import { assets, contentDescription, flavorName, getCSSVariablesFromPalette } from "@/flavor/flavor";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>{flavorName}</title>
        <meta name="description" content={contentDescription} />
        <style dangerouslySetInnerHTML={{ __html: getCSSVariablesFromPalette() }} />
        {assets.favicon_io.map((icon, index) => {
          if (icon.name.includes('apple-touch-icon')) {
            return <link key={index} rel="apple-touch-icon" href={icon.path} />;
          } else if (icon.name.includes('.webmanifest')) {
            return <link key={index} rel="manifest" href={icon.path} />;
          } else if (icon.name.includes('.ico')) {
            return <link key={index} rel="icon" href={icon.path} />;
          } else if (icon.name.includes('.png')) {
            const sizes = icon.name.split('-').pop()?.split('.')[0];
            return <link key={index} rel="icon" type="image/png" sizes={sizes} href={icon.path} />;
          }
          return null;
        })}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
