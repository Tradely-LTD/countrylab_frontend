import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { TestTubeDiagonal, Phone, Building2, CheckCircle, Loader2 } from "lucide-react";
import { clsx } from "clsx";

interface OrgInfo {
  marketer_name: string;
  organization: string;
  logo_url: string | null;
  org_phone: string | null;
  org_email: string | null;
}

export function ReferralPage() {
  const { code } = useParams<{ code: string }>();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    company: "",
    email: "",
    city: "",
    state: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const { data: orgInfo, isLoading, error } = useQuery({
    queryKey: ["ref-info", code],
    queryFn: () =>
      api.get(`/marketers/ref/${code}`).then((r) => r.data.data as OrgInfo),
    retry: false,
  });

  const submitMutation = useMutation({
    mutationFn: (data: typeof form) =>
      api.post(`/marketers/ref/${code}`, data),
    onSuccess: () => setSubmitted(true),
  });

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !orgInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-lg">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TestTubeDiagonal size={24} className="text-red-500" />
          </div>
          <h1 className="font-bold text-lg text-gray-800 mb-2">Invalid Link</h1>
          <p className="text-sm text-gray-500">
            This referral link is not valid or has expired. Please contact the person who shared it.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-lg">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-600" />
          </div>
          <h1 className="font-bold text-xl text-gray-800 mb-2">Thank You!</h1>
          <p className="text-sm text-gray-600 mb-1">
            Your enquiry has been received by <strong>{orgInfo.organization}</strong>.
          </p>
          <p className="text-sm text-gray-500">
            A member of our team will contact you shortly.
          </p>
          {orgInfo.org_phone && (
            <a
              href={`tel:${orgInfo.org_phone}`}
              className="mt-6 inline-flex items-center gap-2 text-primary-600 text-sm font-medium"
            >
              <Phone size={14} />
              {orgInfo.org_phone}
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-primary-600 px-6 py-6 text-white text-center">
          {orgInfo.logo_url ? (
            <img
              src={orgInfo.logo_url}
              alt={orgInfo.organization}
              className="h-14 w-auto mx-auto mb-3 object-contain bg-white rounded-lg px-2 py-1"
            />
          ) : (
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <TestTubeDiagonal size={26} className="text-white" />
            </div>
          )}
          <h1 className="font-bold text-xl leading-tight">{orgInfo.organization}</h1>
          <p className="text-primary-200 text-sm mt-1">Accredited Laboratory Services</p>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className="bg-primary-50 border border-primary-100 rounded-xl p-3 mb-5 flex items-start gap-2">
            <Building2 size={15} className="text-primary-600 mt-0.5 shrink-0" />
            <p className="text-sm text-primary-800">
              You were referred by <strong>{orgInfo.marketer_name}</strong>. Fill in your details and we will reach out to discuss how we can help you.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitMutation.mutate(form);
            }}
            className="space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  required
                  className={clsx("w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300", "border-gray-200 bg-gray-50 focus:bg-white")}
                  placeholder="e.g. Aminu Ibrahim"
                  value={form.name}
                  onChange={set("name")}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number *</label>
                <input
                  required
                  type="tel"
                  className={clsx("w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300", "border-gray-200 bg-gray-50 focus:bg-white")}
                  placeholder="+234 803..."
                  value={form.phone}
                  onChange={set("phone")}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Organisation</label>
                <input
                  className={clsx("w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300", "border-gray-200 bg-gray-50 focus:bg-white")}
                  placeholder="Company name (optional)"
                  value={form.company}
                  onChange={set("company")}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className={clsx("w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300", "border-gray-200 bg-gray-50 focus:bg-white")}
                  placeholder="Optional"
                  value={form.email}
                  onChange={set("email")}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                <input
                  className={clsx("w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300", "border-gray-200 bg-gray-50 focus:bg-white")}
                  placeholder="e.g. Kano"
                  value={form.city}
                  onChange={set("city")}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                <input
                  className={clsx("w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300", "border-gray-200 bg-gray-50 focus:bg-white")}
                  placeholder="e.g. Kano State"
                  value={form.state}
                  onChange={set("state")}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">What do you need tested?</label>
                <textarea
                  rows={3}
                  className={clsx("w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300 resize-none", "border-gray-200 bg-gray-50 focus:bg-white")}
                  placeholder="e.g. Water quality test, food safety analysis..."
                  value={form.notes}
                  onChange={set("notes")}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitMutation.isPending || !form.name || !form.phone}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {submitMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : null}
              {submitMutation.isPending ? "Submitting..." : "Send Enquiry"}
            </button>

            {submitMutation.isError && (
              <p className="text-xs text-red-600 text-center">
                Something went wrong. Please try again.
              </p>
            )}
          </form>

          {orgInfo.org_phone && (
            <p className="text-center text-xs text-gray-400 mt-4">
              Or call us directly:{" "}
              <a href={`tel:${orgInfo.org_phone}`} className="text-primary-600 font-medium">
                {orgInfo.org_phone}
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
