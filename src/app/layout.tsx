import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "GoalQuest — Employee Goal Setting & Tracking Portal",
  description: "In-house goal setting and tracking portal for organizational performance management. Set goals, track progress, and drive results.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
