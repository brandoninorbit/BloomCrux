// src/app/page.tsx
import { redirect } from "next/navigation";

export default function RootPage() {
  // Redirect to the /home page, which is the main entry point for authenticated users.
  redirect("/home");
}
