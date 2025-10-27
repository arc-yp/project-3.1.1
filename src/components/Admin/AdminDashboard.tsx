import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Building2,
  Calendar,
  LogOut,
  Database,
  Loader2,
  Wifi,
  WifiOff,
  RefreshCw,
  ExternalLink,
  QrCode,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { ReviewCard } from "../../types";
import { storage } from "../../utils/storage";
import { formatDate } from "../../utils/helpers";
import { CompactAddCardModal } from "./CompactAddCardModal";
import { EditCardModal } from "./EditCardModal";
import { ConfirmDialog } from "./ConfirmDialog";
import { auth } from "../../utils/auth";
import { isSupabaseConfigured } from "../../utils/supabase";
import { QRCodeModal } from "./QRCodeModal";
import { SegmentedButtonGroup } from "../ReviewCard/SegmentedButtonGroup";
import { UserAdminManagement } from "../UserAdmin";

export const AdminDashboard: React.FC = () => {
  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCard, setEditingCard] = useState<ReviewCard | null>(null);
  const [deletingCard, setDeletingCard] = useState<ReviewCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "local" | "checking"
  >("checking");
  const [selectedCategories] = useState<string[]>([]);
  const [qrCard, setQrCard] = useState<ReviewCard | null>(null);
  const [nowTs, setNowTs] = useState<number>(Date.now());
  const [activeTab, setActiveTab] = useState<"cards" | "userAdmins">("cards");
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>(""); // Active | Inactive
  const [creationFilter, setCreationFilter] = useState<string>(""); // Today | 7d | 30d | Month | Year
  const [expiryFilter, setExpiryFilter] = useState<string>(""); // Expiring 24h | 7d | 30d | 6m | Expired | No Expiry
  const [showFilters, setShowFilters] = useState<boolean>(false);
  // Removed showInactive filter; inactive cards are always visible per requirements


  // Fast load: show local cards instantly, then update from Supabase/cloud
  const initializeDashboard = useCallback(async () => {
    // Show local cards immediately
    try {
      const localCards = storage._getLocalCards ? storage._getLocalCards() : [];
      setCards(localCards);
    } catch {
      setCards([]);
    }
    setIsLoading(false); // Remove spinner instantly

    // Check connection status and migration in background
    if (isSupabaseConfigured()) {
      setConnectionStatus("connected");
      await checkForMigration();
    } else {
      setConnectionStatus("local");
    }

    // Now update cards from Supabase/cloud in background
    try {
      const savedCards = await storage.getCards();
      setCards(savedCards);
      console.log(`Loaded ${savedCards.length} cards (cloud)`);
    } catch (error) {
      console.error("Error loading cards (cloud):", error);
    }
  }, []);

  useEffect(() => {
    initializeDashboard();
  }, [initializeDashboard]);

  // Real-time ticking clock for countdowns
  useEffect(() => {
    const interval = setInterval(() => {
      const current = Date.now();
      setNowTs(current);
      setCards((prev) => {
        let changed = false;
        const updated = prev.map((c) => {
          if (
            c.active !== false &&
            c.expiresAt &&
            Date.parse(c.expiresAt) <= current
          ) {
            changed = true;
            // fire & forget persistence
            (async () => {
              try {
                const updatedCard = {
                  ...c,
                  active: false,
                  updatedAt: new Date().toISOString(),
                };
                await storage.updateCard(updatedCard);
              } catch (err) {
                console.error("Failed to persist expiry update:", err);
              }
            })();
            return { ...c, active: false };
          }
          return c;
        });
        return changed ? updated : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatRemaining = (card: ReviewCard): string | null => {
    if (!card.expiresAt) return null;
    const end = Date.parse(card.expiresAt);
    const diffMs = end - nowTs;
    if (diffMs <= 0) return "Expired";
    const totalSec = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSec / 86400);
    const hrs = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (days > 0) return `${days}d ${hrs}h ${mins}m ${secs}s`;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const loadCards = async () => {
    try {
      const savedCards = await storage.getCards();
      setCards(savedCards);
      console.log(`Loaded ${savedCards.length} cards`);
    } catch (error) {
      console.error("Error loading cards:", error);
      setCards([]);
    }
  };

  const checkForMigration = async () => {
    const localData = localStorage.getItem("scc_review_cards");
    if (localData) {
      try {
        const localCards = JSON.parse(localData);
        if (localCards.length > 0) {
          console.log(`Found ${localCards.length} local cards to migrate`);
          setIsMigrating(true);
          try {
            await storage.migrateFromLocalStorage();
          } catch (migrationError) {
            console.error(
              "Migration failed, continuing with local storage:",
              migrationError
            );
          }
          setIsMigrating(false);
          console.log("Migration completed");
        }
      } catch (error) {
        console.error("Error during migration check:", error);
        setIsMigrating(false);
      }
    }
  };

  const handleAddCard = async (newCard: ReviewCard) => {
    try {
      const success = await storage.addCard(newCard);
      if (success) {
        await loadCards(); // Reload to get latest data
        setShowAddModal(false);
        console.log("Card added successfully:", newCard.businessName);
      } else {
        alert("Failed to add card. Please try again.");
      }
    } catch (error) {
      console.error("Error adding card:", error);
      alert("Failed to add card. Please try again.");
    }
  };

  const handleEditCard = async (updatedCard: ReviewCard) => {
    try {
      const success = await storage.updateCard(updatedCard);
      if (success) {
        await loadCards(); // Reload to get latest data
        setEditingCard(null);
        console.log("Card updated successfully:", updatedCard.businessName);
      } else {
        alert("Failed to update card. Please try again.");
      }
    } catch (error) {
      console.error("Error updating card:", error);
      alert("Failed to update card. Please try again.");
    }
  };

  const handleDeleteCard = async () => {
    if (deletingCard) {
      try {
        const success = await storage.deleteCard(deletingCard.id);
        if (success) {
          await loadCards(); // Reload to get latest data
          setDeletingCard(null);
          console.log("Card deleted successfully:", deletingCard.businessName);
        } else {
          alert("Failed to delete card. Please try again.");
        }
      } catch (error) {
        console.error("Error deleting card:", error);
        alert("Failed to delete card. Please try again.");
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (isSupabaseConfigured()) {
        await storage.syncData();
      }
      await loadCards();
      console.log("Data refreshed successfully");
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const matchesSearch =
        card.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.slug.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(card.category);

      if (!matchesSearch || !matchesCategory) return false;

      // Status filter
      if (statusFilter === "Active" && card.active === false) return false;
      if (statusFilter === "Inactive" && card.active !== false) return false;

      // Creation date filter
      if (creationFilter) {
        const createdAt = Date.parse(card.createdAt);
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const now = nowTs;
        let pass = true;
        switch (creationFilter) {
          case "Today":
            pass = createdAt >= startOfToday.getTime();
            break;
          case "7d":
            pass = createdAt >= now - 7 * 86400000;
            break;
          case "30d":
            pass = createdAt >= now - 30 * 86400000;
            break;
          case "Month": {
            // current calendar month
            const d = new Date(createdAt);
            const today = new Date(now);
            pass =
              d.getMonth() === today.getMonth() &&
              d.getFullYear() === today.getFullYear();
            break;
          }
          case "Year": {
            const d = new Date(createdAt);
            const today = new Date(now);
            pass = d.getFullYear() === today.getFullYear();
            break;
          }
          default:
            pass = true;
        }
        if (!pass) return false;
      }

      // Expiry timeframe filter
      if (expiryFilter) {
        const endTs = card.expiresAt ? Date.parse(card.expiresAt) : null;
        const diff = endTs ? endTs - nowTs : null;
        let pass = true;
        switch (expiryFilter) {
          case "Expiring 24h":
            pass = !!endTs && diff! > 0 && diff! <= 24 * 3600000;
            break;
          case "Expiring 7d":
            pass =
              !!endTs &&
              diff! > 0 &&
              diff! <= 7 * 86400000 &&
              diff! > 24 * 3600000;
            break;
          case "Expiring 30d":
            pass =
              !!endTs &&
              diff! > 0 &&
              diff! <= 30 * 86400000 &&
              diff! > 7 * 86400000;
            break;
          case "Expiring 6m": {
            const sixMonthsMs = 182 * 86400000; // approx 6 months
            pass =
              !!endTs &&
              diff! > 0 &&
              diff! <= sixMonthsMs &&
              diff! > 30 * 86400000;
            break;
          }
          case "Expired":
            pass = !!endTs && diff! <= 0;
            break;
          case "No Expiry":
            pass = !endTs;
            break;
          default:
            pass = true;
        }
        if (!pass) return false;
      }

      return true;
    });
  }, [
    cards,
    searchTerm,
    selectedCategories,
    statusFilter,
    creationFilter,
    expiryFilter,
    nowTs,
  ]);

  const handleViewCard = (slug: string) => {
    window.open(`/${slug}`, "_blank");
  };

  const handleLogout = () => {
    auth.logout();
    window.location.href = "/ai-login";
  };

  if (isMigrating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-yellow-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-200">
            <Database className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-4">
            Migrating Data
          </h1>
          <p className="text-slate-600 mb-8">
            Moving your review cards to cloud storage for cross-device sync...
          </p>
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin mr-2" />
            <span className="text-blue-600">Please wait...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-yellow-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center text-sm text-slate-600">
              <div className="flex items-center">
                {connectionStatus === "connected" ? (
                  <>
                    <Database className="w-4 h-4 mr-2 text-green-500" />
                    <Wifi className="w-3 h-3 mr-1 text-green-500" />
                    <span>Cloud Storage Active</span>
                  </>
                ) : connectionStatus === "local" ? (
                  <>
                    <Building2 className="w-4 h-4 mr-2 text-amber-500" />
                    <WifiOff className="w-3 h-3 mr-1 text-amber-500" />
                    <span>Local Storage Only</span>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-500" />
                    <span>Checking Connection...</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Changed <a> to <Link> */}
              <Link
                to="/ai-admin/analytics"
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 font-medium shadow-lg"
                title="Analytics"
              >
                <Eye className="w-4 h-4 mr-2" /> Analytics
              </Link>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 font-medium shadow-lg"
                title="Refresh Data"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
                {isRefreshing ? "Syncing..." : "Refresh"}
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium shadow-lg"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>

          {/* <h1 className="text-4xl lg:text-5xl font-bold text-slate-800 mb-4">
        <div className=" flex items-center justify-center mb-8">            
                      <img
                        src="/py.png"
                        alt="YP Logo"
                        className="w-20 h-20 sm:w-12 sm:h-12 lg:w-20 lg:h-20 object-contain rounded-xl  border border-white"
                      />
                  </div>      
            Admin Dashboard
          </h1> */}
          {/* <p className="text-slate-600 mb-4">
            {connectionStatus === "connected"
              ? "Your review cards are synced across all devices"
              : "Managing review cards locally"}
          </p> */}

          {/* Tab Navigation */}
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setActiveTab("cards")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === "cards"
                  ? "bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Review Cards
            </button>
            <button
              onClick={() => setActiveTab("userAdmins")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === "userAdmins"
                  ? "bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              User Admins
            </button>
          </div>
        </div>

        {/* Review Cards Section */}
        {activeTab === "cards" && (
          <>
            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search cards by business name or slug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm"
                />
              </div>
              {/* Removed show inactive toggle button */}
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-green-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add New Card
              </button>
            </div>

            {/* Stats */}
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-xl p-6 border border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
                <p className="text-slate-600 text-sm font-medium">
                  Total Cards
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-blue-600">
                      {cards.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center border border-blue-200">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-green-200 shadow-lg hover:shadow-xl transition-shadow">
                <p className="text-slate-600 text-sm font-medium">
                  Active Today
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-green-600">
                      {cards.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center border border-green-200">
                    <Eye className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-yellow-200 shadow-lg hover:shadow-xl transition-shadow">
                <p className="text-slate-600 text-sm font-medium">This Month</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-yellow-600">
                      {
                        cards.filter((card) => {
                          const created = new Date(card.createdAt);
                          const now = new Date();
                          return (
                            created.getMonth() === now.getMonth() &&
                            created.getFullYear() === now.getFullYear()
                          );
                        }).length
                      }
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center border border-yellow-200">
                    <Calendar className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filters Row */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-lg mb-10">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center border border-blue-200">
                    <Filter className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 tracking-wide flex items-center gap-2">
                      Filters
                      {(statusFilter || creationFilter || expiryFilter) && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {
                            [statusFilter, creationFilter, expiryFilter].filter(
                              Boolean
                            ).length
                          }{" "}
                          active
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Refine results. Showing {filteredCards.length} of{" "}
                      {cards.length} cards.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(statusFilter || creationFilter || expiryFilter) && (
                    <button
                      onClick={() => {
                        setStatusFilter("");
                        setCreationFilter("");
                        setExpiryFilter("");
                      }}
                      className="text-[11px] px-2 py-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                    >
                      Reset
                    </button>
                  )}
                  <button
                    onClick={() => setShowFilters((v) => !v)}
                    className="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200 transition"
                  >
                    {showFilters ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                    {showFilters ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              {showFilters && (
                <div className="px-5 py-5 space-y-8">
                  <div className="grid lg:grid-cols-3 gap-8">
                    <div className="group rounded-xl border border-blue-200 bg-blue-50 p-4 hover:border-blue-300 transition">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
                        Status
                        {statusFilter && (
                          <button
                            onClick={() => setStatusFilter("")}
                            className="text-blue-600 hover:text-blue-800"
                            title="Clear"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </p>
                      <SegmentedButtonGroup
                        options={["Active", "Inactive"]}
                        selected={statusFilter}
                        onChange={(v) => setStatusFilter(v as string)}
                        size="sm"
                      />
                    </div>
                    <div className="group rounded-xl border border-green-200 bg-green-50 p-4 hover:border-green-300 transition">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
                        Created
                        {creationFilter && (
                          <button
                            onClick={() => setCreationFilter("")}
                            className="text-green-600 hover:text-green-800"
                            title="Clear"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </p>
                      <SegmentedButtonGroup
                        options={["Today", "7d", "30d", "Month", "Year"]}
                        selected={creationFilter}
                        onChange={(v) => setCreationFilter(v as string)}
                        size="sm"
                      />
                    </div>
                    <div className="group rounded-xl border border-yellow-200 bg-yellow-50 p-4 hover:border-yellow-300 transition">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
                        Expiry
                        {expiryFilter && (
                          <button
                            onClick={() => setExpiryFilter("")}
                            className="text-yellow-600 hover:text-yellow-800"
                            title="Clear"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </p>
                      <SegmentedButtonGroup
                        options={[
                          "Expiring 24h",
                          "Expiring 7d",
                          "Expiring 30d",
                          "Expiring 6m",
                          "Expired",
                          "No Expiry",
                        ]}
                        selected={expiryFilter}
                        onChange={(v) => setExpiryFilter(v as string)}
                        size="sm"
                      />
                    </div>
                  </div>

                  {(statusFilter || creationFilter || expiryFilter) && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-2">
                        Active Filters
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {statusFilter && (
                          <span className="group inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-medium">
                            {statusFilter}
                            <button
                              onClick={() => setStatusFilter("")}
                              aria-label="Clear status filter"
                              title="Clear status filter"
                              className="p-0.5 rounded-full hover:bg-blue-200 transition"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        )}
                        {creationFilter && (
                          <span className="group inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-full bg-green-100 text-green-700 border border-green-200 text-[11px] font-medium">
                            {creationFilter}
                            <button
                              onClick={() => setCreationFilter("")}
                              aria-label="Clear creation date filter"
                              title="Clear creation date filter"
                              className="p-0.5 rounded-full hover:bg-green-200 transition"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        )}
                        {expiryFilter && (
                          <span className="group inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200 text-[11px] font-medium">
                            {expiryFilter}
                            <button
                              onClick={() => setExpiryFilter("")}
                              aria-label="Clear expiry filter"
                              title="Clear expiry filter"
                              className="p-0.5 rounded-full hover:bg-yellow-200 transition"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setStatusFilter("");
                            setCreationFilter("");
                            setExpiryFilter("");
                          }}
                          className="text-[11px] text-slate-600 hover:text-slate-800 underline decoration-dotted ml-1"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-200">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-800 mb-2">
                  Loading Cards
                </h3>
                <p className="text-slate-600">
                  {connectionStatus === "connected"
                    ? "Fetching your review cards from cloud storage..."
                    : "Loading your review cards from local storage..."}
                </p>
              </div>
            ) : filteredCards.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-200">
                  <Building2 className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-800 mb-2">
                  {searchTerm ? "No cards found" : "No review cards yet"}
                </h3>
                <p className="text-slate-600 mb-8 max-w-md mx-auto">
                  {searchTerm
                    ? "Try adjusting your search terms or create a new card."
                    : "Get started by creating your first review card for your business."}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-green-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Card
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                {/* Review Cards Grid */}
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                    <Building2 className="w-6 h-6 mr-3 text-blue-600" />
                    Review Cards ({filteredCards.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {filteredCards.map((card) => (
                      <div
                        key={card.id}
                        className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 sm:transform sm:hover:scale-105 relative shadow-lg"
                      >
                        <div className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-center mb-4 gap-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-100 to-green-100 rounded-lg flex items-center justify-center sm:mr-4 shadow-md border border-blue-200">
                              {card.logoUrl ? (
                                <img
                                  src={card.logoUrl}
                                  alt={`${card.businessName} logo`}
                                  className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                                />
                              ) : (
                                <Building2 className="w-6 h-6 text-blue-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base sm:text-lg font-semibold text-slate-800 truncate">
                                {card.businessName}
                              </h3>
                              <p className="text-xs sm:text-sm text-slate-500 break-all">
                                /{card.slug}
                              </p>
                            </div>
                            {/* Views pill */}
                            <div className="sm:ml-2 mt-2 sm:mt-0 flex flex-row sm:flex-col items-start sm:items-end gap-2">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] sm:text-xs bg-blue-100 text-blue-700 border border-blue-200 font-medium">
                                <Eye className="w-3 h-3" />
                                {(card.viewCount || 0).toLocaleString()}
                              </span>
                              {card.active === false && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] sm:text-xs bg-red-100 text-red-700 border border-red-200 justify-center font-medium">
                                  Inactive
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="mb-4">
                            <p className="text-xs text-slate-500 mb-1">
                              Category :{" "}
                              <span className="text-sm text-slate-700 font-medium">
                                {card.category}
                              </span>
                            </p>

                            <p className="text-xs text-slate-500 mb-1 mt-2">
                              Type :{" "}
                              <span className="text-sm text-slate-700 font-medium">
                                {card.type}
                              </span>
                            </p>

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                              <div className="text-xs text-slate-500 mb-0">
                                <p className="mb-0">
                                  Created :{" "}
                                  <span className="text-sm text-slate-700 font-medium">
                                    {formatDate(card.createdAt)}
                                  </span>
                                </p>
                                {card.expiresAt && (
                                  <p className="mt-1 mb-0 text-xs text-slate-500">
                                    End:{" "}
                                    <span className="text-sm text-slate-700 font-medium">
                                      {formatDate(card.expiresAt)}
                                    </span>{" "}
                                    <span
                                      className={`ml-0 sm:ml-2 mt-1 sm:mt-0 inline-block px-2 py-0.5 rounded-full text-[10px] tracking-wide border font-medium ${
                                        formatRemaining(card) === "Expired"
                                          ? "bg-red-100 text-red-700 border-red-200"
                                          : "bg-green-100 text-green-700 border-green-200"
                                      }`}
                                    >
                                      {formatRemaining(card)}
                                    </span>
                                  </p>
                                )}
                                {!card.expiresAt && (
                                  <p className="mt-1 mb-0 text-xs text-slate-500 font-medium">
                                    No expiry
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center justify-center gap-3">
                                {/* Active toggle switch (right side) */}
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const updated = {
                                      ...card,
                                      active: !card.active,
                                      updatedAt: new Date().toISOString(),
                                    };
                                    setCards((prev) =>
                                      prev.map((c) =>
                                        c.id === card.id ? updated : c
                                      )
                                    );
                                    await storage.updateCard(updated);
                                  }}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    card.active ? "bg-green-500" : "bg-gray-400"
                                  }`}
                                  aria-label={
                                    card.active
                                      ? "Deactivate card"
                                      : "Activate card"
                                  }
                                  title={
                                    card.active
                                      ? "Click to deactivate"
                                      : "Click to activate"
                                  }
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                      card.active
                                        ? "translate-x-6"
                                        : "translate-x-1"
                                    }`}
                                  />
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <button
                              onClick={() => handleViewCard(card.slug)}
                              className="w-full inline-flex items-center justify-center px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium shadow-sm"
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Open
                            </button>
                            <button
                              onClick={() => setQrCard(card)}
                              className="w-full inline-flex items-center justify-center px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-sm"
                              title="Show QR"
                            >
                              <QrCode className="w-4 h-4 mr-1" />
                              QR
                            </button>
                            <button
                              onClick={() => setEditingCard(card)}
                              className="w-full inline-flex items-center justify-center px-3 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 font-medium shadow-sm"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => setDeletingCard(card)}
                              className="w-full inline-flex items-center justify-center px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium shadow-sm"
                              title="Delete card"
                              aria-label={`Delete ${card.businessName}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* User Admins Section */}
        {activeTab === "userAdmins" && <UserAdminManagement />}

        {/* Modals */}
        {showAddModal && (
          <CompactAddCardModal
            onClose={() => setShowAddModal(false)}
            onSave={handleAddCard}
          />
        )}

        {editingCard && (
          <EditCardModal
            card={editingCard}
            onClose={() => setEditingCard(null)}
            onSave={handleEditCard}
          />
        )}

        {deletingCard && (
          <ConfirmDialog
            title="Delete Review Card"
            message={`Are you sure you want to delete the review card for "${deletingCard.businessName}"? This action cannot be undone.`}
            onConfirm={handleDeleteCard}
            onCancel={() => setDeletingCard(null)}
          />
        )}

        {qrCard && (
          <QRCodeModal
            url={`${window.location.origin}/${qrCard.slug}`}
            title={`Scan to open ${qrCard.businessName}`}
            logoUrl={qrCard.logoUrl}
            onClose={() => setQrCard(null)}
          />
        )}
      </div>
    </div>
  );
};
