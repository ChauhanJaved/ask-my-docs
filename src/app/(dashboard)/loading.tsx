import { DashboardPageSkeleton } from "@/components/ui/page-loader";

export default function DashboardLoading() {
  return <DashboardPageSkeleton title={true} statCards={3} tableRows={4} />;
}
