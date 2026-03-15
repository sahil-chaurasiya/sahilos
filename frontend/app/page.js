import { redirect } from "next/navigation";

export const metadata = {
  title: "SahilOS — Personal Life & Career OS",
  description: "Your personal operating system. Tasks, projects, habits, journal, budget, and AI assistant — all in one place.",
};

export default function Page() {
  redirect("/dashboard");
}