import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  FlaskConical,
  ArrowLeft,
  Edit,
  QrCode,
  MapPin,
  User,
  Calendar,
  Clock,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { api } from "../../lib/api";
import { AppShell, PageContainer, TopHeader } from "../../components/layout";
import {
  Button,
  Input,
  Select,
  StatusBadge,
  Modal,
  Pagination,
  EmptyState,
  Skeleton,
  Alert,
  Card,
  StepIndicator,
  Textarea,
} from "../../components/ui";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { clsx } from "clsx";

// ── Samples List Page ─────────────────────────────────────────────────────────
export function SamplesListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["samples", page, search, statusFilter],
    queryFn: () =>
      api
        .get("/samples", {
          params: {
            page,
            limit: 25,
            search: search || undefined,
            status: statusFilter || undefined,
          },
        })
        .then((r) => r.data),
    keepPreviousData: true,
  } as any);

  return (
    <AppShell>
      <TopHeader
        title="Samples"
        subtitle="Track and manage all lab samples"
        actions={
          <Button
            leftIcon={<Plus size={14} />}
            onClick={() => setShowNewModal(true)}
          >
            Register Sample
          </Button>
        }
      />
      <PageContainer>
        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <Input
            placeholder="Search by name or ULID..."
            leftIcon={<Search size={14} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select
            options={[
              { value: "", label: "All Statuses" },
              { value: "received", label: "Received" },
              { value: "in_testing", label: "In Testing" },
              { value: "pending_review", label: "Pending Review" },
              { value: "approved", label: "Approved" },
              { value: "disposed", label: "Disposed" },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-44"
          />
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sample ID</th>
                <th>Name / Matrix</th>
                <th>Client</th>
                <th>Analyst</th>
                <th>Status</th>
                <th>Received</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j}>
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))}
              {!isLoading &&
                data?.data?.map((sample: any) => (
                  <motion.tr
                    key={sample.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() =>
                      (window.location.href = `/samples/${sample.id}`)
                    }
                  >
                    <td>
                      <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded font-semibold">
                        {sample.ulid}
                      </span>
                    </td>
                    <td>
                      <p className="font-medium text-sm">{sample.name}</p>
                      {sample.matrix && (
                        <p className="text-xs text-lab-muted">
                          {sample.matrix}
                        </p>
                      )}
                    </td>
                    <td className="text-sm">{sample.client?.name}</td>
                    <td className="text-sm">
                      {sample.analyst?.full_name || "—"}
                    </td>
                    <td>
                      <StatusBadge status={sample.status} />
                    </td>
                    <td className="text-xs text-lab-muted">
                      {sample.received_at
                        ? format(new Date(sample.received_at), "dd MMM yyyy")
                        : "—"}
                    </td>
                    <td>
                      <ChevronRight size={14} className="text-lab-muted" />
                    </td>
                  </motion.tr>
                ))}
              {!isLoading && data?.data?.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={
                        <FlaskConical size={28} className="text-lab-muted" />
                      }
                      title="No samples found"
                      description="Register your first sample to get started"
                      action={
                        <Button
                          leftIcon={<Plus size={14} />}
                          onClick={() => setShowNewModal(true)}
                        >
                          Register Sample
                        </Button>
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {data?.pagination && (
            <Pagination
              page={data.pagination.page}
              pages={data.pagination.pages}
              total={data.pagination.total}
              limit={data.pagination.limit}
              onChange={setPage}
            />
          )}
        </div>

        {showNewModal && (
          <NewSampleModal onClose={() => setShowNewModal(false)} />
        )}
      </PageContainer>
    </AppShell>
  );
}

// ── New Sample Modal ──────────────────────────────────────────────────────────
const sampleSchema = z.object({
  client_id: z.string().uuid("Select a client"),
  name: z.string().min(1, "Sample name is required"),
  matrix: z.string().optional(),
  description: z.string().optional(),
  storage_zone: z.string().optional(),
  storage_location: z.string().optional(),
  notes: z.string().optional(),
  // Enhanced CoA fields
  sample_container: z.string().optional(),
  sample_volume: z.string().optional(),
  reference_standard: z.string().optional(),
  batch_number: z.string().optional(),
  sample_condition: z.string().optional(),
  temperature_on_receipt: z.string().optional(),
  sampling_point: z.string().optional(),
  production_date: z.string().optional(),
  expiry_date: z.string().optional(),
  manufacturer: z.string().optional(),
});

function NewSampleModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(sampleSchema),
  });

  const { data: clients } = useQuery({
    queryKey: ["clients-list"],
    queryFn: () => api.get("/clients").then((r) => r.data.data),
  });

  const { data: analysts } = useQuery({
    queryKey: ["analysts-list"],
    queryFn: () =>
      api
        .get("/users")
        .then((r) =>
          r.data.data.filter((u: any) =>
            ["lab_analyst", "quality_manager", "md", "super_admin"].includes(
              u.role,
            ),
          ),
        ),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => {
      // Format dates properly and clean empty strings
      const formattedData = {
        ...data,
        collection_date: data.collection_date
          ? new Date(data.collection_date).toISOString()
          : undefined,
        production_date: data.production_date
          ? new Date(data.production_date).toISOString()
          : undefined,
        expiry_date: data.expiry_date
          ? new Date(data.expiry_date).toISOString()
          : undefined,
      };
      // Remove empty strings
      Object.keys(formattedData).forEach((key) => {
        if (formattedData[key] === "") formattedData[key] = undefined;
      });
      return api.post("/samples", formattedData);
    },
    onSuccess: (res) => {
      toast.success(`Sample ${res.data.data.ulid} registered!`);
      qc.invalidateQueries({ queryKey: ["samples"] });
      onClose();
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.error || "Failed to register sample"),
  });

  return (
    <Modal open onClose={onClose} title="Register New Sample" size="lg">
      <form
        onSubmit={handleSubmit((d) => mutation.mutate(d))}
        className="space-y-4"
      >
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="font-display text-sm font-semibold text-gray-700 border-b pb-2">
            Basic Information
          </h3>
          <Select
            label="Client *"
            error={errors.client_id?.message as string}
            options={(clients || []).map((c: any) => ({
              value: c.id,
              label: `${c.name}${c.company ? ` (${c.company})` : ""}`,
            }))}
            placeholder="Select a client..."
            {...register("client_id")}
          />
          <Input
            label="Sample Name *"
            error={errors.name?.message as string}
            placeholder="e.g. Borehole Water Sample A"
            {...register("name")}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Sample Matrix"
              options={[
                { value: "Water", label: "Water" },
                { value: "Wastewater", label: "Wastewater" },
                { value: "Soil", label: "Soil" },
                { value: "Food", label: "Food" },
                { value: "Animal Feed", label: "Animal Feed" },
                { value: "Air", label: "Air" },
                { value: "Other", label: "Other" },
              ]}
              placeholder="Select matrix..."
              {...register("matrix")}
            />
            <Input
              label="Collection Date"
              type="datetime-local"
              {...register("collection_date")}
            />
          </div>
        </div>

        {/* Sample Details */}
        <div className="space-y-4">
          <h3 className="font-display text-sm font-semibold text-gray-700 border-b pb-2">
            Sample Details
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Container Type"
              placeholder="e.g. Plastic Bottle"
              {...register("sample_container")}
            />
            <Input
              label="Volume/Size"
              placeholder="e.g. 750ml, 500g"
              {...register("sample_volume")}
            />
            <Input
              label="Batch Number"
              placeholder="e.g. BATCH-2024-001"
              {...register("batch_number")}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Sample Condition"
              options={[
                { value: "Good", label: "Good" },
                { value: "Damaged", label: "Damaged" },
                { value: "Compromised", label: "Compromised" },
                { value: "Acceptable", label: "Acceptable" },
              ]}
              placeholder="Select condition..."
              {...register("sample_condition")}
            />
            <Input
              label="Temperature on Receipt"
              placeholder="e.g. 25°C, Ambient"
              {...register("temperature_on_receipt")}
            />
          </div>
          <Input
            label="Sampling Point"
            placeholder="e.g. Borehole at Factory Gate"
            {...register("sampling_point")}
          />
        </div>

        {/* Product Information (for product testing) */}
        <div className="space-y-4">
          <h3 className="font-display text-sm font-semibold text-gray-700 border-b pb-2">
            Product Information (Optional)
          </h3>
          <Input
            label="Manufacturer"
            placeholder="e.g. ABC Foods Limited"
            {...register("manufacturer")}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Production Date"
              type="date"
              {...register("production_date")}
            />
            <Input
              label="Expiry Date"
              type="date"
              {...register("expiry_date")}
            />
          </div>
          <Input
            label="Reference Standard"
            placeholder="e.g. NIS 077:2017, ISO 17025"
            {...register("reference_standard")}
          />
        </div>

        {/* Lab Management */}
        <div className="space-y-4">
          <h3 className="font-display text-sm font-semibold text-gray-700 border-b pb-2">
            Lab Management
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Assign Analyst"
              options={(analysts || []).map((a: any) => ({
                value: a.id,
                label: a.full_name,
              }))}
              placeholder="Select analyst (optional)..."
              {...register("assigned_analyst_id")}
            />
            <Input
              label="Storage Location"
              placeholder="e.g. Cold Room A, Shelf 2"
              {...register("storage_location")}
            />
          </div>
          <Textarea
            label="Description / Notes"
            placeholder="Any additional details..."
            {...register("notes")}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending} className="flex-1">
            Register Sample
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Sample Detail Page ────────────────────────────────────────────────────────
export function SampleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showStatusModal, setShowStatusModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["sample", id],
    queryFn: () => api.get(`/samples/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

  const { data: results } = useQuery({
    queryKey: ["sample-results", id],
    queryFn: () =>
      api
        .get("/results", { params: { sample_id: id } })
        .then((r) => r.data.data),
    enabled: !!id,
  });

  if (isLoading)
    return (
      <AppShell>
        <TopHeader title="Loading..." />
        <PageContainer>
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-48 w-full" />
          </div>
        </PageContainer>
      </AppShell>
    );

  if (!data) return null;

  return (
    <AppShell>
      <TopHeader
        title={data.name}
        subtitle={`Sample ID: ${data.ulid}`}
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              leftIcon={<ArrowLeft size={14} />}
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
            <Link to={`/results/new?sample_id=${id}`}>
              <Button leftIcon={<Plus size={14} />}>Enter Results</Button>
            </Link>
          </div>
        }
      />
      <PageContainer>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-display text-lg">{data.name}</h2>
                  <code className="text-xs bg-slate-100 px-2 py-0.5 rounded font-mono">
                    {data.ulid}
                  </code>
                </div>
                <StatusBadge status={data.status} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="label">Matrix</p>
                  <p className="text-sm">{data.matrix || "—"}</p>
                </div>
                <div>
                  <p className="label">Client</p>
                  <p className="text-sm">{data.client?.name || "—"}</p>
                </div>
                <div>
                  <p className="label">Assigned Analyst</p>
                  <p className="text-sm">
                    {data.analyst?.full_name || "Unassigned"}
                  </p>
                </div>
                <div>
                  <p className="label">Storage Location</p>
                  <p className="text-sm">{data.storage_location || "—"}</p>
                </div>
                <div>
                  <p className="label">Date Received</p>
                  <p className="text-sm">
                    {data.received_at
                      ? format(new Date(data.received_at), "dd MMM yyyy, HH:mm")
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="label">Collection Date</p>
                  <p className="text-sm">
                    {data.collection_date
                      ? format(new Date(data.collection_date), "dd MMM yyyy")
                      : "—"}
                  </p>
                </div>
              </div>

              {data.notes && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                  <p className="label">Notes</p>
                  <p className="text-sm text-lab-text">{data.notes}</p>
                </div>
              )}
            </Card>

            {/* Status Timeline */}
            <Card className="p-5">
              <h3 className="font-display text-base mb-4">Status Timeline</h3>
              <StatusTimeline current={data.status} />
            </Card>

            {/* Results */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base">Test Results</h3>
                <Link to={`/results/new?sample_id=${id}`}>
                  <Button size="sm" leftIcon={<Plus size={12} />}>
                    Add Results
                  </Button>
                </Link>
              </div>
              {(results || []).length === 0 ? (
                <EmptyState
                  icon={<FileCheck size={24} className="text-lab-muted" />}
                  title="No results yet"
                  description="Enter test results for this sample"
                />
              ) : (
                <div className="space-y-2">
                  {results.map((r: any) => (
                    <Link
                      key={r.id}
                      to={`/results/${r.id}`}
                      className="flex items-center justify-between p-3 border border-lab-border rounded-lg hover:border-primary-300 hover:bg-blue-50/30 transition-colors group"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {r.test_method?.name || "Test Result"}
                        </p>
                        <p className="text-xs text-lab-muted">
                          {format(new Date(r.created_at), "dd MMM yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={r.overall_status} />
                        <ChevronRight
                          size={14}
                          className="text-lab-muted group-hover:text-primary-600"
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {data.barcode_url ? (
              <Card className="p-5 text-center">
                <p className="label mb-3">Sample Barcode</p>
                <img
                  src={data.barcode_url}
                  alt="Barcode"
                  className="w-40 h-40 mx-auto rounded-lg"
                  onError={(e) => {
                    // Fallback if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.src = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(data.ulid)}`;
                  }}
                />
                <p className="text-xs text-lab-muted mt-2 font-mono">
                  {data.ulid}
                </p>
              </Card>
            ) : (
              <Card className="p-5 text-center">
                <p className="label mb-3">Sample Barcode</p>
                <div className="w-40 h-40 mx-auto rounded-lg bg-gray-100 flex items-center justify-center">
                  <QrCode size={48} className="text-gray-400" />
                </div>
                <p className="text-xs text-lab-muted mt-2">
                  Barcode not generated
                </p>
                <p className="text-xs text-lab-muted font-mono mt-1">
                  {data.ulid}
                </p>
              </Card>
            )}

            <Card className="p-5">
              <p className="label mb-3">Update Status</p>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setShowStatusModal(true)}
              >
                Change Status
              </Button>
            </Card>
          </div>
        </div>

        {showStatusModal && (
          <UpdateStatusModal
            sampleId={id!}
            currentStatus={data.status}
            onClose={() => setShowStatusModal(false)}
            onSuccess={() => {
              qc.invalidateQueries({ queryKey: ["sample", id] });
              setShowStatusModal(false);
            }}
          />
        )}
      </PageContainer>
    </AppShell>
  );
}

function StatusTimeline({ current }: { current: string }) {
  const steps = ["received", "in_testing", "pending_review", "approved"];
  const currentIdx = steps.indexOf(current);

  return (
    <div className="flex items-center">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={clsx(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                i < currentIdx
                  ? "bg-primary-600 border-primary-600 text-white"
                  : i === currentIdx
                    ? "bg-white border-primary-600 text-primary-600"
                    : "bg-white border-slate-200 text-slate-300",
              )}
            >
              {i < currentIdx ? "✓" : i + 1}
            </div>
            <p
              className={clsx(
                "text-[10px] mt-1 text-center leading-tight",
                i <= currentIdx
                  ? "text-primary-700 font-medium"
                  : "text-slate-400",
              )}
            >
              {step.replace(/_/g, " ")}
            </p>
          </div>
          {i < steps.length - 1 && (
            <div
              className={clsx(
                "flex-1 h-0.5 mx-2 rounded mb-4",
                i < currentIdx ? "bg-primary-500" : "bg-slate-200",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function UpdateStatusModal({
  sampleId,
  currentStatus,
  onClose,
  onSuccess,
}: {
  sampleId: string;
  currentStatus: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      api.patch(`/samples/${sampleId}/status`, { status, reason }),
    onSuccess: () => {
      toast.success("Status updated");
      onSuccess();
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed"),
  });

  return (
    <Modal open onClose={onClose} title="Update Sample Status" size="sm">
      <div className="space-y-4">
        <Select
          label="New Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={[
            { value: "received", label: "Received" },
            { value: "in_testing", label: "In Testing" },
            { value: "pending_review", label: "Pending Review" },
            { value: "approved", label: "Approved" },
            { value: "disposed", label: "Disposed" },
            { value: "voided", label: "Voided" },
          ]}
        />
        {["voided", "disposed"].includes(status) && (
          <Textarea
            label="Reason *"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Provide a reason for this status change"
          />
        )}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
            className="flex-1"
          >
            Update
          </Button>
        </div>
      </div>
    </Modal>
  );
}

import { FileCheck } from "lucide-react";
