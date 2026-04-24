import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FileText, Printer, DollarSign, Edit, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { AppShell, PageContainer, TopHeader } from "../../components/layout";
import { Button, Badge, Skeleton, Modal, Input } from "../../components/ui";
import toast from "react-hot-toast";

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    accountName: "",
    bankName: "",
  });

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => api.get(`/invoices/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

  const markPaid = useMutation({
    mutationFn: (data: { payment_method: string; bank_details?: any }) =>
      api.patch(`/invoices/${id}/payment`, data),
    onSuccess: () => {
      toast.success("Invoice marked as paid");
      qc.invalidateQueries({ queryKey: ["invoice", id] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      setShowPaymentModal(false);
      setPaymentMethod("Cash");
      setBankDetails({ accountNumber: "", accountName: "", bankName: "" });
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.error || "Failed to update invoice"),
  });

  const handleMarkPaid = () => {
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

    markPaid.mutate({ payment_method: paymentMethodStr });
  };

  const voidInvoice = useMutation({
    mutationFn: () => api.delete(`/invoices/${id}`),
    onSuccess: () => {
      toast.success("Invoice voided");
      navigate("/invoices");
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.error || "Failed to void invoice"),
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <AppShell>
        <PageContainer>
          <Skeleton className="h-64 w-full" />
        </PageContainer>
      </AppShell>
    );
  }

  if (!invoice) {
    return (
      <AppShell>
        <PageContainer>
          <div className="text-center py-12">
            <p className="text-gray-500">Invoice not found</p>
            <Button className="mt-4" onClick={() => navigate("/invoices")}>
              Back to Invoices
            </Button>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  const formatCurrency = (amount: number, currency: string = "NGN") => {
    if (currency === "NGN") {
      return `₦ ${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${currency} ${amount.toFixed(2)}`;
  };

  const getStatusBadge = (status: string) => {
    if (status === "paid") return <Badge variant="success">Paid</Badge>;
    if (status === "voided") return <Badge variant="error">Voided</Badge>;
    if (status === "unpaid") return <Badge variant="warning">Unpaid</Badge>;
    if (status === "partial") return <Badge variant="info">Partial</Badge>;
    return <Badge>{status}</Badge>;
  };

  const org = invoice.organization;
  const client = invoice.client;
  const logoUrl = org?.logo_url
    ? org.logo_url.startsWith("http")
      ? org.logo_url
      : `${org.logo_url}?v=${org.updated_at ? new Date(org.updated_at).getTime() : Date.now()}`
    : null;

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-print-area,
          #invoice-print-area * {
            visibility: visible;
          }
          #invoice-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
          
          /* Reduce spacing for print */
          #invoice-print-area .p-8 {
            padding: 0.75rem !important;
          }
          
          #invoice-print-area .mb-8 {
            margin-bottom: 0.75rem !important;
          }
          
          #invoice-print-area .mb-6 {
            margin-bottom: 0.5rem !important;
          }
          
          #invoice-print-area .mb-4 {
            margin-bottom: 0.25rem !important;
          }
          
          #invoice-print-area .mb-2 {
            margin-bottom: 0.125rem !important;
          }
          
          #invoice-print-area .gap-4 {
            gap: 0.5rem !important;
          }
          
          #invoice-print-area h1 {
            font-size: 1.25rem !important;
            margin-bottom: 0 !important;
          }
          
          #invoice-print-area h2 {
            font-size: 1rem !important;
          }
          
          #invoice-print-area h3 {
            font-size: 0.65rem !important;
            margin-bottom: 0.125rem !important;
          }
          
          #invoice-print-area .text-sm {
            font-size: 0.65rem !important;
          }
          
          #invoice-print-area .text-xs {
            font-size: 0.6rem !important;
            line-height: 1.2 !important;
          }
          
          #invoice-print-area .h-12 {
            height: 2rem !important;
          }
          
          #invoice-print-area .leading-tight {
            line-height: 1.1 !important;
          }
          
          /* Force print colors for table header */
          .print-table-header {
            background-color: #1f2937 !important;
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Ensure table borders print */
          table {
            border-collapse: collapse !important;
          }
          
          table, th, td {
            border: 1px solid #e5e7eb !important;
          }
        }
        
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 120px;
          font-weight: bold;
          opacity: 0.1;
          pointer-events: none;
          z-index: 1;
          white-space: nowrap;
        }
        
        .watermark-paid {
          color: #10b981;
        }
        
        .watermark-unpaid {
          color: #f59e0b;
        }
        
        .watermark-voided {
          color: #ef4444;
        }
      `}</style>

      <AppShell>
        <div className="print:hidden">
          <TopHeader
            title={invoice.invoice_number}
            subtitle="Invoice Details"
            icon={<FileText />}
            backButton
            actions={
              <div className="flex gap-2">
                {invoice.status === "unpaid" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Edit size={14} />}
                      onClick={() => navigate(`/invoices/${id}/edit`)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<DollarSign size={14} />}
                      onClick={() => setShowPaymentModal(true)}
                    >
                      Mark Paid
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Printer size={14} />}
                  onClick={handlePrint}
                >
                  Print
                </Button>
                {invoice.status !== "paid" && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Trash2 size={14} />}
                    onClick={() => {
                      if (
                        confirm("Are you sure you want to void this invoice?")
                      ) {
                        voidInvoice.mutate();
                      }
                    }}
                    loading={voidInvoice.isPending}
                  >
                    Void
                  </Button>
                )}
              </div>
            }
          />
        </div>

        <PageContainer>
          <div id="invoice-print-area" className="relative">
            {/* Watermark */}
            <div className={`watermark watermark-${invoice.status}`}>
              {invoice.status.toUpperCase()}
            </div>

            <div className="p-8 max-w-4xl mx-auto bg-white rounded-lg shadow relative z-10">
              {/* Invoice Header - Compact Layout */}
              <div className="mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    {logoUrl && (
                      <img
                        src={logoUrl}
                        alt={org?.name}
                        className="h-12 object-contain"
                      />
                    )}
                    <div>
                      <h2 className="text-xl font-bold">{org?.name}</h2>
                      {org?.accreditation_number && (
                        <p className="text-xs text-gray-500">
                          {org.accreditation_number}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <h1 className="text-2xl font-bold text-gray-800">
                      INVOICE
                    </h1>
                    <div className="text-xs mt-1 print:hidden">
                      {getStatusBadge(invoice.status)}
                    </div>
                  </div>
                </div>

                {/* Biller and Billed To - Side by Side */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  {/* From */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">FROM</h3>
                    {org?.address && (
                      <p className="text-gray-600 whitespace-pre-line leading-tight">
                        {org.address}
                      </p>
                    )}
                    <div className="text-gray-600 mt-1 space-y-0.5">
                      {org?.phone && <div>Tel: {org.phone}</div>}
                      {org?.email && <div>Email: {org.email}</div>}
                    </div>
                  </div>

                  {/* To */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">
                      BILLED TO
                    </h3>
                    <div className="font-semibold">{client?.name}</div>
                    {client?.company && <div>{client.company}</div>}
                    {client?.address && (
                      <p className="text-gray-600 mt-1 whitespace-pre-line leading-tight">
                        {client.address}
                      </p>
                    )}
                    <div className="text-gray-600 mt-1 space-y-0.5">
                      {client?.phone && <div>Tel: {client.phone}</div>}
                      {client?.email && <div>Email: {client.email}</div>}
                    </div>
                  </div>

                  {/* Invoice Details */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">
                      DETAILS
                    </h3>
                    <div className="space-y-0.5">
                      <div>
                        <span className="text-gray-600">Invoice #:</span>{" "}
                        <span className="font-mono font-semibold">
                          {invoice.invoice_number}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Date:</span>{" "}
                        {new Date(invoice.created_at).toLocaleDateString()}
                      </div>
                      {invoice.due_date && (
                        <div>
                          <span className="text-gray-600">Due:</span>{" "}
                          {new Date(invoice.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="mb-8">
                <table className="w-full border border-gray-300">
                  <thead className="bg-gray-800 text-white print-table-header">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold border border-gray-300">
                        Description
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-semibold border border-gray-300">
                        Qty/Hr Rate
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold border border-gray-300">
                        Unit Price
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold border border-gray-300">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invoice.line_items?.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 text-xs border border-gray-300">
                          {item.description}
                        </td>
                        <td className="px-3 py-2 text-xs text-center border border-gray-300">
                          {item.quantity}
                        </td>
                        <td className="px-3 py-2 text-xs text-right border border-gray-300">
                          {formatCurrency(item.unit_price, invoice.currency)}
                        </td>
                        <td className="px-3 py-2 text-xs text-right font-medium border border-gray-300">
                          {formatCurrency(item.amount, invoice.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end mb-8">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">
                      {formatCurrency(invoice.subtotal, invoice.currency)}
                    </span>
                  </div>
                  {invoice.discount_amount > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>
                        Discount (
                        {invoice.discount_type === "percentage"
                          ? `${invoice.discount_value}%`
                          : "Fixed"}
                        ):
                      </span>
                      <span>
                        -{" "}
                        {formatCurrency(
                          invoice.discount_amount,
                          invoice.currency,
                        )}
                      </span>
                    </div>
                  )}
                  {invoice.tax_rate > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Tax ({invoice.tax_rate}% on{" "}
                        {formatCurrency(
                          invoice.subtotal - (invoice.discount_amount || 0),
                          invoice.currency,
                        )}
                        ):
                      </span>
                      <span className="font-medium">
                        {formatCurrency(invoice.tax_amount, invoice.currency)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>
                      {formatCurrency(invoice.total, invoice.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div className="mb-6 p-4 bg-gray-50 rounded">
                  <h3 className="font-semibold text-sm text-gray-700 mb-2">
                    SPECIAL NOTES
                  </h3>
                  <p className="text-sm text-gray-600 whitespace-pre-line">
                    {invoice.notes}
                  </p>
                </div>
              )}

              {/* Payment Info */}
              {invoice.status === "paid" && invoice.paid_at && (
                <div className="p-4 bg-green-50 border border-green-200 rounded print:hidden">
                  <div className="flex items-center gap-2 text-green-800">
                    <DollarSign size={16} />
                    <span className="font-semibold">Payment Received</span>
                  </div>
                  <div className="text-sm text-green-700 mt-1">
                    Paid on {new Date(invoice.paid_at).toLocaleDateString()}
                    {invoice.payment_method && ` via ${invoice.payment_method}`}
                  </div>
                </div>
              )}

              {/* Payment Details */}
              {(() => {
                const bankAccounts = (
                  invoice?.organization?.settings?.bank_accounts ?? []
                ).filter((a: any) => a.is_active);
                return (
                  bankAccounts.length > 0 && (
                    <div className="mb-6 p-4 bg-gray-50 rounded">
                      <h3 className="font-semibold text-sm text-gray-700 mb-2">
                        PAYMENT DETAILS
                      </h3>
                      {bankAccounts.map((acct: any) => (
                        <div
                          key={acct.id}
                          className="text-xs text-gray-600 mb-1"
                        >
                          <span className="font-medium">{acct.bank_name}</span>{" "}
                          — {acct.account_name} — {acct.account_number}
                          {acct.label && (
                            <span className="text-gray-400">
                              {" "}
                              ({acct.label})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                );
              })()}

              {/* Footer */}
              <div className="mt-8 pt-6 border-t text-center text-xs text-gray-500">
                <p>Thank you for your business!</p>
                {org?.email && (
                  <p className="mt-1">
                    For any questions, please contact us at {org.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        </PageContainer>
      </AppShell>

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
    </>
  );
}
