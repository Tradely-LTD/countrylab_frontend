import { useNavigate } from "react-router-dom";
import {
  FlaskConical,
  FileText,
  CheckCircle,
  Clock,
  Shield,
} from "lucide-react";
import { Button, Card } from "../../components/ui";

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <FlaskConical size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-gray-900">
                Countrylab
              </h1>
              <p className="text-xs text-gray-500">
                Laboratory Management System
              </p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => navigate("/login")}>
            Staff Login
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-display font-bold text-gray-900 mb-4">
            Professional Laboratory Testing Services
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Submit your sample analysis request online in minutes
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/request")}
            className="text-lg px-8 py-4"
          >
            <FileText size={20} className="mr-2" />
            Request Analysis Now
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <Card className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-4 rounded-full">
                <Clock size={32} className="text-blue-600" />
              </div>
            </div>
            <h3 className="font-display text-lg font-semibold mb-2">
              Fast Turnaround
            </h3>
            <p className="text-gray-600 text-sm">
              Quick response times with professional service and accurate
              results
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle size={32} className="text-green-600" />
              </div>
            </div>
            <h3 className="font-display text-lg font-semibold mb-2">
              ISO Accredited
            </h3>
            <p className="text-gray-600 text-sm">
              Internationally recognized testing standards and certifications
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-purple-100 p-4 rounded-full">
                <Shield size={32} className="text-purple-600" />
              </div>
            </div>
            <h3 className="font-display text-lg font-semibold mb-2">
              Reliable Results
            </h3>
            <p className="text-gray-600 text-sm">
              Accurate analysis with comprehensive certificates of analysis
            </p>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-white rounded-2xl shadow-xl p-12 text-center">
          <h3 className="text-3xl font-display font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Submit your sample analysis request online. Our team will review
            your request and provide a quotation within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/request")}
              className="text-lg px-8"
            >
              Submit Request Form
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate("/verify")}
              className="text-lg px-8"
            >
              Verify Certificate
            </Button>
          </div>
        </div>

        {/* Services */}
        <div className="mt-16">
          <h3 className="text-2xl font-display font-bold text-center mb-8">
            Our Testing Services
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              "Water Quality Testing",
              "Food Safety Analysis",
              "Animal Feed Testing",
              "Wastewater Analysis",
              "Soil Testing",
              "Microbiological Testing",
              "Chemical Analysis",
              "Product Certification",
            ].map((service) => (
              <Card
                key={service}
                className="p-4 text-center hover:shadow-lg transition-shadow"
              >
                <p className="font-medium text-gray-700">{service}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} Countrylab. All rights reserved.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            ISO 17025 Accredited Laboratory
          </p>
        </div>
      </footer>
    </div>
  );
}
