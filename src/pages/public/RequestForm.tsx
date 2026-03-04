import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle, FlaskConical } from "lucide-react";
import { api } from "../../lib/api";
import { Button, Input, Select, Textarea, Card } from "../../components/ui";
import toast from "react-hot-toast";

const requestSchema = z.object({
  // Client Information
  client_name: z.string().min(1, "Name is required"),
  client_company: z.string().optional(),
  client_email: z.string().email("Valid email required"),
  client_phone: z.string().min(1, "Phone is required"),
  client_address: z.string().optional(),
  // Representative
  representative_name: z.string().optional(),
  representative_phone: z.string().optional(),
  representative_email: z.string().email().optional().or(z.literal("")),
  // Sample Information
  product_name: z.string().min(1, "Product name is required"),
  sample_source: z.string().optional(),
  sample_type: z.string().optional(),
  production_date: z.string().optional(),
  expiry_date: z.string().optional(),
  batch_number: z.string().optional(),
  // Analysis
  intended_use: z.string().optional(),
  reference_standard: z.string().optional(),
  test_category: z.string().min(1, "Test category is required"),
  test_category_other: z.string().optional(),
  // Additional
  sample_container: z.string().optional(),
  sample_volume: z.string().optional(),
  sample_condition: z.string().optional(),
  sampling_point: z.string().optional(),
  manufacturer: z.string().optional(),
  matrix: z.string().optional(),
});

export function PublicRequestForm() {
  const [submitted, setSubmitted] = useState(false);
  const [requestNumber, setRequestNumber] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(requestSchema),
  });

  const testCategory = watch("test_category");

  const mutation = useMutation({
    mutationFn: (data: any) => {
      // Clean empty strings
      const cleanedData = { ...data };
      Object.keys(cleanedData).forEach((key) => {
        if (cleanedData[key] === "") cleanedData[key] = undefined;
      });

      return api.post("/sample-requests/public", cleanedData);
    },
    onSuccess: (res) => {
      setRequestNumber(res.data.data.request_number);
      setSubmitted(true);
      toast.success("Request submitted successfully!");
    },
    onError: (e: any) =>
      toast.error(e.response?.data?.error || "Failed to submit request"),
  });

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle size={64} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-2">
            Request Submitted!
          </h2>
          <p className="text-gray-600 mb-4">
            Your sample analysis request has been received.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Request Number</p>
            <p className="text-2xl font-mono font-bold text-blue-600">
              {requestNumber}
            </p>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Please save this number for tracking. Our team will contact you
            shortly with a quotation and next steps.
          </p>
          <Button onClick={() => window.location.reload()} className="w-full">
            Submit Another Request
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-white p-4 rounded-full shadow-lg">
              <FlaskConical size={48} className="text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">
            Sample Analysis Request
          </h1>
          <p className="text-gray-600">
            Submit your laboratory testing request online
          </p>
        </div>

        {/* Form */}
        <Card className="p-8">
          <form
            onSubmit={handleSubmit((d) => mutation.mutate(d))}
            className="space-y-6"
          >
            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="font-display text-lg font-semibold text-gray-800 border-b pb-2">
                Company Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Contact Name *"
                  error={errors.client_name?.message as string}
                  placeholder="John Doe"
                  {...register("client_name")}
                />
                <Input
                  label="Company Name"
                  placeholder="ABC Limited"
                  {...register("client_company")}
                />
                <Input
                  label="Email Address *"
                  type="email"
                  error={errors.client_email?.message as string}
                  placeholder="john@example.com"
                  {...register("client_email")}
                />
                <Input
                  label="Phone Number *"
                  error={errors.client_phone?.message as string}
                  placeholder="+234 800 000 0000"
                  {...register("client_phone")}
                />
              </div>
              <Input
                label="Company Address"
                placeholder="Full address"
                {...register("client_address")}
              />
            </div>

            {/* Representative (if different) */}
            <div className="space-y-4">
              <h3 className="font-display text-lg font-semibold text-gray-800 border-b pb-2">
                Representative (if different from above)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Name"
                  placeholder="Representative name"
                  {...register("representative_name")}
                />
                <Input
                  label="Phone"
                  placeholder="Phone number"
                  {...register("representative_phone")}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="email@example.com"
                  {...register("representative_email")}
                />
              </div>
            </div>

            {/* Sample Information */}
            <div className="space-y-4">
              <h3 className="font-display text-lg font-semibold text-gray-800 border-b pb-2">
                Sample Information
              </h3>
              <Input
                label="Product Name *"
                error={errors.product_name?.message as string}
                placeholder="e.g., Bottled Water, Animal Feed"
                {...register("product_name")}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Sample Source"
                  placeholder="e.g., Borehole, Factory"
                  {...register("sample_source")}
                />
                <Select
                  label="Sample Type"
                  options={[
                    { value: "Water", label: "Water" },
                    { value: "Wastewater", label: "Wastewater" },
                    { value: "Food", label: "Food" },
                    { value: "Animal Feed", label: "Animal Feed" },
                    { value: "Soil", label: "Soil" },
                    { value: "Air", label: "Air" },
                    { value: "Other", label: "Other" },
                  ]}
                  placeholder="Select type..."
                  {...register("sample_type")}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Production Date"
                  type="date"
                  {...register("production_date")}
                />
                <Input
                  label="Expiry Date"
                  type="date"
                  {...register("expiry_date")}
                />
                <Input
                  label="Batch/Code Number"
                  placeholder="BATCH-001"
                  {...register("batch_number")}
                />
              </div>
            </div>

            {/* Analysis Requirements */}
            <div className="space-y-4">
              <h3 className="font-display text-lg font-semibold text-gray-800 border-b pb-2">
                Analysis Requirements
              </h3>
              <Select
                label="Required Tests *"
                error={errors.test_category?.message as string}
                options={[
                  { value: "comprehensive", label: "Comprehensive" },
                  { value: "basic", label: "Basic" },
                  { value: "proximate", label: "Proximate" },
                  { value: "other", label: "Other (Specify)" },
                ]}
                placeholder="Select test category..."
                {...register("test_category")}
              />
              {testCategory === "other" && (
                <Input
                  label="Specify Tests"
                  placeholder="List specific tests required"
                  {...register("test_category_other")}
                />
              )}
              <Textarea
                label="Intended Use of Analysis Report"
                placeholder="e.g., Regulatory compliance, Quality control, Product certification"
                rows={3}
                {...register("intended_use")}
              />
              <Input
                label="Reference Standard"
                placeholder="e.g., NIS 077:2017, ISO 17025"
                {...register("reference_standard")}
              />
            </div>

            {/* Additional Details */}
            <div className="space-y-4">
              <h3 className="font-display text-lg font-semibold text-gray-800 border-b pb-2">
                Additional Details (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Sample Container"
                  placeholder="e.g., Plastic Bottle"
                  {...register("sample_container")}
                />
                <Input
                  label="Sample Volume"
                  placeholder="e.g., 750ml"
                  {...register("sample_volume")}
                />
                <Input
                  label="Manufacturer"
                  placeholder="Manufacturer name"
                  {...register("manufacturer")}
                />
              </div>
              <Input
                label="Sampling Point"
                placeholder="Where the sample was collected"
                {...register("sampling_point")}
              />
            </div>

            {/* Submit */}
            <div className="pt-4">
              <Button
                type="submit"
                loading={mutation.isPending}
                className="w-full py-3 text-lg"
              >
                Submit Request
              </Button>
              <p className="text-xs text-gray-500 text-center mt-3">
                By submitting this form, you agree to our terms and conditions.
                We will contact you within 24 hours with a quotation.
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
