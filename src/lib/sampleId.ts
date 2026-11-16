import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

/**
 * The organisation's required Sample ID prefix (e.g. "CL/"), set in
 * Settings → Organization. "" when none is set. Shares the cache with the
 * Settings page so a change there applies immediately.
 */
export function useSampleIdPrefix(): string {
  const { data } = useQuery({
    queryKey: ["tenant-settings"],
    queryFn: () => api.get("/settings/organization").then((r) => r.data.data),
    staleTime: 60_000,
  });
  const prefix = data?.settings?.sample_id_prefix;
  return typeof prefix === "string" ? prefix.trim() : "";
}

/** Mirrors the backend rule. Returns an error message, or null when valid. */
export function sampleIdError(value: string, prefix: string): string | null {
  const id = value.trim();
  if (!id) return "Sample ID is required";
  if (id.length > 30) return "Sample ID must be 30 characters or fewer";
  if (prefix && (!id.startsWith(prefix) || id.length === prefix.length)) {
    return `Sample ID must start with "${prefix}" followed by the rest of the ID`;
  }
  return null;
}
