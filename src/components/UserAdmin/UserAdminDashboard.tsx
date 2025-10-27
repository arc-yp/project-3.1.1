import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  LogOut,
  User,
  TrendingUp,
  Eye,
  Calendar,
  Loader2,
  ArrowLeft,
  X,
  Copy,
  Pause,
  Check,
} from "lucide-react";
import { userAuth } from "../../utils/userAuth";
import { storage } from "../../utils/storage";
import { ReviewCard } from "../../types";
import { formatDate } from "../../utils/helpers";

export const UserAdminDashboard: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [userAdmin, setUserAdmin] = useState(userAuth.getCurrentUser());
  const [card, setCard] = useState<ReviewCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);

  const loadBusinessData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (slug) {
        const businessCard = await storage.getCardBySlug(slug);
        setCard(businessCard);
      }
    } catch (error) {
      console.error("Error loading business data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    const currentUser = userAuth.getCurrentUser();

    // Check authentication
    if (!userAuth.isAuthenticated() || !currentUser) {
      navigate(`/${slug}/admin`, { replace: true });
      return;
    }

    // Check if user has access to this business
    if (currentUser.businessSlug !== slug) {
      alert(`Access denied. You can only access /${currentUser.businessSlug}`);
      navigate(`/${currentUser.businessSlug}/admin`, { replace: true });
      return;
    }

    setUserAdmin(currentUser);
    loadBusinessData();
  }, [slug, navigate, loadBusinessData]);

  const handleLogout = () => {
    userAuth.logout();
    navigate(`/${slug}/admin`, { replace: true });
  };

  const handleViewCard = () => {
    window.open(`/${slug}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-blue-700 mb-4">
            Loading Dashboard
          </h1>
          <p className="text-blue-400">Please wait...</p>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-4xl">❌</span>
          </div>
          <h1 className="text-3xl font-bold text-blue-700 mb-4">
            Business Not Found
          </h1>
          <p className="text-blue-400 mb-8">
            The business "/{slug}" doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition-colors duration-200"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-yellow-50 to-green-50">
      {/* Decorative Background */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute top-[8%] left-[8%] w-72 h-72 bg-blue-300/40 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[8%] right-[8%] w-96 h-96 bg-red-300/40 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-300/40 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-[20%] right-[20%] w-64 h-64 bg-yellow-300/40 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => navigate(`/${slug}`)}
              className="inline-flex items-center px-4 py-2 bg-white text-blue-700 rounded-xl shadow border border-blue-100 hover:bg-blue-50 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Review Page
            </button>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-blue-700 bg-blue-100 px-4 py-2 rounded-xl border border-blue-200 shadow">
                <User className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  {userAdmin?.fullName || userAdmin?.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 bg-red-100 text-red-500 rounded-xl shadow hover:bg-red-200 border border-red-200 transition-colors duration-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-transparent bg-gradient-to-r from-blue-500 via-red-500 via-yellow-500 to-green-500 bg-clip-text mb-2 tracking-tight">
              Business Analytics
            </h1>
            <p className="text-slate-600 ">Dashboard for {card.businessName}</p>
          </div>
        </div>

        {/* Business Info Card */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-lg p-6 mb-8 flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 bg-blue-50 rounded-2xl flex items-center justify-center shadow flex-shrink-0">
            {card.logoUrl ? (
              <img
                src={card.logoUrl}
                alt={`${card.businessName} logo`}
                className="w-25 h-25 object-contain"
              />
            ) : (
              <div className="text-4xl">🏢</div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">
              {card.businessName}
            </h2>
            {/* <p className="text-slate-600 mb-1 text-base">
              {card.category} • {card.type}
            </p> */}
            <p className="text-slate-500 text-sm">Slug: /{card.slug}</p>
            {card.location && (
              <p className="text-slate-500 text-sm mt-1">📍 {card.location}</p>
            )}
          </div>
          <div className="flex flex-col gap-2 items-end">
            <button
              onClick={handleViewCard}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-xl shadow hover:bg-blue-600 transition-colors duration-200 text-sm font-semibold"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Live Page
            </button>
            <div
              className={`inline-flex items-center justify-center px-5 py-2 rounded-full shadow text-sm font-semibold ${
                card.active === false
                  ? "bg-red-100 text-red-500 border border-red-200"
                  : "bg-green-100 text-green-600 border border-green-200"
              }`}
            >
              {card.active === false ? "Inactive" : "Active"}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 shadow flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <p className="text-blue-700 text-sm font-medium">Total Views</p>
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-blue-800">
              {(card.viewCount || 0).toLocaleString()}
            </p>
            <p className="text-blue-600 text-xs mt-1">All-time views</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200 shadow flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <p className="text-red-700 text-sm font-medium">Category</p>
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-lg font-bold text-red-800">{card.category}</p>
            <p className="text-red-600 text-xs mt-1">{card.type}</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200 shadow flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <p className="text-yellow-700 text-sm font-medium">Created</p>
              <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-base font-bold text-yellow-800">
              {formatDate(card.createdAt)}
            </p>
            <p className="text-yellow-600 text-xs mt-1">Registration date</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 shadow flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <p className="text-green-700 text-sm font-medium">Status</p>
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  card.active === false ? "bg-red-500" : "bg-green-500"
                }`}
              >
                <span className="text-xl text-white">
                  {card.active === false ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                </span>
              </div>
            </div>
            <p className="text-base font-bold text-green-800">
              {card.active === false ? "Inactive" : "Active"}
            </p>
            <p className="text-green-600 text-xs mt-1">Current status</p>
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Description */}
          {card.description && (
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 shadow relative">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">
                Description
              </h3>
              {(() => {
                const lines = (card.description || "").split(/\r?\n/);
                const hasMore = lines.length > 1;
                const preview = lines.slice(0, 5).join("\n");
                return (
                  <>
                    <pre className="text-blue-700 text-sm leading-relaxed whitespace-pre-line font-sans">
                      {preview}
                    </pre>
                    {hasMore && (
                      <div className="mt-3">
                        <button
                          onClick={() => setShowDescriptionModal(true)}
                          className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center bg-blue-50 px-3 py-1 rounded-full border border-blue-200"
                        >
                          Show full description
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}

              {showDescriptionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                  <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 w-full max-w-3xl">
                    <div className="flex items-center justify-between p-4 border-b">
                      <h4 className="text-lg font-semibold text-slate-800">
                        Full Description
                      </h4>
                      <button
                        className="p-2 rounded-lg hover:bg-slate-100"
                        onClick={() => setShowDescriptionModal(false)}
                        aria-label="Close"
                      >
                        <X className="w-5 h-5 text-slate-500" />
                      </button>
                    </div>
                    <div className="p-4 max-h-[70vh] overflow-auto">
                      <pre className="whitespace-pre-wrap text-slate-700 text-sm leading-relaxed">
                        {card.description}
                      </pre>
                    </div>
                    <div className="flex items-center justify-between p-4 border-t">
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(
                              card.description || ""
                            );
                          } catch (e) {
                            console.warn("Copy to clipboard failed", e);
                          }
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl border border-blue-200 hover:bg-blue-200"
                      >
                        <Copy className="w-4 h-4" /> Copy
                      </button>
                      <button
                        onClick={() => setShowDescriptionModal(false)}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Services */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 shadow">
            <h3 className="text-lg font-semibold text-green-800 mb-3">
              Services
            </h3>
            <div className="flex flex-wrap gap-2">
              {card.services && card.services.length > 0 ? (
                card.services.map((service, idx) => (
                  <span
                    key={idx}
                    className={`px-3 py-1 rounded-full text-sm font-medium border shadow ${
                      idx % 4 === 0
                        ? "bg-blue-100 text-blue-700 border-blue-200"
                        : idx % 4 === 1
                        ? "bg-red-100 text-red-700 border-red-200"
                        : idx % 4 === 2
                        ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                        : "bg-green-100 text-green-700 border-green-200"
                    }`}
                  >
                    {service}
                  </span>
                ))
              ) : (
                <span className="text-green-600 text-sm">
                  No services listed.
                </span>
              )}
            </div>
          </div>

          {/* Expiry Information */}
          {card.expiresAt && (
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200 shadow">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">
                Expiry Information
              </h3>
              <p className="text-yellow-700 text-sm">
                Expires on:{" "}
                <span className="font-semibold text-yellow-800">
                  {formatDate(card.expiresAt)}
                </span>
              </p>
              {Date.parse(card.expiresAt) <= Date.now() && (
                <p className="text-red-500 text-sm mt-2 bg-red-50 px-3 py-2 rounded border border-red-200">
                  ⚠️ This card has expired
                </p>
              )}
            </div>
          )}
        </div>

        {/* Note */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            You have read-only access to this business analytics. Contact the
            main administrator for changes.
          </p>
        </div>
      </div>
    </div>
  );
};
