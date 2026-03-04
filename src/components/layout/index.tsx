import { NavLink, useNavigate } from "react-router-dom";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  FlaskConical,
  FileCheck,
  Package,
  Wrench,
  ShoppingCart,
  Users,
  FileText,
  ClipboardList,
  LogOut,
  Bell,
  ChevronDown,
  Settings,
  TestTubeDiagonal,
  BarChart3,
  Building2,
  Menu,
  X,
  Truck,
} from "lucide-react";
import { useAuth } from "../../lib/auth";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  {
    section: "Operations",
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        to: "/dashboard",
        roles: [],
      },
      { label: "Requests", icon: FileText, to: "/requests", roles: [] },
      { label: "Samples", icon: FlaskConical, to: "/samples", roles: [] },
      { label: "Results & CoA", icon: FileCheck, to: "/results", roles: [] },
      {
        label: "MD Queue",
        icon: ClipboardList,
        to: "/approval-queue",
        roles: ["md", "super_admin"],
      },
    ],
  },
  {
    section: "Inventory",
    items: [
      {
        label: "Stock & Consumables",
        icon: Package,
        to: "/inventory",
        roles: [],
      },
      { label: "Assets & Equipment", icon: Wrench, to: "/assets", roles: [] },
    ],
  },
  {
    section: "Procurement",
    items: [
      {
        label: "Requisitions",
        icon: ShoppingCart,
        to: "/procurement",
        roles: [],
      },
      {
        label: "Invoices",
        icon: FileText,
        to: "/invoices",
        roles: ["md", "super_admin", "finance", "business_development"],
      },
    ],
  },
  {
    section: "Admin",
    items: [
      { label: "Clients", icon: Building2, to: "/clients", roles: [] },
      {
        label: "Suppliers",
        icon: Truck,
        to: "/suppliers",
        roles: [
          "md",
          "super_admin",
          "procurement_officer",
          "inventory_manager",
        ],
      },
      {
        label: "Team",
        icon: Users,
        to: "/team",
        roles: ["md", "super_admin", "quality_manager"],
      },
      {
        label: "Audit Logs",
        icon: BarChart3,
        to: "/audit-logs",
        roles: ["md", "super_admin", "quality_manager"],
      },
      {
        label: "Settings",
        icon: Settings,
        to: "/settings",
        roles: ["md", "super_admin"],
      },
    ],
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapse?: (v: boolean) => void;
}

export function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const { user, logout, isRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside
      className={clsx(
        "flex flex-col h-screen bg-white border-r border-lab-border transition-all duration-300 fixed left-0 top-0 z-30",
        collapsed ? "w-16" : "w-[240px]",
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-lab-border flex-shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <TestTubeDiagonal size={18} className="text-white" />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-primary-800 leading-tight">
                Countrylab
              </p>
              <p className="text-[10px] text-lab-muted leading-tight">LMS</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mx-auto">
            <TestTubeDiagonal size={18} className="text-white" />
          </div>
        )}
        <button
          onClick={() => onCollapse?.(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-lab-bg text-lab-muted ml-auto"
        >
          {collapsed ? (
            <ChevronDown size={14} className="-rotate-90" />
          ) : (
            <Menu size={14} />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {NAV_ITEMS.map((section) => {
          const filtered = section.items.filter(
            (item) => item.roles.length === 0 || isRole(...item.roles),
          );
          if (filtered.length === 0) return null;

          return (
            <div key={section.section}>
              {!collapsed && <p className="section-label">{section.section}</p>}
              <div className="space-y-0.5">
                {filtered.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      clsx(
                        "nav-link",
                        isActive && "active",
                        collapsed && "justify-center px-2",
                      )
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon size={17} className="shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User */}
      <div
        className={clsx(
          "border-t border-lab-border p-3 flex-shrink-0",
          collapsed ? "flex justify-center" : "",
        )}
      >
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary-700">
                {user?.full_name?.charAt(0) || "?"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-lab-text truncate">
                {user?.full_name}
              </p>
              <p className="text-[10px] text-lab-muted capitalize">
                {user?.role?.replace("_", " ")}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-lab-bg text-lab-muted"
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg hover:bg-lab-bg text-lab-muted"
            title="Logout"
          >
            <LogOut size={14} />
          </button>
        )}
      </div>
    </aside>
  );
}

// ─── Top Header ───────────────────────────────────────────────────────────────
interface TopHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  backButton?: boolean;
  sidebarCollapsed?: boolean;
}

export function TopHeader({
  title,
  subtitle,
  icon,
  actions,
  backButton,
  sidebarCollapsed,
}: TopHeaderProps) {
  const navigate = useNavigate();
  const marginLeft = sidebarCollapsed ? "ml-16" : "ml-[240px]";

  return (
    <header
      className={clsx(
        "fixed top-0 right-0 z-20 bg-white/90 backdrop-blur border-b border-lab-border h-16 flex items-center px-6 transition-all duration-300",
        marginLeft,
      )}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          {backButton && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-lab-bg text-lab-muted"
            >
              <ChevronDown size={16} className="rotate-90" />
            </button>
          )}
          {icon && <div className="text-primary-600">{icon}</div>}
          <div>
            <h1 className="font-display text-lg text-lab-text leading-tight">
              {title}
            </h1>
            {subtitle && <p className="text-xs text-lab-muted">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
    </header>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-lab-bg">
      <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
      <main
        className={clsx(
          "transition-all duration-300 pt-16 min-h-screen",
          collapsed ? "ml-16" : "ml-[240px]",
        )}
      >
        {children}
      </main>
    </div>
  );
}

// ─── Page Container ───────────────────────────────────────────────────────────
export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("p-6 max-w-screen-2xl mx-auto", className)}>
      {children}
    </div>
  );
}
