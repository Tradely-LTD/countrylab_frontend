import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText, Plus, Trash2, Save } from "lucide-react";
import { api } from "../../lib/api";
import { AppShell, PageContainer, TopHeader } from "../../components/layout";
import { Button, Input, Textarea, Card, Skeleton } from "../../components/ui";
import toast from "react-hot-toast";

const invoiceSchema = z
  .object({
    client_id: z.string().min(1, "Client is required"),
    sample_id: z.string().optional(),
    line_items: z
      .array(
        z.object({
          description: z.string().min(1, "Description is required"),
          quantity: z.number().min(0.01, "Quantity must be positive"),
          unit_price: z.number().min(0, "Unit price must be positive"),
          amount: z.number(),
        }),
      )
      .min(1, "At least one line item is required"),
    tax_rate: z.number().min(0).max(100).default(7.5),
    discount_type: z.enum(["percentage", "fixed"]).default("percentage"),
    discount_value: z.number().min(0).default(0),
    due_date: z.string().optional(),
    notes: z.string().optional(),
    currency: z.string().default("NGN"),
  })
  .superRefine((data, ctx) => {
    if (
      data.discount_type === "percentage" &&
      (data.discount_value < 0 || data.discount_value > 100)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Percentage discount must be between 0 and 100",
        path: ["discount_value"],
      });
    }
  });

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export default function EditInvoicePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [formReady, setFormReady] = useState(false);

  const { data: invoice, isLoading: invoiceLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => api.get(`/invoices/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: () => api.get("/clients").then((r) => r.data.data),
  });

  const { data: samples } = useQuery({
    queryKey: ["samples"],
    queryFn: () => api.get("/samples?limit=100").then((r) => r.data.data),
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      line_items: [{ description: "", quantity: 1, unit_price: 0, amount: 0 }],
      tax_rate: 7.5,
      discount_type: "percentage",
      discount_value: 0,
      currency: "NGN",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "line_items",
  });

  const lineItems = watch("line_items");
  const taxRate = watch("tax_rate");
  const discountType = watch("discount_type");
  const discountValue = watch("discount_value");

  const subtotal = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const discountAmount =
    discountType === "percentage"
      ? subtotal * (discountValue / 100)
      : Math.min(discountValue, subtotal);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (taxRate / 100);
  const total = taxableAmount + taxAmount;

  // Pre-fill form when invoice data is loaded
  useEffect(() => {
    if (invoice && !formReady) {
      reset({
        client_id: invoice.client_id ?? "",
        sample_id: invoice.sample_id ?? "",
        line_items: Array.isArray(invoice.line_items) && invoice.line_items.length > 0
          ? invoice.line_items.map((item: any) => ({
              description: item.description ?? "",
              quantity: Number(item.quantity) || 1,
              unit_price: Number(item.unit_price) || 0,
              amount: Number(item.amount) || 0,
            }))
          : [{ description: "", quantity: 1, unit_price: 0, amount: 0 }],
        tax_rate: Number(invoice.tax_rate) || 7.5,
        discount_type: invoice.discount_type ?? "percentage",
        discount_value: Number(invoice.discount_value) || 0,
        due_date: invoice.due_date ? invoice.due_date.split("T")[0] : "",
        notes: invoice.notes ?? "",
        currency: invoice.currency ?? "NGN",
      });
      setFormReady(true);
    }
  }, [invoice, formReady, reset]);

  useEffect(() => {
    if (discountType === "fixed" && discountValue > subtotal && subtotal > 0) {
      toast("Fixed discount capped at subtotal", { icon: "⚠️" });
    }
  }, [discountType, discountValue, subtotal]);

  const updateMutation = useMutation({
    mutationFn: (data: InvoiceFormData) => api.put(`/invoices/${id}`, data),
    onSuccess: () => {
      toast.success("Invoice updated successfully");
      qc.invalidateQueries({ queryKey: ["invoice", id] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      navigate(`/invoices/${id}`);
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.error || "Failed to update invoice"),
  });

  const updateLineItemAmount = (index: number) => {
    const item = lineItems[index];
    const amount = (item.quantity || 0) * (item.unit_price || 0);
    setValue(`line_items.${index}.amount`, amount);
  };

  const onSubmit = (data: InvoiceFormData) => {
    const cleanData = {
      ...data,
      sample_id:
        data.sample_id && data.sample_id.trim() !== ""
          ? data.sample_id
          : undefined,
      due_date:
        data.due_date && data.due_date.trim() !== ""
          ? data.due_date
          : undefined,
      notes: data.notes && data.notes.trim() !== "" ? data.notes : undefined,
    };
    updateMutation.mutate(cleanData);
  };

  const formatCurrency = (amount: number) => {
    return `NGN ${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (invoiceLoading) {
    return (
      <AppShell>
        <TopHeader title="Edit Invoice" icon={<FileText />} backButton />
        <PageContainer>
          <div className="max-w-4xl mx-auto space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  if (!invoice) {
    return (
      <AppShell>
        <TopHeader title="Edit Invoice" icon={<FileText />} backButton />
        <PageContainer>
          <p className="text-lab-muted">Invoice not found.</p>
        </PageContainer>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <TopHeader
        title={`Edit Invoice ${invoice.invoice_number ?? ""}`}
        subtitle="Update invoice details"
        icon={<FileText />}
        backButton
      />

      <PageContainer>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Client Selection */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Client Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Client *
                  </label>
                  <select
                    {...register("client_id")}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a client</option>
                    {clients?.map((client: any) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                        {client.company && ` - ${client.company}`}
                      </option>
                    ))}
                  </select>
                  {errors.client_id && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.client_id.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Related Sample (Optional)
                  </label>
                  <select
                    {...register("sample_id")}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None</option>
                    {samples?.map((sample: any) => (
                      <option key={sample.id} value={sample.id}>
                        {sample.ulid} - {sample.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            {/* Line Items */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Line Items</h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  leftIcon={<Plus size={14} />}
                  onClick={() =>
                    append({
                      description: "",
                      quantity: 1,
                      unit_price: 0,
                      amount: 0,
                    })
                  }
                >
                  Add Item
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-800 text-white">
                      <th className="px-4 py-3 text-left text-sm font-semibold rounded-tl-lg">
                        Description
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold w-24">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold w-32">
                        Unit Price
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold w-32">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold w-16 rounded-tr-lg"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {fields.map((field, index) => (
                      <tr key={field.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            {...register(`line_items.${index}.description`)}
                            placeholder="e.g., Water Quality Analysis"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                          {errors.line_items?.[index]?.description && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.line_items[index]?.description?.message}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            {...register(`line_items.${index}.quantity`, {
                              valueAsNumber: true,
                              onChange: () => updateLineItemAmount(index),
                            })}
                            placeholder="1"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-center"
                          />
                          {errors.line_items?.[index]?.quantity && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.line_items[index]?.quantity?.message}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            {...register(`line_items.${index}.unit_price`, {
                              valueAsNumber: true,
                              onChange: () => updateLineItemAmount(index),
                            })}
                            placeholder="0.00"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-right"
                          />
                          {errors.line_items?.[index]?.unit_price && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.line_items[index]?.unit_price?.message}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-right font-medium text-gray-700">
                            {formatCurrency(lineItems[index]?.amount || 0)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {fields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove item"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {errors.line_items && (
                <p className="text-red-500 text-xs mt-2">
                  {errors.line_items.message}
                </p>
              )}
            </Card>

            {/* Totals & Additional Info */}
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Input
                    label="Tax Rate (%)"
                    type="number"
                    step="0.01"
                    {...register("tax_rate", { valueAsNumber: true })}
                    error={errors.tax_rate?.message}
                  />

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Discount Type
                    </label>
                    <select
                      {...register("discount_type")}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>

                  <Input
                    label={
                      discountType === "percentage"
                        ? "Discount (%)"
                        : "Discount Amount"
                    }
                    type="number"
                    step="0.01"
                    {...register("discount_value", { valueAsNumber: true })}
                    error={errors.discount_value?.message}
                  />

                  <Input
                    label="Due Date (Optional)"
                    type="date"
                    {...register("due_date")}
                  />

                  <Textarea
                    label="Notes (Optional)"
                    {...register("notes")}
                    rows={3}
                    placeholder="Special instructions or payment terms..."
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg h-fit">
                  <h4 className="font-semibold mb-3">Invoice Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>
                          Discount (
                          {discountType === "percentage"
                            ? `${discountValue}%`
                            : "Fixed"}
                          ):
                        </span>
                        <span>- {formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Tax ({taxRate}%
                        {discountAmount > 0 ? " on post-discount" : ""}):
                      </span>
                      <span className="font-medium">
                        {formatCurrency(taxAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/invoices/${id}`)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                leftIcon={<Save size={16} />}
                loading={updateMutation.isPending}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </PageContainer>
    </AppShell>
  );
}
