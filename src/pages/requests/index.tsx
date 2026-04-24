import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText,
  Search,
  ArrowLeft,
  CheckCircle,
  XCircle,
  FileCheck,
  DollarSign,
  Package,
} from "lucide-react";
import { api } from "../../lib/api";
import { AppShell, PageContainer, TopHeader } from "../../components/layout";
import {
  Button,
  Input,
  Select,
  StatusBadge,
  EmptyState,
  Skeleton,
  Card,
  Textarea,
} from "../../components/ui";
import toast from "react-hot-toast";
import { format } from "date-fns";

// ── Requests List Page ────────────────────────────────────────────────────────
export function RequestsListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["sample-requests", page, search, statusFilter],
    queryFn: () =>
      api
        .get("/sample-requests", {
          params: {
            page,
            limit: 25,
            search: search || undefined,
            status: statusFilter || undefined,
          },
        })
        .then((r) => r.data),
  });

  return (
    <AppShell>
      <TopHeader
        title="Sample Requests"
        subtitle="Manage customer sample analysis requests"
      />
      <PageContainer>
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Input
            placeholder="Search by request number or product..."
            leftIcon={<Search size={14} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-xs"
          />
          <Select
            options={[
              { value: "", label: "All Statuses" },
              { value: "pending", label: "Pending" },
              { value: "under_review", label: "Under Review" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
              { value: "sample_received", label: "Sample Received" },
              { value: "completed", label: "Completed" },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-48"
          />
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Request #</th>
                <th>Client</th>
                <th>Product</th>
                <th>Test Category</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j}>
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))}
              {!isLoading &&
                (data?.data || []).map((request: any) => (
                  <motion.tr
                    key={request.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => navigate(`/requests/${request.id}`)}
                  >
                    <td>
                      <span className="font-mono text-xs bg-blue-100 px-2 py-0.5 rounded font-semibold text-blue-700">
                        {request.request_number}
                      </span>
                    </td>
                    <td>
                      <p className="font-medium text-sm">
                        {request.client?.name}
                      </p>
                      {request.client?.company && (
                        <p className="text-xs text-lab-muted">
                          {request.client.company}
                        </p>
                      )}
                    </td>
                    <td className="text-sm">{request.product_name || "—"}</td>
                    <td className="text-sm capitalize">
                      {request.test_category || "—"}
                    </td>
                    <td>
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="text-sm">
                      {request.quotation_amount
                        ? `₦${request.quotation_amount.toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="text-xs text-lab-muted">
                      {format(new Date(request.created_at), "dd MMM yyyy")}
                    </td>
                    <td>
                      {request.sample && (
                        <span className="text-xs text-green-600 font-medium">
                          Sample: {request.sample.ulid}
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              {!isLoading && (data?.data || []).length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={<FileText size={28} className="text-lab-muted" />}
                      title="No requests found"
                      description="Customer requests will appear here"
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}

// ── Request Detail Page ───────────────────────────────────────────────────────
export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["sample-request", id],
    queryFn: () => api.get(`/sample-requests/${id}`).then((r) => r.data.data),
    enabled: !!id,
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

  if (!data) return null;

  return (
    <AppShell>
      <TopHeader
        title={`Request ${data.request_number}`}
        subtitle="Sample analysis request details"
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              leftIcon={<ArrowLeft size={14} />}
              onClick={() => navigate("/requests")}
            >
              Back
            </Button>
            {data.status === "pending" && (
              <>
                <Button
                  variant="secondary"
                  leftIcon={<XCircle size={14} />}
                  onClick={() => setShowRejectModal(true)}
                >
                  Reject
                </Button>
                <Button
                  leftIcon={<CheckCircle size={14} />}
                  onClick={() => setShowApproveModal(true)}
                >
                  Approve
                </Button>
              </>
            )}
            {data.status === "approved" && !data.sample_id && (
              <Button
                leftIcon={<Package size={14} />}
                onClick={() => setShowConvertModal(true)}
              >
                Convert to Sample
              </Button>
            )}
          </div>
        }
      />
      <PageContainer>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Information */}
            <Card className="p-6">
              <h3 className="font-display text-lg font-semibold mb-4">
                Client Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Name</p>
                  <p className="font-medium">{data.client?.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Company</p>
                  <p className="font-medium">{data.client?.company || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium">{data.client?.email || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="font-medium">{data.client?.phone || "—"}</p>
                </div>
              </div>
            </Card>

            {/* Sample Information */}
            <Card className="p-6">
              <h3 className="font-display text-lg font-semibold mb-4">
                Sample Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Product Name</p>
                  <p className="font-medium">{data.product_name || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Sample Type</p>
                  <p className="font-medium">{data.sample_type || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Batch Number</p>
                  <p className="font-medium">{data.batch_number || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Manufacturer</p>
                  <p className="font-medium">{data.manufacturer || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Sample Source</p>
                  <p className="font-medium">{data.sample_source || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Sampling Point</p>
                  <p className="font-medium">{data.sampling_point || "—"}</p>
                </div>
              </div>
            </Card>

            {/* Analysis Requirements */}
            <Card className="p-6">
              <h3 className="font-display text-lg font-semibold mb-4">
                Analysis Requirements
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Test Category</p>
                  <p className="font-medium capitalize">
                    {data.test_category || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Reference Standard</p>
                  <p className="font-medium">
                    {data.reference_standard || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Intended Use</p>
                  <p className="font-medium">{data.intended_use || "—"}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card className="p-6">
              <h3 className="font-display text-sm font-semibold mb-3">
                Request Status
              </h3>
              <div className="mb-4">
                <StatusBadge status={data.status} />
              </div>
              <div className="space-y-2 text-xs text-gray-600">
                <p>
                  Created: {format(new Date(data.created_at), "dd MMM yyyy")}
                </p>
                {data.approved_at && (
                  <p>
                    Approved:{" "}
                    {format(new Date(data.approved_at), "dd MMM yyyy")}
                  </p>
                )}
              </div>
            </Card>

            {/* Quotation */}
            {data.quotation_amount && (
              <Card className="p-6">
                <h3 className="font-display text-sm font-semibold mb-3">
                  Quotation
                </h3>
                <p className="text-2xl font-bold text-green-600">
                  ₦{data.quotation_amount.toLocaleString()}
                </p>
                {data.payment_confirmed && (
                  <p className="text-xs text-green-600 mt-2">
                    ✓ Payment Confirmed
                  </p>
                )}
              </Card>
            )}

            {/* Linked Sample */}
            {data.sample && (
              <Card className="p-6">
                <h3 className="font-display text-sm font-semibold mb-3">
                  Linked Sample
                </h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/samples/${data.sample.id}`)}
                  className="w-full"
                >
                  View Sample {data.sample.ulid}
                </Button>
              </Card>
            )}

            {/* Invoice Actions */}
            {data.quotation_amount && data.status === "approved" && (
              <Card className="p-6">
                <h3 className="font-display text-sm font-semibold mb-3">
                  Invoice
                </h3>
                {data.invoice_id ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/invoices/${data.invoice_id}`)}
                    className="w-full"
                  >
                    View Invoice
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => navigate(`/invoices/new?request_id=${id}`)}
                    className="w-full"
                  >
                    Create Invoice
                  </Button>
                )}
              </Card>
            )}
          </div>
        </div>

        {/* Modals */}
        {showApproveModal && (
          <ApproveModal
            requestId={id!}
            onClose={() => setShowApproveModal(false)}
          />
        )}
        {showRejectModal && (
          <RejectModal
            requestId={id!}
            onClose={() => setShowRejectModal(false)}
          />
        )}
        {showConvertModal && (
          <ConvertToSampleModal
            requestId={id!}
            onClose={() => setShowConvertModal(false)}
          />
        )}
      </PageContainer>
    </AppShell>
  );
}

// ── Approve Modal ─────────────────────────────────────────────────────────────
function ApproveModal({
  requestId,
  onClose,
}: {
  requestId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [quotationAmount, setQuotationAmount] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      api.put(`/sample-requests/${requestId}`, {
        status: "approved",
        quotation_amount: quotationAmount
          ? parseFloat(quotationAmount)
          : undefined,
      }),
    onSuccess: () => {
      toast.success("Request approved! You can now create an invoice.");
      qc.invalidateQueries({ queryKey: ["sample-request", requestId] });
      qc.invalidateQueries({ queryKey: ["sample-requests"] });
      onClose();
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.error || "Failed to approve request"),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full p-6 m-4">
        <h3 className="font-display text-lg font-semibold mb-4">
          Approve Request
        </h3>
        <Input
          label="Quotation Amount (₦)"
          type="number"
          value={quotationAmount}
          onChange={(e) => setQuotationAmount(e.target.value)}
          placeholder="Enter amount"
        />
        <div className="flex gap-3 mt-6">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
            className="flex-1"
          >
            Approve
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ── Reject Modal ──────────────────────────────────────────────────────────────
function RejectModal({
  requestId,
  onClose,
}: {
  requestId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      api.put(`/sample-requests/${requestId}`, {
        status: "rejected",
        rejection_reason: reason,
      }),
    onSuccess: () => {
      toast.success("Request rejected");
      qc.invalidateQueries({ queryKey: ["sample-request", requestId] });
      qc.invalidateQueries({ queryKey: ["sample-requests"] });
      onClose();
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.error || "Failed to reject request"),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full p-6 m-4">
        <h3 className="font-display text-lg font-semibold mb-4">
          Reject Request
        </h3>
        <Textarea
          label="Reason for Rejection"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why this request is being rejected..."
          rows={4}
        />
        <div className="flex gap-3 mt-6">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
            className="flex-1 bg-red-600 hover:bg-red-700"
          >
            Reject
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ── Convert to Sample Modal ───────────────────────────────────────────────────
function ConvertToSampleModal({
  requestId,
  onClose,
}: {
  requestId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [storageLocation, setStorageLocation] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      api.post(`/sample-requests/${requestId}/convert-to-sample`, {
        storage_location: storageLocation,
      }),
    onSuccess: (res) => {
      toast.success("Sample created successfully!");
      qc.invalidateQueries({ queryKey: ["sample-request", requestId] });
      qc.invalidateQueries({ queryKey: ["sample-requests"] });
      qc.invalidateQueries({ queryKey: ["samples"] });
      navigate(`/samples/${res.data.data.id}`);
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.error || "Failed to convert to sample"),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full p-6 m-4">
        <h3 className="font-display text-lg font-semibold mb-4">
          Convert to Sample
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          This will create a new sample from this request and mark it as
          received.
        </p>
        <Input
          label="Storage Location"
          value={storageLocation}
          onChange={(e) => setStorageLocation(e.target.value)}
          placeholder="e.g., Cold Room A, Shelf 2"
        />
        <div className="flex gap-3 mt-6">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
            className="flex-1"
          >
            Convert to Sample
          </Button>
        </div>
      </Card>
    </div>
  );
}
