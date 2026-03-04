import {
  ReactNode,
  forwardRef,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  useEffect,
} from "react";
import { clsx } from "clsx";
import {
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, className, ...props }, ref) => (
    <div className="space-y-1">
      {label && <label className="label">{label}</label>}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-lab-muted">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={clsx(
            "input",
            leftIcon && "pl-9",
            error && "input-error",
            className,
          )}
          {...props}
        />
      </div>
      {error && <p className="field-error">{error}</p>}
      {hint && !error && <p className="text-xs text-lab-muted">{hint}</p>}
    </div>
  ),
);
Input.displayName = "Input";

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, ...props }, ref) => (
    <div className="space-y-1">
      {label && <label className="label">{label}</label>}
      <select
        ref={ref}
        className={clsx("select", error && "input-error", className)}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="field-error">{error}</p>}
    </div>
  ),
);
Select.displayName = "Select";

// ─── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="space-y-1">
      {label && <label className="label">{label}</label>}
      <textarea
        ref={ref}
        rows={3}
        className={clsx("input resize-none", error && "input-error", className)}
        {...props}
      />
      {error && <p className="field-error">{error}</p>}
    </div>
  ),
);
Textarea.displayName = "Textarea";

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const variantClass = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
    danger: "btn-danger",
    outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
  }[variant];

  const sizeClass = { sm: "btn-sm", md: "", lg: "btn-lg", icon: "btn-icon" }[
    size
  ];

  return (
    <button
      className={clsx(variantClass, sizeClass, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : leftIcon}
      {size !== "icon" && children}
      {rightIcon && !loading && rightIcon}
    </button>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
}) {
  const variantClass = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-orange-100 text-orange-700",
    error: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
  }[variant];

  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variantClass,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    received: "Received",
    in_testing: "In Testing",
    pending_review: "Pending Review",
    approved: "Approved",
    disposed: "Disposed",
    voided: "Voided",
    draft: "Draft",
    submitted: "Submitted",
    under_review: "Under Review",
    rejected: "Rejected",
    operational: "Operational",
    under_repair: "Under Repair",
    calibration_due: "Calibration Due",
    decommissioned: "Decommissioned",
    open: "Open",
    in_progress: "In Progress",
    resolved: "Resolved",
    closed: "Closed",
    unpaid: "Unpaid",
    paid: "Paid",
    partial: "Partial",
  };

  return (
    <span className={`badge-${status.toLowerCase().replace(" ", "_")}`}>
      {labels[status] || status}
    </span>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={clsx("card", className)}>{children}</div>;
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: ModalProps) {
  const sizeClass = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }[size];

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.body.classList.add("modal-open");
    } else {
      document.body.style.overflow = "";
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.style.overflow = "";
      document.body.classList.remove("modal-open");
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            onClick={onClose}
          />
          <div
            className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
            style={{ zIndex: 10000 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: [0.175, 0.885, 0.32, 1.05] }}
              className={clsx(
                "bg-white rounded-2xl shadow-modal w-full pointer-events-auto max-h-[90vh] flex flex-col",
                sizeClass,
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {title && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-lab-border flex-shrink-0">
                  <h3 className="font-display text-lg text-lab-text">
                    {title}
                  </h3>
                  <button
                    onClick={onClose}
                    className="btn-icon text-lab-muted hover:text-lab-text"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
              <div className="p-6 overflow-y-auto">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("skeleton", className)} />;
}

export function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
}

export function Pagination({
  page,
  pages,
  total,
  limit,
  onChange,
}: PaginationProps) {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-lab-border">
      <p className="text-xs text-lab-muted">
        Showing {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="btn-icon btn-ghost disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: Math.min(5, pages) }, (_, i) => {
          let p = i + 1;
          if (pages > 5 && page > 3) p = page - 2 + i;
          if (p > pages) return null;
          return (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={clsx(
                "w-8 h-8 rounded-lg text-xs font-medium transition-colors",
                p === page
                  ? "bg-primary-600 text-white"
                  : "text-lab-text hover:bg-lab-bg",
              )}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= pages}
          className="btn-icon btn-ghost disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon text-lab-muted">{icon}</div>}
      <h3 className="font-display text-base text-lab-text mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-lab-muted max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Alert ────────────────────────────────────────────────────────────────────
export function Alert({
  type = "info",
  title,
  message,
}: {
  type?: "info" | "warning" | "error" | "success";
  title?: string;
  message: string;
}) {
  const icons = {
    info: <Info size={16} />,
    warning: <AlertTriangle size={16} />,
    error: <XCircle size={16} />,
    success: <CheckCircle size={16} />,
  };
  return (
    <div className={`alert-${type}`}>
      <span className="shrink-0 mt-0.5">{icons[type]}</span>
      <div>
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <p>{message}</p>
      </div>
    </div>
  );
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
export function Spinner({ size = 20 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin text-primary-600" />;
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
export function StepIndicator({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center">
          <div
            className={clsx(
              "flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all",
              i < current
                ? "bg-primary-600 text-white"
                : i === current
                  ? "bg-primary-600 text-white ring-4 ring-primary-100"
                  : "bg-slate-100 text-slate-400",
            )}
          >
            {i < current ? "✓" : i + 1}
          </div>
          <div className="ml-2 mr-4">
            <p
              className={clsx(
                "text-xs font-medium",
                i <= current ? "text-primary-700" : "text-slate-400",
              )}
            >
              {step}
            </p>
          </div>
          {i < steps.length - 1 && (
            <div
              className={clsx(
                "w-8 h-0.5 mr-4 rounded",
                i < current ? "bg-primary-500" : "bg-slate-200",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
