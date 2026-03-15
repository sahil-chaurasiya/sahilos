import HomeClient from "./home/HomeClient";

const SITE_URL = "https://portfolio-next-eight-rose.vercel.app";

export const metadata = {
  title: "Sahil Chaurasiya | Full-Stack Developer – Next.js, Django, React",
  description:
    "Full-Stack Web Developer from Bhopal, India specializing in Next.js, React, Node.js, Django, and MongoDB.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "Sahil Chaurasiya | Full-Stack Developer",
    description:
      "Explore projects, resume, and developer journey built with Next.js, Django, and modern web technologies.",
    url: SITE_URL,
    siteName: "Sahil Chaurasiya Portfolio",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Sahil Chaurasiya – Full-Stack Developer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sahil Chaurasiya | Full-Stack Developer",
    description: "Full-Stack Developer from Bhopal, India. Next.js, Django, React, Node.js, MongoDB.",
    images: [`${SITE_URL}/og-image.png`],
  },
};

export default function Page() {
  return <HomeClient />;
}