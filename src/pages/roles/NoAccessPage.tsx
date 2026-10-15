import { ShieldOff } from "lucide-react";
import { AppShell, PageContainer, TopHeader } from "../../components/layout";
import { EmptyState } from "../../components/ui";
import { useAuth } from "../../lib/auth";
import { roleLabel } from "../../lib/roles";

// Shown when a user's role has no page permissions at all
export function NoAccessPage() {
  const { user } = useAuth();
  return (
    <AppShell>
      <TopHeader title="No access yet" />
      <PageContainer>
        <div className="card">
          <EmptyState
            icon={<ShieldOff size={28} />}
            title="Your role doesn't have access to any pages"
            description={`You're signed in as ${user?.role_name ?? roleLabel(user?.role)}. Ask an administrator to grant permissions under Roles & Permissions.`}
          />
        </div>
      </PageContainer>
    </AppShell>
  );
}
