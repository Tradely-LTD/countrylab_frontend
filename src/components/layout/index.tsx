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
  ChevronDown,
  Settings,
  TestTubeDiagonal,
  BarChart3,
  Building2,
  Menu,
  X,
  Truck,
  WifiOff,
} from "lucide-react";
import { useAuth } from "../../lib/auth";
import { useState, useContext, createContext } from "react";
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

// ─── Layout Context ────────────────────────────────────────────────────────────
interface LayoutContextType {
  collapsed: boolean;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType>({
  collapsed: false,
  mobileOpen: false,
  setMobileOpen: () => {},
});

// ─── Sidebar ──────────────────────────────────────────────────────────────────
interface SidebarProps {
  collapsed?: boolean;
  onCollapse?: (v: boolean) => void;
}

export function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const { user, logout, isRole } = useAuth();
  const navigate = useNavigate();
  const { mobileOpen, setMobileOpen } = useContext(LayoutContext);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside
      className={clsx(
        "flex flex-col h-screen bg-white border-r border-lab-border transition-all duration-300 fixed left-0 top-0 z-30",
        collapsed ? "w-16" : "w-[240px]",
        // On mobile: hidden off-screen by default, slides in when mobileOpen
        mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0",
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
        {/* Desktop: collapse toggle */}
        <button
          onClick={() => onCollapse?.(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-lab-bg text-lab-muted ml-auto hidden md:flex"
        >
          {collapsed ? (
            <ChevronDown size={14} className="-rotate-90" />
          ) : (
            <Menu size={14} />
          )}
        </button>
        {/* Mobile: close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="p-1.5 rounded-lg hover:bg-lab-bg text-lab-muted ml-auto md:hidden"
        >
          <X size={16} />
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
                    onClick={() => setMobileOpen(false)}
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
  const { collapsed, mobileOpen, setMobileOpen } = useContext(LayoutContext);

  // Prefer context value; fall back to prop for standalone use
  const isCollapsed = sidebarCollapsed !== undefined ? sidebarCollapsed : collapsed;
  const marginLeft = isCollapsed ? "md:ml-16" : "md:ml-[240px]";

  return (
    <header
      className={clsx(
        "fixed top-0 left-0 right-0 z-20 bg-white/90 backdrop-blur border-b border-lab-border h-16 flex items-center px-4 md:px-6 transition-all duration-300",
        marginLeft,
      )}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg hover:bg-lab-bg text-lab-muted md:hidden shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu size={18} />
          </button>
          {backButton && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-lab-bg text-lab-muted shrink-0"
            >
              <ChevronDown size={16} className="rotate-90" />
            </button>
          )}
          {icon && <div className="text-primary-600 shrink-0">{icon}</div>}
          <div className="min-w-0">
            <h1 className="font-display text-base md:text-lg text-lab-text leading-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-lab-muted hidden sm:block truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      </div>
    </header>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { networkError } = useAuth();

  return (
    <LayoutContext.Provider value={{ collapsed, mobileOpen, setMobileOpen }}>
      <div className="min-h-screen bg-lab-bg">
        {/* Mobile backdrop overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-20 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
          )}
        </AnimatePresence>

        <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
        <main
          className={clsx(
            "transition-all duration-300 pt-16 min-h-screen",
            collapsed ? "md:ml-16" : "md:ml-[240px]",
          )}
        >
          {networkError && (
            <div className="flex items-center gap-2 bg-red-50 border-b border-red-200 px-4 md:px-6 py-2.5 text-sm text-red-700">
              <WifiOff size={15} className="shrink-0" />
              <span>
                Cannot reach the server. Check your internet connection or
                contact support.
              </span>
            </div>
          )}
          {children}
        </main>
      </div>
    </LayoutContext.Provider>
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
    <div className={clsx("p-4 md:p-6 max-w-screen-2xl mx-auto", className)}>
      {children}
    </div>
  );
}
