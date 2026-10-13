// Staff Training Logs — HR views; lab and executive managers maintain
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Plus, Trash2 } from "lucide-react";
import { format, isBefore } from "date-fns";
import toast from "react-hot-toast";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { roleLabel } from "../../lib/roles";
import { AppShell, PageContainer, TopHeader } from "../../components/layout";
import {
  Button,
  EmptyState,
  Input,
  Modal,
  Select,
  Skeleton,
  Textarea,
} from "../../components/ui";

const CATEGORIES = ["Induction", "Technical", "Safety", "Quality", "Other"];

export function TrainingLogsPage() {
  const { isRole } = useAuth();
  const qc = useQueryClient();
  const [staffFilter, setStaffFilter] = useState("");
  const [showNew, setShowNew] = useState(false);

  // HR may only view; these roles may record and remove entries
  const canManage = isRole("super_admin", "md", "lab_manager", "quality_manager");

  const { data: logs, isLoading } = useQuery({
    queryKey: ["training-logs", staffFilter],
    queryFn: () =>
      api
        .get("/training-logs", {
          params: { user_id: staffFilter || undefined },
        })
        .then((r) => r.data.data),
  });

  const { data: staff } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get("/users").then((r) => r.data.data),
    enabled: canManage,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/training-logs/${id}`),
    onSuccess: () => {
      toast.success("Training record removed");
      qc.invalidateQueries({ queryKey: ["training-logs"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed"),
  });

  // Staff filter options come from the logs themselves so HR needs no user access
  const staffOptions = Array.from(
    new Map<string, string>(
      (logs || []).map((l: any) => [l.user_id, l.staff?.full_name || "—"]),
    ),
  ).map(([value, label]) => ({ value, label }));

  const today = new Date();

  return (
    <AppShell>
      <TopHeader
        title="Training Logs"
        subtitle="Staff training and competency records"
      />
      <PageContainer>
        <div className="flex flex-wrap gap-3 mb-4">
          <Select
            options={[{ value: "", label: "All Staff" }, ...staffOptions]}
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="w-56"
          />
          {canManage && (
            <Button
              className="ml-auto"
              leftIcon={<Plus size={14} />}
              onClick={() => setShowNew(true)}
            >
              Record Training
            </Button>
          )}
        </div>
        <div className="card overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff</th>
                <th>Training</th>
                <th>Category</th>
                <th>Completed</th>
                <th>Expires</th>
                <th>Recorded By</th>
                {canManage && <th />}
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j}>
                        <Skeleton className="h-3.5 w-full" />
                      </td>
                    ))}
                  </tr>
                ))}
              {!isLoading && (logs || []).length === 0 && (
                <tr>
                  <td colSpan={canManage ? 7 : 6}>
                    <EmptyState
                      icon={<GraduationCap size={28} />}
                      title="No training records yet"
                    />
                  </td>
                </tr>
              )}
              {(logs || []).map((log: any) => {
                const expired =
                  log.expires_on && isBefore(new Date(log.expires_on), today);
                return (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td>
                      <p className="text-xs font-medium">
                        {log.staff?.full_name}
                      </p>
                      <p className="text-[10px] text-lab-muted">
                        {roleLabel(log.staff?.role)}
                      </p>
                    </td>
                    <td>
                      <p className="text-xs font-medium">{log.title}</p>
                      {log.provider && (
                        <p className="text-[10px] text-lab-muted">
                          {log.provider}
                        </p>
                      )}
                    </td>
                    <td className="text-xs">{log.category || "—"}</td>
                    <td className="text-xs font-mono">
                      {format(new Date(log.completed_on), "dd MMM yyyy")}
                    </td>
                    <td className="text-xs font-mono">
                      {log.expires_on ? (
                        <span className={expired ? "text-red-600" : ""}>
                          {format(new Date(log.expires_on), "dd MMM yyyy")}
                          {expired && " (expired)"}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="text-xs text-lab-muted">
                      {log.recorded_by?.full_name || "—"}
                    </td>
                    {canManage && (
                      <td>
                        <button
                          className="p-1.5 rounded-lg hover:bg-red-50 text-lab-muted hover:text-red-600"
                          title="Remove"
                          onClick={() => {
                            if (confirm("Remove this training record?"))
                              deleteMutation.mutate(log.id);
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </PageContainer>
      {showNew && (
        <NewTrainingModal staff={staff || []} onClose={() => setShowNew(false)} />
      )}
    </AppShell>
  );
}

function NewTrainingModal({
  staff,
  onClose,
}: {
  staff: any[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    user_id: "",
    title: "",
    category: "Technical",
    provider: "",
    completed_on: format(new Date(), "yyyy-MM-dd"),
    expires_on: "",
    notes: "",
  });
  const set = (k: string) => (e: any) =>
    setForm({ ...form, [k]: e.target.value });

  const mutation = useMutation({
    mutationFn: () =>
      api.post("/training-logs", {
        ...form,
        provider: form.provider || undefined,
        expires_on: form.expires_on || undefined,
        notes: form.notes || undefined,
      }),
    onSuccess: () => {
      toast.success("Training recorded");
      qc.invalidateQueries({ queryKey: ["training-logs"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed"),
  });

  return (
    <Modal open onClose={onClose} title="Record Training" size="md">
      <div className="space-y-3">
        <Select
          label="Staff Member *"
          value={form.user_id}
          onChange={set("user_id")}
          options={[
            { value: "", label: "Select staff…" },
            ...staff.map((u) => ({
              value: u.id,
              label: `${u.full_name} — ${roleLabel(u.role)}`,
            })),
          ]}
        />
        <Input label="Training *" value={form.title} onChange={set("title")} />
        <Select
          label="Category"
          value={form.category}
          onChange={set("category")}
          options={CATEGORIES.map((c) => ({ value: c, label: c }))}
        />
        <Input
          label="Provider"
          value={form.provider}
          onChange={set("provider")}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Completed On *"
            type="date"
            value={form.completed_on}
            onChange={set("completed_on")}
          />
          <Input
            label="Expires On"
            type="date"
            value={form.expires_on}
            onChange={set("expires_on")}
          />
        </div>
        <Textarea label="Notes" value={form.notes} onChange={set("notes")} />
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={!form.user_id || !form.title || !form.completed_on}
            className="flex-1"
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
