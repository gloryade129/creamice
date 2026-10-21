import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s | Creamice Dashboard",
  },
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardChrome role={user.role} fullName={user.fullName}>
      {children}
    </DashboardChrome>
  );
}
