import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Upload,
  Edit,
  Trash2,
  PowerOff,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { Button, Badge, Card, Skeleton, EmptyState } from "../../components/ui";
import { TemplateFormModal } from "./TemplateFormModal";
import { TemplateImportModal } from "./TemplateImportModal";
import toast from "react-hot-toast";

interface TemplateSummary {
  id: string;
  name: string;
  nis_standard: string;
  nis_standard_ref: string;
  effective_date: string | null;
  version: number;
  is_active: boolean;
  parent_template_id: string | null;
}

interface TemplateDetail extends TemplateSummary {
  parameters: {
    id: string;
    parameter_name: string;
    nis_limit: string;
    unit: string;
    parameter_group: string;
    sequence_order: number;
    data_type: "numerical" | "qualitative" | "pass_fail";
    spec_min: number | null;
    spec_max: number | null;
  }[];
}

export function TemplateLibraryTab() {
  const { isRole } = useAuth();
  const qc = useQueryClient();
  const canManage = isRole("quality_manager", "md", "super_admin");

  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editTemplate, setEditTemplate] = useState<{
    id: string;
    name: string;
    nis_standard: string;
    nis_standard_ref: string;
    effective_date: string;
    parameters: TemplateDetail["parameters"];
  } | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: templates = [], isLoading } = useQuery<TemplateSummary[]>({
    queryKey: ["result-templates-all"],
    queryFn: () => api.get("/result-templates/all").then((r) => r.data.data),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) =>
      api.patch(`/result-templates/${id}`, { action: "deactivate" }),
    onSuccess: () => {
      toast.success("Template deactivated");
      qc.invalidateQueries({ queryKey: ["result-templates-all"] });
      qc.invalidateQueries({ queryKey: ["result-templates"] });
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.error || "Failed to deactivate"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/result-templates/${id}`),
    onSuccess: () => {
      toast.success("Template deleted");
      setDeleteConfirm(null);
      qc.invalidateQueries({ queryKey: ["result-templates-all"] });
      qc.invalidateQueries({ queryKey: ["result-templates"] });
    },
    onError: (e: any) => {
      const msg = e.response?.data?.error || "Failed to delete";
      toast.error(msg);
      setDeleteConfirm(null);
    },
  });

  async function handleEdit(template: TemplateSummary) {
    try {
      const res = await api.get(`/result-templates/${template.id}`);
      const detail = res.data.data;
      setEditTemplate({
        ...detail,
        effective_date: detail.effective_date ?? "",
      });
    } catch {
      toast.error("Failed to load template details");
    }
  }

  function toggleGroup(name: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  // Group templates by name
  const grouped = templates.reduce<Record<string, TemplateSummary[]>>(
    (acc, t) => {
      if (!acc[t.name]) acc[t.name] = [];
      acc[t.name].push(t);
      return acc;
    },
    {},
  );

  // Sort group names alphabetically
  const groupNames = Object.keys(grouped).sort();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-5 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-lab-muted">
          {templates.length} template{templates.length !== 1 ? "s" : ""} total
        </p>
        {canManage && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Upload size={13} />}
              onClick={() => setShowImport(true)}
            >
              Import
            </Button>
            <Button
              size="sm"
              leftIcon={<Plus size={13} />}
              onClick={() => setShowCreate(true)}
            >
              Create Template
            </Button>
          </div>
        )}
      </div>

      {/* Template list grouped by name */}
      {groupNames.length === 0 ? (
        <EmptyState
          title="No templates yet"
          description="Create or import a template to get started"
          action={
            canManage ? (
              <Button
                leftIcon={<Plus size={14} />}
                onClick={() => setShowCreate(true)}
              >
                Create Template
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {groupNames.map((name) => {
            const versions = grouped[name].sort(
              (a, b) => b.version - a.version,
            );
            const latest = versions[0];
            const isExpanded = expandedGroups.has(name);
            const hasMultiple = versions.length > 1;

            return (
              <Card key={name} className="overflow-hidden">
                {/* Group header — latest version */}
                <div className="flex items-center gap-3 px-4 py-3">
                  {hasMultiple && (
                    <button
                      type="button"
                      onClick={() => toggleGroup(name)}
                      className="text-lab-muted hover:text-lab-text flex-shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronDown size={15} />
                      ) : (
                        <ChevronRight size={15} />
                      )}
                    </button>
                  )}
                  {!hasMultiple && <div className="w-4 flex-shrink-0" />}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-lab-text text-sm">
                        {latest.name}
                      </span>
                      <span className="text-xs text-lab-muted">
                        {latest.nis_standard_ref}
                      </span>
                      <Badge variant={latest.is_active ? "success" : "default"}>
                        {latest.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <span className="text-xs text-lab-muted">
                        v{latest.version}
                      </span>
                      {hasMultiple && (
                        <span className="text-xs text-lab-muted">
                          ({versions.length} versions)
                        </span>
                      )}
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<Edit size={13} />}
                        onClick={() => handleEdit(latest)}
                        title="Create new version"
                      >
                        Edit
                      </Button>
                      {latest.is_active && (
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<PowerOff size={13} />}
                          onClick={() => deactivateMutation.mutate(latest.id)}
                          loading={deactivateMutation.isPending}
                          title="Deactivate"
                        >
                          Deactivate
                        </Button>
                      )}
                      {deleteConfirm === latest.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-red-600">Confirm?</span>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => deleteMutation.mutate(latest.id)}
                            loading={deleteMutation.isPending}
                          >
                            Yes
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteConfirm(null)}
                          >
                            No
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<Trash2 size={13} />}
                          onClick={() => setDeleteConfirm(latest.id)}
                          title="Delete"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Version history (expanded) */}
                {isExpanded && hasMultiple && (
                  <div className="border-t border-lab-border bg-gray-50">
                    {versions.slice(1).map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center gap-3 px-4 py-2 border-b border-lab-border last:border-0"
                      >
                        <div className="w-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-lab-muted">
                              v{v.version}
                            </span>
                            <span className="text-xs text-lab-muted">
                              {v.nis_standard_ref}
                            </span>
                            <Badge
                              variant={v.is_active ? "success" : "default"}
                            >
                              {v.is_active ? "Active" : "Inactive"}
                            </Badge>
                            {v.effective_date && (
                              <span className="text-xs text-lab-muted">
                                {new Date(
                                  v.effective_date,
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        {canManage && v.is_active && (
                          <Button
                            size="sm"
                            variant="ghost"
                            leftIcon={<PowerOff size={13} />}
                            onClick={() => deactivateMutation.mutate(v.id)}
                            loading={deactivateMutation.isPending}
                          >
                            Deactivate
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showCreate && <TemplateFormModal onClose={() => setShowCreate(false)} />}
      {showImport && (
        <TemplateImportModal onClose={() => setShowImport(false)} />
      )}
      {editTemplate && (
        <TemplateFormModal
          template={editTemplate}
          onClose={() => setEditTemplate(null)}
        />
      )}
    </div>
  );
}
