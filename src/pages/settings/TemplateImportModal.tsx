import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, CheckCircle } from "lucide-react";
import { api } from "../../lib/api";
import { Modal, Button } from "../../components/ui";
import toast from "react-hot-toast";

interface Props {
  onClose: () => void;
}

export function TemplateImportModal({ onClose }: Props) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setFieldErrors([]);
    setSuccess(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setSubmitting(true);
    setFieldErrors([]);
    setSuccess(null);

    try {
      const res = await api.post("/result-templates/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const created = res.data?.data;
      const templateName = created?.name ?? "Template";
      setSuccess(templateName);
      qc.invalidateQueries({ queryKey: ["result-templates-all"] });
      qc.invalidateQueries({ queryKey: ["result-templates"] });
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.fields && Array.isArray(data.fields)) {
        setFieldErrors(data.fields);
      } else if (data?.error) {
        toast.error(data.error);
      } else {
        toast.error("Import failed");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Import Template" size="md">
      {success ? (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <CheckCircle size={40} className="text-green-500" />
          <div>
            <p className="font-semibold text-lab-text text-base">
              Import successful
            </p>
            <p className="text-sm text-lab-muted mt-1">
              Template <span className="font-medium">{success}</span> was
              created.
            </p>
          </div>
          <Button onClick={onClose}>Done</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <p className="text-sm text-lab-muted mb-3">
              Upload a <strong>.json</strong> or <strong>.csv</strong> file to
              import a template.
            </p>

            <div
              className="border-2 border-dashed border-lab-border rounded-lg p-6 text-center cursor-pointer hover:border-primary-400 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={24} className="mx-auto mb-2 text-lab-muted" />
              {file ? (
                <p className="text-sm font-medium text-lab-text">{file.name}</p>
              ) : (
                <p className="text-sm text-lab-muted">Click to select a file</p>
              )}
              <p className="text-xs text-lab-muted mt-1">
                Accepted: .json, .csv
              </p>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".json,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {fieldErrors.length > 0 && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm font-medium text-red-700 mb-1">
                Validation errors — missing or invalid fields:
              </p>
              <ul className="list-disc list-inside space-y-0.5">
                {fieldErrors.map((f) => (
                  <li key={f} className="text-sm text-red-600">
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              disabled={!file}
              className="flex-1"
              leftIcon={<Upload size={14} />}
            >
              Import
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
