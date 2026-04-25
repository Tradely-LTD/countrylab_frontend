import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";
import React from "react";
import { AuthProvider, useAuth } from "./lib/auth";
import { LoginPage } from "./pages/auth/LoginPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";
import DashboardPage from "./pages/dashboard";
import { SamplesListPage, SampleDetailPage } from "./pages/samples";
import { ResultsListPage, ResultDetailPage } from "./pages/results";
import { ApprovalQueuePage } from "./pages/results/ApprovalQueue";
import { RequestsListPage, RequestDetailPage } from "./pages/requests";
import { PublicRequestForm } from "./pages/public/RequestForm";
import { LandingPage } from "./pages/public/LandingPage";
import { ReferralPage } from "./pages/public/ReferralPage";
import MarketersPage from "./pages/marketers";
import { InventoryPage } from "./pages/inventory";
import {
  AssetsPage,
  ProcurementPage,
  ClientsPage,
  SuppliersPage,
  TeamPage,
} from "./pages/admin";
import { VerifyPage, AuditLogsPage } from "./pages/verify";
import { SettingsPage } from "./pages/settings";
import InvoicesPage from "./pages/invoices";
import InvoiceDetailPage from "./pages/invoices/InvoiceDetailPage";
import CreateInvoicePage from "./pages/invoices/CreateInvoicePage";
import EditInvoicePage from "./pages/invoices/EditInvoicePage";
import { Spinner } from "./components/ui";
import ReportsPage from "./pages/reports";

// ─── Error Boundary ───────────────────────────────────────────────────────────
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-lab-bg p-6">
          <div className="text-center max-w-md">
            <p className="text-red-600 font-semibold text-lg mb-2">
              Something went wrong
            </p>
            <p className="text-sm text-lab-muted mb-4">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = "/dashboard";
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-lab-bg">
        <div className="text-center">
          <Spinner size={32} />
          <p className="text-sm text-lab-muted mt-3">
            Loading Countrylab LMS...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <Routes>
              {/* Public */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/request" element={<PublicRequestForm />} />
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/verify/:qrHash" element={<VerifyPage />} />
              <Route path="/ref/:code" element={<ReferralPage />} />

              {/* Protected */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/samples"
                element={
                  <ProtectedRoute>
                    <SamplesListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/samples/new"
                element={
                  <ProtectedRoute>
                    <SamplesListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/samples/:id"
                element={
                  <ProtectedRoute>
                    <SampleDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/results"
                element={
                  <ProtectedRoute>
                    <ResultsListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/results/new"
                element={
                  <ProtectedRoute>
                    <ResultsListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/results/:id"
                element={
                  <ProtectedRoute>
                    <ResultDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/requests"
                element={
                  <ProtectedRoute>
                    <RequestsListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/requests/:id"
                element={
                  <ProtectedRoute>
                    <RequestDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/approval-queue"
                element={
                  <ProtectedRoute>
                    <ApprovalQueuePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inventory"
                element={
                  <ProtectedRoute>
                    <InventoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assets"
                element={
                  <ProtectedRoute>
                    <AssetsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/assets/new"
                element={
                  <ProtectedRoute>
                    <AssetsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/procurement"
                element={
                  <ProtectedRoute>
                    <ProcurementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/procurement/new"
                element={
                  <ProtectedRoute>
                    <ProcurementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clients"
                element={
                  <ProtectedRoute>
                    <ClientsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/suppliers"
                element={
                  <ProtectedRoute>
                    <SuppliersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/team"
                element={
                  <ProtectedRoute>
                    <TeamPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/audit-logs"
                element={
                  <ProtectedRoute>
                    <AuditLogsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoices"
                element={
                  <ProtectedRoute>
                    <InvoicesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoices/new"
                element={
                  <ProtectedRoute>
                    <CreateInvoicePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoices/:id"
                element={
                  <ProtectedRoute>
                    <InvoiceDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoices/:id/edit"
                element={
                  <ProtectedRoute>
                    <EditInvoicePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/marketers"
                element={
                  <ProtectedRoute>
                    <MarketersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />

              {/* 404 */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ErrorBoundary>

          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#1e293b",
                color: "#f8fafc",
                fontSize: "13px",
                borderRadius: "10px",
                padding: "12px 16px",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
              },
              success: {
                iconTheme: { primary: "#10b981", secondary: "#fff" },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "#fff" },
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}

export default App;
