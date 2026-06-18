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
  themeColor: "#6366f1",
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
          {/* Orb 1 — top right */}
          <div
            className="absolute rounded-full orb-pulse"
            style={{
              width: 700, height: 700,
              top: "-20%", right: "-15%",
              background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
          {/* Orb 2 — bottom left */}
          <div
            className="absolute rounded-full orb-pulse"
            style={{
              width: 600, height: 600,
              bottom: "-20%", left: "-15%",
              background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
              filter: "blur(80px)",
              animationDelay: "2s",
            }}
          />
          {/* Orb 3 — center subtle */}
          <div
            className="absolute rounded-full orb-pulse"
            style={{
              width: 400, height: 400,
              top: "40%", left: "40%",
              transform: "translate(-50%, -50%)",
              background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
              filter: "blur(60px)",
              animationDelay: "4s",
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
              background: "#0D1117",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#f1f5f9",
            },
          }}
        />
      </body>
    </html>
  );
}
