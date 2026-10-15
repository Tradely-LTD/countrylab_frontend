import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import { useAuth } from "./auth";

export interface RoleSummary {
  key: string;
  name: string;
  is_system: boolean;
  user_count: number;
}

/** The tenant's roles (built-in and custom), for pickers and display names. */
export function useRoles() {
  const { can } = useAuth();
  const { data } = useQuery<RoleSummary[]>({
    queryKey: ["roles"],
    queryFn: () => api.get("/roles").then((r) => r.data.data),
    enabled: can("roles.view", "team.view"),
    staleTime: 60_000,
  });
  const roles = data ?? [];
  const names = Object.fromEntries(roles.map((r) => [r.key, r.name]));
  return { roles, names };
}

/** Roles the current user may assign — only a Super Admin can grant Super Admin. */
export function assignableRoleOptions(roles: RoleSummary[], currentRole?: string) {
  return roles
    .filter((r) => r.key !== "super_admin" || currentRole === "super_admin")
    .map((r) => ({ value: r.key, label: r.name }));
}
