import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { DashboardChrome } from "@/components/dashboard/DashboardChrome";

export const dynamic = "force-dynamic";

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
