import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  FlaskConical,
  Download,
  Eye,
  Loader2,
  BarChart3,
} from "lucide-react";
import { api } from "../../lib/api";
import { AppShell, PageContainer, TopHeader } from "../../components/layout";
import { generatePDFReport, fmt } from "../../lib/pdfReport";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { clsx } from "clsx";
import toast from "react-hot-toast";

// ── Date range helpers ────────────────────────────────────────────
function toISO(d: Date) {
  return d.toISOString().split("T")[0];
}

const QUICK_RANGES = [
  { label: "This month", from: toISO(startOfMonth(new Date())), to: toISO(new Date()) },
  { label: "Last month", from: toISO(startOfMonth(subMonths(new Date(), 1))), to: toISO(endOfMonth(subMonths(new Date(), 1))) },
  { label: "Last 3 months", from: toISO(subMonths(new Date(), 3)), to: toISO(new Date()) },
  { label: "Last 6 months", from: toISO(subMonths(new Date(), 6)), to: toISO(new Date()) },
  { label: "This year", from: `${new Date().getFullYear()}-01-01`, to: toISO(new Date()) },
];

// ── Individual report generators ────────────────────────────────
type ReportMode = "save" | "preview";

function runIncomeReport(invoices: any[], from: string, to: string, mode: ReportMode = "save") {
  const paid = invoices.filter((i) => i.status === "paid");
  const unpaid = invoices.filter((i) => i.status === "unpaid");
  const total = invoices.reduce((s, i) => s + (i.total || 0), 0);
  const totalPaid = paid.reduce((s, i) => s + (i.total || 0), 0);

  generatePDFReport({
    title: "Income / Revenue Report",
    subtitle: `Invoices from ${fmt.date(from)} to ${fmt.date(to)}`,
    dateRange: `${fmt.date(from)} – ${fmt.date(to)}`,
    filename: `income-report-${from}-${to}.pdf`,
    summary: [
      { label: "Total Invoices", value: String(invoices.length) },
      { label: "Total Billed", value: fmt.currency(total) },
      { label: "Collected", value: fmt.currency(totalPaid) },
      { label: "Outstanding", value: fmt.currency(total - totalPaid) },
      { label: "Paid Invoices", value: String(paid.length) },
      { label: "Unpaid Invoices", value: String(unpaid.length) },
    ],
    columns: [
      { header: "Invoice #", dataKey: "invoice_number" },
      { header: "Client", dataKey: "client_name" },
      { header: "Date", dataKey: "date" },
      { header: "Due Date", dataKey: "due_date" },
      { header: "Amount (₦)", dataKey: "total" },
      { header: "Status", dataKey: "status" },
      { header: "Payment Method", dataKey: "payment_method" },
    ],
    rows: invoices.map((i) => ({
      invoice_number: i.invoice_number,
      client_name: i.client?.name || "—",
      date: fmt.date(i.created_at),
      due_date: fmt.date(i.due_date),
      total: fmt.currency(i.total),
      status: fmt.cap(i.status),
      payment_method: fmt.cap(i.payment_method),
    })),
    mode,
  });
}

function runExpenditureReport(requisitions: any[], pos: any[], from: string, to: string, mode: ReportMode = "save") {
  const approved = requisitions.filter((r) => r.status === "approved");
  const totalPO = pos.reduce((s: number, p: any) => s + (p.total_amount || 0), 0);
  const depts = [...new Set(requisitions.map((r) => r.department).filter(Boolean))];

  generatePDFReport({
    title: "Expenditure Report",
    subtitle: `Requisitions & Purchase Orders from ${fmt.date(from)} to ${fmt.date(to)}`,
    dateRange: `${fmt.date(from)} – ${fmt.date(to)}`,
    filename: `expenditure-report-${from}-${to}.pdf`,
    summary: [
      { label: "Total Requisitions", value: String(requisitions.length) },
      { label: "Approved", value: String(approved.length) },
      { label: "Purchase Orders", value: String(pos.length) },
      { label: "Total PO Value", value: fmt.currency(totalPO) },
      { label: "Departments", value: String(depts.length) },
    ],
    columns: [
      { header: "Req. Number", dataKey: "req_number" },
      { header: "Department", dataKey: "department" },
      { header: "Items", dataKey: "items" },
      { header: "Urgency", dataKey: "urgency" },
      { header: "Prepared By", dataKey: "prepared_by" },
      { header: "Status", dataKey: "status" },
      { header: "Date", dataKey: "date" },
    ],
    rows: requisitions.map((r) => ({
      req_number: r.requisition_number,
      department: r.department || "—",
      items: `${r.items?.length || 0} item${r.items?.length !== 1 ? "s" : ""}`,
      urgency: fmt.cap(r.urgency),
      prepared_by: r.prepared_by?.full_name || "—",
      status: fmt.cap(r.status),
      date: fmt.date(r.created_at),
    })),
    mode,
  });
}

function runSampleReport(samples: any[], from: string, to: string, mode: ReportMode = "save") {
  const byStatus: Record<string, number> = {};
  samples.forEach((s) => {
    byStatus[s.status] = (byStatus[s.status] || 0) + 1;
  });

  generatePDFReport({
    title: "Sample Activity Report",
    subtitle: `Samples received from ${fmt.date(from)} to ${fmt.date(to)}`,
    dateRange: `${fmt.date(from)} – ${fmt.date(to)}`,
    filename: `sample-report-${from}-${to}.pdf`,
    summary: [
      { label: "Total Samples", value: String(samples.length) },
      { label: "Completed", value: String(byStatus["completed"] || 0) },
      { label: "In Progress", value: String(byStatus["in_progress"] || 0) },
      { label: "Received", value: String(byStatus["received"] || 0) },
      { label: "Approved", value: String(byStatus["approved"] || 0) },
    ],
    columns: [
      { header: "Sample ID", dataKey: "ulid" },
      { header: "Sample Name", dataKey: "name" },
      { header: "Client", dataKey: "client" },
      { header: "Matrix", dataKey: "matrix" },
      { header: "Category", dataKey: "category" },
      { header: "Status", dataKey: "status" },
      { header: "Received", dataKey: "received_at" },
    ],
    rows: samples.map((s) => ({
      ulid: s.ulid,
      name: s.name,
      client: s.client?.name || "—",
      matrix: s.matrix || "—",
      category: fmt.cap(s.test_category),
      status: fmt.cap(s.status),
      received_at: fmt.date(s.received_at),
    })),
    mode,
  });
}

function runInventoryReport(reagents: any[], mode: ReportMode = "save") {
  const lowStock = reagents.filter((r) => r.quantity <= r.reorder_level);
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 86400_000);
  const expiring = reagents.filter((r) => r.expiry_date && new Date(r.expiry_date) <= in30 && new Date(r.expiry_date) > now);
  const expired = reagents.filter((r) => r.expiry_date && new Date(r.expiry_date) < now);

  generatePDFReport({
    title: "Inventory Report",
    subtitle: `Stock status as of ${fmt.date(new Date())}`,
    filename: `inventory-report-${toISO(new Date())}.pdf`,
    summary: [
      { label: "Total Items", value: String(reagents.length) },
      { label: "Low Stock", value: String(lowStock.length) },
      { label: "Expiring ≤30 days", value: String(expiring.length) },
      { label: "Expired", value: String(expired.length) },
    ],
    columns: [
      { header: "Item Name", dataKey: "name" },
      { header: "Category", dataKey: "category" },
      { header: "Qty", dataKey: "quantity" },
      { header: "Unit", dataKey: "unit" },
      { header: "Reorder Level", dataKey: "reorder_level" },
      { header: "Stock Status", dataKey: "stock_status" },
      { header: "Expiry Date", dataKey: "expiry_date" },
      { header: "Location", dataKey: "location" },
    ],
    rows: reagents.map((r) => {
      const isLow = r.quantity <= r.reorder_level;
      const isExpired = r.expiry_date && new Date(r.expiry_date) < now;
      const isExpiring = r.expiry_date && new Date(r.expiry_date) <= in30 && !isExpired;
      return {
        name: r.name,
        category: fmt.cap(r.category),
        quantity: fmt.num(r.quantity),
        unit: r.unit || "—",
        reorder_level: fmt.num(r.reorder_level),
        stock_status: isLow ? "LOW STOCK" : "OK",
        expiry_date: isExpired ? `EXPIRED (${fmt.date(r.expiry_date)})` : isExpiring ? `Expiring (${fmt.date(r.expiry_date)})` : fmt.date(r.expiry_date),
        location: r.storage_location || "—",
      };
    }),
    mode,
  });
}

function runMarketerReport(marketers: any[], leads: any[], from: string, to: string, mode: ReportMode = "save") {
  const totalLeads = leads.length;
  const converted = leads.filter((l) => l.status === "converted").length;
  const convRate = totalLeads ? Math.round((converted / totalLeads) * 100) : 0;

  generatePDFReport({
    title: "Marketer Performance Report",
    subtitle: `Leads & conversions from ${fmt.date(from)} to ${fmt.date(to)}`,
    dateRange: `${fmt.date(from)} – ${fmt.date(to)}`,
    filename: `marketer-report-${from}-${to}.pdf`,
    summary: [
      { label: "Total Marketers", value: String(marketers.length) },
      { label: "Total Leads", value: String(totalLeads) },
      { label: "Converted", value: String(converted) },
      { label: "Conversion Rate", value: fmt.pct(convRate) },
    ],
    columns: [
      { header: "Marketer", dataKey: "name" },
      { header: "Email", dataKey: "email" },
      { header: "Total Leads", dataKey: "total_leads" },
      { header: "Converted", dataKey: "converted_leads" },
      { header: "Conversion Rate", dataKey: "conversion_rate" },
      { header: "Referral Code", dataKey: "referral_code" },
      { header: "Active", dataKey: "active" },
    ],
    rows: marketers.map((m) => ({
      name: m.full_name,
      email: m.email,
      total_leads: fmt.num(m.total_leads),
      converted_leads: fmt.num(m.converted_leads),
      conversion_rate: fmt.pct(m.conversion_rate),
      referral_code: m.referral_code || "—",
      active: m.is_active ? "Yes" : "No",
    })),
    mode,
  });
}

function runClientReport(clients: any[], mode: ReportMode = "save") {
  const active = clients.filter((c) => c.client_status === "active");
  const leads = clients.filter((c) => c.client_status === "lead");

  generatePDFReport({
    title: "Client Summary Report",
    subtitle: `All clients as of ${fmt.date(new Date())}`,
    filename: `client-report-${toISO(new Date())}.pdf`,
    summary: [
      { label: "Total Clients", value: String(clients.length) },
      { label: "Active Clients", value: String(active.length) },
      { label: "Leads", value: String(leads.length) },
    ],
    columns: [
      { header: "Client Name", dataKey: "name" },
      { header: "Company", dataKey: "company" },
      { header: "Contact Person", dataKey: "contact_person" },
      { header: "Phone", dataKey: "phone" },
      { header: "Email", dataKey: "email" },
      { header: "Status", dataKey: "status" },
      { header: "Created By", dataKey: "creator" },
      { header: "Date Added", dataKey: "date" },
    ],
    rows: clients.map((c) => ({
      name: c.name,
      company: c.company || "—",
      contact_person: c.contact_person || "—",
      phone: c.phone || "—",
      email: c.email || "—",
      status: fmt.cap(c.client_status),
      creator: c.creator_name || "—",
      date: fmt.date(c.created_at),
    })),
    mode,
  });
}

// ── Report Card ─────────────────────────────────────────────────
interface ReportCardProps {
  icon: React.ReactNode;
  color: string;
  title: string;
  description: string;
  from: string;
  to: string;
  loading: string | null; // "preview" | "save" | null
  onPreview: () => void;
  onDownload: () => void;
}

function ReportCard({ icon, color, title, description, loading, onPreview, onDownload }: ReportCardProps) {
  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", color)}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-lab-text">{title}</p>
          <p className="text-xs text-lab-muted mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="mt-auto flex gap-2">
        <button
          onClick={onPreview}
          disabled={!!loading}
          className="flex items-center justify-center gap-1.5 flex-1 py-2 px-3 bg-white border border-lab-border hover:bg-lab-bg disabled:opacity-50 text-lab-text text-sm font-medium rounded-lg transition-colors"
        >
          {loading === "preview" ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Eye size={13} />
          )}
          Preview
        </button>
        <button
          onClick={onDownload}
          disabled={!!loading}
          className="flex items-center justify-center gap-1.5 flex-1 py-2 px-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading === "save" ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Download size={13} />
          )}
          Download
        </button>
      </div>
    </div>
  );
}

// ── Reports Page ─────────────────────────────────────────────────
export default function ReportsPage() {
  const [from, setFrom] = useState(toISO(startOfMonth(new Date())));
  const [to, setTo] = useState(toISO(new Date()));
  // loading format: "reportKey:mode" e.g. "income:preview" | "income:save" | null
  const [loading, setLoading] = useState<string | null>(null);

  const applyRange = (f: string, t: string) => {
    setFrom(f);
    setTo(t);
  };

  // Prefetch queries so generation is fast
  const { data: invoices } = useQuery({
    queryKey: ["report-invoices", from, to],
    queryFn: () => api.get("/invoices", { params: { from, to } }).then((r) => r.data.data),
    staleTime: 60_000,
  });

  const { data: requisitions } = useQuery({
    queryKey: ["report-requisitions"],
    queryFn: () => api.get("/procurement/requisitions").then((r) => r.data.data),
    staleTime: 60_000,
  });

  const { data: pos } = useQuery({
    queryKey: ["report-pos"],
    queryFn: () => api.get("/procurement/purchase-orders").then((r) => r.data.data),
    staleTime: 60_000,
  });

  const { data: samples } = useQuery({
    queryKey: ["report-samples", from, to],
    queryFn: () =>
      api.get("/samples", { params: { from, to, limit: 5000 } }).then((r) =>
        Array.isArray(r.data.data) ? r.data.data : r.data.data?.samples || [],
      ),
    staleTime: 60_000,
  });

  const { data: reagents } = useQuery({
    queryKey: ["report-reagents"],
    queryFn: () =>
      api.get("/inventory", { params: { limit: 5000 } }).then((r) =>
        Array.isArray(r.data.data) ? r.data.data : r.data.data?.reagents || [],
      ),
    staleTime: 60_000,
  });

  const { data: marketers } = useQuery({
    queryKey: ["report-marketers"],
    queryFn: () => api.get("/marketers").then((r) => r.data.data),
    staleTime: 60_000,
  });

  const { data: leadsData } = useQuery({
    queryKey: ["report-leads", from, to],
    queryFn: () =>
      api.get("/marketers/leads", { params: { from, to } }).then((r) => r.data.data),
    staleTime: 60_000,
  });

  const { data: clients } = useQuery({
    queryKey: ["report-clients"],
    queryFn: () => api.get("/clients").then((r) => r.data.data),
    staleTime: 60_000,
  });

  const dateLabel = `${fmt.date(from)} – ${fmt.date(to)}`;

  async function generate(key: string, mode: ReportMode, fn: () => void) {
    setLoading(`${key}:${mode}`);
    try {
      await new Promise((r) => setTimeout(r, 80)); // let spinner render
      fn();
    } catch (e: any) {
      toast.error(e?.message || "Failed to generate report");
    } finally {
      setLoading(null);
    }
  }

  function makeHandlers(key: string, check: () => boolean, fn: (mode: ReportMode) => void) {
    return {
      onPreview: () => generate(key, "preview", () => { if (!check()) return; fn("preview"); }),
      onDownload: () => generate(key, "save", () => { if (!check()) return; fn("save"); }),
    };
  }

  const REPORTS = [
    {
      key: "income",
      icon: <TrendingUp size={18} className="text-emerald-600" />,
      color: "bg-emerald-50",
      title: "Income / Revenue",
      description: "All invoices with amounts, client details, payment status and methods for the selected period.",
      ...makeHandlers(
        "income",
        () => { if (!invoices?.length) { toast.error("No invoice data for this period"); return false; } return true; },
        (mode) => runIncomeReport(invoices!, from, to, mode),
      ),
    },
    {
      key: "expenditure",
      icon: <ShoppingCart size={18} className="text-orange-600" />,
      color: "bg-orange-50",
      title: "Expenditure",
      description: "Requisitions and purchase orders summarised by department, urgency and status.",
      ...makeHandlers(
        "expenditure",
        () => { if (!requisitions?.length) { toast.error("No requisition data found"); return false; } return true; },
        (mode) => runExpenditureReport(requisitions!, pos || [], from, to, mode),
      ),
    },
    {
      key: "samples",
      icon: <FlaskConical size={18} className="text-violet-600" />,
      color: "bg-violet-50",
      title: "Sample Activity",
      description: "Sample throughput by status, matrix, test category and client for the selected period.",
      ...makeHandlers(
        "samples",
        () => { if (!samples?.length) { toast.error("No sample data for this period"); return false; } return true; },
        (mode) => runSampleReport(samples!, from, to, mode),
      ),
    },
    {
      key: "inventory",
      icon: <Package size={18} className="text-blue-600" />,
      color: "bg-blue-50",
      title: "Inventory Status",
      description: "Current stock levels for all reagents, highlighting low-stock and expiring items.",
      ...makeHandlers(
        "inventory",
        () => { if (!reagents?.length) { toast.error("No inventory data found"); return false; } return true; },
        (mode) => runInventoryReport(reagents!, mode),
      ),
    },
    {
      key: "marketers",
      icon: <BarChart3 size={18} className="text-pink-600" />,
      color: "bg-pink-50",
      title: "Marketer Performance",
      description: "Lead counts, conversion rates and pipeline breakdown per marketer for the selected period.",
      ...makeHandlers(
        "marketers",
        () => { if (!marketers?.length) { toast.error("No marketer data found"); return false; } return true; },
        (mode) => runMarketerReport(marketers!, leadsData || [], from, to, mode),
      ),
    },
    {
      key: "clients",
      icon: <Users size={18} className="text-teal-600" />,
      color: "bg-teal-50",
      title: "Client Summary",
      description: "Full client listing with contact details, status and the team member who added them.",
      ...makeHandlers(
        "clients",
        () => { if (!clients?.length) { toast.error("No client data found"); return false; } return true; },
        (mode) => runClientReport(clients!, mode),
      ),
    },
  ];

  return (
    <AppShell>
      <TopHeader
        title="Reports"
        subtitle="Generate and download PDF reports for any module"
        icon={<FileText size={20} />}
      />
      <PageContainer>
        {/* Date range selector */}
        <div className="card p-4 mb-6">
          <p className="text-xs font-semibold text-lab-muted uppercase tracking-wide mb-3">
            Date Range
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {QUICK_RANGES.map((r) => (
              <button
                key={r.label}
                onClick={() => applyRange(r.from, r.to)}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                  from === r.from && to === r.to
                    ? "bg-primary-600 text-white border-primary-600"
                    : "bg-white text-lab-text border-lab-border hover:bg-lab-bg",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-lab-muted w-8">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="border border-lab-border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-300 bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-lab-muted w-8">To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="border border-lab-border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-300 bg-white"
              />
            </div>
            <p className="text-xs text-lab-muted ml-1">
              Selected: <span className="font-medium text-lab-text">{dateLabel}</span>
            </p>
          </div>
        </div>

        {/* Report cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {REPORTS.map((r) => (
            <ReportCard
              key={r.key}
              icon={r.icon}
              color={r.color}
              title={r.title}
              description={r.description}
              from={from}
              to={to}
              loading={loading?.startsWith(r.key) ? loading.split(":")[1] as "preview" | "save" : null}
              onPreview={r.onPreview}
              onDownload={r.onDownload}
            />
          ))}
        </div>

        <p className="text-xs text-lab-muted text-center mt-6">
          Reports use data currently visible within your date range. Inventory and Client reports always show current state.
        </p>
      </PageContainer>
    </AppShell>
  );
}
