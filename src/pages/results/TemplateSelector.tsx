import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, ChevronDown } from "lucide-react";
import { api } from "../../lib/api";

export interface TemplateParameter {
  parameter_name: string;
  nis_limit: string;
  unit: string;
  parameter_group: string;
  sequence_order: number;
  data_type: "numerical" | "qualitative" | "pass_fail";
  spec_min: number | null;
  spec_max: number | null;
}

interface TemplateSummary {
  id: string;
  name: string;
  nis_standard_ref: string;
  version: number;
  is_active: boolean;
}

interface Props {
  onTemplateLoad: (
    params: TemplateParameter[],
    id: string,
    version: number,
  ) => void;
  onClear: () => void;
}

export function TemplateSelector({ onTemplateLoad, onClear }: Props) {
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateSummary | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: templates = [] } = useQuery<TemplateSummary[]>({
    queryKey: ["result-templates"],
    queryFn: () => api.get("/result-templates").then((r) => r.data.data),
  });

  async function handleSelect(template: TemplateSummary) {
    setOpen(false);
    setLoading(true);
    try {
      const res = await api.get(`/result-templates/${template.id}`);
      const full = res.data.data;
      setSelectedTemplate(template);
      onTemplateLoad(
        full.parameters as TemplateParameter[],
        template.id,
        template.version,
      );
    } catch {
      // silently fail — user can retry
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setSelectedTemplate(null);
    onClear();
  }

  if (selectedTemplate) {
    return (
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
          {selectedTemplate.name} ({selectedTemplate.nis_standard_ref})
          <button
            type="button"
            onClick={handleClear}
            className="ml-1 hover:text-blue-600 focus:outline-none"
            aria-label="Clear template"
          >
            <X size={14} />
          </button>
        </span>
      </div>
    );
  }

  if (templates.length === 0) return null;

  return (
    <div className="relative mb-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {loading ? "Loading…" : "Load from Template"}
        <ChevronDown size={14} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <ul className="absolute z-20 mt-1 w-72 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto text-sm">
            {templates.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(t)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                >
                  <span className="font-medium">{t.name}</span>
                  <span className="ml-2 text-gray-500 text-xs">
                    {t.nis_standard_ref}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
