import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, Eye, ClipboardList, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
import { api } from '../../lib/api';
import { AppShell, PageContainer, TopHeader } from '../../components/layout';
import { Button, StatusBadge, EmptyState, Modal, Alert, Skeleton } from '../../components/ui';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { clsx } from 'clsx';

export function ApprovalQueuePage() {
  const qc = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);

  const { data: queue, isLoading } = useQuery({
    queryKey: ['approval-queue'],
    queryFn: () => api.get('/results/meta/queue').then(r => r.data),
    refetchInterval: 15_000,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/results/${id}/approve`),
    onSuccess: () => {
      toast.success('✅ Result approved. CoA has been generated!');
      qc.invalidateQueries({ queryKey: ['approval-queue'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Approval failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/results/${id}/reject`, { reason }),
    onSuccess: () => {
      toast.success('Result rejected');
      qc.invalidateQueries({ queryKey: ['approval-queue'] });
      setRejectTarget(null);
      setRejectReason('');
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to reject'),
  });

  const count = queue?.count || 0;

  return (
    <AppShell>
      <TopHeader
        title="MD Approval Queue"
        subtitle="Results awaiting your final sign-off"
      />
      <PageContainer>
        {/* Summary Bar */}
        {!isLoading && (
          <div className={clsx(
            'flex items-center gap-3 px-4 py-3 rounded-xl mb-6 border',
            count > 0
              ? 'bg-violet-50 border-violet-200 text-violet-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          )}>
            {count > 0 ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
            <span className="font-medium text-sm">
              {count > 0
                ? `${count} result${count > 1 ? 's' : ''} awaiting your review and approval`
                : 'All clear — no pending results'}
            </span>
          </div>
        )}

        {/* Queue Cards */}
        <div className="space-y-3">
          {isLoading && Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5">
              <div className="flex gap-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            </div>
          ))}

          {!isLoading && (queue?.data || []).length === 0 && !count && (
            <EmptyState
              icon={<ClipboardList size={28} className="text-lab-muted" />}
              title="Queue is empty"
              description="All results have been reviewed. No pending approvals."
            />
          )}

          {(queue?.data || []).map((item: any, i: number) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="card p-5"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                  <ClipboardList size={20} className="text-violet-600" />
                </div>

                {/* Details + Actions */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-display text-sm sm:text-base truncate">{item.sample?.name}</p>
                      <p className="text-xs text-lab-muted mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{item.sample?.ulid}</code>
                        <span className="hidden sm:inline">·</span>
                        <span className="hidden sm:inline">{item.sample?.matrix}</span>
                        <span>·</span>
                        <span>Analyst: <span className="font-medium text-lab-text">{item.analyst?.full_name}</span></span>
                      </p>
                    </div>
                    <span className="shrink-0"><StatusBadge status={item.overall_status} /></span>
                  </div>

                  {item.notes && (
                    <p className="text-sm text-lab-muted mt-2 bg-slate-50 rounded-lg px-3 py-2">
                      "{item.notes}"
                    </p>
                  )}

                  <p className="text-xs text-lab-muted mt-1.5">
                    Submitted {format(new Date(item.created_at), 'dd MMM yyyy, HH:mm')}
                  </p>

                  {/* Actions — below details, wraps on mobile */}
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-lab-border">
                    <Link to={`/results/${item.id}`}>
                      <Button variant="secondary" size="sm" leftIcon={<Eye size={13} />}>
                        View
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="danger"
                      leftIcon={<X size={13} />}
                      onClick={() => setRejectTarget(item.id)}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      leftIcon={<Check size={13} />}
                      loading={approveMutation.isPending && approveMutation.variables === item.id}
                      onClick={() => {
                        if (confirm('Approve this result and generate the Certificate of Analysis?')) {
                          approveMutation.mutate(item.id);
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Approve & Sign
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Reject Modal */}
        <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject Result" size="sm">
          <div className="space-y-4">
            <Alert type="warning" message="Please provide a clear reason for rejecting this result. The analyst will be notified." />
            <div>
              <label className="label">Reason for Rejection *</label>
              <textarea
                className="input resize-none"
                rows={4}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. Calculation error in pH parameter. Please re-enter raw weights."
              />
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setRejectTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                loading={rejectMutation.isPending}
                disabled={rejectReason.length < 10}
                onClick={() => rejectMutation.mutate({ id: rejectTarget!, reason: rejectReason })}
              >
                Reject Result
              </Button>
            </div>
          </div>
        </Modal>
      </PageContainer>
    </AppShell>
  );
}
