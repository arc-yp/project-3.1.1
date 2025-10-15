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
import { ReviewCard } from "../types";
import { storage } from "../utils/storage";
import { formatDate } from "../utils/helpers";
import { CompactAddCardModal } from "./CompactAddCardModal";
import { EditCardModal } from "./EditCardModal";
import { ConfirmDialog } from "./ConfirmDialog";
import { auth } from "../utils/auth";
import { isSupabaseConfigured } from "../utils/supabase";
import { QRCodeModal } from "./QRCodeModal";
import { SegmentedButtonGroup } from "./SegmentedButtonGroup";

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
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>(""); // Active | Inactive
  const [creationFilter, setCreationFilter] = useState<string>(""); // Today | 7d | 30d | Month | Year
  const [expiryFilter, setExpiryFilter] = useState<string>(""); // Expiring 24h | 7d | 30d | 6m | Expired | No Expiry
  const [showFilters, setShowFilters] = useState<boolean>(false);
  // Removed showInactive filter; inactive cards are always visible per requirements

  const initializeDashboard = useCallback(async () => {
    setIsLoading(true);

    // Check connection status
    if (isSupabaseConfigured()) {
      setConnectionStatus("connected");
      await checkForMigration();
    } else {
      setConnectionStatus("local");
    }

    await loadCards();
    setIsLoading(false);
  }, []);

  useEffect(() => {
    initializeDashboard();
  }, [initializeDashboard]);

  // Real-time ticking clock for countdowns
  useEffect(() => {
    const interval = setInterval(() => {
      const current = Date.now();
      setNowTs(current);
      setCards(prev => {
        let changed = false;
        const updated = prev.map(c => {
          if (c.active !== false && c.expiresAt && Date.parse(c.expiresAt) <= current) {
            changed = true;
            // fire & forget persistence
            (async () => {
              try {
                const updatedCard = { ...c, active: false, updatedAt: new Date().toISOString() };
                await storage.updateCard(updatedCard);
              } catch {}
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
    if (diffMs <= 0) return 'Expired';
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
      if (statusFilter === 'Active' && card.active === false) return false;
      if (statusFilter === 'Inactive' && card.active !== false) return false;

      // Creation date filter
      if (creationFilter) {
        const createdAt = Date.parse(card.createdAt);
        const startOfToday = new Date();
        startOfToday.setHours(0,0,0,0);
        const now = nowTs;
        let pass = true;
        switch (creationFilter) {
          case 'Today':
            pass = createdAt >= startOfToday.getTime();
            break;
          case '7d':
            pass = createdAt >= now - 7 * 86400000;
            break;
          case '30d':
            pass = createdAt >= now - 30 * 86400000;
            break;
          case 'Month': { // current calendar month
            const d = new Date(createdAt);
            const today = new Date(now);
            pass = d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
            break; }
          case 'Year': {
            const d = new Date(createdAt);
            const today = new Date(now);
            pass = d.getFullYear() === today.getFullYear();
            break; }
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
          case 'Expiring 24h':
            pass = !!endTs && diff! > 0 && diff! <= 24 * 3600000;
            break;
          case 'Expiring 7d':
            pass = !!endTs && diff! > 0 && diff! <= 7 * 86400000 && diff! > 24 * 3600000;
            break;
          case 'Expiring 30d':
            pass = !!endTs && diff! > 0 && diff! <= 30 * 86400000 && diff! > 7 * 86400000;
            break;
            case 'Expiring 6m': {
              const sixMonthsMs = 182 * 86400000; // approx 6 months
              pass = !!endTs && diff! > 0 && diff! <= sixMonthsMs && diff! > 30 * 86400000;
              break; }
          case 'Expired':
            pass = !!endTs && diff! <= 0;
            break;
          case 'No Expiry':
            pass = !endTs;
            break;
          default:
            pass = true;
        }
        if (!pass) return false;
      }

      return true;
    });
  }, [cards, searchTerm, selectedCategories, statusFilter, creationFilter, expiryFilter, nowTs]);

  const handleViewCard = (slug: string) => {
    window.open(`/${slug}`, "_blank");
  };

  const handleLogout = () => {
    auth.logout();
    window.location.href = "/ai-login";
  };

  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case "connected":
        return (
          <div className="flex items-center text-green-400 text-sm">
            <Database className="w-4 h-4 mr-2" />
            <Wifi className="w-3 h-3 mr-1" />
            <span>Cloud Storage Active</span>
          </div>
        );
      case "local":
        return (
          <div className="flex items-center text-yellow-400 text-sm">
            <Building2 className="w-4 h-4 mr-2" />
            <WifiOff className="w-3 h-3 mr-1" />
            <span>Local Storage Only</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center text-blue-400 text-sm">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            <span>Checking Connection...</span>
          </div>
        );
    }
  };

  if (isMigrating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Database className="w-8 h-8 text-blue-400 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Migrating Data</h1>
          <p className="text-slate-400 mb-8">
            Moving your review cards to cloud storage for cross-device sync...
          </p>
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin mr-2" />
            <span className="text-blue-400">Please wait...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-[10%] left-[10%] w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[10%] right-[10%] w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-between items-center mb-4">
            {getConnectionStatusDisplay()}
            <div className="flex items-center gap-3">
              {/* Changed <a> to <Link> */}
                <Link
                  to="/ai-admin/analytics"
                  className="inline-flex items-center px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/15 transition-colors duration-200 border border-white/20"
                  title="Analytics"
                >
                  <Eye className="w-4 h-4 mr-2" /> Analytics
                </Link>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors duration-200 disabled:opacity-50"
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
                  className="inline-flex items-center px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </button>
            </div>
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            {/* <div className=" flex items-center justify-center mb-8">            
                      <img
                        src="/py.png"
                        alt="YP Logo"
                        className="w-20 h-20 sm:w-12 sm:h-12 lg:w-20 lg:h-20 object-contain rounded-xl  border border-white"
                      />
                  </div>      */}
            Review Cards Dashboard
          </h1>
          <p className="text-slate-300">
            {connectionStatus === "connected"
              ? "Your review cards are synced across all devices"
              : "Managing review cards locally"}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search cards by business name or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            />
          </div>
          {/* Removed show inactive toggle button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Card
          </button>
        </div>  

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20  ">
            <p className="text-slate-400 text-sm font-medium">Total Cards</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-white">{cards.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <p className="text-slate-400 text-sm font-medium">Active Today</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-white">{cards.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <p className="text-slate-400 text-sm font-medium">This Month</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-white">
                  {
                    cards.filter((card) => {
                      const cardDate = new Date(card.createdAt);
                      const now = new Date();
                      return (
                        cardDate.getMonth() === now.getMonth() &&
                        cardDate.getFullYear() === now.getFullYear()
                      );
                    }).length
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

         {/* Filters Row */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-white/3 to-white/5 backdrop-blur-md mb-10">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-400/30">
                <Filter className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">Filters
                  {(statusFilter || creationFilter || expiryFilter) && (
                    <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-blue-600/30 text-blue-200 border border-blue-400/30">{[statusFilter,creationFilter,expiryFilter].filter(Boolean).length} active</span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-400">Refine results. Showing {filteredCards.length} of {cards.length} cards.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(statusFilter || creationFilter || expiryFilter) && (
                <button
                  onClick={() => { setStatusFilter(''); setCreationFilter(''); setExpiryFilter(''); }}
                  className="text-[11px] px-2 py-1 rounded-md bg-white/10 text-slate-300 hover:bg-white/20 transition"
                >Reset</button>
              )}
              <button
                onClick={() => setShowFilters(v => !v)}
                className="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-md bg-blue-600/30 text-blue-100 hover:bg-blue-600/40 border border-blue-500/30 transition"
              >
                {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showFilters ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          {showFilters && (
            <div className="px-5 py-5 space-y-8">
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="group rounded-xl border border-white/10 bg-white/5 p-4 hover:border-blue-400/40 transition">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">Status
                    {statusFilter && (
                      <button onClick={()=>setStatusFilter('')} className="text-slate-400 hover:text-white" title="Clear">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </p>
                  <SegmentedButtonGroup
                    options={['Active','Inactive']}
                    selected={statusFilter}
                    onChange={(v) => setStatusFilter(v as string)}
                    size="sm"
                  />
                </div>
                <div className="group rounded-xl border border-white/10 bg-white/5 p-4 hover:border-purple-400/40 transition">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">Created
                    {creationFilter && (
                      <button onClick={()=>setCreationFilter('')} className="text-slate-400 hover:text-white" title="Clear">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </p>
                  <SegmentedButtonGroup
                    options={['Today','7d','30d','Month','Year']}
                    selected={creationFilter}
                    onChange={(v) => setCreationFilter(v as string)}
                    size="sm"
                  />
                </div>
                <div className="group rounded-xl border border-white/10 bg-white/5 p-4 hover:border-pink-400/40 transition">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">Expiry
                    {expiryFilter && (
                      <button onClick={()=>setExpiryFilter('')} className="text-slate-400 hover:text-white" title="Clear">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </p>
                  <SegmentedButtonGroup
                    options={['Expiring 24h','Expiring 7d','Expiring 30d','Expiring 6m','Expired','No Expiry']}
                    selected={expiryFilter}
                    onChange={(v) => setExpiryFilter(v as string)}
                    size="sm"
                  />
                </div>
              </div>

              {(statusFilter || creationFilter || expiryFilter) && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Active Filters</p>
                  <div className="flex flex-wrap gap-2">
                    {statusFilter && (
                      <span className="group inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-full bg-blue-600/25 text-blue-100 border border-blue-500/30 text-[11px]">
                        {statusFilter}
                        <button onClick={()=>setStatusFilter('')} aria-label="Clear status filter" title="Clear status filter" className="p-0.5 rounded-full hover:bg-blue-500/40 transition">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {creationFilter && (
                      <span className="group inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-full bg-purple-600/25 text-purple-100 border border-purple-500/30 text-[11px]">
                        {creationFilter}
                        <button onClick={()=>setCreationFilter('')} aria-label="Clear creation date filter" title="Clear creation date filter" className="p-0.5 rounded-full hover:bg-purple-500/40 transition">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    {expiryFilter && (
                      <span className="group inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-full bg-pink-600/25 text-pink-100 border border-pink-500/30 text-[11px]">
                        {expiryFilter}
                        <button onClick={()=>setExpiryFilter('')} aria-label="Clear expiry filter" title="Clear expiry filter" className="p-0.5 rounded-full hover:bg-pink-500/40 transition">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    <button
                      onClick={() => { setStatusFilter(''); setCreationFilter(''); setExpiryFilter(''); }}
                      className="text-[11px] text-slate-400 hover:text-white underline decoration-dotted ml-1"
                    >Clear All</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-2">
              Loading Cards
            </h3>
            <p className="text-slate-400">
              {connectionStatus === "connected"
                ? "Fetching your review cards from cloud storage..."
                : "Loading your review cards from local storage..."}
            </p>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-2">
              {searchTerm ? "No cards found" : "No review cards yet"}
            </h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              {searchTerm
                ? "Try adjusting your search terms or create a new card."
                : "Get started by creating your first review card for your business."}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
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
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Building2 className="w-6 h-6 mr-3" />
                Review Cards ({filteredCards.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCards.map((card) => (
                  <div
                    key={card.id}
                    className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden hover:bg-white/15 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl relative"
                  >
                    <div className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mr-4 shadow-lg">
                          {card.logoUrl ? (
                            <img
                              src={card.logoUrl}
                              alt={`${card.businessName} logo`}
                              className="w-8 h-8 object-contain"
                            />
                          ) : (
                            <Building2 className="w-6 h-6 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white truncate">
                            {card.businessName}
                          </h3>
                          <p className="text-sm text-slate-400">/{card.slug}</p>
                        </div>
                        {/* Views pill */}
                        <div className="ml-2 flex flex-col items-end ">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-white/10 text-blue-200 border border-white/20">
                            <Eye className="w-3 h-3" />
                            {(card.viewCount || 0).toLocaleString()}
                          </span>
                          {card.active === false && (
                            <span className="mt-1 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-200 border border-red-400/20 w-full justify-center">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs text-slate-400 mb-1">
                          Category :{" "}
                          <span className="text-sm text-slate-300">
                            {card.category}
                          </span>
                        </p>

                        <p className="text-xs text-slate-400 mb-1 mt-2">
                          Type :{" "}
                          <span className="text-sm text-slate-300">
                            {card.type}
                          </span>
                        </p>

                        <div className="flex items-center justify-between mb-4">
                          <div className="text-xs text-slate-400 mb-0">
                            <p className="mb-0">
                              Created :{" "}
                              <span className="text-sm text-slate-300">
                                {formatDate(card.createdAt)}
                              </span>
                            </p>
                            {card.expiresAt && (
                              <p className="mt-1 mb-0 text-xs text-slate-400">
                                End: <span className="text-sm text-slate-300">{formatDate(card.expiresAt)}</span>{" "}
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] tracking-wide border ${formatRemaining(card)==='Expired' ? 'bg-red-500/20 text-red-300 border-red-400/30' : 'bg-blue-500/10 text-blue-200 border-blue-400/20'}`}>{formatRemaining(card)}</span>
                              </p>
                            )}
                            {!card.expiresAt && (
                              <p className="mt-1 mb-0 text-xs text-slate-500">No expiry</p>
                            )}
                          </div>

                          <div className="flex items-center justify-center gap-3">
                            {/* Active toggle switch (right side) */}
                            <button
                              type="button"
                              onClick={async () => {
                                const updated = { ...card, active: !card.active, updatedAt: new Date().toISOString() };
                                setCards((prev) => prev.map((c) => (c.id === card.id ? updated : c)));
                                await storage.updateCard(updated);
                              }}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                card.active ? "bg-green-500" : "bg-gray-400/60"
                              }`}
                              aria-label={card.active ? "Deactivate card" : "Activate card"}
                              title={card.active ? "Click to deactivate" : "Click to activate"}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                  card.active ? "translate-x-6" : "translate-x-1"
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                        
                      </div>

                      <div className="flex flex-wrap gap-2">
                        
                        <button
                          onClick={() => handleViewCard(card.slug)}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors duration-200"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Open
                        </button>
                        <button
                          onClick={() => setQrCard(card)}
                          className="inline-flex items-center justify-center px-3 py-2 bg-blue-600/20 text-blue-300 rounded-lg hover:bg-blue-600/30 transition-colors duration-200"
                          title="Show QR"
                        >
                          <QrCode className="w-4 h-4 mr-1" />
                          QR
                        </button>
                        <button
                          onClick={() => setEditingCard(card)}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-colors duration-200"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingCard(card)}
                          className="inline-flex items-center justify-center px-3 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors duration-200"
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
