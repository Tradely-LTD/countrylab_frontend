import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  TrendingUp,
  Plus,
  Search,
  Copy,
  Check,
  ChevronDown,
  BarChart3,
  Phone,
  Building2,
  MapPin,
  ExternalLink,
  Trophy,
  Target,
  UserCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { AppShell, TopHeader, PageContainer } from "../../components/layout";
import {
  Button,
  Modal,
  Input,
  Select,
  Textarea,
  Badge,
  EmptyState,
  Spinner,
  Card,
} from "../../components/ui";
import { clsx } from "clsx";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Marketer {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  referral_code: string | null;
  is_active: boolean;
  last_login_at: string | null;
  total_leads: number;
  converted_leads: number;
  conversion_rate: number;
}

interface Lead {
  id: string;
  marketer_id: string;
  marketer_name: string;
  name: string;
  company: string | null;
  phone: string;
  email: string | null;
  city: string | null;
  state: string | null;
  notes: string | null;
  status: string;
  referral_code: string | null;
  converted_client_id: string | null;
  converted_at: string | null;
  created_at: string;
}

interface MyStats {
  marketer: { id: string; full_name: string; referral_code: string | null; email: string };
  stats: { total_leads: number; converted: number; in_pipeline: number; this_month: number };
  referral_link: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LEAD_STATUSES = [
  { value: "new", label: "New", color: "bg-blue-100 text-blue-700" },
  { value: "contacted", label: "Contacted", color: "bg-yellow-100 text-yellow-700" },
  { value: "interested", label: "Interested", color: "bg-purple-100 text-purple-700" },
  { value: "sample_submitted", label: "Sample Submitted", color: "bg-orange-100 text-orange-700" },
  { value: "converted", label: "Converted", color: "bg-green-100 text-green-700" },
  { value: "lost", label: "Lost", color: "bg-red-100 text-red-700" },
];

function LeadStatusBadge({ status }: { status: string }) {
  const s = LEAD_STATUSES.find((x) => x.value === status);
  return (
    <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", s?.color ?? "bg-gray-100 text-gray-700")}>
      {s?.label ?? status}
    </span>
  );
}

// ─── Copy Button ─────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg hover:bg-lab-bg text-lab-muted transition-colors"
      title="Copy"
    >
      {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
    </button>
  );
}

// ─── Marketer Dashboard (marketer role) ──────────────────────────────────────

function MarketerDashboard() {
  const queryClient = useQueryClient();
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", company: "", email: "", city: "", state: "", notes: "" });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["marketer-my-stats"],
    queryFn: () => api.get("/marketers/my-stats").then((r) => r.data.data as MyStats),
  });

  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ["my-leads", statusFilter, search],
    queryFn: () => {
      const p = new URLSearchParams();
      if (statusFilter) p.set("status", statusFilter);
      if (search) p.set("search", search);
      return api.get(`/marketers/leads?${p}`).then((r) => r.data);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post("/marketers/leads", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-leads"] });
      queryClient.invalidateQueries({ queryKey: ["marketer-my-stats"] });
      setAddLeadOpen(false);
      setForm({ name: "", phone: "", company: "", email: "", city: "", state: "", notes: "" });
      toast.success("Lead added");
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed to add lead"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof form> }) =>
      api.put(`/marketers/leads/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-leads"] });
      setEditLead(null);
      toast.success("Lead updated");
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed to update lead"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/marketers/leads/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-leads"] });
      queryClient.invalidateQueries({ queryKey: ["marketer-my-stats"] });
      toast.success("Status updated");
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed to update status"),
  });

  const stats = statsData?.stats;
  const marketer = statsData?.marketer;
  const referralLink = statsData?.referral_link
    ? `${window.location.origin}/ref/${marketer?.referral_code}`
    : null;

  const leads: Lead[] = leadsData?.data ?? [];

  return (
    <AppShell>
      <TopHeader
        title="My Dashboard"
        subtitle="Track your leads and referrals"
        icon={<TrendingUp size={20} />}
        actions={
          <Button onClick={() => setAddLeadOpen(true)} leftIcon={<Plus size={14} />} size="sm">
            Add Lead
          </Button>
        }
      />
      <PageContainer>
        {statsLoading ? (
          <div className="flex justify-center py-16"><Spinner size={32} /></div>
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Leads", value: stats?.total_leads ?? 0, icon: Users, color: "text-blue-600" },
                { label: "Converted", value: stats?.converted ?? 0, icon: UserCheck, color: "text-green-600" },
                { label: "In Pipeline", value: stats?.in_pipeline ?? 0, icon: Target, color: "text-orange-600" },
                { label: "This Month", value: stats?.this_month ?? 0, icon: TrendingUp, color: "text-purple-600" },
              ].map((s) => (
                <Card key={s.label} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-lab-muted">{s.label}</p>
                    <s.icon size={16} className={s.color} />
                  </div>
                  <p className="text-2xl font-bold text-lab-text">{s.value}</p>
                </Card>
              ))}
            </div>

            {/* Referral Link Card */}
            {referralLink && (
              <Card className="p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-lab-text mb-1">Your Referral Link</p>
                    <p className="text-xs text-lab-muted mb-2">
                      Share this link with prospects. Any enquiry submitted will be credited to you.
                    </p>
                    <div className="flex items-center gap-2 bg-lab-bg rounded-lg px-3 py-2">
                      <ExternalLink size={13} className="text-primary-600 shrink-0" />
                      <span className="text-xs font-mono text-lab-text truncate flex-1">{referralLink}</span>
                      <CopyButton text={referralLink} />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-lab-muted mb-1">Code</p>
                    <div className="flex items-center gap-1 bg-primary-50 rounded-lg px-3 py-2">
                      <span className="text-sm font-bold text-primary-700 font-mono">{marketer?.referral_code}</span>
                      <CopyButton text={marketer?.referral_code ?? ""} />
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Leads List */}
            <Card>
              <div className="p-4 border-b border-lab-border flex flex-wrap gap-2 items-center">
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lab-muted" />
                  <input
                    className="input pl-8 w-full text-sm"
                    placeholder="Search leads..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <select
                  className="select text-sm w-full sm:w-auto"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  {LEAD_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {leadsLoading ? (
                <div className="flex justify-center py-12"><Spinner /></div>
              ) : leads.length === 0 ? (
                <EmptyState
                  icon={<Users size={32} />}
                  title="No leads yet"
                  description="Add your first lead or share your referral link to get started."
                  action={
                    <Button onClick={() => setAddLeadOpen(true)} leftIcon={<Plus size={14} />} size="sm">
                      Add Lead
                    </Button>
                  }
                />
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Company</th>
                        <th>Phone</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Added</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead) => (
                        <tr key={lead.id}>
                          <td className="font-medium text-lab-text">{lead.name}</td>
                          <td className="text-lab-muted">{lead.company || "—"}</td>
                          <td>{lead.phone}</td>
                          <td className="text-lab-muted">
                            {[lead.city, lead.state].filter(Boolean).join(", ") || "—"}
                          </td>
                          <td><LeadStatusBadge status={lead.status} /></td>
                          <td className="text-lab-muted">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </td>
                          <td>
                            <div className="flex items-center gap-1 flex-wrap">
                              <button
                                onClick={() => setEditLead(lead)}
                                className="text-xs text-primary-600 hover:underline"
                              >
                                Edit
                              </button>
                              <span className="text-lab-border">|</span>
                              <div className="relative group">
                                <button className="text-xs text-lab-muted hover:text-lab-text flex items-center gap-0.5">
                                  Move <ChevronDown size={10} />
                                </button>
                                <div className="absolute right-0 top-full mt-1 bg-white border border-lab-border rounded-xl shadow-lg z-10 py-1 min-w-[140px] hidden group-hover:block">
                                  {LEAD_STATUSES.filter((s) => s.value !== lead.status).map((s) => (
                                    <button
                                      key={s.value}
                                      onClick={() => statusMutation.mutate({ id: lead.id, status: s.value })}
                                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-lab-bg text-lab-text"
                                    >
                                      {s.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              {lead.status === "converted" && !lead.converted_client_id && (
                                <>
                                  <span className="text-lab-border">|</span>
                                  <button
                                    onClick={() => setConvertingLead(lead)}
                                    className="text-xs text-green-700 hover:underline font-medium"
                                  >
                                    + Create Client
                                  </button>
                                </>
                              )}
                              {lead.converted_client_id && (
                                <span className="text-xs text-green-600 font-medium">✓ Linked</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}
      </PageContainer>

      {/* Add Lead Modal */}
      <Modal open={addLeadOpen} onClose={() => setAddLeadOpen(false)} title="Add Lead" size="md">
        <LeadForm
          form={form}
          setForm={setForm}
          onSubmit={() => createMutation.mutate(form)}
          loading={createMutation.isPending}
          onCancel={() => setAddLeadOpen(false)}
        />
      </Modal>

      {/* Edit Lead Modal */}
      {editLead && (
        <Modal open={!!editLead} onClose={() => setEditLead(null)} title="Edit Lead" size="md">
          <LeadForm
            form={{
              name: editLead.name,
              phone: editLead.phone,
              company: editLead.company ?? "",
              email: editLead.email ?? "",
              city: editLead.city ?? "",
              state: editLead.state ?? "",
              notes: editLead.notes ?? "",
            }}
            setForm={(f) => setEditLead((prev) => prev ? { ...prev, ...f } : prev)}
            onSubmit={() => updateMutation.mutate({
              id: editLead.id,
              data: {
                name: editLead.name,
                phone: editLead.phone,
                company: editLead.company ?? "",
                email: editLead.email ?? "",
                city: editLead.city ?? "",
                state: editLead.state ?? "",
                notes: editLead.notes ?? "",
              }
            })}
            loading={updateMutation.isPending}
            onCancel={() => setEditLead(null)}
          />
        </Modal>
      )}

      {convertingLead && (
        <ConvertToClientModal
          lead={convertingLead}
          onClose={() => setConvertingLead(null)}
        />
      )}
    </AppShell>
  );
}

// ─── Shared Lead Form ─────────────────────────────────────────────────────────

function LeadForm({
  form,
  setForm,
  onSubmit,
  loading,
  onCancel,
  marketers,
}: {
  form: any;
  setForm: (f: any) => void;
  onSubmit: () => void;
  loading: boolean;
  onCancel: () => void;
  marketers?: Marketer[];
}) {
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Full Name *" value={form.name} onChange={set("name")} placeholder="e.g. Aminu Musa" />
        <Input label="Phone *" value={form.phone} onChange={set("phone")} placeholder="+234 803..." />
        <Input label="Company / Organisation" value={form.company} onChange={set("company")} placeholder="Optional" />
        <Input label="Email" type="email" value={form.email} onChange={set("email")} placeholder="Optional" />
        <Input label="City" value={form.city} onChange={set("city")} placeholder="e.g. Kano" />
        <Input label="State" value={form.state} onChange={set("state")} placeholder="e.g. Kano State" />
      </div>
      {marketers && (
        <Select
          label="Assign to Marketer"
          value={form.marketer_id ?? ""}
          onChange={set("marketer_id")}
          placeholder="Select marketer..."
          options={marketers.map((m) => ({ value: m.id, label: m.full_name }))}
        />
      )}
      <Textarea label="Notes" value={form.notes} onChange={set("notes")} placeholder="Any relevant info..." rows={2} />
      <div className="flex gap-2 justify-end pt-2">
        <Button variant="secondary" onClick={onCancel} size="sm">Cancel</Button>
        <Button onClick={onSubmit} loading={loading} size="sm" disabled={!form.name || !form.phone}>
          Save Lead
        </Button>
      </div>
    </div>
  );
}

// ─── Admin Marketers Page ─────────────────────────────────────────────────────

function AdminMarketersPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"marketers" | "leads" | "analytics">("marketers");
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [leadForm, setLeadForm] = useState({ name: "", phone: "", company: "", email: "", city: "", state: "", notes: "", marketer_id: "" });
  const [leadsFilter, setLeadsFilter] = useState({ status: "", marketer_id: "", search: "" });

  const { data: marketersData, isLoading: mLoading } = useQuery({
    queryKey: ["admin-marketers"],
    queryFn: () => api.get("/marketers").then((r) => r.data.data as Marketer[]),
  });

  const { data: leadsData, isLoading: lLoading } = useQuery({
    queryKey: ["admin-leads", leadsFilter],
    queryFn: () => {
      const p = new URLSearchParams();
      if (leadsFilter.status) p.set("status", leadsFilter.status);
      if (leadsFilter.marketer_id) p.set("marketer_id", leadsFilter.marketer_id);
      if (leadsFilter.search) p.set("search", leadsFilter.search);
      return api.get(`/marketers/leads?${p}`).then((r) => r.data);
    },
  });

  const { data: analyticsData, isLoading: aLoading } = useQuery({
    queryKey: ["marketers-analytics"],
    queryFn: () => api.get("/marketers/analytics").then((r) => r.data.data),
    enabled: tab === "analytics",
  });

  const createLeadMutation = useMutation({
    mutationFn: (data: typeof leadForm) => api.post("/marketers/leads", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      queryClient.invalidateQueries({ queryKey: ["admin-marketers"] });
      setAddLeadOpen(false);
      setLeadForm({ name: "", phone: "", company: "", email: "", city: "", state: "", notes: "", marketer_id: "" });
      toast.success("Lead added");
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed to add lead"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/marketers/leads/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      queryClient.invalidateQueries({ queryKey: ["admin-marketers"] });
      queryClient.invalidateQueries({ queryKey: ["marketers-analytics"] });
      toast.success("Status updated");
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed"),
  });

  const marketers: Marketer[] = marketersData ?? [];
  const leads: Lead[] = leadsData?.data ?? [];
  const summary = leadsData?.summary;

  return (
    <AppShell>
      <TopHeader
        title="Marketers"
        subtitle="Track field marketers, leads, and conversions"
        icon={<TrendingUp size={20} />}
        actions={
          tab === "leads" ? (
            <Button onClick={() => setAddLeadOpen(true)} leftIcon={<Plus size={14} />} size="sm">
              Add Lead
            </Button>
          ) : undefined
        }
      />
      <PageContainer>
        {/* Tabs */}
        <div className="flex gap-1 bg-lab-bg p-1 rounded-xl mb-6 w-full sm:w-fit">
          {(["marketers", "leads", "analytics"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                "flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg capitalize transition-colors",
                tab === t ? "bg-white text-primary-700 shadow-sm" : "text-lab-muted hover:text-lab-text",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── Marketers Tab ── */}
        {tab === "marketers" && (
          <div>
            {mLoading ? (
              <div className="flex justify-center py-16"><Spinner size={32} /></div>
            ) : marketers.length === 0 ? (
              <EmptyState
                icon={<Users size={32} />}
                title="No marketers yet"
                description="Create a user with the Marketer role to get started."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {marketers.map((m) => {
                  const refLink = m.referral_code
                    ? `${window.location.origin}/ref/${m.referral_code}`
                    : null;
                  return (
                    <Card key={m.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-primary-700">
                              {m.full_name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-lab-text text-sm">{m.full_name}</p>
                            <p className="text-xs text-lab-muted">{m.email}</p>
                          </div>
                        </div>
                        <Badge variant={m.is_active ? "success" : "error"}>
                          {m.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center py-2 border-y border-lab-border">
                        <div>
                          <p className="text-lg font-bold text-lab-text">{m.total_leads}</p>
                          <p className="text-[10px] text-lab-muted">Leads</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-green-600">{m.converted_leads}</p>
                          <p className="text-[10px] text-lab-muted">Converted</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-primary-600">{m.conversion_rate}%</p>
                          <p className="text-[10px] text-lab-muted">Rate</p>
                        </div>
                      </div>

                      {refLink && (
                        <div className="flex items-center gap-2 bg-lab-bg rounded-lg px-2 py-1.5">
                          <ExternalLink size={11} className="text-primary-600 shrink-0" />
                          <span className="text-[11px] font-mono text-lab-text truncate flex-1">{refLink}</span>
                          <CopyButton text={refLink} />
                        </div>
                      )}

                      {m.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-lab-muted">
                          <Phone size={11} /> {m.phone}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Leads Tab ── */}
        {tab === "leads" && (
          <div className="space-y-4">
            {/* Summary */}
            {summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total", value: summary.total, color: "text-lab-text" },
                  { label: "New", value: summary.new_count, color: "text-blue-600" },
                  { label: "In Pipeline", value: summary.in_pipeline, color: "text-orange-600" },
                  { label: "Converted", value: summary.converted, color: "text-green-600" },
                ].map((s) => (
                  <Card key={s.label} className="p-3 text-center">
                    <p className={clsx("text-xl font-bold", s.color)}>{s.value}</p>
                    <p className="text-xs text-lab-muted">{s.label}</p>
                  </Card>
                ))}
              </div>
            )}

            {/* Filters */}
            <Card>
              <div className="p-4 border-b border-lab-border flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[180px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lab-muted" />
                  <input
                    className="input pl-8 w-full text-sm"
                    placeholder="Search leads..."
                    value={leadsFilter.search}
                    onChange={(e) => setLeadsFilter((f) => ({ ...f, search: e.target.value }))}
                  />
                </div>
                <select
                  className="select text-sm w-full sm:w-auto"
                  value={leadsFilter.status}
                  onChange={(e) => setLeadsFilter((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="">All Statuses</option>
                  {LEAD_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <select
                  className="select text-sm w-full sm:w-auto"
                  value={leadsFilter.marketer_id}
                  onChange={(e) => setLeadsFilter((f) => ({ ...f, marketer_id: e.target.value }))}
                >
                  <option value="">All Marketers</option>
                  {marketers.map((m) => (
                    <option key={m.id} value={m.id}>{m.full_name}</option>
                  ))}
                </select>
              </div>

              {lLoading ? (
                <div className="flex justify-center py-12"><Spinner /></div>
              ) : leads.length === 0 ? (
                <EmptyState icon={<Users size={32} />} title="No leads found" />
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Lead</th>
                        <th>Contact</th>
                        <th>Location</th>
                        <th>Marketer</th>
                        <th>Status</th>
                        <th>Added</th>
                        <th>Move To</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead) => (
                        <tr key={lead.id}>
                          <td>
                            <div>
                              <p className="font-medium text-lab-text">{lead.name}</p>
                              {lead.company && <p className="text-xs text-lab-muted">{lead.company}</p>}
                            </div>
                          </td>
                          <td>
                            <div>
                              <p className="text-sm">{lead.phone}</p>
                              {lead.email && <p className="text-xs text-lab-muted">{lead.email}</p>}
                            </div>
                          </td>
                          <td className="text-sm text-lab-muted">
                            {[lead.city, lead.state].filter(Boolean).join(", ") || "—"}
                          </td>
                          <td className="text-sm">{lead.marketer_name}</td>
                          <td><LeadStatusBadge status={lead.status} /></td>
                          <td className="text-xs text-lab-muted">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </td>
                          <td>
                            <div className="flex items-center gap-2 flex-wrap">
                              <select
                                className="select text-xs py-1 h-7"
                                value={lead.status}
                                onChange={(e) => statusMutation.mutate({ id: lead.id, status: e.target.value })}
                              >
                                {LEAD_STATUSES.map((s) => (
                                  <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                              </select>
                              {lead.status === "converted" && !lead.converted_client_id && (
                                <button
                                  onClick={() => setConvertingLead(lead)}
                                  className="text-xs text-white bg-green-600 hover:bg-green-700 px-2 py-1 rounded-lg font-medium whitespace-nowrap"
                                >
                                  + Create Client
                                </button>
                              )}
                              {lead.converted_client_id && (
                                <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                                  ✓ Client linked
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ── Analytics Tab ── */}
        {tab === "analytics" && (
          <div className="space-y-6">
            {aLoading ? (
              <div className="flex justify-center py-16"><Spinner size={32} /></div>
            ) : (
              <>
                {/* Overview cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Total Leads", value: analyticsData?.overview?.total_leads ?? 0, color: "text-lab-text", icon: Users },
                    { label: "Converted", value: analyticsData?.overview?.converted ?? 0, color: "text-green-600", icon: UserCheck },
                    { label: "In Pipeline", value: analyticsData?.overview?.in_pipeline ?? 0, color: "text-orange-600", icon: Target },
                    { label: "Lost", value: analyticsData?.overview?.lost ?? 0, color: "text-red-600", icon: BarChart3 },
                  ].map((s) => (
                    <Card key={s.label} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-lab-muted">{s.label}</p>
                        <s.icon size={15} className={s.color} />
                      </div>
                      <p className={clsx("text-2xl font-bold", s.color)}>{s.value}</p>
                    </Card>
                  ))}
                </div>

                {/* Leaderboard */}
                <Card>
                  <div className="p-4 border-b border-lab-border flex items-center gap-2">
                    <Trophy size={16} className="text-yellow-500" />
                    <h3 className="font-display font-semibold text-lab-text text-sm">Leaderboard</h3>
                  </div>
                  {(!analyticsData?.leaderboard || analyticsData.leaderboard.length === 0) ? (
                    <EmptyState icon={<Trophy size={28} />} title="No data yet" />
                  ) : (
                    <div className="table-wrap">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Marketer</th>
                            <th>Total Leads</th>
                            <th>In Pipeline</th>
                            <th>Converted</th>
                            <th>Conversion Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.leaderboard.map((row: any, i: number) => (
                            <tr key={row.marketer_id}>
                              <td>
                                <span className={clsx(
                                  "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                                  i === 0 ? "bg-yellow-100 text-yellow-700" :
                                  i === 1 ? "bg-gray-100 text-gray-600" :
                                  i === 2 ? "bg-orange-100 text-orange-600" : "text-lab-muted",
                                )}>
                                  {i + 1}
                                </span>
                              </td>
                              <td className="font-medium text-lab-text">{row.marketer_name}</td>
                              <td>{row.total_leads}</td>
                              <td>{row.in_pipeline}</td>
                              <td className="text-green-600 font-semibold">{row.converted}</td>
                              <td>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full max-w-[80px]">
                                    <div
                                      className="h-1.5 bg-primary-500 rounded-full"
                                      style={{ width: `${row.conversion_rate}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-semibold text-primary-600">{row.conversion_rate}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>

                {/* By Status */}
                {analyticsData?.byStatus && (
                  <Card className="p-4">
                    <h3 className="font-display font-semibold text-lab-text text-sm mb-3">Lead Pipeline Breakdown</h3>
                    <div className="flex flex-wrap gap-3">
                      {analyticsData.byStatus.map((s: any) => {
                        const def = LEAD_STATUSES.find((x) => x.value === s.status);
                        return (
                          <div key={s.status} className={clsx("flex items-center gap-2 px-3 py-2 rounded-lg", def?.color ?? "bg-gray-100 text-gray-700")}>
                            <span className="text-lg font-bold">{s.count}</span>
                            <span className="text-xs">{def?.label ?? s.status}</span>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        )}
      </PageContainer>

      {/* Add Lead Modal */}
      <Modal open={addLeadOpen} onClose={() => setAddLeadOpen(false)} title="Add Lead" size="md">
        <LeadForm
          form={leadForm}
          setForm={setLeadForm}
          onSubmit={() => createLeadMutation.mutate(leadForm)}
          loading={createLeadMutation.isPending}
          onCancel={() => setAddLeadOpen(false)}
          marketers={marketers}
        />
      </Modal>

      {convertingLead && (
        <ConvertToClientModal
          lead={convertingLead}
          onClose={() => setConvertingLead(null)}
        />
      )}
    </AppShell>
  );
}

// ─── Convert Lead → Client Modal ──────────────────────────────────────────────

function ConvertToClientModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: lead.name,
    company: lead.company ?? "",
    phone: lead.phone,
    email: lead.email ?? "",
    contact_person: "",
    notes: lead.notes ?? "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const mutation = useMutation({
    mutationFn: async () => {
      // 1. Create the client record
      const res = await api.post("/clients", form);
      const clientId = res.data.data?.id ?? res.data.id;
      // 2. Link back to the lead
      await api.patch(`/marketers/leads/${lead.id}/status`, {
        status: "converted",
        client_id: clientId,
      });
      return clientId;
    },
    onSuccess: () => {
      toast.success("Client created and linked to lead");
      qc.invalidateQueries({ queryKey: ["admin-leads"] });
      qc.invalidateQueries({ queryKey: ["my-leads"] });
      qc.invalidateQueries({ queryKey: ["marketer-my-stats"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed to create client"),
  });

  return (
    <Modal open onClose={onClose} title={`Convert Lead to Client — ${lead.name}`} size="md">
      <div className="space-y-4">
        <p className="text-xs text-lab-muted">
          This will create a new client record and link it to this lead for attribution tracking.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Client Name *" value={form.name} onChange={set("name")} />
          <Input label="Phone *" value={form.phone} onChange={set("phone")} />
          <Input label="Company / Organisation" value={form.company} onChange={set("company")} />
          <Input label="Email" type="email" value={form.email} onChange={set("email")} />
          <Input label="Contact Person" value={form.contact_person} onChange={set("contact_person")} className="sm:col-span-2" />
        </div>
        <Textarea label="Notes" value={form.notes} onChange={set("notes")} rows={2} />
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="secondary" onClick={onClose} size="sm">Cancel</Button>
          <Button
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
            size="sm"
            disabled={!form.name || !form.phone}
          >
            Create Client
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Export: route decides which view ─────────────────────────────────────────

export default function MarketersPage() {
  const { user } = useAuth();
  if (user?.role === "marketer") return <MarketerDashboard />;
  return <AdminMarketersPage />;
}
