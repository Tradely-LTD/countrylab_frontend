import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FileText, Plus, Trash2, Save } from "lucide-react";
import { api } from "../../lib/api";
import { AppShell, PageContainer, TopHeader } from "../../components/layout";
import { Button, Input, Textarea, Card, Select } from "../../components/ui";
import toast from "react-hot-toast";

const invoiceSchema = z.object({
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
  due_date: z.string().optional(),
  notes: z.string().optional(),
  currency: z.string().default("NGN"),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export default function CreateInvoicePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get("request_id");

  // Fetch request data if request_id is provided
  const { data: requestData } = useQuery({
    queryKey: ["sample-request", requestId],
    queryFn: () =>
      api.get(`/sample-requests/${requestId}`).then((r) => r.data.data),
    enabled: !!requestId,
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
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      line_items: [{ description: "", quantity: 1, unit_price: 0, amount: 0 }],
      tax_rate: 7.5,
      currency: "NGN",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "line_items",
  });

  const lineItems = watch("line_items");
  const taxRate = watch("tax_rate");

  const subtotal = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  // Pre-fill form when request data is loaded
  useEffect(() => {
    if (requestData) {
      setValue("client_id", requestData.client_id);
      if (requestData.quotation_amount) {
        setValue("line_items", [
          {
            description: `Laboratory Testing - ${requestData.product_name || "Sample Analysis"}`,
            quantity: 1,
            unit_price: requestData.quotation_amount,
            amount: requestData.quotation_amount,
          },
        ]);
      }
    }
  }, [requestData, setValue]);

  const createMutation = useMutation({
    mutationFn: (data: InvoiceFormData) => {
      // Add request_id to link invoice to request
      const payload = requestId ? { ...data, request_id: requestId } : data;
      return api.post("/invoices", payload);
    },
    onSuccess: (response) => {
      toast.success("Invoice created successfully");
      navigate(`/invoices/${response.data.data.id}`);
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.error || "Failed to create invoice"),
  });

  const updateLineItemAmount = (index: number) => {
    const item = lineItems[index];
    const amount = (item.quantity || 0) * (item.unit_price || 0);
    setValue(`line_items.${index}.amount`, amount);
  };

  const onSubmit = (data: InvoiceFormData) => {
    // Clean up empty optional fields
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
    createMutation.mutate(cleanData);
  };

  const formatCurrency = (amount: number) => {
    return `₦ ${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <AppShell>
      <TopHeader
        title="Create Invoice"
        subtitle="Generate a new invoice for a client"
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
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax ({taxRate}%):</span>
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
                onClick={() => navigate("/invoices")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                leftIcon={<Save size={16} />}
                loading={createMutation.isPending}
              >
                Create Invoice
              </Button>
            </div>
          </div>
        </form>
      </PageContainer>
    </AppShell>
  );
}
