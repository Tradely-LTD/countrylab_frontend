// Assets Page
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Wrench,
  AlertTriangle,
  Calendar,
  Search,
  ClipboardList,
  Trash2,
  MoreVertical,
  Edit,
  Eye,
  Printer,
  Send,
  Check,
  X,
  KeyRound,
  UserX,
  UserCheck,
} from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { AppShell, PageContainer, TopHeader } from "../../components/layout";
import {
  Button,
  Input,
  Select,
  Modal,
  EmptyState,
  Card,
  StatusBadge,
  Skeleton,
} from "../../components/ui";
import toast from "react-hot-toast";
import { format, differenceInDays } from "date-fns";
import { clsx } from "clsx";

export function AssetsPage() {
  const [showNew, setShowNew] = useState(false);
  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState<any>(null);
  const [logTarget, setLogTarget] = useState<any>(null);

  const { data: assets, isLoading } = useQuery({
    queryKey: ["assets"],
    queryFn: () => api.get("/assets").then((r) => r.data.data),
  });

  const filtered = (assets || []).filter(
    (a: any) => !search || a.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AppShell>
      <TopHeader
        title="Assets & Equipment"
        subtitle="Track lab equipment lifecycle and calibration"
        actions={
          <Button
            leftIcon={<Plus size={14} />}
            onClick={() => setShowNew(true)}
          >
            Add Asset
          </Button>
        }
      />
      <PageContainer>
        <div className="flex flex-wrap gap-2 mb-4">
          <Input
            placeholder="Search assets..."
            leftIcon={<Search size={14} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-xs"
          />
        </div>

        <div className="card overflow-hidden">
          <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Asset / Model</th>
                <th>Serial No</th>
                <th>Status</th>
                <th>Custodian</th>
                <th>Next Calibration</th>
                <th>Location</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j}>
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))}
              {filtered.map((a: any) => {
                const daysToCalibration = a.next_calibration_date
                  ? differenceInDays(
                      new Date(a.next_calibration_date),
                      new Date(),
                    )
                  : null;
                const isCalibrationDue =
                  daysToCalibration !== null && daysToCalibration <= 30;

                return (
                  <tr key={a.id}>
                    <td>
                      <p className="font-medium text-sm">{a.name}</p>
                      {a.model && (
                        <p className="text-xs text-lab-muted">
                          {a.manufacturer} {a.model}
                        </p>
                      )}
                    </td>
                    <td className="text-xs font-mono">
                      {a.serial_number || "—"}
                    </td>
                    <td>
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="text-sm">{a.custodian?.full_name || "—"}</td>
                    <td>
                      {a.next_calibration_date ? (
                        <div>
                          <p
                            className={clsx(
                              "text-sm font-medium",
                              isCalibrationDue ? "text-amber-600" : "",
                            )}
                          >
                            {format(
                              new Date(a.next_calibration_date),
                              "dd MMM yyyy",
                            )}
                          </p>
                          {isCalibrationDue && (
                            <p className="text-xs text-amber-500 flex items-center gap-1">
                              <AlertTriangle size={10} />
                              {daysToCalibration <= 0
                                ? "Overdue"
                                : `${daysToCalibration}d`}
                            </p>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="text-sm">{a.location || "—"}</td>
                    <td>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditTarget(a)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLogTarget(a)}
                          leftIcon={<ClipboardList size={12} />}
                        >
                          Log
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={<Wrench size={28} className="text-lab-muted" />}
                      title="No assets found"
                      action={
                        <Button
                          leftIcon={<Plus size={14} />}
                          onClick={() => setShowNew(true)}
                        >
                          Add Asset
                        </Button>
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        {showNew && <NewAssetModal onClose={() => setShowNew(false)} />}
        {editTarget && (
          <NewAssetModal
            asset={editTarget}
            onClose={() => setEditTarget(null)}
          />
        )}
        {logTarget && (
          <LogAssetModal asset={logTarget} onClose={() => setLogTarget(null)} />
        )}
      </PageContainer>
    </AppShell>
  );
}

function NewAssetModal({
  asset,
  onClose,
}: {
  asset?: any;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const isEditing = !!asset;

  const [name, setName] = useState(asset?.name || "");
  const [model, setModel] = useState(asset?.model || "");
  const [serial, setSerial] = useState(asset?.serial_number || "");
  const [location, setLocation] = useState(asset?.location || "");
  const [manufacturer, setManufacturer] = useState(asset?.manufacturer || "");
  const [status, setStatus] = useState(asset?.status || "operational");

  const mutation = useMutation({
    mutationFn: () =>
      isEditing
        ? api.patch(`/assets/${asset.id}`, {
            name,
            model,
            serial_number: serial,
            location,
            manufacturer,
            status,
          })
        : api.post("/assets", {
            name,
            model,
            serial_number: serial,
            location,
            manufacturer,
            status,
          }),
    onSuccess: () => {
      toast.success(isEditing ? "Asset updated" : "Asset added");
      qc.invalidateQueries({ queryKey: ["assets"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed"),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={isEditing ? "Edit Asset" : "Add New Asset"}
      size="md"
    >
      <div className="space-y-3">
        <Input
          label="Asset Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. pH Meter"
        />
        <Input
          label="Manufacturer"
          value={manufacturer}
          onChange={(e) => setManufacturer(e.target.value)}
          placeholder="e.g. Mettler Toledo"
        />
        <Input
          label="Model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="e.g. SevenCompact S220"
        />
        <Input
          label="Serial Number"
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
        />
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={[
            { value: "operational", label: "Operational" },
            { value: "under_repair", label: "Under Repair" },
            { value: "calibration_due", label: "Calibration Due" },
            { value: "decommissioned", label: "Decommissioned" },
          ]}
        />
        <Input
          label="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Lab A"
        />
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={!name}
            className="flex-1"
          >
            {isEditing ? "Update Asset" : "Add Asset"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function LogAssetModal({
  asset,
  onClose,
}: {
  asset: any;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [action, setAction] = useState("calibrated");
  const [description, setDescription] = useState("");
  const [nextDue, setNextDue] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      api.post(`/assets/${asset.id}/log`, {
        action,
        description,
        next_due_date: nextDue ? new Date(nextDue).toISOString() : undefined,
      }),
    onSuccess: () => {
      toast.success("Log entry added");
      qc.invalidateQueries({ queryKey: ["assets"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed"),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={`Log Action — ${asset.name}`}
      size="sm"
    >
      <div className="space-y-3">
        <Select
          label="Action"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          options={[
            { value: "calibrated", label: "Calibrated" },
            { value: "repaired", label: "Repaired" },
            { value: "maintenance", label: "Maintenance" },
            { value: "moved", label: "Moved" },
            { value: "inspected", label: "Inspected" },
          ]}
        />
        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add notes..."
        />
        {action === "calibrated" && (
          <Input
            label="Next Calibration Due"
            type="date"
            value={nextDue}
            onChange={(e) => setNextDue(e.target.value)}
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
            Log Action
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Procurement Page ───────────────────────────────────────────────────────────
export function ProcurementPage() {
  const [showNew, setShowNew] = useState(false);
  const [viewTarget, setViewTarget] = useState<any>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [viewPO, setViewPO] = useState<any>(null);
  const [tab, setTab] = useState<"requisitions" | "pos">("requisitions");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuRect, setMenuRect] = useState<{
    top: number;
    bottom: number;
    right: number;
  } | null>(null);
  const qc = useQueryClient();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const handleMenuToggle = (id: string, event: React.MouseEvent) => {
    if (openMenuId === id) {
      setOpenMenuId(null);
      setMenuRect(null);
      return;
    }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuRect({ top: rect.top, bottom: rect.bottom, right: rect.right });
    setOpenMenuId(id);
  };

  const menuStyle =
    menuRect && window.innerHeight - menuRect.bottom > 220
      ? {
          top: menuRect.bottom + 4,
          right: window.innerWidth - menuRect.right,
        }
      : menuRect
        ? {
            bottom: window.innerHeight - menuRect.top + 4,
            right: window.innerWidth - menuRect.right,
          }
        : {};

  const { data: requisitions } = useQuery({
    queryKey: ["requisitions"],
    queryFn: () =>
      api.get("/procurement/requisitions").then((r) => r.data.data),
  });

  const { data: pos } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: () =>
      api.get("/procurement/purchase-orders").then((r) => r.data.data),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      api.patch(`/procurement/requisitions/${id}/approve`, { action }),
    onSuccess: () => {
      toast.success("Requisition processed");
      qc.invalidateQueries({ queryKey: ["requisitions"] });
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
  });

  const printRequisition = (requisition: any) => {
    const items = requisition.items_metadata || requisition.items || [];
    const total = items.reduce(
      (sum: number, item: any) =>
        sum + (item.estimated_price || 0) * (item.quantity || 1),
      0,
    );

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Requisition ${requisition.requisition_number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { font-size: 24px; margin-bottom: 10px; }
            .header { margin-bottom: 30px; }
            .info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .info-item { margin-bottom: 10px; }
            .label { font-weight: bold; color: #666; font-size: 12px; }
            .value { font-size: 14px; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
            @media print {
              body { padding: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Requisition ${requisition.requisition_number}</h1>
            <p>CountryLab LMS - Procurement System</p>
          </div>
          
          <div class="info">
            <div>
              <div class="info-item">
                <div class="label">Department</div>
                <div class="value">${requisition.department || "—"}</div>
              </div>
              <div class="info-item">
                <div class="label">Prepared By</div>
                <div class="value">${requisition.prepared_by?.full_name || "—"}</div>
              </div>
            </div>
            <div>
              <div class="info-item">
                <div class="label">Status</div>
                <div class="value">${requisition.status}</div>
              </div>
              <div class="info-item">
                <div class="label">Date</div>
                <div class="value">${format(new Date(requisition.created_at), "dd MMM yyyy HH:mm")}</div>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (item: any) => `
                <tr>
                  <td>
                    ${item.item_name}
                    ${item.catalog_number ? `<br><small>Catalog: ${item.catalog_number}</small>` : ""}
                  </td>
                  <td>${item.quantity} ${item.unit}</td>
                  <td>${item.estimated_price ? `₦${item.estimated_price.toLocaleString()}` : "—"}</td>
                  <td>${item.estimated_price ? `₦${(item.estimated_price * item.quantity).toLocaleString()}` : "—"}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>

          ${total > 0 ? `<div class="total">Grand Total: ₦${total.toLocaleString()}</div>` : ""}

          <button onclick="window.print()" style="margin-top: 30px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Print</button>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const deleteRequisitionMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/procurement/requisitions/${id}`),
    onSuccess: () => {
      toast.success("Requisition deleted");
      qc.invalidateQueries({ queryKey: ["requisitions"] });
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.error || "Failed to delete"),
  });

  const deletePOMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/procurement/purchase-orders/${id}`),
    onSuccess: () => {
      toast.success("Purchase order deleted");
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.error || "Failed to delete"),
  });

  return (
    <AppShell>
      <TopHeader
        title="Procurement"
        subtitle="Requisitions and Purchase Orders"
        actions={
          <Button
            leftIcon={<Plus size={14} />}
            onClick={() => setShowNew(true)}
          >
            New Requisition
          </Button>
        }
      />
      <PageContainer>
        <div className="flex rounded-lg border border-lab-border overflow-hidden w-fit mb-4">
          {[
            { key: "requisitions", label: "Requisitions" },
            { key: "pos", label: "Purchase Orders" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key as any)}
              className={clsx(
                "px-4 py-2 text-sm font-medium transition-colors",
                tab === key
                  ? "bg-primary-600 text-white"
                  : "text-lab-text hover:bg-lab-bg",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "requisitions" && (
          <div className="card overflow-visible">
            <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Items</th>
                  <th>Department</th>
                  <th>Urgency</th>
                  <th>Prepared By</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(requisitions || []).map((r: any) => (
                  <tr key={r.id}>
                    <td className="font-mono text-sm">
                      {r.requisition_number}
                    </td>
                    <td className="text-sm">
                      {r.items?.length || 0} item
                      {r.items?.length !== 1 ? "s" : ""}
                    </td>
                    <td className="text-sm">{r.department || "—"}</td>
                    <td>
                      <span
                        className={clsx(
                          "badge",
                          r.urgency === "emergency"
                            ? "badge-voided"
                            : "badge-received",
                        )}
                      >
                        {r.urgency}
                      </span>
                    </td>
                    <td className="text-sm">{r.prepared_by?.full_name}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="text-xs text-lab-muted">
                      {format(new Date(r.created_at), "dd MMM yyyy")}
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleMenuToggle(r.id, e)}
                      >
                        <MoreVertical size={16} />
                      </Button>
                      {openMenuId === r.id && menuRect && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div
                            className="fixed w-48 bg-white rounded-lg shadow-lg border border-lab-border z-20 py-1"
                            style={menuStyle}
                          >
                            <button
                              className="w-full px-4 py-2 text-left text-sm hover:bg-lab-bg flex items-center gap-2"
                              onClick={() => {
                                setViewTarget(r);
                                setOpenMenuId(null);
                              }}
                            >
                              <Eye size={14} />
                              View Details
                            </button>
                            <button
                              className="w-full px-4 py-2 text-left text-sm hover:bg-lab-bg flex items-center gap-2"
                              onClick={() => {
                                printRequisition(r);
                                setOpenMenuId(null);
                              }}
                            >
                              <Printer size={14} />
                              Print
                            </button>
                            {r.status === "draft" && (
                              <>
                                <button
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-lab-bg flex items-center gap-2"
                                  onClick={() => {
                                    setEditTarget(r);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  <Edit size={14} />
                                  Edit
                                </button>
                                <button
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-lab-bg flex items-center gap-2"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    if (
                                      confirm(
                                        "Submit this requisition for approval?",
                                      )
                                    ) {
                                      api
                                        .patch(
                                          `/procurement/requisitions/${r.id}/submit`,
                                        )
                                        .then(() => {
                                          toast.success(
                                            "Requisition submitted for approval",
                                          );
                                          qc.invalidateQueries({
                                            queryKey: ["requisitions"],
                                          });
                                        })
                                        .catch((e) =>
                                          toast.error(
                                            e.response?.data?.error || "Failed",
                                          ),
                                        );
                                    }
                                  }}
                                >
                                  <Send size={14} />
                                  Submit for Approval
                                </button>
                              </>
                            )}
                            {r.status === "pending_approval" && (
                              <>
                                <button
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-green-50 text-green-700 flex items-center gap-2"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    approveMutation.mutate({
                                      id: r.id,
                                      action: "approve",
                                    });
                                  }}
                                >
                                  <Check size={14} />
                                  Approve
                                </button>
                                <button
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-700 flex items-center gap-2"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    approveMutation.mutate({
                                      id: r.id,
                                      action: "reject",
                                    });
                                  }}
                                >
                                  <X size={14} />
                                  Reject
                                </button>
                              </>
                            )}
                            {isSuperAdmin && (
                              <>
                                <div className="border-t border-lab-border my-1" />
                                <button
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-700 flex items-center gap-2"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    if (
                                      confirm(
                                        `Delete requisition ${r.requisition_number}? This cannot be undone.`,
                                      )
                                    ) {
                                      deleteRequisitionMutation.mutate(r.id);
                                    }
                                  }}
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {!(requisitions || []).length && (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState
                        icon={
                          <ClipboardList size={24} className="text-lab-muted" />
                        }
                        title="No requisitions"
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {tab === "pos" && (
          <div className="card overflow-visible">
            <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(pos || []).map((p: any) => (
                  <tr key={p.id}>
                    <td className="font-mono text-sm">{p.po_number}</td>
                    <td className="text-sm">{p.supplier_name || "—"}</td>
                    <td className="text-sm">
                      {p.total_amount
                        ? `₦${p.total_amount.toLocaleString()}`
                        : "—"}
                    </td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="text-xs text-lab-muted">
                      {format(new Date(p.created_at), "dd MMM yyyy")}
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleMenuToggle(p.id, e)}
                      >
                        <MoreVertical size={16} />
                      </Button>
                      {openMenuId === p.id && menuRect && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div
                            className="fixed w-48 bg-white rounded-lg shadow-lg border border-lab-border z-20 py-1"
                            style={menuStyle}
                          >
                            <button
                              className="w-full px-4 py-2 text-left text-sm hover:bg-lab-bg flex items-center gap-2"
                              onClick={() => {
                                setViewPO(p);
                                setOpenMenuId(null);
                              }}
                            >
                              <Eye size={14} />
                              {p.total_amount ? "View Details" : "Complete PO"}
                            </button>
                            {isSuperAdmin && (
                              <>
                                <div className="border-t border-lab-border my-1" />
                                <button
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-700 flex items-center gap-2"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    if (
                                      confirm(
                                        `Delete purchase order ${p.po_number}? This cannot be undone.`,
                                      )
                                    ) {
                                      deletePOMutation.mutate(p.id);
                                    }
                                  }}
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {!(pos || []).length && (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState title="No purchase orders" />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {showNew && <NewRequisitionModal onClose={() => setShowNew(false)} />}
        {viewTarget && (
          <ViewRequisitionModal
            requisition={viewTarget}
            onClose={() => setViewTarget(null)}
          />
        )}
        {editTarget && (
          <NewRequisitionModal
            requisition={editTarget}
            onClose={() => setEditTarget(null)}
          />
        )}
        {viewPO && <EditPOModal po={viewPO} onClose={() => setViewPO(null)} />}
      </PageContainer>
    </AppShell>
  );
}

function EditPOModal({ po, onClose }: { po: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [supplierName, setSupplierName] = useState(po.supplier_name || "");
  const [supplierContact, setSupplierContact] = useState(
    po.supplier_contact || "",
  );
  const [status, setStatus] = useState(po.status || "pending");
  const [notes, setNotes] = useState(po.notes || "");

  // Fetch the linked requisition to get items
  const { data: requisition } = useQuery({
    queryKey: ["requisition", po.requisition_id],
    queryFn: () =>
      api.get(`/procurement/requisitions`).then((r) => {
        const reqs = r.data.data;
        return reqs.find((req: any) => req.id === po.requisition_id);
      }),
    enabled: !!po.requisition_id,
  });

  const items = requisition?.items_metadata || requisition?.items || [];

  // Calculate total from estimated prices
  const calculatedTotal = items.reduce((sum: number, item: any) => {
    const price = item.estimated_price || 0;
    const qty = item.quantity || 0;
    return sum + price * qty;
  }, 0);

  const [totalAmount, setTotalAmount] = useState(
    po.total_amount || calculatedTotal,
  );

  const mutation = useMutation({
    mutationFn: () =>
      api.patch(`/procurement/purchase-orders/${po.id}`, {
        supplier_name: supplierName,
        supplier_contact: supplierContact,
        total_amount: totalAmount,
        status,
        notes,
      }),
    onSuccess: () => {
      toast.success("Purchase Order updated");
      qc.invalidateQueries({ queryKey: ["purchase-orders"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed"),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={`Purchase Order ${po.po_number}`}
      size="lg"
    >
      <div className="space-y-4">
        <div className="bg-lab-bg p-3 rounded-lg">
          <p className="text-xs text-lab-muted">Linked Requisition</p>
          <p className="text-sm font-medium">
            {requisition?.requisition_number || "—"}
          </p>
        </div>

        <div>
          <p className="label mb-2">Items ({items.length})</p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {items.map((item: any, i: number) => (
              <div
                key={i}
                className="border border-lab-border rounded p-2 text-sm"
              >
                <div className="flex justify-between">
                  <span className="font-medium">{item.item_name}</span>
                  <span>
                    {item.quantity} {item.unit}
                  </span>
                </div>
                {item.estimated_price && (
                  <div className="text-xs text-lab-muted mt-1">
                    Est. Price: ₦{item.estimated_price.toLocaleString()} ×{" "}
                    {item.quantity} = ₦
                    {(item.estimated_price * item.quantity).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
          {calculatedTotal > 0 && (
            <div className="mt-2 p-2 bg-primary-50 rounded text-sm">
              <strong>
                Estimated Total: ₦{calculatedTotal.toLocaleString()}
              </strong>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Supplier Name"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            placeholder="e.g. Sigma-Aldrich"
          />
          <Input
            label="Supplier Contact"
            value={supplierContact}
            onChange={(e) => setSupplierContact(e.target.value)}
            placeholder="Phone or email"
          />
          <Input
            label="Total Amount (₦)"
            type="number"
            value={totalAmount}
            onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
            placeholder="Actual amount paid"
          />
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: "pending", label: "Pending" },
              { value: "received", label: "Received" },
              { value: "partial", label: "Partial" },
              { value: "cancelled", label: "Cancelled" },
            ]}
          />
        </div>

        <Input
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes..."
        />

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Update PO
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ViewRequisitionModal({
  requisition,
  onClose,
}: {
  requisition: any;
  onClose: () => void;
}) {
  return (
    <Modal
      open
      onClose={onClose}
      title={`Requisition ${requisition.requisition_number}`}
      size="lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-lab-muted">Department</p>
            <p className="text-sm font-medium">
              {requisition.department || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-lab-muted">Urgency</p>
            <span
              className={clsx(
                "badge",
                requisition.urgency === "emergency"
                  ? "badge-voided"
                  : "badge-received",
              )}
            >
              {requisition.urgency}
            </span>
          </div>
          <div>
            <p className="text-xs text-lab-muted">Prepared By</p>
            <p className="text-sm font-medium">
              {requisition.prepared_by?.full_name}
            </p>
          </div>
          <div>
            <p className="text-xs text-lab-muted">Status</p>
            <StatusBadge status={requisition.status} />
          </div>
          <div>
            <p className="text-xs text-lab-muted">Created</p>
            <p className="text-sm font-medium">
              {format(new Date(requisition.created_at), "dd MMM yyyy HH:mm")}
            </p>
          </div>
        </div>

        <div>
          <p className="label mb-2">
            Items (
            {(requisition.items_metadata || requisition.items || []).length})
          </p>
          <div className="space-y-2">
            {(requisition.items_metadata || requisition.items || []).map(
              (item: any, i: number) => (
                <div
                  key={i}
                  className="border border-lab-border rounded-lg p-3"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">{item.item_name}</p>
                      {item.reagent_id && (
                        <span className="text-xs text-lab-muted">
                          From Stock
                        </span>
                      )}
                      {item.asset_id && (
                        <span className="text-xs text-lab-muted">Asset</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold">
                      {item.quantity} {item.unit}
                    </p>
                  </div>
                  {item.catalog_number && (
                    <p className="text-xs text-lab-muted">
                      Catalog: {item.catalog_number}
                    </p>
                  )}
                  {item.estimated_price && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-lab-muted">
                        Unit Price: ₦{item.estimated_price.toLocaleString()}
                      </p>
                      <p className="text-sm font-medium text-lab-primary">
                        Subtotal: ₦
                        {(
                          item.estimated_price * (item.quantity || 1)
                        ).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {item.notes && (
                    <p className="text-xs text-lab-muted mt-1">
                      Note: {item.notes}
                    </p>
                  )}
                </div>
              ),
            )}
          </div>
        </div>

        {(requisition.items_metadata || requisition.items || []).some(
          (it: any) => it.estimated_price,
        ) && (
          <div className="border-t border-lab-border pt-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Grand Total:</span>
              <span className="text-lg font-bold text-lab-primary">
                ₦
                {(requisition.items_metadata || requisition.items || [])
                  .reduce(
                    (sum: number, it: any) =>
                      sum + (it.estimated_price || 0) * (it.quantity || 1),
                    0,
                  )
                  .toLocaleString()}
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}

function NewRequisitionModal({
  requisition,
  onClose,
}: {
  requisition?: any;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const isEditing = !!requisition;

  const [items, setItems] = useState<any[]>(
    requisition?.items_metadata ||
      requisition?.items || [
        {
          item_name: "",
          reagent_id: null,
          asset_id: null,
          quantity: 1,
          unit: "units",
          supplier_id: null,
          estimated_price: null,
          catalog_number: "",
          notes: "",
          source: "custom",
        },
      ],
  );
  const [urgency, setUrgency] = useState(requisition?.urgency || "routine");
  const [department, setDepartment] = useState(requisition?.department || "");

  // Fetch inventory items for selection
  const { data: stockItems } = useQuery({
    queryKey: ["reagents-all"],
    queryFn: () =>
      api
        .get("/inventory/reagents", { params: { limit: 500 } })
        .then((r) => r.data.data),
  });

  const { data: assets } = useQuery({
    queryKey: ["assets-all"],
    queryFn: () => api.get("/assets").then((r) => r.data.data),
  });

  // Combine stock and assets for selection
  const inventoryOptions = [
    { value: "", label: "-- Select from inventory or type custom --" },
    ...(stockItems || []).map((item: any) => ({
      value: `stock_${item.id}`,
      label: `${item.name} (${item.product_type || "reagent"}) - Stock: ${item.quantity} ${item.unit}`,
      data: item,
      type: "stock",
    })),
    ...(assets || []).map((item: any) => ({
      value: `asset_${item.id}`,
      label: `${item.name} ${item.model ? `(${item.model})` : ""} - Asset`,
      data: item,
      type: "asset",
    })),
  ];

  const handleItemSelect = (index: number, value: string) => {
    if (!value) {
      // Reset to custom
      setItems(
        items.map((it, j) =>
          j === index
            ? {
                item_name: "",
                reagent_id: null,
                asset_id: null,
                quantity: 1,
                unit: "units",
                supplier_id: null,
                estimated_price: null,
                catalog_number: "",
                notes: "",
                source: "custom",
              }
            : it,
        ),
      );
      return;
    }

    const option = inventoryOptions.find((opt) => opt.value === value);
    if (!option || !option.data) return;

    const newItem: any = {
      source: "inventory",
      item_name: option.data.name,
      quantity: 1,
      notes: items[index].notes,
    };

    if (option.type === "stock") {
      newItem.reagent_id = option.data.id;
      newItem.asset_id = null;
      newItem.unit = option.data.unit || "units";
      newItem.supplier_id = option.data.supplier_id || null;
      newItem.estimated_price = option.data.unit_price || null;
      newItem.catalog_number = option.data.catalog_number || "";
      newItem.quantity = option.data.reorder_level || 1;
    } else {
      newItem.asset_id = option.data.id;
      newItem.reagent_id = null;
      newItem.unit = "units";
      newItem.quantity = 1;
    }

    setItems(items.map((it, j) => (j === index ? newItem : it)));
  };

  const mutation = useMutation({
    mutationFn: () =>
      isEditing
        ? api.patch(`/procurement/requisitions/${requisition.id}`, {
            urgency,
            department,
            items,
          })
        : api.post("/procurement/requisitions", { urgency, department, items }),
    onSuccess: () => {
      toast.success(
        isEditing ? "Requisition updated" : "Requisition submitted",
      );
      qc.invalidateQueries({ queryKey: ["requisitions"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed"),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={isEditing ? "Edit Requisition" : "New Requisition"}
      size="xl"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
          <Select
            label="Urgency"
            value={urgency}
            onChange={(e) => setUrgency(e.target.value)}
            options={[
              { value: "routine", label: "Routine" },
              { value: "emergency", label: "Emergency" },
            ]}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label">Items *</label>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<Plus size={12} />}
              onClick={() =>
                setItems([
                  ...items,
                  {
                    item_name: "",
                    reagent_id: null,
                    asset_id: null,
                    quantity: 1,
                    unit: "units",
                    supplier_id: null,
                    estimated_price: null,
                    catalog_number: "",
                    notes: "",
                    source: "custom",
                  },
                ])
              }
            >
              Add Item
            </Button>
          </div>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div
                key={i}
                className="border border-lab-border rounded-lg p-3 space-y-2"
              >
                <Select
                  label="Select Item"
                  value={
                    item.reagent_id
                      ? `stock_${item.reagent_id}`
                      : item.asset_id
                        ? `asset_${item.asset_id}`
                        : ""
                  }
                  onChange={(e) => handleItemSelect(i, e.target.value)}
                  options={inventoryOptions}
                />
                {item.source === "custom" && (
                  <Input
                    placeholder="Or type custom item name"
                    value={item.item_name}
                    onChange={(e) =>
                      setItems(
                        items.map((it, j) =>
                          j === i ? { ...it, item_name: e.target.value } : it,
                        ),
                      )
                    }
                  />
                )}
                {item.source === "inventory" && (
                  <div className="text-xs text-lab-muted bg-lab-bg p-2 rounded">
                    <p>
                      <strong>Item:</strong> {item.item_name}
                    </p>
                    {item.catalog_number && (
                      <p>
                        <strong>Catalog:</strong> {item.catalog_number}
                      </p>
                    )}
                    {item.estimated_price && (
                      <p>
                        <strong>Est. Price:</strong> ₦
                        {item.estimated_price.toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Input
                    type="number"
                    label="Quantity"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) =>
                      setItems(
                        items.map((it, j) =>
                          j === i
                            ? { ...it, quantity: parseInt(e.target.value) || 1 }
                            : it,
                        ),
                      )
                    }
                  />
                  <Select
                    label="Unit"
                    value={item.unit}
                    onChange={(e) =>
                      setItems(
                        items.map((it, j) =>
                          j === i ? { ...it, unit: e.target.value } : it,
                        ),
                      )
                    }
                    disabled={item.source === "inventory"}
                    options={[
                      { value: "units", label: "Units" },
                      { value: "ml", label: "mL" },
                      { value: "L", label: "L" },
                      { value: "g", label: "g" },
                      { value: "kg", label: "kg" },
                      { value: "mg", label: "mg" },
                      { value: "pieces", label: "Pieces" },
                      { value: "boxes", label: "Boxes" },
                      { value: "packs", label: "Packs" },
                      { value: "bottles", label: "Bottles" },
                      { value: "vials", label: "Vials" },
                    ]}
                  />
                  <Input
                    type="number"
                    label="Unit Price (₦)"
                    placeholder="Price"
                    value={item.estimated_price || ""}
                    onChange={(e) =>
                      setItems(
                        items.map((it, j) =>
                          j === i
                            ? {
                                ...it,
                                estimated_price:
                                  parseFloat(e.target.value) || null,
                              }
                            : it,
                        ),
                      )
                    }
                  />
                  <Input
                    label="Notes"
                    placeholder="Notes"
                    value={item.notes}
                    onChange={(e) =>
                      setItems(
                        items.map((it, j) =>
                          j === i ? { ...it, notes: e.target.value } : it,
                        ),
                      )
                    }
                  />
                </div>
                {item.estimated_price && item.quantity && (
                  <div className="text-right text-sm font-medium text-lab-primary">
                    Subtotal: ₦
                    {(item.estimated_price * item.quantity).toLocaleString()}
                  </div>
                )}
                {items.length > 1 && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setItems(items.filter((_, j) => j !== i))}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
        {items.some((it) => it.estimated_price) && (
          <div className="border-t border-lab-border pt-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Grand Total:</span>
              <span className="text-lg font-bold text-lab-primary">
                ₦
                {items
                  .reduce(
                    (sum, it) =>
                      sum + (it.estimated_price || 0) * (it.quantity || 0),
                    0,
                  )
                  .toLocaleString()}
              </span>
            </div>
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
            disabled={items.every((it) => !it.item_name)}
          >
            Submit Requisition
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Clients Page ───────────────────────────────────────────────────────────────
export function ClientsPage() {
  const [showNew, setShowNew] = useState(false);
  const [viewingClient, setViewingClient] = useState<any>(null);
  const [interactionClient, setInteractionClient] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [createdBy, setCreatedBy] = useState<string>("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const { user, isRole } = useAuth();
  const queryClient = useQueryClient();

  // Default business_development users to their own filter
  useEffect(() => {
    if (user?.role === "business_development" && user?.id) {
      setCreatedBy(user.id);
    }
  }, [user?.id, user?.role]);

  const canManageClients = isRole(
    "super_admin",
    "md",
    "quality_manager",
    "business_development",
    "finance",
  );

  const canToggleStatus = isRole(
    "super_admin",
    "md",
    "quality_manager",
    "business_development",
    "finance",
  );

  // Fetch users for staff filter
  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get("/users").then((r) => r.data.data),
  });

  const staffUsers = (usersData || []).filter((u: any) =>
    [
      "super_admin",
      "md",
      "quality_manager",
      "business_development",
      "finance",
      "lab_analyst",
      "staff",
    ].includes(u.role),
  );

  const { data: clientsResponse } = useQuery({
    queryKey: ["clients", search, createdBy, fromDate, toDate],
    queryFn: () =>
      api
        .get("/clients", {
          params: {
            search: search || undefined,
            created_by: createdBy || undefined,
            from: fromDate || undefined,
            to: toDate || undefined,
          },
        })
        .then((r) => r.data),
  });

  const clients: any[] = clientsResponse?.data ?? clientsResponse ?? [];
  const summary = clientsResponse?.summary ?? null;

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/clients/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client status updated");
    },
    onError: () => {
      toast.error("Failed to update client status");
    },
  });

  function toggleStatus(client: any) {
    const newStatus = client.client_status === "lead" ? "active" : "lead";
    statusMutation.mutate({ id: client.id, status: newStatus });
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const response = await api.get("/clients/export", {
        params: {
          created_by: createdBy || undefined,
          from: fromDate || undefined,
          to: toDate || undefined,
        },
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `clients-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Export failed");
    } finally {
      setIsExporting(false);
    }
  }

  const noData = clients.length === 0;

  return (
    <AppShell>
      <TopHeader
        title="Clients"
        subtitle="Manage client accounts and contacts"
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleExport}
              disabled={noData || isExporting}
              title={noData ? "No data to export" : undefined}
            >
              {isExporting ? "Exporting..." : "Export CSV"}
            </Button>
            {noData && (
              <span className="text-xs text-lab-muted self-center">
                No data to export
              </span>
            )}
            {canManageClients && (
              <Button
                leftIcon={<Plus size={14} />}
                onClick={() => setShowNew(true)}
              >
                Add Client
              </Button>
            )}
          </div>
        }
      />
      <PageContainer>
        {/* Analytics Summary Panel */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-primary-600">
                {summary.total ?? 0}
              </p>
              <p className="text-sm text-lab-muted mt-1">Total Clients</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {summary.leads ?? 0}
              </p>
              <p className="text-sm text-lab-muted mt-1">Total Prospects</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {summary.interactions ?? 0}
              </p>
              <p className="text-sm text-lab-muted mt-1">Total Interactions</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <Input
            placeholder="Search clients..."
            leftIcon={<Search size={14} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-xs"
          />
          <select
            value={createdBy}
            onChange={(e) => setCreatedBy(e.target.value)}
            className="border border-lab-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Staff</option>
            {staffUsers.map((u: any) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border border-lab-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="From"
            title="From date"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border border-lab-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="To"
            title="To date"
          />
        </div>

        <div className="card overflow-hidden">
          <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Contact Person</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Uploaded By</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c: any) => (
                <tr key={c.id}>
                  <td className="font-medium text-sm">{c.name}</td>
                  <td className="text-sm">{c.company || "—"}</td>
                  <td className="text-sm">{c.contact_person || "—"}</td>
                  <td className="text-sm">{c.email || "—"}</td>
                  <td className="text-sm">{c.phone || "—"}</td>
                  <td className="text-sm">{c.creator_name || "—"}</td>
                  <td>
                    {canToggleStatus ? (
                      <button
                        onClick={() => toggleStatus(c)}
                        disabled={statusMutation.isPending}
                        className={clsx(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-opacity",
                          c.client_status === "lead"
                            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                            : "bg-green-100 text-green-800 hover:bg-green-200",
                          statusMutation.isPending &&
                            "opacity-50 cursor-not-allowed",
                        )}
                      >
                        {c.client_status === "lead" ? "Prospect" : "Active"}
                      </button>
                    ) : (
                      <span
                        className={clsx(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                          c.client_status === "lead"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800",
                        )}
                      >
                        {c.client_status === "lead" ? "Prospect" : "Active"}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setInteractionClient(c)}
                      >
                        Log Interaction
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingClient(c)}
                      >
                        History
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      title="No clients yet"
                      action={
                        canManageClients && (
                          <Button
                            leftIcon={<Plus size={14} />}
                            onClick={() => setShowNew(true)}
                          >
                            Add Client
                          </Button>
                        )
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
        {showNew && <NewClientModal onClose={() => setShowNew(false)} />}
        {viewingClient && (
          <ClientHistoryModal
            client={viewingClient}
            onClose={() => setViewingClient(null)}
          />
        )}
        {interactionClient && (
          <InteractionModal
            client={interactionClient}
            onClose={() => setInteractionClient(null)}
          />
        )}
      </PageContainer>
    </AppShell>
  );
}

// ── Interaction Modal ──────────────────────────────────────────────────────────

function InteractionModal({
  client,
  onClose,
}: {
  client: any;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [type, setType] = useState("Call");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [outcome, setOutcome] = useState("Interested");

  const { data: interactions, isLoading: loadingHistory } = useQuery({
    queryKey: ["client-interactions", client.id],
    queryFn: () =>
      api.get(`/clients/${client.id}/interactions`).then((r) => r.data.data),
  });

  const mutation = useMutation({
    mutationFn: () =>
      api.post(`/clients/${client.id}/interactions`, {
        type,
        date: new Date(date).toISOString(),
        notes,
        outcome,
      }),
    onSuccess: () => {
      toast.success("Interaction logged");
      qc.invalidateQueries({ queryKey: ["client-interactions", client.id] });
      qc.invalidateQueries({ queryKey: ["clients"] });
      setNotes("");
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.error || "Failed to log interaction"),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={`Interactions — ${client.name}`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Log form */}
        <div className="p-4 bg-lab-bg rounded-lg space-y-3">
          <h3 className="font-semibold text-sm">Log New Interaction</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-lab-muted mb-1">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border border-lab-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {["Call", "Email", "Visit", "Meeting", "Other"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-lab-muted mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-lab-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-lab-muted mb-1">
              Outcome
            </label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="w-full border border-lab-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {[
                "Interested",
                "Not Interested",
                "Follow-up Required",
                "Converted",
              ].map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-lab-muted mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add notes about this interaction..."
              className="w-full border border-lab-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
          <Button
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
            disabled={!date}
            size="sm"
          >
            Log Interaction
          </Button>
        </div>

        {/* Interaction history */}
        <div>
          <h3 className="font-semibold text-sm mb-3">Interaction History</h3>
          {loadingHistory ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (interactions || []).length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(interactions || []).map((interaction: any) => (
                <div
                  key={interaction.id}
                  className="p-3 border border-lab-border rounded-lg text-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium">{interaction.type}</span>
                      <span className="text-lab-muted mx-2">·</span>
                      <span className="text-lab-muted">
                        {interaction.staff_name ||
                          interaction.staff?.full_name ||
                          "—"}
                      </span>
                    </div>
                    <div className="text-right text-xs text-lab-muted">
                      {interaction.date
                        ? format(new Date(interaction.date), "dd MMM yyyy")
                        : "—"}
                    </div>
                  </div>
                  {interaction.outcome && (
                    <span
                      className={clsx(
                        "inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium",
                        interaction.outcome === "Converted"
                          ? "bg-green-100 text-green-800"
                          : interaction.outcome === "Interested"
                            ? "bg-blue-100 text-blue-800"
                            : interaction.outcome === "Not Interested"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800",
                      )}
                    >
                      {interaction.outcome}
                    </span>
                  )}
                  {interaction.notes && (
                    <p className="text-xs text-lab-muted mt-1">
                      {interaction.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-lab-muted">
              No interactions logged yet.
            </p>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function NewClientModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    contact_person: "",
  });
  const mutation = useMutation({
    mutationFn: () => {
      // Clean up the form data - remove empty strings for optional fields
      const cleanedData = {
        name: form.name,
        ...(form.company && { company: form.company }),
        ...(form.email && { email: form.email }),
        ...(form.phone && { phone: form.phone }),
        ...(form.contact_person && { contact_person: form.contact_person }),
      };
      return api.post("/clients", cleanedData);
    },
    onSuccess: () => {
      toast.success("Client added");
      qc.invalidateQueries({ queryKey: ["clients"] });
      onClose();
    },
    onError: (e: any) => {
      console.error("Client creation error:", e);
      const errorMsg =
        e.response?.data?.error ||
        e.response?.data?.message ||
        e.message ||
        "Failed to add client";
      toast.error(errorMsg);
    },
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <Modal open onClose={onClose} title="Add New Client" size="md">
      <div className="space-y-3">
        <Input
          label="Client Name *"
          value={form.name}
          onChange={set("name")}
          placeholder="e.g. ABC Corporation"
        />
        <Input
          label="Company"
          value={form.company}
          onChange={set("company")}
          placeholder="Optional"
        />
        <Input
          label="Contact Person"
          value={form.contact_person}
          onChange={set("contact_person")}
          placeholder="Optional"
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={set("email")}
          placeholder="Optional - must be valid email"
        />
        <Input
          label="Phone"
          value={form.phone}
          onChange={set("phone")}
          placeholder="Optional"
        />
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            loading={mutation.isPending}
            disabled={!form.name.trim()}
            onClick={() => mutation.mutate()}
          >
            Add Client
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Client History Modal ───────────────────────────────────────────────────────

function ClientHistoryModal({
  client,
  onClose,
}: {
  client: any;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { data: history, isLoading } = useQuery({
    queryKey: ["client-history", client.id],
    queryFn: () =>
      api.get(`/clients/${client.id}/history`).then((r) => r.data.data),
  });

  return (
    <Modal open onClose={onClose} title={`${client.name} - History`} size="xl">
      <div className="space-y-4">
        {/* Client Info */}
        <div className="p-4 bg-lab-bg rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-lab-muted">Company</p>
              <p className="font-medium">{client.company || "—"}</p>
            </div>
            <div>
              <p className="text-lab-muted">Contact Person</p>
              <p className="font-medium">{client.contact_person || "—"}</p>
            </div>
            <div>
              <p className="text-lab-muted">Email</p>
              <p className="font-medium">{client.email || "—"}</p>
            </div>
            <div>
              <p className="text-lab-muted">Phone</p>
              <p className="font-medium">{client.phone || "—"}</p>
            </div>
          </div>
        </div>

        {/* Invoices */}
        <div>
          <h3 className="font-semibold text-sm mb-3">Invoices</h3>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : history?.invoices?.length > 0 ? (
            <div className="space-y-2">
              {history.invoices.map((invoice: any) => (
                <div
                  key={invoice.id}
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                  className="p-3 border border-lab-border rounded-lg flex justify-between items-center cursor-pointer hover:bg-lab-bg transition-colors"
                >
                  <div>
                    <p className="font-mono text-sm font-medium">
                      {invoice.invoice_number}
                    </p>
                    <p className="text-xs text-lab-muted">
                      {format(new Date(invoice.invoice_date), "dd MMM yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">
                      ₦{invoice.total_amount?.toLocaleString() || "—"}
                    </p>
                    <StatusBadge status={invoice.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-lab-muted">No invoices yet</p>
          )}
        </div>

        {/* Sample Requests */}
        <div>
          <h3 className="font-semibold text-sm mb-3">Sample Requests</h3>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : history?.sample_requests?.length > 0 ? (
            <div className="space-y-2">
              {history.sample_requests.map((req: any) => (
                <div
                  key={req.id}
                  onClick={() => navigate(`/requests/${req.id}`)}
                  className="p-3 border border-lab-border rounded-lg flex justify-between items-center cursor-pointer hover:bg-lab-bg transition-colors"
                >
                  <div>
                    <p className="font-mono text-sm font-medium">
                      {req.request_number}
                    </p>
                    <p className="text-xs text-lab-muted">
                      {req.sample_description} •{" "}
                      {format(new Date(req.created_at), "dd MMM yyyy")}
                    </p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-lab-muted">No sample requests yet</p>
          )}
        </div>

        {/* Samples */}
        <div>
          <h3 className="font-semibold text-sm mb-3">Samples</h3>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : history?.samples?.length > 0 ? (
            <div className="space-y-2">
              {history.samples.map((sample: any) => (
                <div
                  key={sample.id}
                  onClick={() => navigate(`/samples/${sample.id}`)}
                  className="p-3 border border-lab-border rounded-lg flex justify-between items-center cursor-pointer hover:bg-lab-bg transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{sample.sample_id}</p>
                    <p className="text-xs text-lab-muted">
                      {sample.sample_name} •{" "}
                      {format(new Date(sample.received_date), "dd MMM yyyy")}
                    </p>
                  </div>
                  <StatusBadge status={sample.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-lab-muted">No samples yet</p>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Team Page ──────────────────────────────────────────────────────────────────
export function TeamPage() {
  const [showNew, setShowNew] = useState(false);
  const qc = useQueryClient();
  const { user: currentUser } = useAuth();

  const { data } = useQuery({
    queryKey: ["team"],
    queryFn: () => api.get("/users").then((r) => r.data.data),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api.patch(`/users/${id}`, { is_active }),
    onSuccess: (_, vars) => {
      toast.success(vars.is_active ? "User activated" : "User deactivated");
      qc.invalidateQueries({ queryKey: ["team"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed"),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) => api.post(`/users/${id}/reset-password`, {}),
    onSuccess: () => toast.success("Password reset email sent"),
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed"),
  });

  return (
    <AppShell>
      <TopHeader
        title="Team Management"
        actions={
          <Button
            leftIcon={<Plus size={14} />}
            onClick={() => setShowNew(true)}
          >
            Add Team Member
          </Button>
        }
      />
      <PageContainer>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(data || []).map((u: any) => (
            <Card key={u.id} className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary-700">
                    {u.full_name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-sm">{u.full_name}</p>
                  <p className="text-xs text-lab-muted capitalize">
                    {u.role.replace(/_/g, " ")}
                  </p>
                </div>
                <span
                  className={clsx(
                    "ml-auto badge",
                    u.is_active ? "badge-approved" : "badge-voided",
                  )}
                >
                  {u.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-xs text-lab-muted">{u.email}</p>
              {u.department && (
                <p className="text-xs text-lab-muted">{u.department}</p>
              )}
              {u.last_login_at && (
                <p className="text-xs text-lab-muted mt-2">
                  Last login: {format(new Date(u.last_login_at), "dd MMM yyyy")}
                </p>
              )}
              {/* Action buttons — hidden for the current logged-in user */}
              {u.id !== currentUser?.id && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-lab-border">
                  <button
                    onClick={() =>
                      resetPasswordMutation.mutate(u.id)
                    }
                    disabled={resetPasswordMutation.isPending}
                    className="flex items-center gap-1.5 text-xs text-lab-muted hover:text-primary-600 px-2 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                    title="Send password reset email"
                  >
                    <KeyRound size={13} />
                    Reset Password
                  </button>
                  <button
                    onClick={() =>
                      toggleActiveMutation.mutate({
                        id: u.id,
                        is_active: !u.is_active,
                      })
                    }
                    disabled={toggleActiveMutation.isPending}
                    className={clsx(
                      "flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg transition-colors ml-auto",
                      u.is_active
                        ? "text-red-500 hover:text-red-700 hover:bg-red-50"
                        : "text-green-600 hover:text-green-700 hover:bg-green-50",
                    )}
                    title={u.is_active ? "Deactivate user" : "Activate user"}
                  >
                    {u.is_active ? (
                      <UserX size={13} />
                    ) : (
                      <UserCheck size={13} />
                    )}
                    {u.is_active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
        {showNew && <NewUserModal onClose={() => setShowNew(false)} />}
      </PageContainer>
    </AppShell>
  );
}

function NewUserModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    role: "lab_analyst",
    department: "",
  });
  const mutation = useMutation({
    mutationFn: () => api.post("/users", form),
    onSuccess: () => {
      toast.success("User invited! An email has been sent.");
      qc.invalidateQueries({ queryKey: ["team"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed"),
  });
  const set = (k: string) => (e: any) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <Modal open onClose={onClose} title="Add Team Member" size="md">
      <div className="space-y-3">
        <Input
          label="Full Name *"
          value={form.full_name}
          onChange={set("full_name")}
        />
        <Input
          label="Email *"
          type="email"
          value={form.email}
          onChange={set("email")}
        />
        <Select
          label="Role *"
          value={form.role}
          onChange={set("role")}
          options={[
            { value: "lab_analyst", label: "Lab Analyst" },
            { value: "quality_manager", label: "Quality Manager" },
            { value: "inventory_manager", label: "Inventory Manager" },
            { value: "procurement_officer", label: "Procurement Officer" },
            { value: "finance", label: "Finance" },
            { value: "business_development", label: "Business Development" },
            { value: "marketer", label: "Marketer" },
            { value: "md", label: "MD / Director" },
          ]}
        />
        <Input
          label="Department"
          value={form.department}
          onChange={set("department")}
        />
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            loading={mutation.isPending}
            disabled={!form.email || !form.full_name}
            onClick={() => mutation.mutate()}
          >
            Send Invite
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Suppliers Page ────────────────────────────────────────────────────────────

export function SuppliersPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [viewingSupplier, setViewingSupplier] = useState<any>(null);
  const [search, setSearch] = useState("");
  const qc = useQueryClient();
  const { user, isRole } = useAuth();

  const canManageSuppliers = isRole(
    "super_admin",
    "md",
    "procurement_officer",
    "inventory_manager",
  );

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () =>
      api
        .get("/suppliers", { params: { limit: 100 } })
        .then((r) => r.data.data),
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/suppliers/${id}`),
    onSuccess: () => {
      toast.success("Supplier deleted");
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.error || "Failed to delete"),
  });

  const filtered = (suppliers || []).filter(
    (s: any) =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.company?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AppShell>
      <TopHeader
        title="Suppliers"
        subtitle="Manage laboratory suppliers and vendors"
        actions={
          canManageSuppliers && (
            <Button
              leftIcon={<Plus size={14} />}
              onClick={() => {
                setEditingSupplier(null);
                setShowModal(true);
              }}
            >
              Add Supplier
            </Button>
          )
        }
      />
      <PageContainer>
        <div className="mb-4">
          <Input
            placeholder="Search suppliers..."
            leftIcon={<Search size={14} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-md"
          />
        </div>

        <div className="card overflow-hidden">
          <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Payment Terms</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j}>
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))}
              {!isLoading &&
                filtered.map((supplier: any) => (
                  <tr key={supplier.id}>
                    <td>
                      <p className="font-medium text-sm">{supplier.name}</p>
                      {supplier.company && (
                        <p className="text-xs text-lab-muted">
                          {supplier.company}
                        </p>
                      )}
                    </td>
                    <td className="text-sm">
                      {supplier.contact_person || "—"}
                    </td>
                    <td className="text-sm">{supplier.email || "—"}</td>
                    <td className="text-sm">{supplier.phone || "—"}</td>
                    <td className="text-sm">{supplier.payment_terms || "—"}</td>
                    <td>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingSupplier(supplier)}
                        >
                          View
                        </Button>
                        {canManageSuppliers && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingSupplier(supplier);
                                setShowModal(true);
                              }}
                            >
                              Edit
                            </Button>
                            {isRole("super_admin") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Delete supplier ${supplier.name}? This cannot be undone.`,
                                    )
                                  ) {
                                    deleteSupplierMutation.mutate(supplier.id);
                                  }
                                }}
                              >
                                <Trash2 size={14} className="text-red-600" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      title="No suppliers found"
                      action={
                        canManageSuppliers && (
                          <Button
                            leftIcon={<Plus size={14} />}
                            onClick={() => setShowModal(true)}
                          >
                            Add Supplier
                          </Button>
                        )
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        {showModal && (
          <SupplierModal
            supplier={editingSupplier}
            onClose={() => {
              setShowModal(false);
              setEditingSupplier(null);
            }}
          />
        )}
        {viewingSupplier && (
          <SupplierHistoryModal
            supplier={viewingSupplier}
            onClose={() => setViewingSupplier(null)}
          />
        )}
      </PageContainer>
    </AppShell>
  );
}

// ── Supplier Modal ────────────────────────────────────────────────────────────

const supplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required"),
  company: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  contact_person: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  tax_id: z.string().optional(),
  payment_terms: z.string().optional(),
  notes: z.string().optional(),
});

function SupplierModal({
  supplier,
  onClose,
}: {
  supplier?: any;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(supplierSchema),
    defaultValues: supplier || {},
  });

  const mutation = useMutation({
    mutationFn: (data: any) =>
      supplier
        ? api.put(`/suppliers/${supplier.id}`, data)
        : api.post("/suppliers", data),
    onSuccess: () => {
      toast.success(supplier ? "Supplier updated" : "Supplier added");
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      onClose();
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.error || "Failed to save supplier"),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={supplier ? "Edit Supplier" : "Add New Supplier"}
      size="lg"
    >
      <form
        onSubmit={handleSubmit((d) => mutation.mutate(d))}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Supplier Name *"
            {...register("name")}
            error={errors.name?.message as string}
            placeholder="e.g. Fisher Scientific"
          />
          <Input
            label="Company"
            {...register("company")}
            placeholder="e.g. Thermo Fisher Scientific Inc."
          />
          <Input
            label="Email"
            type="email"
            {...register("email")}
            placeholder="orders@supplier.com"
          />
          <Input label="Phone" {...register("phone")} placeholder="+234..." />
          <Input
            label="Contact Person"
            {...register("contact_person")}
            placeholder="John Doe"
          />
          <Input
            label="Tax ID"
            {...register("tax_id")}
            placeholder="Tax identification number"
          />
          <Input
            label="Website"
            {...register("website")}
            placeholder="https://..."
          />
          <Input
            label="Payment Terms"
            {...register("payment_terms")}
            placeholder="e.g. Net 30, Net 60, COD"
          />
        </div>
        <Input
          label="Address"
          {...register("address")}
          placeholder="Full address"
        />
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
            {supplier ? "Update" : "Add"} Supplier
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Supplier History Modal ────────────────────────────────────────────────────

function SupplierHistoryModal({
  supplier,
  onClose,
}: {
  supplier: any;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [viewingRequisition, setViewingRequisition] = useState<any>(null);
  const [viewingPO, setViewingPO] = useState<any>(null);

  const { data: history, isLoading } = useQuery({
    queryKey: ["supplier-history", supplier.id],
    queryFn: () =>
      api.get(`/suppliers/${supplier.id}/history`).then((r) => r.data.data),
  });

  const handleViewRequisition = async (reqId: string) => {
    try {
      const response = await api.get(`/procurement/requisitions/${reqId}`);
      setViewingRequisition(response.data.data);
    } catch (error) {
      toast.error("Failed to load requisition details");
    }
  };

  const handleViewPO = async (poId: string) => {
    try {
      const response = await api.get(`/procurement/purchase-orders/${poId}`);
      setViewingPO(response.data.data);
    } catch (error) {
      toast.error("Failed to load purchase order details");
    }
  };

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={`${supplier.name} - History`}
        size="xl"
      >
        <div className="space-y-4">
          {/* Supplier Info */}
          <div className="p-4 bg-lab-bg rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-lab-muted">Company</p>
                <p className="font-medium">{supplier.company || "—"}</p>
              </div>
              <div>
                <p className="text-lab-muted">Contact</p>
                <p className="font-medium">{supplier.contact_person || "—"}</p>
              </div>
              <div>
                <p className="text-lab-muted">Email</p>
                <p className="font-medium">{supplier.email || "—"}</p>
              </div>
              <div>
                <p className="text-lab-muted">Phone</p>
                <p className="font-medium">{supplier.phone || "—"}</p>
              </div>
            </div>
          </div>

          {/* Purchase Orders */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Purchase Orders</h3>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : history?.purchase_orders?.length > 0 ? (
              <div className="space-y-2">
                {history.purchase_orders.map((po: any) => (
                  <div
                    key={po.id}
                    onClick={() => handleViewPO(po.id)}
                    className="p-3 border border-lab-border rounded-lg flex justify-between items-center cursor-pointer hover:bg-lab-bg transition-colors"
                  >
                    <div>
                      <p className="font-mono text-sm font-medium">
                        {po.po_number}
                      </p>
                      <p className="text-xs text-lab-muted">
                        {format(new Date(po.created_at), "dd MMM yyyy")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        ₦{po.total_amount?.toLocaleString() || "—"}
                      </p>
                      <StatusBadge status={po.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-lab-muted">No purchase orders yet</p>
            )}
          </div>

          {/* Requisitions */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Requisitions</h3>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : history?.requisitions?.length > 0 ? (
              <div className="space-y-2">
                {history.requisitions.map((req: any) => (
                  <div
                    key={req.id}
                    onClick={() => handleViewRequisition(req.id)}
                    className="p-3 border border-lab-border rounded-lg flex justify-between items-center cursor-pointer hover:bg-lab-bg transition-colors"
                  >
                    <div>
                      <p className="font-mono text-sm font-medium">
                        {req.requisition_number}
                      </p>
                      <p className="text-xs text-lab-muted">
                        {req.department} •{" "}
                        {format(new Date(req.created_at), "dd MMM yyyy")}
                      </p>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-lab-muted">No requisitions yet</p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </Modal>

      {/* Show requisition detail modal */}
      {viewingRequisition && (
        <ViewRequisitionModal
          requisition={viewingRequisition}
          onClose={() => setViewingRequisition(null)}
        />
      )}

      {/* Show PO detail modal */}
      {viewingPO && (
        <EditPOModal po={viewingPO} onClose={() => setViewingPO(null)} />
      )}
    </>
  );
}
