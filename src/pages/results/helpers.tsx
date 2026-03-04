// Continuation of Results page - Review Step & helpers

function SampleSearch({ onSelect }: { onSelect: (s: any) => void }) {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['samples-search', search],
    queryFn: () => api.get('/samples', { params: { search, status: 'received', limit: 10 } }).then(r => r.data.data),
    enabled: search.length > 0,
  });

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search sample name or ID..."
        leftIcon={<Search size={14} />}
        value={search}
        onChange={e => setSearch(e.target.value)}
        autoFocus
      />
      {isLoading && <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>}
      {(data || []).map((s: any) => (
        <button key={s.id} onClick={() => onSelect(s)}
          className="w-full text-left p-3 border border-lab-border rounded-lg hover:border-primary-300 hover:bg-blue-50/30 transition-colors flex items-center justify-between group">
          <div>
            <p className="text-sm font-medium group-hover:text-primary-700">{s.name}</p>
            <p className="text-xs text-lab-muted">{s.client?.name} · <code className="font-mono">{s.ulid}</code></p>
          </div>
          <StatusBadge status={s.status} />
        </button>
      ))}
      {search && data?.length === 0 && !isLoading && (
        <p className="text-sm text-lab-muted text-center py-4">No samples found</p>
      )}
    </div>
  );
}

function TestMethodSelector({ onSelect, onSkip }: {
  onSelect: (m: any) => void;
  onSkip: () => void;
}) {
  const { data: methods } = useQuery({
    queryKey: ['test-methods'],
    queryFn: () => api.get('/test-methods').then(r => r.data.data),
  });

  return (
    <div className="space-y-3">
      <div className="grid gap-2">
        {(methods || []).map((m: any) => (
          <button key={m.id} onClick={() => onSelect(m)}
            className="w-full text-left p-3 border border-lab-border rounded-lg hover:border-primary-300 hover:bg-blue-50/30 transition-colors">
            <p className="text-sm font-medium">{m.name}</p>
            <p className="text-xs text-lab-muted">{m.code} · {m.category} · {m.standard}</p>
          </button>
        ))}
      </div>
      <div className="pt-2 border-t border-lab-border">
        <button onClick={onSkip} className="text-sm text-lab-muted hover:text-lab-text transition-colors">
          Skip — enter custom parameters →
        </button>
      </div>
    </div>
  );
}
