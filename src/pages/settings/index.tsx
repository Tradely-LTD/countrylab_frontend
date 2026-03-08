import { useState, useEffect } from "react";
import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "react-router-dom";
import {
  Settings as SettingsIcon,
  Building2,
  Users,
  Package,
  Tag,
  Plus,
  Edit,
  Trash2,
  Save,
  Upload,
} from "lucide-react";
import { api } from "../../lib/api";
import { AppShell, PageContainer, TopHeader } from "../../components/layout";
import {
  Button,
  Input,
  Textarea,
  Modal,
  Card,
  Skeleton,
  EmptyState,
} from "../../components/ui";
import toast from "react-hot-toast";
import { clsx } from "clsx";

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");

  // Validate and set initial tab
  const getValidTab = (tab: string | null): "organization" | "categories" => {
    if (tab === "categories") return tab;
    if (tab === "organizations") return "organization"; // Handle legacy/alternate name
    return "organization";
  };

  const [activeTab, setActiveTab] = useState<"organization" | "categories">(
    getValidTab(tabParam),
  );

  // Sync tab with URL
  useEffect(() => {
    const validTab = getValidTab(tabParam);
    if (validTab !== activeTab) {
      setActiveTab(validTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  const handleTabChange = (tab: "organization" | "categories") => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const tabs = [
    { key: "organization", label: "Organization", icon: Building2 },
    { key: "categories", label: "Categories", icon: Tag },
  ];

  return (
    <AppShell>
      <TopHeader
        title="Settings"
        subtitle="Manage organization settings and categories"
      />
      <PageContainer>
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-lab-border">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key as any)}
              className={clsx(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2",
                activeTab === key
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-lab-muted hover:text-lab-text",
              )}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "organization" && <OrganizationSettings />}
        {activeTab === "categories" && <CategoriesSettings />}
      </PageContainer>
    </AppShell>
  );
}

// ── Organization Settings ─────────────────────────────────────────────────────

function OrganizationSettings() {
  const qc = useQueryClient();
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [logoError, setLogoError] = React.useState(false);

  const { data: tenant, isLoading } = useQuery({
    queryKey: ["tenant-settings"],
    queryFn: () => api.get("/settings/organization").then((r) => r.data.data),
  });

  const orgSchema = z.object({
    name: z.string().min(1, "Organization name is required"),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    accreditation_number: z.string().optional(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(orgSchema),
    values: tenant || {},
  });

  const mutation = useMutation({
    mutationFn: (data: any) => api.put("/settings/organization", data),
    onSuccess: () => {
      toast.success("Organization settings updated");
      qc.invalidateQueries({ queryKey: ["tenant-settings"] });
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.error || "Failed to update settings"),
  });

  const logoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("logo", file);
      return api.post("/settings/organization/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      toast.success("Logo uploaded successfully");
      qc.invalidateQueries({ queryKey: ["tenant-settings"] });
      setLogoFile(null);
      setLogoPreview(null);
      setLogoError(false);
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.error || "Failed to upload logo"),
  });

  const deleteLogo = useMutation({
    mutationFn: () => api.delete("/settings/organization/logo"),
    onSuccess: () => {
      toast.success("Logo deleted");
      qc.invalidateQueries({ queryKey: ["tenant-settings"] });
      setLogoError(false);
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.error || "Failed to delete logo"),
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = () => {
    if (logoFile) logoMutation.mutate(logoFile);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-10 w-full mb-3" />
        <Skeleton className="h-10 w-full mb-3" />
        <Skeleton className="h-10 w-full" />
      </Card>
    );
  }

  const logoUrl = tenant?.logo_url
    ? tenant.logo_url.startsWith("http")
      ? tenant.logo_url
      : `${import.meta.env.VITE_API_URL || "http://localhost:3001"}${tenant.logo_url}?v=${tenant.updated_at ? new Date(tenant.updated_at).getTime() : Date.now()}`
    : null;

  React.useEffect(() => {
    if (tenant) {
      console.log("Tenant logo_url from DB:", tenant.logo_url);
      console.log("Constructed logoUrl:", logoUrl);
      console.log("Tenant updated_at:", tenant.updated_at);
      setLogoError(false); // Reset error state when tenant changes
    }
  }, [tenant, logoUrl]);

  return (
    <Card className="p-6">
      <h3 className="font-display text-lg mb-4">Organization Information</h3>

      {/* Logo Section */}
      <div className="mb-6 pb-6 border-b">
        <label className="block text-sm font-medium mb-2">
          Organization Logo
        </label>
        <div className="flex items-start gap-4">
          <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-gray-50">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo preview"
                className="max-w-full max-h-full object-contain p-2"
              />
            ) : logoUrl && !logoError ? (
              <img
                src={logoUrl}
                alt="Organization logo"
                className="max-w-full max-h-full object-contain p-2"
                onError={() => {
                  console.error("Failed to load logo:", logoUrl);
                  setLogoError(true);
                }}
                onLoad={() => console.log("Logo loaded successfully:", logoUrl)}
              />
            ) : (
              <div className="text-center text-gray-400 text-xs">
                <Upload size={24} className="mx-auto mb-1" />
                {logoError ? "Failed to load" : "No logo"}
              </div>
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/svg+xml"
              onChange={handleLogoChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, SVG up to 5MB
            </p>
            <div className="flex gap-2 mt-3">
              {logoFile && (
                <Button
                  size="sm"
                  onClick={handleLogoUpload}
                  loading={logoMutation.isPending}
                  leftIcon={<Upload size={14} />}
                >
                  Upload
                </Button>
              )}
              {logoUrl && !logoFile && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteLogo.mutate()}
                  loading={deleteLogo.isPending}
                  leftIcon={<Trash2 size={14} />}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit((d) => mutation.mutate(d))}
        className="space-y-4"
      >
        <Input
          label="Organization Name *"
          {...register("name")}
          error={errors.name?.message as string}
        />
        <Textarea
          label="Address"
          {...register("address")}
          rows={3}
          placeholder="Full business address"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Phone" {...register("phone")} placeholder="+234..." />
          <Input
            label="Email"
            type="email"
            {...register("email")}
            placeholder="info@lab.com"
          />
        </div>
        <Input
          label="Accreditation Number"
          {...register("accreditation_number")}
          placeholder="e.g. ISO 17025:2017"
        />

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            loading={mutation.isPending}
            leftIcon={<Save size={14} />}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ── Suppliers Settings ────────────────────────────────────────────────────────

function SuppliersSettings() {
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () =>
      api
        .get("/suppliers", { params: { limit: 100 } })
        .then((r) => r.data.data),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-lab-muted">
          Manage your laboratory suppliers and vendors
        </p>
        <Button
          leftIcon={<Plus size={14} />}
          onClick={() => {
            setEditingSupplier(null);
            setShowModal(true);
          }}
        >
          Add Supplier
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </Card>
          ))}

        {!isLoading &&
          (suppliers || []).map((supplier: any) => (
            <Card
              key={supplier.id}
              className="p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-lab-text">
                    {supplier.name}
                  </h4>
                  {supplier.company && (
                    <p className="text-sm text-lab-muted">{supplier.company}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditingSupplier(supplier);
                      setShowModal(true);
                    }}
                  >
                    <Edit size={14} />
                  </Button>
                </div>
              </div>
              <div className="space-y-1 text-xs text-lab-muted">
                {supplier.email && <p>📧 {supplier.email}</p>}
                {supplier.phone && <p>📞 {supplier.phone}</p>}
                {supplier.contact_person && <p>👤 {supplier.contact_person}</p>}
              </div>
              {supplier.total_spent > 0 && (
                <div className="mt-3 pt-3 border-t border-lab-border">
                  <p className="text-xs text-lab-muted">
                    Total Spent:{" "}
                    <span className="font-semibold text-lab-text">
                      {supplier.currency}{" "}
                      {supplier.total_spent.toLocaleString()}
                    </span>
                  </p>
                </div>
              )}
            </Card>
          ))}

        {!isLoading && (suppliers || []).length === 0 && (
          <div className="col-span-2">
            <EmptyState
              icon={<Users size={28} className="text-lab-muted" />}
              title="No suppliers yet"
              description="Add your first supplier to start tracking purchases"
              action={
                <Button
                  leftIcon={<Plus size={14} />}
                  onClick={() => setShowModal(true)}
                >
                  Add Supplier
                </Button>
              }
            />
          </div>
        )}
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
    </div>
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
        <div className="grid grid-cols-2 gap-3">
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
        <Textarea
          label="Address"
          {...register("address")}
          rows={2}
          placeholder="Full address"
        />
        <Textarea
          label="Notes"
          {...register("notes")}
          rows={2}
          placeholder="Additional notes..."
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

// ── Categories Settings ───────────────────────────────────────────────────────

function CategoriesSettings() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-display text-base mb-4">Reagent Categories</h3>
        <p className="text-sm text-lab-muted mb-4">
          These categories are used when adding reagents to inventory
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[
            "Acid",
            "Base",
            "Solvent",
            "Indicator",
            "Buffer",
            "Salt",
            "Oxidizer",
            "Standard",
            "Other",
          ].map((cat) => (
            <div
              key={cat}
              className="px-3 py-2 bg-slate-50 rounded-lg text-sm font-medium text-lab-text"
            >
              {cat}
            </div>
          ))}
        </div>
        <p className="text-xs text-lab-muted mt-3">
          Note: Categories are currently fixed. Contact support to add custom
          categories.
        </p>
      </Card>

      <Card className="p-6">
        <h3 className="font-display text-base mb-4">Reagent Grades</h3>
        <p className="text-sm text-lab-muted mb-4">
          Standard reagent grades for quality classification
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { code: "AR", name: "Analytical Reagent" },
            { code: "HPLC", name: "HPLC Grade" },
            { code: "GR", name: "General Reagent" },
            { code: "LR", name: "Laboratory Reagent" },
            { code: "Technical", name: "Technical Grade" },
          ].map((grade) => (
            <div
              key={grade.code}
              className="px-3 py-2 bg-slate-50 rounded-lg text-sm"
            >
              <span className="font-semibold text-lab-text">{grade.code}</span>
              <span className="text-lab-muted"> — {grade.name}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-lab-muted mt-3">
          Note: Grades follow international standards and are fixed.
        </p>
      </Card>

      <Card className="p-6">
        <h3 className="font-display text-base mb-4">Measurement Units</h3>
        <p className="text-sm text-lab-muted mb-4">
          Available units for reagent quantities
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[
            "mL",
            "L",
            "µL",
            "g",
            "kg",
            "mg",
            "µg",
            "units",
            "vials",
            "bottles",
            "packs",
          ].map((unit) => (
            <div
              key={unit}
              className="px-3 py-2 bg-slate-50 rounded-lg text-sm font-mono text-center text-lab-text"
            >
              {unit}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
