import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Plus,
  Package,
  AlertTriangle,
  Calendar,
  Search,
  TrendingDown,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { api } from "../../lib/api";
import { AppShell, PageContainer, TopHeader } from "../../components/layout";
import {
  Button,
  Input,
  Select,
  Modal,
  EmptyState,
  Card,
  Alert,
  Skeleton,
  StatusBadge,
} from "../../components/ui";
import toast from "react-hot-toast";
import { format, differenceInDays } from "date-fns";
import { clsx } from "clsx";

export function InventoryPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low_stock" | "expiring">("all");
  const [showNewModal, setShowNewModal] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [adjustTarget, setAdjustTarget] = useState<any>(null);

  const queryParams = {
    low_stock: filter === "low_stock" ? "true" : undefined,
    expiring_soon: filter === "expiring" ? "true" : undefined,
  };

  const { data: reagents, isLoading } = useQuery({
    queryKey: ["reagents", filter],
    queryFn: () =>
      api
        .get("/inventory/reagents", { params: queryParams })
        .then((r) => r.data.data),
    refetchInterval: 30_000,
  });

  const { data: alerts } = useQuery({
    queryKey: ["reagent-alerts"],
    queryFn: () =>
      api.get("/inventory/reagents/alerts").then((r) => r.data.data),
  });

  const filtered = (reagents || []).filter(
    (r: any) =>
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.chemical_name?.toLowerCase().includes(search.toLowerCase()),
  );

  const printStockReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Stock & Consumables Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { font-size: 24px; margin-bottom: 10px; }
            .header { margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .low-stock { background-color: #fee; }
            .expiring { background-color: #ffc; }
            @media print {
              body { padding: 20px; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Stock & Consumables Report</h1>
            <p>CountryLab LMS - Generated on ${format(new Date(), "dd MMM yyyy HH:mm")}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Reorder Level</th>
                <th>Unit Price</th>
                <th>Expiry Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${(reagents || [])
                .map((item: any) => {
                  const isLowStock = item.quantity <= item.reorder_level;
                  const daysToExpiry = item.expiry_date
                    ? differenceInDays(new Date(item.expiry_date), new Date())
                    : null;
                  const isExpiring =
                    daysToExpiry !== null && daysToExpiry <= 30;
                  const rowClass = isLowStock
                    ? "low-stock"
                    : isExpiring
                      ? "expiring"
                      : "";

                  return `
                    <tr class="${rowClass}">
                      <td>${item.name}</td>
                      <td>${item.product_type || "—"}</td>
                      <td>${item.quantity}</td>
                      <td>${item.unit}</td>
                      <td>${item.reorder_level}</td>
                      <td>${item.unit_price ? `₦${item.unit_price.toLocaleString()}` : "—"}</td>
                      <td>${item.expiry_date ? format(new Date(item.expiry_date), "dd MMM yyyy") : "—"}</td>
                      <td>${isLowStock ? "Low Stock" : isExpiring ? "Expiring Soon" : "OK"}</td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>

          <button onclick="window.print()" style="margin-top: 30px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Print</button>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <AppShell>
      <TopHeader
        title="Stock & Consumables"
        subtitle="Track reagents, chemicals, test kits, and consumable items"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={printStockReport}>
              Print Report
            </Button>
            <Button
              leftIcon={<Plus size={14} />}
              onClick={() => setShowNewModal(true)}
            >
              Add Item
            </Button>
          </div>
        }
      />
      <PageContainer>
        {/* Alert Summary */}
        {alerts && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              {
                label: "Low Stock",
                count: alerts.lowStock?.length,
                color: "bg-red-50 border-red-200 text-red-700",
                icon: TrendingDown,
              },
              {
                label: "Expiring Soon",
                count: alerts.expiringSoon?.length,
                color: "bg-amber-50 border-amber-200 text-amber-700",
                icon: Calendar,
              },
              {
                label: "Expired",
                count: alerts.expired?.length,
                color: "bg-orange-50 border-orange-200 text-orange-700",
                icon: AlertCircle,
              },
            ].map(({ label, count, color, icon: Icon }) => (
              <div
                key={label}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-xl border",
                  color,
                )}
              >
                <Icon size={16} />
                <span className="text-sm font-semibold">
                  {count || 0} {label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <Input
            placeholder="Search items..."
            leftIcon={<Search size={14} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <div className="flex rounded-lg border border-lab-border overflow-hidden">
            {[
              { key: "all", label: "All" },
              { key: "low_stock", label: "Low Stock" },
              { key: "expiring", label: "Expiring" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={clsx(
                  "px-4 py-2 text-sm font-medium transition-colors",
                  filter === key
                    ? "bg-primary-600 text-white"
                    : "text-lab-text hover:bg-lab-bg",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Stock Table */}
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Type</th>
                <th>Grade / CAS</th>
                <th>Stock</th>
                <th>Expiry</th>
                <th>Storage</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j}>
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))}
              {!isLoading &&
                filtered.map((r: any) => {
                  const daysToExpiry = r.expiry_date
                    ? differenceInDays(new Date(r.expiry_date), new Date())
                    : null;
                  const isLow = r.quantity <= r.reorder_level;
                  const isExpired = daysToExpiry !== null && daysToExpiry < 0;
                  const isExpiringSoon =
                    daysToExpiry !== null &&
                    daysToExpiry >= 0 &&
                    daysToExpiry <= 30;

                  return (
                    <tr key={r.id}>
                      <td>
                        <p className="font-medium text-sm">{r.name}</p>
                        {r.chemical_name && (
                          <p className="text-xs text-lab-muted">
                            {r.chemical_name}
                          </p>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-slate-100 text-slate-700 capitalize">
                          {r.product_type || "reagent"}
                        </span>
                      </td>
                      <td>
                        <p className="text-sm">{r.grade || "—"}</p>
                        {r.cas_number && (
                          <p className="text-xs text-lab-muted font-mono">
                            {r.cas_number}
                          </p>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span
                            className={clsx(
                              "font-semibold text-sm",
                              isLow ? "text-red-600" : "text-lab-text",
                            )}
                          >
                            {r.quantity} {r.unit}
                          </span>
                          {isLow && (
                            <AlertTriangle size={12} className="text-red-500" />
                          )}
                        </div>
                        <p className="text-xs text-lab-muted">
                          Min: {r.reorder_level} {r.unit}
                        </p>
                      </td>
                      <td>
                        {r.expiry_date ? (
                          <div>
                            <p
                              className={clsx(
                                "text-sm font-medium",
                                isExpired
                                  ? "text-red-600"
                                  : isExpiringSoon
                                    ? "text-amber-600"
                                    : "text-lab-text",
                              )}
                            >
                              {format(new Date(r.expiry_date), "dd MMM yyyy")}
                            </p>
                            {isExpired && (
                              <p className="text-xs text-red-500">EXPIRED</p>
                            )}
                            {isExpiringSoon && !isExpired && (
                              <p className="text-xs text-amber-600">
                                {daysToExpiry}d left
                              </p>
                            )}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="text-sm">
                        {r.storage_location || r.storage_conditions || "—"}
                      </td>
                      <td>
                        {isExpired ? (
                          <span className="badge bg-red-50 text-red-600">
                            Expired
                          </span>
                        ) : isLow ? (
                          <span className="badge bg-red-50 text-red-600">
                            Low Stock
                          </span>
                        ) : isExpiringSoon ? (
                          <span className="badge bg-amber-50 text-amber-700">
                            Expiring
                          </span>
                        ) : (
                          <span className="badge bg-emerald-50 text-emerald-700">
                            Good
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditTarget(r)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAdjustTarget(r)}
                          >
                            Adjust
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={<Package size={28} className="text-lab-muted" />}
                      title="No items found"
                      action={
                        <Button
                          leftIcon={<Plus size={14} />}
                          onClick={() => setShowNewModal(true)}
                        >
                          Add Item
                        </Button>
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showNewModal && (
          <NewItemModal onClose={() => setShowNewModal(false)} />
        )}
        {editTarget && (
          <NewItemModal
            reagent={editTarget}
            onClose={() => setEditTarget(null)}
          />
        )}
        {adjustTarget && (
          <AdjustStockModal
            reagent={adjustTarget}
            onClose={() => setAdjustTarget(null)}
          />
        )}
      </PageContainer>
    </AppShell>
  );
}

// ── New Item Modal ───────────────────────────────────────────────────────────
const reagentSchema = z.object({
  product_type: z
    .enum(["reagent", "consumable", "standard", "supply", "kit"])
    .default("reagent"),
  name: z.string().min(1),
  chemical_name: z.string().optional(),
  cas_number: z.string().optional(),
  catalog_number: z.string().optional(),
  lot_number: z.string().optional(),
  manufacturer: z.string().optional(),
  supplier_id: z.string().uuid().optional(),
  grade: z.enum(["AR", "HPLC", "GR", "LR", "Technical"]).optional(),
  category: z
    .enum([
      "Acid",
      "Base",
      "Solvent",
      "Indicator",
      "Buffer",
      "Salt",
      "Oxidizer",
      "Standard",
      "Other",
    ])
    .optional(),
  quantity: z.coerce.number().min(0),
  unit: z.string().default("units"),
  reorder_level: z.coerce.number().default(10),
  expiry_date: z.string().optional(),
  storage_conditions: z.string().optional(),
  storage_location: z.string().optional(),
});

function NewItemModal({
  reagent,
  onClose,
}: {
  reagent?: any;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const isEditing = !!reagent;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(reagentSchema),
    defaultValues: reagent
      ? {
          product_type: reagent.product_type || "reagent",
          name: reagent.name || "",
          chemical_name: reagent.chemical_name || "",
          cas_number: reagent.cas_number || "",
          catalog_number: reagent.catalog_number || "",
          lot_number: reagent.lot_number || "",
          manufacturer: reagent.manufacturer || "",
          supplier_id: reagent.supplier_id || "",
          grade: reagent.grade || "",
          category: reagent.category || "",
          quantity: reagent.quantity || 0,
          unit: reagent.unit || "units",
          reorder_level: reagent.reorder_level || 10,
          expiry_date: reagent.expiry_date
            ? new Date(reagent.expiry_date).toISOString().split("T")[0]
            : "",
          storage_conditions: reagent.storage_conditions || "",
          storage_location: reagent.storage_location || "",
        }
      : { product_type: "reagent" },
  });

  const productType = watch("product_type");

  // Determine which fields to show based on product type
  const showChemicalFields =
    productType === "reagent" || productType === "standard";
  const showExpiryDate = productType !== "supply"; // Supplies don't expire
  const showGrade = productType === "reagent" || productType === "standard";

  // Fetch suppliers for dropdown
  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () =>
      api
        .get("/suppliers", { params: { limit: 100 } })
        .then((r) => r.data.data),
  });

  const mutation = useMutation({
    mutationFn: (data: any) =>
      isEditing
        ? api.patch(`/inventory/reagents/${reagent.id}`, data)
        : api.post("/inventory/reagents", data),
    onSuccess: () => {
      toast.success(isEditing ? "Item updated" : "Item added");
      qc.invalidateQueries({ queryKey: ["reagents"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed"),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={isEditing ? "Edit Item" : "Add New Item"}
      size="lg"
    >
      <form
        onSubmit={handleSubmit((d) => mutation.mutate(d))}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Product Type *"
            {...register("product_type")}
            options={[
              { value: "reagent", label: "Reagent/Chemical" },
              { value: "consumable", label: "Consumable" },
              { value: "standard", label: "Standard/Reference Material" },
              { value: "supply", label: "Supply/Sundry" },
              { value: "kit", label: "Test Kit" },
            ]}
          />
          <Input
            label={showChemicalFields ? "Reagent Name *" : "Product Name *"}
            {...register("name")}
            error={errors.name?.message as string}
            placeholder={
              showChemicalFields ? "e.g. Sulfuric Acid" : "e.g. Pipette Tips"
            }
          />
          {showChemicalFields && (
            <>
              <Input
                label="Chemical Name"
                {...register("chemical_name")}
                placeholder="e.g. H₂SO₄"
              />
              <Input
                label="CAS Number"
                {...register("cas_number")}
                placeholder="e.g. 7664-93-9"
              />
            </>
          )}
          <Input
            label="Catalog Number"
            {...register("catalog_number")}
            placeholder="e.g. SA-98-1L"
          />
          <Input
            label="Lot/Batch Number"
            {...register("lot_number")}
            placeholder="e.g. SLCD1234"
          />
          <Input
            label="Manufacturer"
            {...register("manufacturer")}
            placeholder="e.g. Sigma-Aldrich"
          />
          <Select
            label="Supplier"
            {...register("supplier_id")}
            options={[
              { value: "", label: "Select supplier..." },
              ...(suppliers || []).map((s: any) => ({
                value: s.id,
                label: s.company ? `${s.name} (${s.company})` : s.name,
              })),
            ]}
          />
          {showGrade && (
            <Select
              label="Grade"
              {...register("grade")}
              options={[
                { value: "", label: "Select grade..." },
                { value: "AR", label: "AR — Analytical Reagent" },
                { value: "HPLC", label: "HPLC Grade" },
                { value: "GR", label: "GR — General Reagent" },
                { value: "LR", label: "LR — Laboratory Reagent" },
                { value: "Technical", label: "Technical Grade" },
              ]}
            />
          )}
          <Select
            label="Category"
            {...register("category")}
            options={[
              { value: "", label: "Select category..." },
              { value: "Acid", label: "Acid" },
              { value: "Base", label: "Base" },
              { value: "Solvent", label: "Solvent" },
              { value: "Indicator", label: "Indicator" },
              { value: "Buffer", label: "Buffer" },
              { value: "Salt", label: "Salt" },
              { value: "Oxidizer", label: "Oxidizer" },
              { value: "Standard", label: "Standard Solution" },
              { value: "Other", label: "Other" },
            ]}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Quantity *"
              type="number"
              step="0.01"
              {...register("quantity")}
            />
            <Select
              label="Unit *"
              {...register("unit")}
              options={[
                { value: "", label: "Select unit..." },
                { value: "mL", label: "mL (milliliters)" },
                { value: "L", label: "L (liters)" },
                { value: "µL", label: "µL (microliters)" },
                { value: "g", label: "g (grams)" },
                { value: "kg", label: "kg (kilograms)" },
                { value: "mg", label: "mg (milligrams)" },
                { value: "µg", label: "µg (micrograms)" },
                { value: "units", label: "units" },
                { value: "vials", label: "vials" },
                { value: "bottles", label: "bottles" },
                { value: "packs", label: "packs" },
              ]}
            />
          </div>
          <Input
            label="Reorder Level"
            type="number"
            step="0.01"
            {...register("reorder_level")}
          />
          {showExpiryDate && (
            <Input
              label="Expiry Date"
              type="date"
              {...register("expiry_date")}
            />
          )}
          <Input
            label="Storage Location"
            {...register("storage_location")}
            placeholder="e.g. Acid Cabinet A1"
          />
          <Input
            label="Storage Conditions"
            {...register("storage_conditions")}
            placeholder="e.g. 2–8°C, Dark"
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
            {isEditing ? "Update Item" : "Add Item"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function AdjustStockModal({
  reagent,
  onClose,
}: {
  reagent: any;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [type, setType] = useState<"add" | "subtract" | "set">("add");
  const [amount, setAmount] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      api.patch(`/inventory/reagents/${reagent.id}/stock`, {
        adjustment: parseFloat(amount),
        type,
      }),
    onSuccess: () => {
      toast.success("Stock updated");
      qc.invalidateQueries({ queryKey: ["reagents"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed"),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={`Adjust Stock — ${reagent.name}`}
      size="sm"
    >
      <div className="space-y-4">
        <div className="p-3 bg-slate-50 rounded-lg text-sm">
          Current stock:{" "}
          <strong>
            {reagent.quantity} {reagent.unit}
          </strong>
        </div>
        <div className="flex rounded-lg border border-lab-border overflow-hidden">
          {[
            { key: "add", label: "+ Add" },
            { key: "subtract", label: "− Remove" },
            { key: "set", label: "= Set" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setType(key as any)}
              className={clsx(
                "flex-1 py-2 text-sm font-medium transition-colors",
                type === key
                  ? "bg-primary-600 text-white"
                  : "text-lab-text hover:bg-lab-bg",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <Input
          label={`${type === "add" ? "Amount to Add" : type === "subtract" ? "Amount to Remove" : "New Quantity"} (${reagent.unit})`}
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
        />
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            loading={mutation.isPending}
            disabled={!amount}
            onClick={() => mutation.mutate()}
          >
            Update Stock
          </Button>
        </div>
      </div>
    </Modal>
  );
}
