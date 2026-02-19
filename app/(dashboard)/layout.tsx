import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getUserStocks } from "@/app/actions/stocks";
import { getUserTags } from "@/app/actions/tags";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [stocks, tags] = await Promise.all([getUserStocks(), getUserTags()]);

  return (
    <DashboardShell stocks={stocks} tags={tags}>
      {children}
    </DashboardShell>
  );
}
