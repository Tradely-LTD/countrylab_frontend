// Mirrors backend/src/middleware/auth.ts — keep the two in sync.

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  md: "Managing Director",
  general_manager: "General Manager",
  operations_manager: "Operations Manager",
  lab_manager: "Laboratory Manager",
  quality_manager: "Quality Manager",
  lab_analyst: "Laboratory Analyst",
  hr_manager: "HR Manager",
  secretary: "Secretary",
  marketing_officer: "Marketing Officer",
  internal_auditor: "Internal Auditor",
  inventory_manager: "Inventory Manager",
  procurement_officer: "Procurement Officer",
  finance: "Finance",
  business_development: "Business Development",
  marketer: "Marketer",
  customer: "Customer",
};

export function roleLabel(role?: string) {
  if (!role) return "";
  return ROLE_LABELS[role] ?? role.replace(/_/g, " ");
}

// Roles that can be assigned from the Team page
export const ASSIGNABLE_ROLES = [
  "md",
  "general_manager",
  "operations_manager",
  "lab_manager",
  "quality_manager",
  "lab_analyst",
  "hr_manager",
  "secretary",
  "marketing_officer",
  "internal_auditor",
  "inventory_manager",
  "procurement_officer",
  "finance",
  "business_development",
  "marketer",
].map((value) => ({ value, label: ROLE_LABELS[value] }));

// The General Manager holds the same executive privileges as the MD.
const ROLE_INHERITS: Record<string, string[]> = {
  general_manager: ["md"],
};

export function hasRole(role: string | undefined, roles: string[]) {
  if (!role) return false;
  return (
    roles.includes(role) ||
    (ROLE_INHERITS[role] ?? []).some((parent) => roles.includes(parent))
  );
}

// Narrow roles only see these pages. Everyone else is governed by the
// per-item role lists in the sidebar and by the API.
const ROLE_PAGES: Record<string, { allow: string[]; deny?: string[] }> = {
  hr_manager: { allow: ["/training-logs"] },
  internal_auditor: { allow: ["/audit-logs"] },
  marketing_officer: {
    allow: ["/dashboard", "/clients", "/requests", "/samples"],
    deny: ["/samples/new"],
  },
  secretary: {
    allow: [
      "/dashboard",
      "/requests",
      "/samples",
      "/results",
      "/invoices",
      "/clients",
    ],
    deny: ["/results/new"],
  },
};

function matchesPrefix(path: string, prefix: string) {
  return path === prefix || path.startsWith(prefix + "/");
}

export function canAccessPage(role: string | undefined, path: string) {
  const pages = role ? ROLE_PAGES[role] : undefined;
  if (!pages) return true;
  if (pages.deny?.some((p) => matchesPrefix(path, p))) return false;
  return pages.allow.some((p) => matchesPrefix(path, p));
}

export function homePath(role: string | undefined) {
  return (role && ROLE_PAGES[role]?.allow[0]) || "/dashboard";
}
