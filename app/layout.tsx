import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "IdeaVault",
  description: "Your collaborative idea space",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "IdeaVault" },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={GeistSans.className}>
        {/* Fixed background layer — dot grid + breathing orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
          {/* Dot grid */}
          <div className="absolute inset-0 dot-grid" />
          {/* Orb 1 — top right, warm spark */}
          <div
            className="absolute rounded-full orb-pulse"
            style={{
              width: 700, height: 700,
              top: "-25%", right: "-18%",
              background: "radial-gradient(circle, rgba(245,165,36,0.10) 0%, transparent 70%)",
              filter: "blur(70px)",
            }}
          />
          {/* Orb 2 — bottom left, cool neutral counterweight */}
          <div
            className="absolute rounded-full orb-pulse"
            style={{
              width: 600, height: 600,
              bottom: "-22%", left: "-15%",
              background: "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)",
              filter: "blur(90px)",
              animationDelay: "3s",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative" style={{ zIndex: 1 }}>
          {children}
        </div>

        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "#1B1B1D",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#F5F4F2",
            },
          }}
        />
      </body>
    </html>
  );
}
