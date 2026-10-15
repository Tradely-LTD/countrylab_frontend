// Page access is driven by the permissions the API returns for the signed-in
// user (/users/me → permissions). Admins edit them under Roles & Permissions;
// the backend enforces the same permissions on every endpoint.

// Fallback names for built-in roles; the API's role_name wins when present
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

export function roleLabel(role?: string, names?: Record<string, string>) {
  if (!role) return "";
  return names?.[role] ?? ROLE_LABELS[role] ?? role.replace(/_/g, " ");
}

// Most specific patterns first; a page opens when the user holds ANY listed permission
const PAGE_PERMISSIONS: [RegExp, string[]][] = [
  [/^\/samples\/new$/, ["samples.create"]],
  [/^\/results\/new$/, ["results.create"]],
  [/^\/assets\/new$/, ["assets.create"]],
  [/^\/procurement\/new$/, ["requisitions.create"]],
  [/^\/invoices\/new$/, ["invoices.create"]],
  [/^\/invoices\/[^/]+\/edit$/, ["invoices.update"]],
  [/^\/dashboard(\/|$)/, ["dashboard.view"]],
  [/^\/requests(\/|$)/, ["sample_requests.view"]],
  [/^\/samples(\/|$)/, ["samples.view"]],
  [/^\/results(\/|$)/, ["results.view"]],
  [/^\/approval-queue(\/|$)/, ["results.approve"]],
  [/^\/inventory(\/|$)/, ["inventory.view"]],
  [/^\/assets(\/|$)/, ["assets.view"]],
  [/^\/procurement(\/|$)/, ["requisitions.view", "purchase_orders.view"]],
  [/^\/invoices(\/|$)/, ["invoices.view"]],
  [/^\/clients(\/|$)/, ["clients.view"]],
  [/^\/marketers(\/|$)/, ["leads.view", "marketers.view"]],
  [/^\/suppliers(\/|$)/, ["suppliers.view"]],
  [/^\/team(\/|$)/, ["team.view"]],
  [/^\/training-logs(\/|$)/, ["training_logs.view"]],
  [/^\/reports(\/|$)/, ["reports.view"]],
  [/^\/audit-logs(\/|$)/, ["audit_logs.view"]],
  [/^\/settings(\/|$)/, ["settings.update"]],
  [/^\/roles(\/|$)/, ["roles.view"]],
];

// Where to land after sign-in: the first page the user may open
const HOME_ORDER = [
  "/dashboard", "/samples", "/requests", "/results", "/approval-queue",
  "/inventory", "/assets", "/procurement", "/invoices", "/clients",
  "/marketers", "/suppliers", "/team", "/training-logs", "/reports",
  "/audit-logs", "/settings", "/roles",
];
export const NO_ACCESS_PATH = "/no-access";

export function canAccessPage(permissions: string[] | undefined, path: string) {
  const rule = PAGE_PERMISSIONS.find(([re]) => re.test(path));
  if (!rule) return true;
  const held = new Set(permissions ?? []);
  return rule[1].some((p) => held.has(p));
}

export function homePath(permissions: string[] | undefined) {
  return HOME_ORDER.find((p) => canAccessPage(permissions, p)) ?? NO_ACCESS_PATH;
}
