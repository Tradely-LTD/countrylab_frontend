// Roles & Permissions — admins choose what each role may view, create, edit,
// delete or approve. The backend enforces the same permissions on every endpoint.
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clsx } from "clsx";
import toast from "react-hot-toast";
import { Lock, Plus, RotateCcw, ShieldCheck, Trash2, Users } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { AppShell, PageContainer, TopHeader } from "../../components/layout";
import {
  Button,
  EmptyState,
  Input,
  Modal,
  Select,
  Skeleton,
  Textarea,
} from "../../components/ui";

interface Role {
  key: string;
  name: string;
  description: string | null;
  is_system: boolean;
  is_customized: boolean;
  permissions: string[];
  user_count: number;
  editable: boolean;
}

interface CatalogModule {
  module: string;
  label: string;
  actions: Record<string, string>;
}

// Standard columns; any other action a module has goes under "More"
const COLUMNS = [
  { key: "view", label: "View" },
  { key: "create", label: "Create" },
  { key: "update", label: "Edit" },
  { key: "delete", label: "Delete" },
  { key: "approve", label: "Approve" },
];
const STANDARD = new Set(COLUMNS.map((c) => c.key));

export function RolesPage() {
  const qc = useQueryClient();
  const { user, can, refreshProfile } = useAuth();
  const canManage = can("roles.update");

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<Set<string> | null>(null);
  const [showNew, setShowNew] = useState(false);

  const { data: roles, isLoading } = useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: () => api.get("/roles").then((r) => r.data.data),
  });
  const { data: catalog } = useQuery<CatalogModule[]>({
    queryKey: ["roles-catalog"],
    queryFn: () => api.get("/roles/catalog").then((r) => r.data.data),
    staleTime: Infinity,
  });

  const selected = roles?.find((r) => r.key === selectedKey) ?? roles?.[0];
  const editable = canManage && !!selected?.editable;

  // Reset the draft whenever a different role is shown or the role reloads
  useEffect(() => {
    setDraft(selected ? new Set(selected.permissions) : null);
  }, [selected?.key, selected?.permissions.join(",")]);

  const dirty = useMemo(() => {
    if (!draft || !selected) return false;
    const orig = new Set(selected.permissions);
    return draft.size !== orig.size || [...draft].some((p) => !orig.has(p));
  }, [draft, selected]);

  const afterChange = async (key?: string) => {
    await qc.invalidateQueries({ queryKey: ["roles"] });
    if (key && key === user?.role) await refreshProfile();
  };

  const save = useMutation({
    mutationFn: () =>
      api.put(`/roles/${selected!.key}`, { permissions: [...draft!] }),
    onSuccess: async () => {
      toast.success(`Permissions for ${selected!.name} saved`);
      await afterChange(selected!.key);
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed to save"),
  });

  const reset = useMutation({
    mutationFn: () => api.post(`/roles/${selected!.key}/reset`),
    onSuccess: async () => {
      toast.success(`${selected!.name} reset to default permissions`);
      await afterChange(selected!.key);
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed to reset"),
  });

  const remove = useMutation({
    mutationFn: () => api.delete(`/roles/${selected!.key}`),
    onSuccess: async () => {
      toast.success(`${selected!.name} deleted`);
      setSelectedKey(null);
      await afterChange();
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed to delete"),
  });

  const toggle = (perm: string) => {
    if (!editable || !draft) return;
    const next = new Set(draft);
    if (next.has(perm)) next.delete(perm);
    else next.add(perm);
    setDraft(next);
  };

  const toggleRow = (m: CatalogModule, on: boolean) => {
    if (!editable || !draft) return;
    const next = new Set(draft);
    for (const a of Object.keys(m.actions)) {
      if (on) next.add(`${m.module}.${a}`);
      else next.delete(`${m.module}.${a}`);
    }
    setDraft(next);
  };

  const builtIn = (roles ?? []).filter((r) => r.is_system);
  const custom = (roles ?? []).filter((r) => !r.is_system);

  return (
    <AppShell>
      <TopHeader
        title="Roles & Permissions"
        subtitle="Choose what each role can view, create, edit, delete and approve"
        actions={
          canManage && (
            <Button leftIcon={<Plus size={14} />} onClick={() => setShowNew(true)}>
              New Role
            </Button>
          )
        }
      />
      <PageContainer>
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 items-start">
          {/* ── Role list ── */}
          <nav className="card p-2 lg:sticky lg:top-20" aria-label="Roles">
            {isLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 m-1" />
              ))}
            {[
              { title: "Built-in roles", items: builtIn },
              { title: "Custom roles", items: custom },
            ].map(
              (group) =>
                group.items.length > 0 && (
                  <div key={group.title} className="mb-2 last:mb-0">
                    <p className="section-label mt-2">{group.title}</p>
                    {group.items.map((r) => (
                      <button
                        key={r.key}
                        onClick={() => setSelectedKey(r.key)}
                        className={clsx(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[13.5px] transition-colors",
                          selected?.key === r.key
                            ? "bg-primary-50 text-primary-800 font-semibold"
                            : "text-slate-700 hover:bg-slate-100",
                        )}
                        aria-current={selected?.key === r.key ? "true" : undefined}
                      >
                        <span className="flex-1 truncate">{r.name}</span>
                        {r.key === "super_admin" ? (
                          <Lock size={12} className="text-slate-400 shrink-0" aria-label="Locked" />
                        ) : r.is_system && r.is_customized ? (
                          <span className="text-[10px] font-medium text-amber-700 bg-amber-50 ring-1 ring-inset ring-amber-600/20 rounded px-1">
                            Edited
                          </span>
                        ) : null}
                        <span
                          className="inline-flex items-center gap-1 text-xs text-lab-muted tabular-nums shrink-0"
                          title={`${r.user_count} active user(s)`}
                        >
                          <Users size={12} />
                          {r.user_count}
                        </span>
                      </button>
                    ))}
                  </div>
                ),
            )}
          </nav>

          {/* ── Permission matrix ── */}
          <section className="card overflow-hidden" aria-label="Permissions">
            {!selected || !catalog || !draft ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-8" />
                ))}
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start gap-3 px-5 py-4 border-b border-lab-border">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold">{selected.name}</h2>
                      <span
                        className={clsx(
                          "badge",
                          selected.is_system
                            ? "bg-slate-50 text-slate-600 ring-slate-500/20"
                            : "bg-violet-50 text-violet-700 ring-violet-600/20",
                        )}
                      >
                        {selected.is_system ? "Built-in" : "Custom"}
                      </span>
                    </div>
                    <p className="text-xs text-lab-muted mt-0.5">
                      {selected.key === "super_admin"
                        ? "Super Admin always has full access so nobody can be locked out. It can't be edited."
                        : selected.description ||
                          `${draft.size} permission${draft.size === 1 ? "" : "s"} · ${selected.user_count} active user${selected.user_count === 1 ? "" : "s"}`}
                    </p>
                  </div>
                  {canManage && selected.is_system && selected.is_customized && (
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<RotateCcw size={13} />}
                      loading={reset.isPending}
                      onClick={() => {
                        if (confirm(`Reset ${selected.name} to its default permissions?`))
                          reset.mutate();
                      }}
                    >
                      Reset to default
                    </Button>
                  )}
                  {canManage && !selected.is_system && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      leftIcon={<Trash2 size={13} />}
                      loading={remove.isPending}
                      onClick={() => {
                        if (confirm(`Delete the ${selected.name} role?`)) remove.mutate();
                      }}
                    >
                      Delete role
                    </Button>
                  )}
                </div>

                {!canManage && (
                  <p className="px-5 py-2 text-xs text-lab-muted bg-slate-50 border-b border-lab-border">
                    You can view permissions but not change them.
                  </p>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[720px]">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-lab-border">
                        <th className="px-5 py-2.5 text-left text-xs font-medium text-slate-500">
                          Module
                        </th>
                        {COLUMNS.map((c) => (
                          <th key={c.key} className="px-2 py-2.5 text-center text-xs font-medium text-slate-500 w-[76px]">
                            {c.label}
                          </th>
                        ))}
                        <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500">
                          More
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {catalog.map((m) => {
                        const actions = Object.keys(m.actions);
                        const onCount = actions.filter((a) => draft.has(`${m.module}.${a}`)).length;
                        const extras = actions.filter((a) => !STANDARD.has(a));
                        return (
                          <tr key={m.module} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                            <td className="px-5 py-2.5">
                              <label className={clsx("flex items-center gap-2.5", editable && "cursor-pointer")}>
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus-visible:ring-primary-500 disabled:opacity-60"
                                  checked={onCount === actions.length}
                                  ref={(el) => {
                                    if (el) el.indeterminate = onCount > 0 && onCount < actions.length;
                                  }}
                                  disabled={!editable}
                                  onChange={(e) => toggleRow(m, e.target.checked)}
                                  aria-label={`All ${m.label} permissions`}
                                />
                                <span className="font-medium text-[13.5px]">{m.label}</span>
                              </label>
                            </td>
                            {COLUMNS.map((c) => {
                              const perm = `${m.module}.${c.key}`;
                              return (
                                <td key={c.key} className="px-2 py-2.5 text-center">
                                  {m.actions[c.key as keyof typeof m.actions] !== undefined ? (
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus-visible:ring-primary-500 disabled:opacity-60 cursor-pointer disabled:cursor-default"
                                      checked={draft.has(perm)}
                                      disabled={!editable}
                                      onChange={() => toggle(perm)}
                                      aria-label={`${m.label}: ${(m.actions as Record<string, string>)[c.key]}`}
                                      title={(m.actions as Record<string, string>)[c.key]}
                                    />
                                  ) : (
                                    <span className="text-slate-300" aria-hidden>—</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap gap-x-4 gap-y-1">
                                {extras.map((a) => {
                                  const perm = `${m.module}.${a}`;
                                  return (
                                    <label key={a} className={clsx("inline-flex items-center gap-1.5 text-xs text-slate-700", editable && "cursor-pointer")}>
                                      <input
                                        type="checkbox"
                                        className="h-3.5 w-3.5 rounded border-slate-300 text-primary-600 focus-visible:ring-primary-500 disabled:opacity-60"
                                        checked={draft.has(perm)}
                                        disabled={!editable}
                                        onChange={() => toggle(perm)}
                                      />
                                      {(m.actions as Record<string, string>)[a]}
                                    </label>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {editable && dirty && (
                  <div className="sticky bottom-0 flex items-center justify-between gap-3 px-5 py-3 border-t border-lab-border bg-white/95 backdrop-blur">
                    <p className="text-sm text-slate-700">
                      Unsaved changes to <strong>{selected.name}</strong>
                      {selected.user_count > 0 &&
                        ` — affects ${selected.user_count} user${selected.user_count === 1 ? "" : "s"}`}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => setDraft(new Set(selected.permissions))}>
                        Discard
                      </Button>
                      <Button size="sm" loading={save.isPending} onClick={() => save.mutate()}>
                        Save changes
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        {!isLoading && (roles ?? []).length === 0 && (
          <EmptyState icon={<ShieldCheck size={28} />} title="No roles found" />
        )}
      </PageContainer>

      {showNew && (
        <NewRoleModal
          roles={roles ?? []}
          onClose={() => setShowNew(false)}
          onCreated={(key) => {
            setShowNew(false);
            setSelectedKey(key);
          }}
        />
      )}
    </AppShell>
  );
}

function NewRoleModal({
  roles,
  onClose,
  onCreated,
}: {
  roles: Role[];
  onClose: () => void;
  onCreated: (key: string) => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: "", description: "", copy_from: "" });
  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  const create = useMutation({
    mutationFn: () =>
      api.post("/roles", {
        name: form.name,
        description: form.description || undefined,
        copy_from: form.copy_from || undefined,
      }),
    onSuccess: async (res) => {
      toast.success(`${form.name} created`);
      await qc.invalidateQueries({ queryKey: ["roles"] });
      onCreated(res.data.data.key);
    },
    onError: (e: any) => toast.error(e.response?.data?.error || "Failed to create role"),
  });

  return (
    <Modal open onClose={onClose} title="New Role" size="md">
      <div className="space-y-3">
        <Input
          label="Role name *"
          placeholder="e.g. Sampling Officer"
          value={form.name}
          onChange={set("name")}
          autoFocus
        />
        <Textarea
          label="Description"
          placeholder="What this role is for"
          value={form.description}
          onChange={set("description")}
        />
        <Select
          label="Start from"
          value={form.copy_from}
          onChange={set("copy_from")}
          options={[
            { value: "", label: "No permissions (blank)" },
            ...roles
              .filter((r) => r.key !== "super_admin")
              .map((r) => ({ value: r.key, label: `Copy ${r.name}` })),
          ]}
        />
        <p className="text-xs text-lab-muted">
          You can fine-tune every permission after the role is created.
        </p>
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={() => create.mutate()}
            loading={create.isPending}
            disabled={form.name.trim().length < 2}
            className="flex-1"
          >
            Create role
          </Button>
        </div>
      </div>
    </Modal>
  );
}
