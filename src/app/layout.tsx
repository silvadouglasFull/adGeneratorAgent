import { sessionInformation } from "@/auth/infrastructure/auth/sessionInformation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserAvatarWithTooltip } from "@/components/user/UserAvatarWithTooltip";
import { ThemeProvider } from "@/context/ThemeContext";
import { assets, contentDescription, flavorName, getCSSVariablesFromTheme } from "@/flavor/flavor";
import "@uiw/react-markdown-preview/markdown.css";
import "@uiw/react-md-editor/markdown-editor.css";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (
    <html lang="en">
      <head>
        <title>{flavorName}</title>
        <meta name="description" content={contentDescription} />
        {/* Default light theme injected server-side; ThemeProvider updates on client */}
        <style id="theme-vars" dangerouslySetInnerHTML={{ __html: getCSSVariablesFromTheme('light') }} />
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
        <ThemeProvider>
          <div className="flex items-center justify-end gap-2 px-4 py-2">
            {sessionInformation.userName && (
              <UserAvatarWithTooltip userName={sessionInformation.userName} />
            )}
            <ThemeToggle />
          </div>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
