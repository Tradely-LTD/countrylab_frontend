import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { motion } from "framer-motion";
import { Plus, FileCheck, ArrowLeft, Send, Save, X } from "lucide-react";
import { api } from "../../lib/api";
import { AppShell, PageContainer, TopHeader } from "../../components/layout";
import {
  Button,
  Input,
  Select,
  EmptyState,
  Card,
  StatusBadge,
  Skeleton,
  Textarea,
} from "../../components/ui";
import toast from "react-hot-toast";
import { format } from "date-fns";

// ── Results List Page ─────────────────────────────────────────────────────────
export function ResultsListPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Check if we should show the new result form
  const sampleId = searchParams.get("sample_id");
  const editId = searchParams.get("edit");
  const showNewForm = searchParams.get("new") !== null || sampleId || editId;

  const { data, isLoading } = useQuery({
    queryKey: ["results", statusFilter],
    queryFn: () =>
      api
        .get("/results", {
          params: { limit: 100, status: statusFilter || undefined },
        })
        .then((r) => r.data),
  });

  if (showNewForm) {
    return <NewResultForm sampleId={sampleId} editId={editId} />;
  }

  return (
    <AppShell>
      <TopHeader
        title="Test Results"
        subtitle="Manage and review laboratory test results"
        actions={
          <Button
            leftIcon={<Plus size={14} />}
            onClick={() => navigate("/results?new=true")}
          >
            Enter Results
          </Button>
        }
      />
      <PageContainer>
        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <Select
            options={[
              { value: "", label: "All Statuses" },
              { value: "draft", label: "Draft" },
              { value: "submitted", label: "Submitted" },
              { value: "under_review", label: "Under Review" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
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
                <th>Sample</th>
                <th>Matrix</th>
                <th>Analyst</th>
                <th>Status</th>
                <th>Created</th>
                <th>Approved</th>
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
                (data?.data || []).map((result: any) => (
                  <motion.tr
                    key={result.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => navigate(`/results/${result.id}`)}
                  >
                    <td>
                      <p className="font-medium text-sm">
                        {result.sample?.name}
                      </p>
                      <p className="text-xs text-lab-muted font-mono">
                        {result.sample?.ulid}
                      </p>
                    </td>
                    <td className="text-sm">{result.sample?.matrix || "—"}</td>
                    <td className="text-sm">
                      {result.analyst?.full_name || "—"}
                    </td>
                    <td>
                      <StatusBadge status={result.overall_status} />
                    </td>
                    <td className="text-xs text-lab-muted">
                      {format(new Date(result.created_at), "dd MMM yyyy")}
                    </td>
                    <td className="text-xs text-lab-muted">
                      {result.approved_at
                        ? format(new Date(result.approved_at), "dd MMM yyyy")
                        : "—"}
                    </td>
                    <td>
                      {result.coa_url && (
                        <a
                          href={result.coa_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 text-xs font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View CoA
                        </a>
                      )}
                    </td>
                  </motion.tr>
                ))}
              {!isLoading && (data?.data || []).length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={<FileCheck size={28} className="text-lab-muted" />}
                      title="No results found"
                      description="Enter test results for your samples"
                      action={
                        <Button
                          leftIcon={<Plus size={14} />}
                          onClick={() => navigate("/results?new=true")}
                        >
                          Enter Results
                        </Button>
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PageContainer>
    </AppShell>
  );
}

// ── New Result Form ───────────────────────────────────────────────────────────
const parameterSchema = z.object({
  param_name: z.string().min(1, "Parameter name required"),
  raw_value: z.string().optional(),
  calculated_value: z.string().optional(),
  unit: z.string().optional(),
  spec_min: z.string().optional(),
  spec_max: z.string().optional(),
  data_type: z.enum(["numerical", "qualitative"]).default("numerical"),
});

const resultSchema = z.object({
  sample_id: z.string().uuid("Select a sample"),
  parameters: z.array(parameterSchema).min(1, "Add at least one parameter"),
  notes: z.string().optional(),
});

function NewResultForm({
  sampleId,
  editId,
}: {
  sampleId: string | null;
  editId: string | null;
}) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [formatType, setFormatType] = useState<
    "standard" | "simple" | "descriptive"
  >("standard");
  const [parameters, setParameters] = useState([
    {
      param_name: "",
      raw_value: "",
      calculated_value: "",
      unit: "",
      spec_min: "",
      spec_max: "",
      data_type: "numerical" as const,
      nis_requirements: "", // For descriptive format
      remarks: "", // For descriptive format
      comment: "", // For simple format
    },
  ]);
  const [selectedSampleId, setSelectedSampleId] = useState(sampleId || "");
  const [notes, setNotes] = useState("");

  // Load existing result if editing
  const { data: existingResult } = useQuery({
    queryKey: ["result-edit", editId],
    queryFn: () => api.get(`/results/${editId}`).then((r) => r.data.data),
    enabled: !!editId,
  });

  // Load data when editing
  useEffect(() => {
    if (existingResult && editId) {
      setSelectedSampleId(existingResult.sample_id);
      setNotes(existingResult.notes || "");
      if (existingResult.parameters && existingResult.parameters.length > 0) {
        setParameters(
          existingResult.parameters.map((p: any) => ({
            param_name: p.param_name || "",
            raw_value: p.raw_value?.toString() || "",
            calculated_value: p.calculated_value?.toString() || "",
            unit: p.unit || "",
            spec_min: p.spec_min?.toString() || "",
            spec_max: p.spec_max?.toString() || "",
            data_type: p.data_type || "numerical",
          })),
        );
      }
    }
  }, [existingResult, editId]);

  const { data: samples } = useQuery({
    queryKey: ["samples-for-results"],
    queryFn: () =>
      api.get("/samples", { params: { limit: 100 } }).then((r) => r.data.data),
  });

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (editId) {
        return api.put(`/results/${editId}`, {
          ...data,
          reason_for_change: "Updated parameters",
        });
      }
      return api.post("/results", data);
    },
    onSuccess: (res) => {
      toast.success(
        editId
          ? "Results updated successfully!"
          : "Results saved successfully!",
      );
      qc.invalidateQueries({ queryKey: ["results"] });
      qc.invalidateQueries({ queryKey: ["samples"] });
      qc.invalidateQueries({ queryKey: ["result", editId] });
      const resultId = editId || res.data.data.id;
      navigate(`/results/${resultId}`);
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.error || "Failed to save results"),
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editId) {
        await api.put(`/results/${editId}`, {
          ...data,
          reason_for_change: "Updated and submitted",
        });
        await api.post(`/results/${editId}/submit`);
        return { data: { data: { id: editId } } };
      }
      const res = await api.post("/results", data);
      await api.post(`/results/${res.data.data.id}/submit`);
      return res;
    },
    onSuccess: () => {
      toast.success("Results submitted for review!");
      qc.invalidateQueries({ queryKey: ["results"] });
      qc.invalidateQueries({ queryKey: ["samples"] });
      qc.invalidateQueries({ queryKey: ["result", editId] });
      navigate("/results");
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.error || "Failed to submit results"),
  });

  const addParameter = () => {
    setParameters([
      ...parameters,
      {
        param_name: "",
        raw_value: "",
        calculated_value: "",
        unit: "",
        spec_min: "",
        spec_max: "",
        data_type: "numerical" as const,
        nis_requirements: "",
        remarks: "",
        comment: "",
      },
    ]);
  };

  const removeParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const updateParameter = (index: number, field: string, value: any) => {
    const updated = [...parameters];
    (updated[index] as any)[field] = value;
    setParameters(updated);
  };

  const handleSave = (submit: boolean = false) => {
    if (!selectedSampleId) {
      toast.error("Please select a sample");
      return;
    }

    const cleanedParams = parameters
      .filter((p) => p.param_name.trim())
      .map((p) => {
        // Helper to safely parse numeric values
        const parseNumeric = (value: string) => {
          if (!value || value.trim() === "") return undefined;
          const parsed = parseFloat(value);
          return isNaN(parsed) ? value : parsed; // Keep as string if not a valid number
        };

        return {
          param_name: p.param_name,
          raw_value: p.raw_value || undefined,
          calculated_value: parseNumeric(p.calculated_value),
          unit: p.unit || undefined,
          spec_min: p.spec_min ? parseFloat(p.spec_min) : undefined,
          spec_max: p.spec_max ? parseFloat(p.spec_max) : undefined,
          data_type: p.data_type,
        };
      });

    if (cleanedParams.length === 0) {
      toast.error("Add at least one parameter");
      return;
    }

    const data = {
      sample_id: selectedSampleId,
      parameters: cleanedParams,
      notes,
    };

    if (submit) {
      submitMutation.mutate(data);
    } else {
      mutation.mutate(data);
    }
  };

  return (
    <AppShell>
      <TopHeader
        title={editId ? "Edit Test Results" : "Enter Test Results"}
        subtitle={
          editId
            ? "Modify laboratory test results"
            : "Record laboratory test results"
        }
        actions={
          <Button
            variant="secondary"
            leftIcon={<ArrowLeft size={14} />}
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
        }
      />
      <PageContainer>
        <Card className="p-6">
          {/* Sample Selection */}
          <div className="mb-6">
            <Select
              label="Sample *"
              value={selectedSampleId}
              onChange={(e) => setSelectedSampleId(e.target.value)}
              options={(samples || []).map((s: any) => ({
                value: s.id,
                label: `${s.ulid} - ${s.name} (${s.matrix || "Unknown"})`,
              }))}
              placeholder="Select a sample..."
            />
          </div>

          {/* Parameters */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-base">Test Parameters</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Format:</label>
                  <select
                    value={formatType}
                    onChange={(e) =>
                      setFormatType(
                        e.target.value as "standard" | "simple" | "descriptive",
                      )
                    }
                    className="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="standard">Standard</option>
                    <option value="simple">Simple</option>
                    <option value="descriptive">Descriptive</option>
                  </select>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<Plus size={12} />}
                  onClick={addParameter}
                >
                  Add Parameter
                </Button>
              </div>
            </div>

            {formatType === "standard" ? (
              /* Standard Format: Parameter name, Raw value, Result, Unit, Min, Max, Data type */
              <div className="space-y-3">
                {parameters.map((param, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-3 items-start p-4 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="col-span-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Parameter Name *
                      </label>
                      <Input
                        placeholder="e.g., pH, Temperature"
                        value={param.param_name}
                        onChange={(e) =>
                          updateParameter(index, "param_name", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Raw Value
                      </label>
                      <Input
                        placeholder="Raw reading"
                        value={param.raw_value}
                        onChange={(e) =>
                          updateParameter(index, "raw_value", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Result *
                      </label>
                      <Input
                        placeholder="Calculated"
                        value={param.calculated_value}
                        onChange={(e) =>
                          updateParameter(
                            index,
                            "calculated_value",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Unit
                      </label>
                      <Input
                        placeholder="mg/L"
                        value={param.unit}
                        onChange={(e) =>
                          updateParameter(index, "unit", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Min
                      </label>
                      <Input
                        placeholder="0"
                        value={param.spec_min}
                        onChange={(e) =>
                          updateParameter(index, "spec_min", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Max
                      </label>
                      <Input
                        placeholder="100"
                        value={param.spec_max}
                        onChange={(e) =>
                          updateParameter(index, "spec_max", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        value={param.data_type}
                        onChange={(e) =>
                          updateParameter(index, "data_type", e.target.value)
                        }
                        className="w-full h-[38px] px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      >
                        <option value="numerical">Num</option>
                        <option value="qualitative">Qual</option>
                      </select>
                    </div>
                    <div className="col-span-1 flex items-end">
                      {parameters.length > 1 && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeParameter(index)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <X size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : formatType === "simple" ? (
              /* Simple Format: Parameters, Result, Comment */
              <div className="space-y-3">
                {parameters.map((param, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-3 items-start p-4 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="col-span-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Parameter *
                      </label>
                      <Input
                        placeholder="e.g., pH, Temperature"
                        value={param.param_name}
                        onChange={(e) =>
                          updateParameter(index, "param_name", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Result *
                      </label>
                      <Input
                        placeholder="Enter result"
                        value={param.calculated_value}
                        onChange={(e) =>
                          updateParameter(
                            index,
                            "calculated_value",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Comment
                      </label>
                      <Input
                        placeholder="Optional comment"
                        value={param.comment}
                        onChange={(e) =>
                          updateParameter(index, "comment", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-1 flex items-end">
                      {parameters.length > 1 && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeParameter(index)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <X size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Descriptive Format: Parameters, NIS Requirements, Results, Remarks */
              <div className="space-y-3">
                {parameters.map((param, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-3 items-start p-4 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="col-span-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Parameter *
                      </label>
                      <Input
                        placeholder="e.g., Total Coliform"
                        value={param.param_name}
                        onChange={(e) =>
                          updateParameter(index, "param_name", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        NIS Requirements
                      </label>
                      <Input
                        placeholder="e.g., <10 CFU/100ml"
                        value={param.nis_requirements}
                        onChange={(e) =>
                          updateParameter(
                            index,
                            "nis_requirements",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Result *
                      </label>
                      <Input
                        placeholder="Enter result"
                        value={param.calculated_value}
                        onChange={(e) =>
                          updateParameter(
                            index,
                            "calculated_value",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Remarks
                      </label>
                      <Input
                        placeholder="e.g., Complies, Non-compliant"
                        value={param.remarks}
                        onChange={(e) =>
                          updateParameter(index, "remarks", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-1 flex items-end">
                      {parameters.length > 1 && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeParameter(index)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <X size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="mb-6">
            <Textarea
              label="Notes / Comments"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional observations or comments..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => navigate(-1)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Save size={14} />}
              onClick={() => handleSave(false)}
              loading={mutation.isPending}
              className="flex-1"
            >
              Save as Draft
            </Button>
            <Button
              leftIcon={<Send size={14} />}
              onClick={() => handleSave(true)}
              loading={submitMutation.isPending}
              className="flex-1"
            >
              Submit for Review
            </Button>
          </div>
        </Card>
      </PageContainer>
    </AppShell>
  );
}
