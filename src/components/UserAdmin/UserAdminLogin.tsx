import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Lock, Eye, EyeOff, User, AlertCircle, Mail } from "lucide-react";
import { userAuth } from "../../utils/userAuth";
import { storage } from "../../utils/storage";
import { ReviewCard } from "../../types";

export const UserAdminLogin: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    emailOrMobile: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [businessCard, setBusinessCard] = useState<ReviewCard | null>(null);

  // Redirect if already authenticated (must be inside an effect to avoid conditional hooks)
  useEffect(() => {
    if (!slug) return;
    if (userAuth.isAuthenticated()) {
      const user = userAuth.getCurrentUser();
      if (user && slug === user.businessSlug) {
        navigate(`/${slug}/admin/dashboard`, { replace: true });
      }
    }
  }, [navigate, slug]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  // Load business card (for logo/name) by slug
  useEffect(() => {
    let active = true;
    (async () => {
      if (!slug) return;
      try {
        const card = await storage.getCardBySlug(slug);
        if (active) setBusinessCard(card);
      } catch (e) {
        console.warn("Failed to load business card for slug:", slug, e);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const userAdmin = await userAuth.login(
        formData.emailOrMobile,
        formData.password
      );

      if (userAdmin) {
        // Check if logged in user has access to this business
        if (userAdmin.businessSlug === slug) {
          navigate(`/${slug}/admin/dashboard`);
        } else {
          setError(
            `You don't have access to this business. Your assigned business: /${userAdmin.businessSlug}`
          );
          userAuth.logout();
        }
      } else {
        setError("Invalid email/mobile or password");
      }
    } catch (err) {
      setError("An error occurred during login");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Colorful Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[5%] left-[5%] w-32 h-32 sm:w-48 sm:h-48 lg:w-72 lg:h-72 bg-blue-300/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-[10%] right-[10%] w-40 h-40 sm:w-60 sm:h-60 lg:w-96 lg:h-96 bg-red-300/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-36 h-36 sm:w-52 sm:h-52 lg:w-80 lg:h-80 bg-green-300/20 rounded-full blur-2xl animate-pulse delay-500"></div>
        <div className="absolute top-[20%] right-[20%] w-24 h-24 sm:w-36 sm:h-36 lg:w-64 lg:h-64 bg-yellow-300/20 rounded-full blur-2xl animate-pulse delay-1500"></div>
      </div>

      <div className="relative z-10 w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          {businessCard?.logoUrl ? (
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl mb-4 sm:mb-6 shadow-xl bg-white ring-1 ring-gray-200">
              <img
                src={businessCard.logoUrl}
                alt={`${businessCard.businessName || slug || "Business"} logo`}
                className="max-w-full max-h-full object-contain p-1.5 sm:p-2"
                loading="eager"
                decoding="async"
              />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 via-green-500 to-red-500 rounded-2xl mb-4 sm:mb-6 shadow-xl">
              <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-blue-600 via-green-600 to-red-600 bg-clip-text text-transparent">
            Business Admin Login
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Access analytics for{" "}
            <span className="font-semibold text-blue-600">/{slug}</span>
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* Email or Mobile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email or Mobile Number
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5" />
                <input
                  type="text"
                  value={formData.emailOrMobile}
                  onChange={(e) =>
                    handleInputChange("emailOrMobile", e.target.value)
                  }
                  placeholder="Enter email or mobile"
                  className={`w-full pl-10 pr-4 py-3 bg-white border-2 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-300 ${
                    error
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-blue-500 focus:border-blue-500 hover:border-green-400"
                  }`}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  placeholder="Enter password"
                  className={`w-full pl-10 pr-12 py-3 bg-white border-2 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-300 ${
                    error
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-green-500 focus:border-green-500 hover:border-blue-400"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-yellow-600 transition-colors duration-200"
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
              <div className="flex items-start p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={
                isLoading || !formData.emailOrMobile || !formData.password
              }
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 via-green-600 to-red-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:via-green-700 hover:to-red-700 focus:ring-4 focus:ring-yellow-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
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

          {/* Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-gray-600 text-sm text-center">
              Your credentials are managed by the main administrator.
            </p>
            <p className="text-gray-500 text-xs text-center mt-2">
              Contact support if you're having trouble logging in.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 sm:mt-8">
          <p className="text-gray-600 text-sm">
            Secure access to business analytics
          </p>
        </div>

        {/* Powered By Section */}
        <div className="mt-8 sm:mt-12">
          <div className="flex items-center justify-center">
            <a
              href="https://www.aireviewsystem.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl px-4 py-3 sm:px-6 sm:py-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <img
                  src="/aireviewlogo.png"
                  alt="AI Review System logo"
                  className="w-full h-8 sm:w-full sm:h-14"
                />
                <div className="text-left">
                  <p className="text-xs sm:text-sm text-gray-500 font-medium uppercase tracking-wide">
                    Powered by
                  </p>
                  <p className="text-sm sm:text-base font-bold text-gray-700 -mt-1">
                    aireviewsystem.com
                  </p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
