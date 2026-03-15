import { redirect } from "next/navigation";

const SITE_URL = "https://sahilos.vercel.app";

// ── PUBLIC ROOT METADATA (SOCIAL PREVIEW SOURCE) ──────────────────
export const metadata = {
  title: "SahilOS — Personal Life & Career OS",
  description:
    "Your personal operating system. Tasks, projects, habits, journal, budget, and AI assistant — all in one place.",

  metadataBase: new URL(SITE_URL),

  openGraph: {
    title: "SahilOS — Personal Operating System",
    description:
      "Tasks, projects, habits, journal, budget, AI assistant — all in one place.",
    url: SITE_URL,
    siteName: "SahilOS",
    type: "website",

    // ⭐ ABSOLUTE URL REQUIRED
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "SahilOS — Personal Operating System",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "SahilOS — Personal Operating System",
    description:
      "Tasks, projects, habits, journal, budget, AI assistant — all in one place.",
    images: [`${SITE_URL}/og-image.png`],
  },
};

// ── REDIRECT USERS AFTER METADATA IS SERVED ───────────────────────
export default function Page() {
  redirect("/dashboard");
}