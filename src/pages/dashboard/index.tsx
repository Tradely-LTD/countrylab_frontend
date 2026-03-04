import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  FlaskConical, FileCheck, Package, Wrench, TrendingUp,
  AlertTriangle, Clock, ArrowRight, Activity, ShoppingCart
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { AppShell, PageContainer, TopHeader } from '../../components/layout';
import { SkeletonCard, StatusBadge, Button } from '../../components/ui';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { clsx } from 'clsx';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.25, ease: [0, 0, 0.2, 1] as any }
  }),
};

function StatCard({
  icon: Icon, label, value, colorClass, trend, delay = 0
}: {
  icon: any; label: string; value: string | number;
  colorClass: string; trend?: string; delay?: number;
}) {
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" custom={delay} className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label">{label}</p>
          <p className="stat-value mt-1">{value}</p>
          {trend && <p className="stat-trend-up mt-1">{trend}</p>}
        </div>
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', colorClass)}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </motion.div>
  );
}

function AlertBanner({
  type, count, label, to
}: {
  type: 'warning' | 'error'; count: number; label: string; to: string;
}) {
  if (!count) return null;
  return (
    <Link to={to} className={clsx(
      'flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium',
      type === 'warning'
        ? 'bg-amber-50 border-amber-200 text-amber-800'
        : 'bg-red-50 border-red-200 text-red-800'
    )}>
      <div className="flex items-center gap-2">
        <AlertTriangle size={14} />
        <span>{count} {label}</span>
      </div>
      <ArrowRight size={13} />
    </Link>
  );
}

export default function DashboardPage() {
  const { user, isRole } = useAuth();

  const { data: widgets, isLoading } = useQuery({
    queryKey: ['dashboard-widgets'],
    queryFn: () => api.get('/dashboard/widgets').then(r => r.data.data),
    refetchInterval: 30_000,
  });

  const { data: activity } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: () => api.get('/dashboard/recent-activity').then(r => r.data.data),
  });

  const statusData = (widgets?.samples?.byStatus || []).map((s: any) => ({
    name: s.status.replace(/_/g, ' '),
    count: s.count,
  }));

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  })();

  return (
    <AppShell>
      <TopHeader
        title={`Good ${greeting}, ${user?.full_name?.split(' ')[0] || 'there'}`}
        subtitle="Lab operations overview"
      />
      <PageContainer>

        {/* Alert Banners */}
        {!isLoading && (
          <div className="space-y-2 mb-6">
            <AlertBanner
              type="error"
              count={widgets?.inventory?.lowStock}
              label="reagents below reorder level"
              to="/inventory"
            />
            <AlertBanner
              type="warning"
              count={widgets?.assets?.calibrationDue}
              label="assets due for calibration this month"
              to="/assets"
            />
            {isRole('md', 'super_admin') && (
              <AlertBanner
                type="error"
                count={widgets?.pendingApprovals}
                label="results awaiting your approval"
                to="/approval-queue"
              />
            )}
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard
                icon={FlaskConical}
                label="Samples Today"
                value={widgets?.samples?.todayCount ?? 0}
                colorClass="bg-blue-500"
                delay={0}
              />
              <StatCard
                icon={Clock}
                label="Pending Approvals"
                value={widgets?.pendingApprovals ?? 0}
                colorClass="bg-violet-500"
                delay={1}
              />
              <StatCard
                icon={Package}
                label="Low Stock Items"
                value={widgets?.inventory?.lowStock ?? 0}
                colorClass="bg-amber-500"
                delay={2}
              />
              {isRole('md', 'super_admin', 'finance') ? (
                <StatCard
                  icon={TrendingUp}
                  label="Month Revenue"
                  value={`₦${((widgets?.finance?.monthRevenue ?? 0) / 1000).toFixed(0)}k`}
                  colorClass="bg-emerald-500"
                  trend="This month"
                  delay={3}
                />
              ) : (
                <StatCard
                  icon={Wrench}
                  label="Calibration Due"
                  value={widgets?.assets?.calibrationDue ?? 0}
                  colorClass="bg-red-500"
                  delay={3}
                />
              )}
            </>
          )}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Sample Status Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="card p-5 lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-base">Sample Status Distribution</h3>
                <p className="text-xs text-lab-muted">All samples by current status</p>
              </div>
              <Activity size={16} className="text-lab-muted" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8, border: '1px solid #e2e8f0',
                    fontSize: 12, boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                  }}
                />
                <Bar dataKey="count" name="Samples" fill="#1A56DB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Recent Samples */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.33 }}
            className="card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-base">Recent Samples</h3>
              <Link to="/samples" className="text-xs text-primary-600 font-medium hover:text-primary-700">
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {(activity?.recentSamples || []).length === 0 && (
                <p className="text-xs text-lab-muted text-center py-6">No samples registered yet</p>
              )}
              {(activity?.recentSamples || []).map((s: any, i: number) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.05 }}
                >
                  <Link to={`/samples/${s.id}`} className="flex items-center gap-3 group">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <FlaskConical size={13} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate group-hover:text-primary-600 transition-colors">
                        {s.name}
                      </p>
                      <p className="text-[10px] text-lab-muted">{s.client?.name}</p>
                    </div>
                    <StatusBadge status={s.status} />
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {[
            { label: 'Register Sample', to: '/samples/new', Icon: FlaskConical, bg: 'bg-blue-50', fg: 'text-blue-600' },
            { label: 'Enter Results', to: '/results/new', Icon: FileCheck, bg: 'bg-violet-50', fg: 'text-violet-600' },
            { label: 'New Requisition', to: '/procurement/new', Icon: ShoppingCart, bg: 'bg-amber-50', fg: 'text-amber-600' },
            { label: 'Add Asset', to: '/assets/new', Icon: Wrench, bg: 'bg-emerald-50', fg: 'text-emerald-600' },
          ].map(({ label, to, Icon, bg, fg }) => (
            <Link key={to} to={to} className="card-hover p-4 flex items-center gap-3 group">
              <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', bg)}>
                <Icon size={17} className={fg} />
              </div>
              <span className="text-sm font-medium group-hover:text-primary-700 transition-colors">{label}</span>
            </Link>
          ))}
        </motion.div>

      </PageContainer>
    </AppShell>
  );
}
