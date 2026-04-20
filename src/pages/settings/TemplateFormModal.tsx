import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { Modal, Button, Input } from "../../components/ui";
import toast from "react-hot-toast";

interface ParameterRow {
  parameter_name: string;
  nis_limit: string;
  unit: string;
  parameter_group: string;
  sequence_order: number;
  data_type: "numerical" | "qualitative" | "pass_fail";
  spec_min: string;
  spec_max: string;
}

interface TemplateFormData {
  name: string;
  nis_standard: string;
  nis_standard_ref: string;
  effective_date: string;
  parameters: ParameterRow[];
}

interface Props {
  /** If provided, we're creating a new version of this template */
  template?: {
    id: string;
    name: string;
    nis_standard: string;
    nis_standard_ref: string;
    effective_date: string;
    parameters: {
      parameter_name: string;
      nis_limit: string;
      unit: string;
      parameter_group: string;
      sequence_order: number;
      data_type: "numerical" | "qualitative" | "pass_fail";
      spec_min: number | string | null;
      spec_max: number | string | null;
    }[];
  };
  onClose: () => void;
}

function emptyRow(seq: number): ParameterRow {
  return {
    parameter_name: "",
    nis_limit: "",
    unit: "",
    parameter_group: "",
    sequence_order: seq,
    data_type: "numerical",
    spec_min: "",
    spec_max: "",
  };
}

export function TemplateFormModal({ template, onClose }: Props) {
  const qc = useQueryClient();
  const isEdit = !!template;

  const [form, setForm] = useState<TemplateFormData>({
    name: template?.name ?? "",
    nis_standard: template?.nis_standard ?? "",
    nis_standard_ref: template?.nis_standard_ref ?? "",
    effective_date: template?.effective_date
      ? template.effective_date.slice(0, 10)
      : "",
    parameters: template?.parameters?.length
      ? template.parameters.map((p) => ({
          ...p,
          spec_min: p.spec_min != null ? String(p.spec_min) : "",
          spec_max: p.spec_max != null ? String(p.spec_max) : "",
        }))
      : [emptyRow(1)],
  });

  const [submitting, setSubmitting] = useState(false);

  function setField<K extends keyof TemplateFormData>(
    key: K,
    value: TemplateFormData[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setParam(
    idx: number,
    key: keyof ParameterRow,
    value: string | number,
  ) {
    setForm((f) => {
      const params = [...f.parameters];
      params[idx] = { ...params[idx], [key]: value };
      return { ...f, parameters: params };
    });
  }

  function addRow() {
    setForm((f) => ({
      ...f,
      parameters: [...f.parameters, emptyRow(f.parameters.length + 1)],
    }));
  }

  function removeRow(idx: number) {
    setForm((f) => ({
      ...f,
      parameters: f.parameters.filter((_, i) => i !== idx),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!form.nis_standard_ref.trim()) {
      toast.error("NIS standard ref is required");
      return;
    }
    if (form.parameters.length === 0) {
      toast.error("At least one parameter is required");
      return;
    }
    for (const p of form.parameters) {
      if (!p.parameter_name.trim()) {
        toast.error("All parameters must have a name");
        return;
      }
    }

    const payload = {
      name: form.name.trim(),
      nis_standard: form.nis_standard.trim() || undefined,
      nis_standard_ref: form.nis_standard_ref.trim(),
      effective_date: form.effective_date || undefined,
      parameters: form.parameters.map((p, i) => ({
        parameter_name: p.parameter_name.trim(),
        nis_limit: p.nis_limit.trim() || undefined,
        unit: p.unit.trim() || undefined,
        parameter_group: p.parameter_group.trim() || undefined,
        sequence_order: p.sequence_order || i + 1,
        data_type: p.data_type,
        spec_min: p.spec_min !== "" ? parseFloat(p.spec_min) : undefined,
        spec_max: p.spec_max !== "" ? parseFloat(p.spec_max) : undefined,
      })),
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        await api.patch(`/result-templates/${template!.id}`, {
          action: "new_version",
          ...payload,
        });
        toast.success("New template version created");
      } else {
        await api.post("/result-templates", payload);
        toast.success("Template created");
      }
      qc.invalidateQueries({ queryKey: ["result-templates-all"] });
      qc.invalidateQueries({ queryKey: ["result-templates"] });
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save template");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "Create New Version" : "Create Template"}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Header fields */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Product Name *"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="e.g. Borehole Water"
          />
          <Input
            label="NIS Standard Ref *"
            value={form.nis_standard_ref}
            onChange={(e) => setField("nis_standard_ref", e.target.value)}
            placeholder="e.g. NIS-554-2015"
          />
          <Input
            label="NIS Standard"
            value={form.nis_standard}
            onChange={(e) => setField("nis_standard", e.target.value)}
            placeholder="e.g. NIS 554"
          />
          <Input
            label="Effective Date"
            type="date"
            value={form.effective_date}
            onChange={(e) => setField("effective_date", e.target.value)}
          />
        </div>

        {/* Parameters */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-lab-text">Parameters</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              leftIcon={<Plus size={13} />}
              onClick={addRow}
            >
              Add Row
            </Button>
          </div>

          <div className="overflow-x-auto border border-lab-border rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-lab-border">
                <tr>
                  {[
                    "Parameter Name",
                    "NIS Limit",
                    "Unit",
                    "Group",
                    "Seq",
                    "Type",
                    "Min",
                    "Max",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-2 py-2 text-left font-medium text-lab-muted whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {form.parameters.map((p, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-lab-border last:border-0"
                  >
                    <td className="px-2 py-1.5">
                      <input
                        className="input text-xs py-1 min-w-[120px]"
                        value={p.parameter_name}
                        onChange={(e) =>
                          setParam(idx, "parameter_name", e.target.value)
                        }
                        placeholder="e.g. pH"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        className="input text-xs py-1 min-w-[80px]"
                        value={p.nis_limit}
                        onChange={(e) =>
                          setParam(idx, "nis_limit", e.target.value)
                        }
                        placeholder="6.5 - 8.5"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        className="input text-xs py-1 w-16"
                        value={p.unit}
                        onChange={(e) => setParam(idx, "unit", e.target.value)}
                        placeholder="mg/L"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        className="input text-xs py-1 min-w-[100px]"
                        value={p.parameter_group}
                        onChange={(e) =>
                          setParam(idx, "parameter_group", e.target.value)
                        }
                        placeholder="Physical"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        className="input text-xs py-1 w-12"
                        type="number"
                        value={p.sequence_order}
                        onChange={(e) =>
                          setParam(
                            idx,
                            "sequence_order",
                            parseInt(e.target.value) || idx + 1,
                          )
                        }
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        className="select text-xs py-1 min-w-[100px]"
                        value={p.data_type}
                        onChange={(e) =>
                          setParam(
                            idx,
                            "data_type",
                            e.target.value as ParameterRow["data_type"],
                          )
                        }
                      >
                        <option value="numerical">Numerical</option>
                        <option value="qualitative">Qualitative</option>
                        <option value="pass_fail">Pass/Fail</option>
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        className="input text-xs py-1 w-16"
                        type="number"
                        step="any"
                        value={p.spec_min}
                        onChange={(e) =>
                          setParam(idx, "spec_min", e.target.value)
                        }
                        placeholder="—"
                        disabled={p.data_type !== "numerical"}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        className="input text-xs py-1 w-16"
                        type="number"
                        step="any"
                        value={p.spec_max}
                        onChange={(e) =>
                          setParam(idx, "spec_max", e.target.value)
                        }
                        placeholder="—"
                        disabled={p.data_type !== "numerical"}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        className="btn-icon text-red-400 hover:text-red-600"
                        disabled={form.parameters.length === 1}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" loading={submitting} className="flex-1">
            {isEdit ? "Create New Version" : "Create Template"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
