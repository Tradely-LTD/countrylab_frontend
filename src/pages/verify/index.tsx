// QR Verification Page (Public)
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  TestTubeDiagonal,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { api } from "../../lib/api";
import { format } from "date-fns";
import { clsx } from "clsx";

export function VerifyPage() {
  const { qrHash } = useParams<{ qrHash: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["verify", qrHash],
    queryFn: () => api.get(`/results/verify/${qrHash}`).then((r) => r.data),
    enabled: !!qrHash,
  });

  return (
    <>
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-full-width { max-width: 100% !important; }
          @page { margin: 1cm; }
        }
      `}</style>
      <div className="min-h-screen bg-lab-bg flex flex-col items-center justify-center p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 no-print">
          {data?.data?.org?.logo_url ? (
            <img
              src={data.data.org.logo_url}
              alt={data.data.org.name}
              className="h-10 max-w-[140px] object-contain"
            />
          ) : (
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <TestTubeDiagonal size={18} className="text-white" />
            </div>
          )}
          <span className="font-display text-xl text-primary-800 font-bold">
            {data?.data?.org?.name || "Countrylab LMS"}
          </span>
        </div>

        <div className="w-full max-w-lg print-full-width">
          {isLoading && (
            <div className="card p-8 text-center">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-lab-muted">
                Verifying report authenticity...
              </p>
            </div>
          )}

          {!isLoading && data && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.175, 0.885, 0.32, 1.1] }}
              className="card overflow-hidden"
            >
              {/* Status Banner */}
              <div
                className={clsx(
                  "px-6 py-5 flex items-center gap-4",
                  data.verified ? "bg-emerald-600" : "bg-red-600",
                )}
              >
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  {data.verified ? (
                    <ShieldCheck size={26} className="text-white" />
                  ) : (
                    <ShieldOff size={26} className="text-white" />
                  )}
                </div>
                <div>
                  <p className="font-display text-xl text-white">
                    {data.verified ? "Authentic Report" : "Unverified"}
                  </p>
                  <p className="text-sm text-white/80">{data.message}</p>
                </div>
              </div>

              {data.verified && data.data && (
                <div className="p-6 space-y-5">
                  {/* Org accreditation */}
                  {data.data.org?.accreditation_number && (
                    <p className="text-xs text-lab-muted">
                      Accreditation No: <span className="font-medium text-lab-text">{data.data.org.accreditation_number}</span>
                    </p>
                  )}
                  {/* Sample Info */}
                  <div>
                    <h3 className="label mb-3">Sample Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-lab-muted text-xs">Sample ID</p>
                        <p className="font-mono font-semibold">
                          {data.data.sample?.ulid}
                        </p>
                      </div>
                      <div>
                        <p className="text-lab-muted text-xs">Sample Name</p>
                        <p className="font-medium">{data.data.sample?.name}</p>
                      </div>
                      <div>
                        <p className="text-lab-muted text-xs">Matrix</p>
                        <p>{data.data.sample?.matrix || "—"}</p>
                      </div>
                      <div>
                        <p className="text-lab-muted text-xs">Approved Date</p>
                        <p>
                          {data.data.approved_at
                            ? format(
                                new Date(data.data.approved_at),
                                "dd MMM yyyy",
                              )
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Parameters */}
                  {data.data.parameters?.length > 0 && (
                    <div>
                      <h3 className="label mb-3">Test Results</h3>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="text-left px-3 py-2 text-xs text-lab-muted font-semibold">
                              Parameter
                            </th>
                            <th className="text-left px-3 py-2 text-xs text-lab-muted font-semibold">
                              Result
                            </th>
                            <th className="text-left px-3 py-2 text-xs text-lab-muted font-semibold">
                              Unit
                            </th>
                            <th className="text-left px-3 py-2 text-xs text-lab-muted font-semibold">
                              Spec Range
                            </th>
                            <th className="text-left px-3 py-2 text-xs text-lab-muted font-semibold">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.data.parameters.map((p: any, i: number) => {
                            // Calculate pass/fail status (same logic as result detail page)
                            const hasSpec =
                              p.spec_min !== undefined ||
                              p.spec_max !== undefined;
                            const value = p.calculated_value ?? p.raw_value;
                            const isNumeric =
                              p.data_type === "numerical" &&
                              typeof value === "number";

                            let status = null;
                            if (hasSpec && isNumeric) {
                              const belowMin =
                                p.spec_min !== undefined && value < p.spec_min;
                              const aboveMax =
                                p.spec_max !== undefined && value > p.spec_max;
                              status = belowMin || aboveMax ? "fail" : "pass";
                            }

                            return (
                              <tr
                                key={i}
                                className="border-t border-lab-border"
                              >
                                <td className="px-3 py-2">{p.param_name}</td>
                                <td className="px-3 py-2 font-mono">
                                  {p.calculated_value ?? p.raw_value ?? "—"}
                                </td>
                                <td className="px-3 py-2 text-lab-muted">
                                  {p.unit || "—"}
                                </td>
                                <td className="px-3 py-2 text-lab-muted">
                                  {hasSpec ? (
                                    <>
                                      {p.spec_min !== undefined &&
                                        `≥ ${p.spec_min}`}
                                      {p.spec_min !== undefined &&
                                        p.spec_max !== undefined &&
                                        " - "}
                                      {p.spec_max !== undefined &&
                                        `≤ ${p.spec_max}`}
                                    </>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  {status === "pass" ? (
                                    <span className="flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                                      <CheckCircle size={12} /> PASS
                                    </span>
                                  ) : status === "fail" ? (
                                    <span className="flex items-center gap-1 text-red-600 font-semibold text-xs">
                                      <XCircle size={12} /> FAIL
                                    </span>
                                  ) : (
                                    <span className="text-lab-muted text-xs">
                                      —
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* QR Code Display */}
                  {data.data.qr_code_url && (
                    <div className="flex justify-center py-6 border-t border-b border-slate-200">
                      <div className="text-center">
                        <p className="text-xs font-semibold text-lab-text mb-3 uppercase tracking-wide">
                          Certificate Verification
                        </p>
                        <img
                          src={data.data.qr_code_url}
                          alt="Verification QR Code"
                          className="w-40 h-40 mx-auto rounded-lg border-2 border-slate-300 shadow-sm"
                        />
                        <p className="text-xs text-lab-muted mt-3">
                          Scan this QR code to verify authenticity
                        </p>
                        <p className="text-[10px] text-lab-muted mt-1 font-mono">
                          Hash: {data.data.qr_hash?.slice(0, 16)}...
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 flex items-center gap-3">
                    <CheckCircle
                      size={16}
                      className="text-emerald-600 shrink-0"
                    />
                    <p className="text-xs text-emerald-800">
                      This report has been digitally verified and is authentic.
                      Any alterations would invalidate this QR code.
                    </p>
                  </div>

                  {/* Print Button */}
                  <button
                    onClick={() => window.print()}
                    className="w-full btn-secondary btn-sm no-print"
                  >
                    Print Certificate
                  </button>
                </div>
              )}

              {!data.verified && (
                <div className="p-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
                    <p className="font-semibold mb-1">⚠️ Report Not Found</p>
                    <p>
                      This QR code does not match any record in our system. This
                      document may be fraudulent or tampered with.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          <p className="text-center text-xs text-lab-muted mt-6 no-print">
            Verified by Countrylab Laboratory Management System
          </p>
        </div>
      </div>
    </>
  );
}

// ── Audit Logs Page ───────────────────────────────────────────────────────────
export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", page, actionFilter],
    queryFn: () =>
      api
        .get("/audit-logs", {
          params: { page, limit: 50, action: actionFilter || undefined },
        })
        .then((r) => r.data),
  });

  const ACTION_COLORS: Record<string, string> = {
    CREATE: "bg-emerald-50 text-emerald-700",
    UPDATE: "bg-blue-50 text-blue-700",
    DELETE: "bg-red-50 text-red-700",
    APPROVE: "bg-violet-50 text-violet-700",
    REJECT: "bg-red-50 text-red-700",
    LOGIN: "bg-slate-100 text-slate-600",
    READ: "bg-slate-50 text-slate-500",
    EXPORT: "bg-amber-50 text-amber-700",
  };

  return (
    <AppShell>
      <TopHeader
        title="Audit Logs"
        subtitle="Immutable record of all system actions (ISO 17025)"
      />
      <PageContainer>
        <div className="alert-info mb-4">
          <ShieldCheck size={15} className="shrink-0 mt-0.5" />
          <p className="text-sm">
            All logs are append-only. Records can be archived but never deleted.
            Required for ISO 17025 compliance.
          </p>
        </div>
        <div className="flex gap-3 mb-4">
          <Select
            options={[
              { value: "", label: "All Actions" },
              ...[
                "CREATE",
                "UPDATE",
                "DELETE",
                "APPROVE",
                "REJECT",
                "LOGIN",
                "READ",
                "EXPORT",
              ].map((a) => ({ value: a, label: a })),
            ]}
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-44"
          />
        </div>
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Table</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j}>
                        <Skeleton className="h-3.5 w-full" />
                      </td>
                    ))}
                  </tr>
                ))}
              {(data?.data || []).map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="text-xs font-mono text-lab-muted">
                    {log.created_at
                      ? format(new Date(log.created_at), "dd MMM yyyy HH:mm:ss")
                      : "—"}
                  </td>
                  <td>
                    <p className="text-xs font-medium">
                      {log.user?.full_name || "System"}
                    </p>
                    <p className="text-[10px] text-lab-muted">
                      {log.user?.email}
                    </p>
                  </td>
                  <td>
                    <span
                      className={clsx(
                        "badge text-xs",
                        ACTION_COLORS[log.action] ||
                          "bg-gray-100 text-gray-600",
                      )}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="text-xs text-lab-muted font-mono">
                    {log.table_name || "—"}
                  </td>
                  <td className="text-xs font-mono text-lab-muted">
                    {log.ip_address || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data?.pagination && (
            <Pagination
              page={data.pagination.page}
              pages={Math.ceil(data.pagination.total / data.pagination.limit)}
              total={data.pagination.total}
              limit={data.pagination.limit}
              onChange={setPage}
            />
          )}
        </div>
      </PageContainer>
    </AppShell>
  );
}

import { useState } from "react";
import { AppShell, PageContainer, TopHeader } from "../../components/layout";
import { Select, Skeleton, Pagination } from "../../components/ui";
import { useAuth } from "../../lib/auth";
import { useQueryClient } from "@tanstack/react-query";
