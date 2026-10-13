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
import { SkeletonCard, Skeleton, StatusBadge } from '../../components/ui';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { canAccessPage } from '../../lib/roles';
import { clsx } from 'clsx';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.25, ease: [0, 0, 0.2, 1] as any }
  }),
};

function StatCard({
  icon: Icon, label, value, hint, to, delay = 0
}: {
  icon: any; label: string; value: string | number;
  hint?: string; to?: string; delay?: number;
}) {
  const body = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="stat-label">{label}</p>
        <p className="stat-value mt-1.5">{value}</p>
        {hint && <p className="text-xs text-lab-muted mt-1">{hint}</p>}
      </div>
      <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-primary-600" />
      </div>
    </div>
  );
  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" custom={delay}>
      {to ? (
        <Link to={to} className="stat-card block hover:border-primary-200 hover:shadow-elevated transition-[border-color,box-shadow] duration-150">
          {body}
        </Link>
      ) : (
        <div className="stat-card">{body}</div>
      )}
    </motion.div>
  );
}

function AlertChip({
  tone, count, singular, plural, to
}: {
  tone: 'warning' | 'action'; count?: number; singular: string; plural: string; to: string;
}) {
  if (!count) return null;
  return (
    <Link to={to} className={clsx(
      'inline-flex items-center gap-2 pl-3 pr-2.5 py-1.5 rounded-lg border text-[13px] font-medium transition-colors',
      tone === 'warning'
        ? 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
        : 'bg-primary-50 border-primary-200 text-primary-800 hover:bg-primary-100'
    )}>
      {tone === 'warning' ? <AlertTriangle size={14} className="text-amber-600" /> : <Clock size={14} className="text-primary-600" />}
      <span><span className="font-semibold tabular-nums">{count}</span> {count === 1 ? singular : plural}</span>
      <ArrowRight size={13} className="opacity-60" />
    </Link>
  );
}

const STATUS_FILL: Record<string, string> = {
  received: '#3B82F6',
  in_testing: '#F59E0B',
  pending_review: '#8B5CF6',
  approved: '#10B981',
  disposed: '#94A3B8',
  voided: '#EF4444',
};

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
    name: s.status.replace(/_/g, ' ').replace(/^\w/, (c: string) => c.toUpperCase()),
    count: s.count,
    fill: STATUS_FILL[s.status] ?? '#1A56DB',
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

        {/* Attention needed */}
        {!isLoading && (
          <div className="flex flex-wrap gap-2 mb-5 empty:hidden">
            {isRole('md', 'super_admin', 'lab_manager') && (
              <AlertChip
                tone="action"
                count={widgets?.pendingApprovals}
                singular="result awaiting your approval"
                plural="results awaiting your approval"
                to="/approval-queue"
              />
            )}
            <AlertChip
              tone="warning"
              count={widgets?.inventory?.lowStock}
              singular="reagent below reorder level"
              plural="reagents below reorder level"
              to="/inventory"
            />
            <AlertChip
              tone="warning"
              count={widgets?.assets?.calibrationDue}
              singular="asset due for calibration"
              plural="assets due for calibration"
              to="/assets"
            />
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
                hint="Registered since midnight"
                to="/samples"
                delay={0}
              />
              <StatCard
                icon={Clock}
                label="Pending Approvals"
                value={widgets?.pendingApprovals ?? 0}
                hint="Results awaiting sign-off"
                to={isRole('md', 'super_admin', 'lab_manager') ? '/approval-queue' : '/results'}
                delay={1}
              />
              <StatCard
                icon={Package}
                label="Low Stock Items"
                value={widgets?.inventory?.lowStock ?? 0}
                hint="At or below reorder level"
                to="/inventory"
                delay={2}
              />
              {isRole('md', 'super_admin', 'finance') ? (
                <StatCard
                  icon={TrendingUp}
                  label="Month Revenue"
                  value={new Intl.NumberFormat('en-NG', {
                    style: 'currency', currency: 'NGN', notation: 'compact', maximumFractionDigits: 1,
                  }).format(widgets?.finance?.monthRevenue ?? 0)}
                  hint="Paid invoices this month"
                  to={isRole('md', 'super_admin', 'finance') ? '/invoices' : undefined}
                  delay={3}
                />
              ) : (
                <StatCard
                  icon={Wrench}
                  label="Calibration Due"
                  value={widgets?.assets?.calibrationDue ?? 0}
                  hint="Due within 30 days"
                  to="/assets"
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
                <h3 className="text-sm font-semibold">Samples by Status</h3>
                <p className="text-xs text-lab-muted">All samples, current status</p>
              </div>
              <Activity size={16} className="text-lab-subtle" />
            </div>
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : statusData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-xs text-lab-muted">
                No samples registered yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusData} barSize={36} margin={{ left: -16 }}>
                  <CartesianGrid stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{
                      borderRadius: 8, border: '1px solid #e2e8f0',
                      fontSize: 12, boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                    }}
                  />
                  <Bar dataKey="count" name="Samples" radius={[4, 4, 0, 0]}>
                    {statusData.map((d: any) => <Cell key={d.name} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Recent Samples */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.33 }}
            className="card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Recent Samples</h3>
              <Link to="/samples" className="inline-flex items-center gap-1 text-xs text-primary-600 font-medium hover:text-primary-700">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="-mx-2 space-y-0.5">
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
                  <Link to={`/samples/${s.id}`} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <FlaskConical size={14} className="text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate group-hover:text-primary-700 transition-colors">
                        {s.name}
                      </p>
                      <p className="text-xs text-lab-muted truncate">{s.client?.name}</p>
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
            { label: 'Register Sample', to: '/samples/new', Icon: FlaskConical,
              roles: ['super_admin', 'md', 'quality_manager', 'lab_manager', 'lab_analyst', 'inventory_manager', 'operations_manager', 'secretary'] },
            { label: 'Enter Results', to: '/results/new', Icon: FileCheck,
              roles: ['super_admin', 'md', 'quality_manager', 'lab_manager', 'lab_analyst'] },
            { label: 'New Requisition', to: '/procurement/new', Icon: ShoppingCart, roles: [] as string[] },
            { label: 'Add Asset', to: '/assets/new', Icon: Wrench,
              roles: ['super_admin', 'md', 'inventory_manager', 'operations_manager'] },
          ]
            .filter(({ to, roles }) => (roles.length === 0 || isRole(...roles)) && canAccessPage(user?.role, to))
            .map(({ label, to, Icon }) => (
            <Link key={to} to={to} className="card-hover p-4 flex items-center gap-3 group hover:border-primary-200">
              <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-primary-50 flex items-center justify-center shrink-0 transition-colors">
                <Icon size={17} className="text-slate-500 group-hover:text-primary-600 transition-colors" />
              </div>
              <span className="text-sm font-medium group-hover:text-primary-700 transition-colors">{label}</span>
              <ArrowRight size={14} className="ml-auto text-slate-300 group-hover:text-primary-500 transition-colors" />
            </Link>
          ))}
        </motion.div>

      </PageContainer>
    </AppShell>
  );
}
