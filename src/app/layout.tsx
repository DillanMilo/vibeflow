import type { Metadata, Viewport } from "next";
import { DM_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Vibeflow",
  description:
    "Project management tool I made coz I was too cheap to subscribe to one.",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.svg",
  },
  openGraph: {
    title: "Vibeflow",
    description:
      "Project management tool I made coz I was too cheap to subscribe to one.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

const FLOW_OS_URL = "https://flow-os-flax.vercel.app";

function FlowOsBridge() {
  return (
    <div className="flex-shrink-0 border-b border-border-subtle bg-background/95 px-3 py-2 backdrop-blur-md md:px-6">
      <div className="flex items-center justify-between gap-3">
        <a
          href={FLOW_OS_URL}
          className="rounded-lg border border-border-subtle bg-surface px-3 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-text-secondary transition hover:border-accent/40 hover:text-text-primary"
        >
          Back to Flow OS
        </a>
        <div className="hidden min-w-0 flex-1 text-center text-[11px] uppercase tracking-[0.16em] text-text-dim sm:block">
          Vibe Flow remains the live task app
        </div>
        <a
          href={`${FLOW_OS_URL}/agents`}
          className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-accent transition hover:bg-accent/15"
        >
          Ask Alfred
        </a>
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${dmSans.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <AuthProvider>
          <AppProvider>
            <div className="flex min-h-dvh flex-col">
              <FlowOsBridge />
              <div className="min-h-0 flex-1">{children}</div>
            </div>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
