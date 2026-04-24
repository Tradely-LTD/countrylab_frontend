import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  FlaskConical,
  FileCheck,
  Package,
  Wrench,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  ArrowRight,
  Activity,
  Calendar,
} from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { AppShell, PageContainer, TopHeader } from "../../components/layout";
import { SkeletonCard, StatusBadge, Button } from "../../components/ui";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { clsx } from "clsx";
import { useState } from "react";
import { ShoppingCart } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.25, ease: [0, 0, 0.2, 1] },
  }),
};

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  trend,
  delay = 0,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
  trend?: string;
  delay?: number;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      custom={delay}
      className="stat-card"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <p className="stat-value mt-1">{value}</p>
          {trend && <p className="stat-trend-up mt-1">{trend}</p>}
        </div>
        <div
          className={clsx(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            color,
          )}
        >
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </motion.div>
  );
}

function AlertBanner({
  type,
  count,
  label,
  to,
}: {
  type: "warning" | "error";
  count: number;
  label: string;
  to: string;
}) {
  if (count === 0) return null;
  return (
    <Link
      to={to}
      className={clsx(
        "flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium",
        type === "warning"
          ? "bg-amber-50 border-amber-200 text-amber-800"
          : "bg-red-50 border-red-200 text-red-800",
      )}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle size={15} />
        <span>
          {count} {label}
        </span>
      </div>
      <ArrowRight size={14} />
    </Link>
  );
}

export default function DashboardPage() {
  const { user, isRole } = useAuth();
  const [dateFilter, setDateFilter] = useState<
    "today" | "yesterday" | "week" | "month"
  >("month");

  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (dateFilter) {
      case "today":
        return { start: today, end: new Date() };
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return { start: yesterday, end: today };
      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return { start: weekAgo, end: new Date() };
      case "month":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: monthStart, end: new Date() };
    }
  };

  const dateRange = getDateRange();

  const { data: widgets, isLoading: widgetsLoading } = useQuery({
    queryKey: ["dashboard-widgets", dateFilter],
    queryFn: () => {
      const params = {
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
      };
      return api.get("/dashboard/widgets", { params }).then((r) => r.data.data);
    },
    refetchInterval: 30_000,
  });

  const { data: activity } = useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: () =>
      api.get("/dashboard/recent-activity").then((r) => r.data.data),
    refetchInterval: 60_000,
  });

  const sampleStatusData =
    widgets?.samples?.byStatus?.map((s: any) => ({
      name: s.status.replace("_", " "),
      count: s.count,
    })) || [];

  return (
    <AppShell>
      <TopHeader
        title={`Good ${getTimeOfDay()}, ${user?.full_name?.split(" ")[0]}`}
        subtitle="Here's what's happening in the lab today"
        actions={
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {["today", "yesterday", "week", "month"].map((filter) => (
              <button
                key={filter}
                onClick={() => setDateFilter(filter as any)}
                className={clsx(
                  "px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap",
                  dateFilter === filter
                    ? "bg-primary-600 text-white"
                    : "bg-white text-lab-text hover:bg-lab-bg border border-lab-border",
                )}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        }
      />
      <PageContainer>
        {/* Alert Banners */}
        {!widgetsLoading && (
          <div className="space-y-2 mb-6">
            <AlertBanner
              type="error"
              count={widgets?.inventory?.lowStock || 0}
              label="reagents below reorder level"
              to="/inventory"
            />
            <AlertBanner
              type="warning"
              count={widgets?.assets?.calibrationDue || 0}
              label="assets due for calibration"
              to="/assets"
            />
            <AlertBanner
              type="warning"
              count={widgets?.inventory?.expiringSoon || 0}
              label="reagents expiring within 30 days"
              to="/inventory"
            />
            {isRole("md", "super_admin") && (
              <AlertBanner
                type="error"
                count={widgets?.pendingApprovals || 0}
                label="results awaiting your approval"
                to="/approval-queue"
              />
            )}
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {widgetsLoading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard
                icon={FlaskConical}
                label="Samples Today"
                value={widgets?.samples?.todayCount || 0}
                color="bg-blue-500"
                delay={0}
              />
              <StatCard
                icon={Clock}
                label="Pending Approvals"
                value={widgets?.pendingApprovals || 0}
                color="bg-violet-500"
                delay={1}
              />
              <StatCard
                icon={Package}
                label="Low Stock Items"
                value={widgets?.inventory?.lowStock || 0}
                color="bg-amber-500"
                delay={2}
              />
              {isRole("md", "super_admin", "finance") && (
                <StatCard
                  icon={TrendingUp}
                  label={`${dateFilter.charAt(0).toUpperCase() + dateFilter.slice(1)} Revenue`}
                  value={`₦${((widgets?.finance?.monthRevenue || 0) / 1000).toFixed(1)}k`}
                  color="bg-emerald-500"
                  trend="Paid invoices"
                  delay={3}
                />
              )}
              {!isRole("md", "super_admin", "finance") && (
                <StatCard
                  icon={Wrench}
                  label="Calibration Due"
                  value={widgets?.assets?.calibrationDue || 0}
                  color="bg-red-500"
                  delay={3}
                />
              )}
            </>
          )}
        </div>

        {/* Charts + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Sample Status Chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="card p-5 lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-base text-lab-text">
                  Sample Status Distribution
                </h3>
                <p className="text-xs text-lab-muted">
                  All-time sample breakdown
                </p>
              </div>
              <Activity size={18} className="text-lab-muted" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sampleStatusData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                  }}
                />
                <Bar dataKey="count" fill="#1A56DB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.3 }}
            className="card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-base text-lab-text">
                Recent Samples
              </h3>
              <Link
                to="/samples"
                className="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {activity?.recentSamples?.length === 0 && (
                <p className="text-xs text-lab-muted text-center py-4">
                  No samples yet
                </p>
              )}
              {activity?.recentSamples?.map((s: any) => (
                <Link
                  key={s.id}
                  to={`/samples/${s.id}`}
                  className="flex items-start gap-3 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                    <FlaskConical size={14} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-lab-text truncate group-hover:text-primary-600 transition-colors">
                      {s.name}
                    </p>
                    <p className="text-[10px] text-lab-muted">
                      {s.client?.name} · {s.ulid}
                    </p>
                  </div>
                  <StatusBadge status={s.status} />
                </Link>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {[
            {
              label: "Register Sample",
              to: "/samples/new",
              icon: FlaskConical,
              color: "bg-blue-50 text-blue-600",
            },
            {
              label: "Enter Results",
              to: "/results/new",
              icon: FileCheck,
              color: "bg-violet-50 text-violet-600",
            },
            {
              label: "New Requisition",
              to: "/procurement/new",
              icon: ShoppingCart,
              color: "bg-amber-50 text-amber-600",
            },
            {
              label: "Add Asset",
              to: "/assets/new",
              icon: Wrench,
              color: "bg-emerald-50 text-emerald-600",
            },
          ].map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className="card-hover p-4 flex items-center gap-3 group"
            >
              <div
                className={clsx(
                  "w-9 h-9 rounded-xl flex items-center justify-center",
                  q.color,
                )}
              >
                <q.icon size={18} />
              </div>
              <span className="text-sm font-medium text-lab-text group-hover:text-primary-700 transition-colors">
                {q.label}
              </span>
            </Link>
          ))}
        </motion.div>
      </PageContainer>
    </AppShell>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
