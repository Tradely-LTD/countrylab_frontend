import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Plus,
  Eye,
  Download,
  DollarSign,
  Filter,
  Search,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { api } from "../../lib/api";
import { AppShell, PageContainer, TopHeader } from "../../components/layout";
import {
  Button,
  Input,
  Card,
  Badge,
  Skeleton,
  EmptyState,
  Modal,
} from "../../components/ui";
import toast from "react-hot-toast";
import { clsx } from "clsx";

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(
    null,
  );
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    accountName: "",
    bankName: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["invoices", statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      return api.get(`/invoices?${params}`).then((r) => r.data.data);
    },
  });

  const qc = useQueryClient();

  const markPaid = useMutation({
    mutationFn: (data: { invoiceId: string; payment_method: string }) =>
      api.patch(`/invoices/${data.invoiceId}/payment`, {
        payment_method: data.payment_method,
      }),
    onSuccess: () => {
      toast.success("Invoice marked as paid");
      qc.invalidateQueries({ queryKey: ["invoices"] });
      setShowPaymentModal(false);
      setSelectedInvoiceId(null);
      setPaymentMethod("Cash");
      setBankDetails({ accountNumber: "", accountName: "", bankName: "" });
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.error || "Failed to update invoice"),
  });

  const handleMarkPaid = () => {
    if (!selectedInvoiceId) return;

    let paymentMethodStr = paymentMethod;

    if (paymentMethod === "Bank Transfer") {
      if (
        !bankDetails.accountNumber ||
        !bankDetails.accountName ||
        !bankDetails.bankName
      ) {
        toast.error("Please fill in all bank transfer details");
        return;
      }
      paymentMethodStr = `Bank Transfer (${bankDetails.bankName} - ${bankDetails.accountName} - ${bankDetails.accountNumber})`;
    }

    markPaid.mutate({
      invoiceId: selectedInvoiceId,
      payment_method: paymentMethodStr,
    });
  };

  const openPaymentModal = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setShowPaymentModal(true);
  };

  const filteredInvoices = data?.filter((inv: any) => {
    const searchLower = search.toLowerCase();
    return (
      inv.invoice_number.toLowerCase().includes(searchLower) ||
      inv.client?.name?.toLowerCase().includes(searchLower) ||
      inv.client?.company?.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: data?.length || 0,
    unpaid: data?.filter((i: any) => i.status === "unpaid").length || 0,
    paid: data?.filter((i: any) => i.status === "paid").length || 0,
    overdue:
      data?.filter((i: any) => {
        if (i.status !== "unpaid") return false;
        return i.due_date && new Date(i.due_date) < new Date();
      }).length || 0,
  };

  return (
    <AppShell>
      <TopHeader
        title="Invoices"
        subtitle="Manage billing and payments"
        icon={<FileText />}
        actions={
          <Button
            leftIcon={<Plus size={16} />}
            onClick={() => navigate("/invoices/new")}
          >
            Create Invoice
          </Button>
        }
      />

      <PageContainer>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <FileText className="text-gray-400" size={32} />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unpaid</p>
                <p className="text-2xl font-bold mt-1 text-orange-600">
                  {stats.unpaid}
                </p>
              </div>
              <Clock className="text-orange-400" size={32} />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paid</p>
                <p className="text-2xl font-bold mt-1 text-green-600">
                  {stats.paid}
                </p>
              </div>
              <CheckCircle className="text-green-400" size={32} />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold mt-1 text-red-600">
                  {stats.overdue}
                </p>
              </div>
              <XCircle className="text-red-400" size={32} />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search by invoice number or client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search size={16} />}
              />
            </div>
            <div className="flex gap-2">
              {["all", "unpaid", "paid", "overdue", "voided"].map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={statusFilter === status ? "primary" : "outline"}
                  onClick={() => setStatusFilter(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Invoices Table */}
        <Card>
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !filteredInvoices || filteredInvoices.length === 0 ? (
            <EmptyState
              icon={<FileText size={48} />}
              title="No invoices found"
              description="Create your first invoice to get started"
              action={
                <Button
                  leftIcon={<Plus size={16} />}
                  onClick={() => navigate("/invoices/new")}
                >
                  Create Invoice
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Invoice #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredInvoices.map((invoice: any) => (
                    <InvoiceRow
                      key={invoice.id}
                      invoice={invoice}
                      onMarkPaid={openPaymentModal}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </PageContainer>

      {/* Payment Modal */}
      <Modal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Mark Invoice as Paid"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                if (e.target.value !== "Bank Transfer") {
                  setBankDetails({
                    accountNumber: "",
                    accountName: "",
                    bankName: "",
                  });
                }
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {paymentMethod === "Bank Transfer" && (
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-sm text-blue-900">
                Bank Transfer Details
              </h4>
              <Input
                label="Account Number *"
                value={bankDetails.accountNumber}
                onChange={(e) =>
                  setBankDetails({
                    ...bankDetails,
                    accountNumber: e.target.value,
                  })
                }
                placeholder="e.g., 1234567890"
              />
              <Input
                label="Account Name *"
                value={bankDetails.accountName}
                onChange={(e) =>
                  setBankDetails({
                    ...bankDetails,
                    accountName: e.target.value,
                  })
                }
                placeholder="e.g., John Doe"
              />
              <Input
                label="Bank Name *"
                value={bankDetails.bankName}
                onChange={(e) =>
                  setBankDetails({ ...bankDetails, bankName: e.target.value })
                }
                placeholder="e.g., First Bank"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowPaymentModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleMarkPaid}
              loading={markPaid.isPending}
              leftIcon={<DollarSign size={16} />}
              className="flex-1"
            >
              Confirm Payment
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}

function InvoiceRow({
  invoice,
  onMarkPaid,
}: {
  invoice: any;
  onMarkPaid: (invoiceId: string) => void;
}) {
  const navigate = useNavigate();

  const getStatusBadge = (status: string, dueDate: string | null) => {
    if (status === "paid") return <Badge variant="success">Paid</Badge>;
    if (status === "voided") return <Badge variant="error">Voided</Badge>;
    if (status === "unpaid" && dueDate && new Date(dueDate) < new Date())
      return <Badge variant="error">Overdue</Badge>;
    if (status === "unpaid") return <Badge variant="warning">Unpaid</Badge>;
    if (status === "partial") return <Badge variant="info">Partial</Badge>;
    return <Badge>{status}</Badge>;
  };

  const formatCurrency = (amount: number, currency: string = "NGN") => {
    if (currency === "NGN") {
      return `₦ ${amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
    }
    return `${currency} ${amount.toFixed(2)}`;
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="font-mono text-sm font-medium">
          {invoice.invoice_number}
        </span>
      </td>
      <td className="px-6 py-4">
        <div>
          <div className="font-medium">{invoice.client?.name}</div>
          {invoice.client?.company && (
            <div className="text-sm text-gray-500">
              {invoice.client.company}
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap font-medium">
        {formatCurrency(invoice.total, invoice.currency)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {getStatusBadge(invoice.status, invoice.due_date)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        {invoice.due_date
          ? new Date(invoice.due_date).toLocaleDateString()
          : "—"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(invoice.created_at).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<Eye size={14} />}
            onClick={() => navigate(`/invoices/${invoice.id}`)}
          >
            View
          </Button>
          {invoice.status === "unpaid" && (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<DollarSign size={14} />}
              onClick={() => onMarkPaid(invoice.id)}
            >
              Mark Paid
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
