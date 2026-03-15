import { headers } from "next/headers";

export const metadata = {
  metadataBase: new URL("https://sahilos.vercel.app"),
  title: "SahilOS — Personal Life & Career OS",
  description: "Your personal operating system. Tasks, projects, habits, journal, budget, and AI assistant — all in one place.",
  openGraph: {
    title: "SahilOS — Personal Operating System",
    description: "Tasks, projects, habits, journal, budget, AI assistant — all in one place.",
    url: "https://sahilos.vercel.app",
    siteName: "SahilOS",
    images: [
      {
        url: "https://sahilos.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "SahilOS — Personal Operating System",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SahilOS — Personal Operating System",
    description: "Tasks, projects, habits, journal, budget, AI assistant — all in one place.",
    images: ["https://sahilos.vercel.app/og-image.png"],
  },
};

// This page renders actual HTML (so scrapers read the OG tags above),
// then immediately redirects real users to /dashboard via meta refresh + JS.
export default function RootPage() {
  return (
    <html>
      <head>
        <meta httpEquiv="refresh" content="0;url=/dashboard" />
      </head>
      <body
        style={{
          margin: 0,
          background: "#0f1117",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "system-ui, sans-serif",
          color: "#6366f1",
          fontSize: "14px",
        }}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `window.location.replace('/dashboard');`,
          }}
        />
        Redirecting…
      </body>
    </html>
  );
}