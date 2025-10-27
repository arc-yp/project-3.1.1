import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  Building2,
  AlertCircle,
} from "lucide-react";
import { auth } from "../../utils/auth";

export const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    mobile: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  if (auth.isAuthenticated()) {
    return <Navigate to="/ai-admin" replace />;
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate loading delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (auth.login(formData.mobile, formData.password)) {
      // Login successful - redirect will happen via Navigate component
      window.location.href = "/ai-admin";
    } else {
      setError("Invalid mobile number or password");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-yellow-50 to-green-50 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-[10%] left-[10%] w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[10%] right-[10%] w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-32 h-full mb-6">
            <img
              src="/arslogo1.png"
              alt="Admin"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Admin Login
          </h1>
          <p className="text-slate-600">Access Review Cards Dashboard</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mobile Number */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Mobile Number
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange("mobile", e.target.value)}
                  placeholder="Enter mobile number"
                  className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-300 shadow-sm ${
                    error
                      ? "border-red-500 focus:ring-red-500"
                      : "border-slate-300 focus:ring-blue-500"
                  }`}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  placeholder="Enter password"
                  className={`w-full pl-10 pr-12 py-3 bg-white border rounded-xl text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-300 shadow-sm ${
                    error
                      ? "border-red-500 focus:ring-red-500"
                      : "border-slate-300 focus:ring-blue-500"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors duration-200"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading || !formData.mobile || !formData.password}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-slate-600 text-sm">
            Secure access to Review Automation System
          </p>
        </div>
      </div>
    </div>
  );
};
