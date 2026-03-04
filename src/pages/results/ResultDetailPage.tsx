import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { api } from "../../lib/api";
import { AppShell, PageContainer, TopHeader } from "../../components/layout";
import {
  Button,
  Card,
  StatusBadge,
  Skeleton,
  Alert,
  Modal,
} from "../../components/ui";
import toast from "react-hot-toast";
import { format } from "date-fns";

export function ResultDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const { data: result, isLoading } = useQuery({
    queryKey: ["result", id],
    queryFn: () => api.get(`/results/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: () => api.post(`/results/${id}/submit`),
    onSuccess: () => {
      toast.success("Result submitted for review!");
      qc.invalidateQueries({ queryKey: ["result", id] });
      qc.invalidateQueries({ queryKey: ["results"] });
      qc.invalidateQueries({ queryKey: ["approval-queue"] });
      setShowSubmitModal(false);
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.error || "Failed to submit"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/results/${id}`),
    onSuccess: () => {
      toast.success("Result deleted");
      navigate("/results");
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.error || "Failed to delete"),
  });

  if (isLoading) {
    return (
      <AppShell>
        <TopHeader title="Loading..." />
        <PageContainer>
          <Skeleton className="h-64 w-full" />
        </PageContainer>
      </AppShell>
    );
  }

  if (!result) {
    return (
      <AppShell>
        <TopHeader title="Result Not Found" />
        <PageContainer>
          <Alert
            type="error"
            message="The requested result could not be found."
          />
        </PageContainer>
      </AppShell>
    );
  }

  const canSubmit = result.overall_status === "draft";
  const canEdit = ["draft"].includes(result.overall_status);
  const canDelete = result.overall_status === "draft";
  const isApproved = result.overall_status === "approved";

  return (
    <AppShell>
      <TopHeader
        title="Test Result Details"
        subtitle={`Result ID: ${result.id.slice(0, 8)}`}
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              leftIcon={<ArrowLeft size={14} />}
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
            {canEdit && (
              <Button
                variant="secondary"
                leftIcon={<Edit size={14} />}
                onClick={() => navigate(`/results?edit=${id}`)}
              >
                Edit
              </Button>
            )}
            {canSubmit && (
              <Button
                leftIcon={<Send size={14} />}
                onClick={() => setShowSubmitModal(true)}
              >
                Submit for Review
              </Button>
            )}
          </div>
        }
      />
      <PageContainer>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Status Card */}
            <Card className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-display text-lg mb-1">Result Status</h2>
                  <StatusBadge status={result.overall_status} />
                </div>
                {isApproved && result.coa_url && (
                  <a
                    href={result.coa_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary btn-sm"
                  >
                    <FileText size={14} className="mr-2" />
                    View Certificate
                  </a>
                )}
              </div>

              {canSubmit && (
                <Alert
                  type="info"
                  message="This result is in draft status. Submit it for review when ready."
                />
              )}

              {result.overall_status === "submitted" && (
                <Alert
                  type="warning"
                  message="This result has been submitted and is awaiting review."
                />
              )}

              {result.overall_status === "rejected" && (
                <Alert
                  type="error"
                  message="This result was rejected. Please review the feedback and make necessary corrections."
                />
              )}
            </Card>

            {/* Sample Info */}
            <Card className="p-5">
              <h3 className="font-display text-base mb-4">
                Sample Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="label">Sample ID</p>
                  <p className="text-sm font-mono">
                    {result.sample?.ulid || "—"}
                  </p>
                </div>
                <div>
                  <p className="label">Sample Name</p>
                  <p className="text-sm">{result.sample?.name || "—"}</p>
                </div>
                <div>
                  <p className="label">Matrix</p>
                  <p className="text-sm">{result.sample?.matrix || "—"}</p>
                </div>
                <div>
                  <p className="label">Analyst</p>
                  <p className="text-sm">{result.analyst?.full_name || "—"}</p>
                </div>
              </div>
            </Card>

            {/* Parameters */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base">Test Parameters</h3>
                <div className="text-xs text-lab-muted bg-slate-50 px-3 py-1.5 rounded-md">
                  <span className="font-semibold">Pass/Fail Logic:</span> Result
                  is within spec range (Min ≤ Result ≤ Max)
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-lab-border">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-lab-muted uppercase">
                        Parameter
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-lab-muted uppercase">
                        Raw Value
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-lab-muted uppercase">
                        Result
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-lab-muted uppercase">
                        Unit
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-lab-muted uppercase">
                        Spec Range
                      </th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-lab-muted uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(result.parameters || []).map(
                      (param: any, index: number) => {
                        const hasSpec =
                          param.spec_min !== undefined ||
                          param.spec_max !== undefined;
                        const value = param.calculated_value ?? param.raw_value;
                        const isNumeric =
                          param.data_type === "numerical" &&
                          typeof value === "number";

                        let status = null;
                        if (hasSpec && isNumeric) {
                          const belowMin =
                            param.spec_min !== undefined &&
                            value < param.spec_min;
                          const aboveMax =
                            param.spec_max !== undefined &&
                            value > param.spec_max;
                          status = belowMin || aboveMax ? "fail" : "pass";
                        }

                        return (
                          <tr
                            key={index}
                            className="border-b border-lab-border hover:bg-slate-50"
                          >
                            <td className="py-3 px-3 font-medium">
                              {param.param_name}
                            </td>
                            <td className="py-3 px-3 text-lab-muted">
                              {param.raw_value || "—"}
                            </td>
                            <td className="py-3 px-3 font-mono font-semibold">
                              {param.calculated_value ?? param.raw_value ?? "—"}
                            </td>
                            <td className="py-3 px-3 text-lab-muted">
                              {param.unit || "—"}
                            </td>
                            <td className="py-3 px-3 text-lab-muted">
                              {hasSpec ? (
                                <>
                                  {param.spec_min !== undefined &&
                                    `≥ ${param.spec_min}`}
                                  {param.spec_min !== undefined &&
                                    param.spec_max !== undefined &&
                                    " - "}
                                  {param.spec_max !== undefined &&
                                    `≤ ${param.spec_max}`}
                                </>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="py-3 px-3">
                              {status === "pass" && (
                                <span className="flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                                  <CheckCircle size={14} /> PASS
                                </span>
                              )}
                              {status === "fail" && (
                                <span className="flex items-center gap-1 text-red-600 font-semibold text-xs">
                                  <XCircle size={14} /> FAIL
                                </span>
                              )}
                              {param.warning && (
                                <span className="flex items-center gap-1 text-amber-600 font-semibold text-xs">
                                  <AlertTriangle size={14} /> WARNING
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Notes */}
            {result.notes && (
              <Card className="p-5">
                <h3 className="font-display text-base mb-3">
                  Notes / Comments
                </h3>
                <p className="text-sm text-lab-text whitespace-pre-wrap">
                  {result.notes}
                </p>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Timestamps */}
            <Card className="p-5">
              <h3 className="font-display text-base mb-4">Timeline</h3>
              <div className="space-y-3">
                <div>
                  <p className="label">Created</p>
                  <p className="text-sm">
                    {format(new Date(result.created_at), "dd MMM yyyy, HH:mm")}
                  </p>
                </div>
                {result.reviewed_at && (
                  <div>
                    <p className="label">Reviewed</p>
                    <p className="text-sm">
                      {format(
                        new Date(result.reviewed_at),
                        "dd MMM yyyy, HH:mm",
                      )}
                    </p>
                  </div>
                )}
                {result.approved_at && (
                  <div>
                    <p className="label">Approved</p>
                    <p className="text-sm">
                      {format(
                        new Date(result.approved_at),
                        "dd MMM yyyy, HH:mm",
                      )}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Actions */}
            {canDelete && (
              <Card className="p-5">
                <h3 className="font-display text-base mb-3">Actions</h3>
                <Button
                  variant="danger"
                  className="w-full"
                  leftIcon={<Trash2 size={14} />}
                  onClick={() => {
                    if (
                      confirm(
                        "Are you sure you want to delete this result? This action cannot be undone.",
                      )
                    ) {
                      deleteMutation.mutate();
                    }
                  }}
                  loading={deleteMutation.isPending}
                >
                  Delete Result
                </Button>
              </Card>
            )}

            {/* QR Code */}
            {isApproved && result.qr_code_url && (
              <Card className="p-5 text-center">
                <p className="label mb-3">Verification QR Code</p>
                <img
                  src={result.qr_code_url}
                  alt="QR Code"
                  className="w-40 h-40 mx-auto rounded-lg"
                />
                <p className="text-xs text-lab-muted mt-2">
                  Scan to verify authenticity
                </p>
              </Card>
            )}

            {/* QR Code Not Generated Yet */}
            {isApproved && !result.qr_code_url && (
              <Card className="p-5 text-center">
                <p className="label mb-3">Verification QR Code</p>
                <div className="w-40 h-40 mx-auto rounded-lg bg-slate-100 flex items-center justify-center">
                  <p className="text-xs text-lab-muted px-4 text-center">
                    QR Code generation in progress...
                  </p>
                </div>
                <p className="text-xs text-lab-muted mt-2">
                  Refresh page if not showing
                </p>
              </Card>
            )}

            {/* Regenerate QR Code (for broken QR codes) */}
            {isApproved &&
              result.qr_code_url &&
              result.qr_code_url.includes("/verify/") && (
                <Card className="p-5">
                  <h3 className="font-display text-base mb-3">QR Code Issue</h3>
                  <Alert
                    type="warning"
                    message="QR code needs to be regenerated"
                  />
                  <Button
                    variant="secondary"
                    className="w-full mt-3"
                    onClick={async () => {
                      try {
                        await api.post(`/results/${id}/regenerate-qr`);
                        toast.success("QR code regenerated!");
                        qc.invalidateQueries({ queryKey: ["result", id] });
                      } catch (e: any) {
                        toast.error(
                          e.response?.data?.error ||
                            "Failed to regenerate QR code",
                        );
                      }
                    }}
                  >
                    Regenerate QR Code
                  </Button>
                </Card>
              )}
          </div>
        </div>

        {/* Submit Confirmation Modal */}
        {showSubmitModal && (
          <Modal
            open
            onClose={() => setShowSubmitModal(false)}
            title="Submit Result for Review"
            size="sm"
          >
            <div className="space-y-4">
              <Alert
                type="warning"
                message="Once submitted, this result will be sent to the quality manager and MD for review. You will not be able to edit it until it's returned."
              />
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowSubmitModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  leftIcon={<Send size={14} />}
                  loading={submitMutation.isPending}
                  onClick={() => submitMutation.mutate()}
                >
                  Submit
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </PageContainer>
    </AppShell>
  );
}
