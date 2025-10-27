import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  Download,
  Eye,
  Filter,
  LineChart,
  ListOrdered,
  RefreshCw,
  Search,
  Trophy,
  TrendingUp,
  Copy as CopyIcon,
  Trash2,
} from "lucide-react";
import { ReviewCard } from "../../types";
import { storage } from "../../utils/storage";
import { formatDate } from "../../utils/helpers";
import {
  BarChartHorizontal,
  DonutChart,
  CreationTrendChart,
  LegendDot,
} from "../analytics/charts";
import ExpiringSection from "../analytics/ExpiringSection";

export const AnalyticsDashboard: React.FC = () => {
  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [metric, setMetric] = useState<"total" | "perDay">("total");
  const [nowTs, setNowTs] = useState<number>(Date.now());
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // live clock for expiring soon section
  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await storage.getCards();
        setCards(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    cards.forEach((c) => c.category && set.add(c.category));
    return ["all", ...Array.from(set).sort()];
  }, [cards]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards
      .filter((c) =>
        categoryFilter === "all" ? true : c.category === categoryFilter
      )
      .filter(
        (c) =>
          !q ||
          c.businessName.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q)
      );
  }, [cards, search, categoryFilter]);

  const totals = useMemo(() => {
    const totalViews = filtered.reduce((sum, c) => sum + (c.viewCount || 0), 0);
    const avgViews = filtered.length
      ? Math.round(totalViews / filtered.length)
      : 0;
    return { totalViews, avgViews, count: filtered.length };
  }, [filtered]);

  // Active vs inactive breakdown
  const activeInactiveData = useMemo(() => {
    const active = filtered.filter((c) => c.active !== false).length;
    const inactive = filtered.length - active;
    return [
      { label: "Active", value: active },
      { label: "Inactive", value: inactive },
    ];
  }, [filtered]);

  // Expiring soon: next 24h
  const expiringSoon = useMemo(() => {
    const in24h = nowTs + 24 * 60 * 60 * 1000;
    return filtered
      .filter(
        (c) =>
          c.expiresAt &&
          c.active !== false &&
          Date.parse(c.expiresAt) > nowTs &&
          Date.parse(c.expiresAt) <= in24h
      )
      .sort((a, b) => Date.parse(a.expiresAt!) - Date.parse(b.expiresAt!))
      .slice(0, 10);
  }, [filtered, nowTs]);

  const expiringIn30Days = useMemo(() => {
    const in30d = nowTs + 30 * 24 * 60 * 60 * 1000;
    const in24h = nowTs + 24 * 60 * 60 * 1000; // exclude ones already in 24h list
    return filtered
      .filter((c) => c.expiresAt && c.active !== false)
      .filter((c) => {
        const t = Date.parse(c.expiresAt!);
        return t > in24h && t <= in30d; // strictly beyond 24h up to 30d
      })
      .sort((a, b) => Date.parse(a.expiresAt!) - Date.parse(b.expiresAt!))
      .slice(0, 15);
  }, [filtered, nowTs]);

  const expiringIn6Months = useMemo(() => {
    const in6m = nowTs + 182 * 24 * 60 * 60 * 1000; // approx 6 months (182 days)
    const in30d = nowTs + 30 * 24 * 60 * 60 * 1000; // exclude ones already in 30d list
    return filtered
      .filter((c) => c.expiresAt && c.active !== false)
      .filter((c) => {
        const t = Date.parse(c.expiresAt!);
        return t > in30d && t <= in6m;
      })
      .sort((a, b) => Date.parse(a.expiresAt!) - Date.parse(b.expiresAt!))
      .slice(0, 20);
  }, [filtered, nowTs]);

  const formatRemaining = (card: ReviewCard) => {
    if (!card.expiresAt) return "—";
    const end = Date.parse(card.expiresAt);
    const diff = end - nowTs;
    if (diff <= 0) return "Expired";
    const s = Math.floor(diff / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${sec}s`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  };

  // Creation trend last 30 days
  const creationTrend = useMemo(() => {
    const days: { date: string; count: number }[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, count: 0 });
    }
    const index = new Map(days.map((d, i) => [d.date, i]));
    filtered.forEach((c) => {
      const key = new Date(c.createdAt).toISOString().slice(0, 10);
      if (index.has(key)) {
        days[index.get(key)!].count += 1;
      }
    });
    return days;
  }, [filtered]);

  const leaderboard = useMemo(() => {
    const now = Date.now();
    const score = (c: ReviewCard) => {
      if (metric === "total") return c.viewCount || 0;
      const days = Math.max(
        1,
        Math.round(
          (now - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        )
      );
      return (c.viewCount || 0) / days;
    };
    return [...filtered].sort((a, b) => score(b) - score(a)).slice(0, 10);
  }, [filtered, metric]);

  // Chart data for leaderboard (Top cards by views)
  const leaderboardChartData = useMemo(() => {
    const now = Date.now();
    return leaderboard.map((c) => {
      const days = Math.max(
        1,
        Math.round(
          (now - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        )
      );
      return {
        label: c.slug,
        fullLabel: c.businessName,
        value:
          metric === "total" ? c.viewCount || 0 : (c.viewCount || 0) / days,
      };
    });
  }, [leaderboard, metric]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { views: number; count: number }>();
    filtered.forEach((c) => {
      const key = c.category || "Uncategorized";
      const entry = map.get(key) || { views: 0, count: 0 };
      entry.views += c.viewCount || 0;
      entry.count += 1;
      map.set(key, entry);
    });
    return Array.from(map.entries())
      .map(([category, v]) => ({
        category,
        ...v,
        avg: v.count ? Math.round(v.views / v.count) : 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);
  }, [filtered]);

  // Chart data for category share
  const categoryChartData = useMemo(() => {
    return categoryBreakdown.map((row) => ({
      label: row.category,
      value: row.views,
    }));
  }, [categoryBreakdown]);

  const velocity = useMemo(() => {
    // Extra feature: view velocity = views per day since created
    const now = Date.now();
    return [...filtered]
      .map((c) => {
        const created = new Date(c.createdAt).getTime();
        const days = Math.max(
          1,
          Math.round((now - created) / (1000 * 60 * 60 * 24))
        );
        const perDay = (c.viewCount || 0) / days;
        return { ...c, days, perDay };
      })
      .sort((a, b) => b.perDay - a.perDay)
      .slice(0, 10);
  }, [filtered]);

  const zeroViewCards = useMemo(
    () => filtered.filter((c) => (c.viewCount || 0) === 0),
    [filtered]
  );

  // (Views distribution removed for now; can be reintroduced as separate component if needed)

  const handleDelete = useCallback(async (id: string) => {
    try {
      await storage.deleteCard(id);
      const fresh = await storage.getCards();
      setCards(fresh);
    } catch (e) {
      console.error("Failed to delete card", e);
    }
  }, []);

  const exportCSV = useCallback((rowsSource: ReviewCard[]) => {
    const header = [
      "businessName",
      "slug",
      "category",
      "type",
      "views",
      "createdAt",
      "updatedAt",
      "active",
      "expiresAt",
      "viewsPerDay",
    ];
    const now = Date.now();
    const rows = rowsSource.map((c) => {
      const days = Math.max(
        1,
        Math.round(
          (now - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        )
      );
      const perDay = ((c.viewCount || 0) / days).toFixed(2);
      return [
        c.businessName,
        c.slug,
        c.category,
        c.type,
        String(c.viewCount || 0),
        c.createdAt,
        c.updatedAt,
        (c.active !== false).toString(),
        c.expiresAt || "",
        perDay,
      ];
    });
    const csv = [header, ...rows]
      .map((r) =>
        r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analytics.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await storage.syncData();
      const fresh = await storage.getCards();
      setCards(fresh);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-yellow-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => (window.location.href = "/ai-admin")}
              className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 shadow-sm transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </button>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 flex items-center gap-2 tracking-tight">
              <BarChart3 className="w-6 h-6 text-blue-600" /> Analytics
              Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 shadow-lg flex-1 sm:flex-initial justify-center"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing" : "Refresh"}
            </button>
            <button
              onClick={() => exportCSV(filtered)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg flex-1 sm:flex-initial justify-center"
              title="Export filtered CSV"
            >
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by business or slug..."
              className="w-full pl-11 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>
          <div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full pl-11 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none shadow-sm"
                aria-label="Filter by category"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Metric toggle */}
          <div>
            <div className="bg-white border border-slate-200 rounded-xl p-1 flex shadow-sm">
              <button
                onClick={() => setMetric("total")}
                className={`flex-1 px-2 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                  metric === "total"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Total Views
              </button>
              <button
                onClick={() => setMetric("perDay")}
                className={`flex-1 px-2 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                  metric === "perDay"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Views / Day
              </button>
            </div>
          </div>
          <div>
            <div className="grid grid-cols-2 gap-2 h-full">
              <div className="bg-white border border-blue-200 rounded-xl p-3 text-center shadow-sm">
                <div className="text-xs text-slate-600 font-medium">
                  Total Views
                </div>
                <div className="text-xl font-bold text-blue-600">
                  {totals.totalViews.toLocaleString()}
                </div>
              </div>
              <div className="bg-white border border-green-200 rounded-xl p-3 text-center shadow-sm">
                <div className="text-xs text-slate-600 font-medium">
                  Avg/Card
                </div>
                <div className="text-xl font-bold text-green-600">
                  {totals.avgViews.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div
            className="space-y-6 animate-pulse"
            aria-label="Loading analytics"
            role="status"
          >
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="h-52 bg-white border border-slate-200 rounded-xl shadow-sm" />
              <div className="h-52 bg-white border border-slate-200 rounded-xl shadow-sm xl:col-span-2" />
            </div>
            <div className="h-64 bg-white border border-slate-200 rounded-xl shadow-sm" />
            <div className="h-64 bg-white border border-slate-200 rounded-xl shadow-sm" />
            <div className="h-64 bg-white border border-slate-200 rounded-xl shadow-sm" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Overview Row Including Active Breakdown & Creation Trend */}
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-600" /> Status &
                Creation Trend
              </h2>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                  <h3 className="text-slate-700 text-sm font-semibold mb-4">
                    Active vs Inactive
                  </h3>
                  {activeInactiveData.every((d) => d.value === 0) ? (
                    <div className="text-slate-500 text-sm">No cards</div>
                  ) : (
                    <DonutChart
                      data={activeInactiveData}
                      size={200}
                      thickness={28}
                      ariaLabel="Active vs Inactive cards"
                    />
                  )}
                  <div className="flex gap-4 mt-4 text-xs text-slate-600">
                    {activeInactiveData.map((d) => (
                      <span key={d.label} className="flex items-center gap-1">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${
                            d.label === "Active" ? "bg-green-500" : "bg-red-500"
                          }`}
                        ></span>
                        {d.label}: {d.value}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-6 xl:col-span-2 shadow-lg hover:shadow-xl transition-shadow">
                  <h3 className="text-slate-700 text-sm font-semibold mb-4">
                    New Cards (Last 30 Days)
                  </h3>
                  <CreationTrendChart
                    data={creationTrend}
                    ariaLabel="Cards created last 30 days"
                  />
                </div>
              </div>
            </section>

            <ExpiringSection
              id="expiring24h"
              title={
                <>
                  <Calendar className="w-5 h-5 mr-2 text-red-600" /> Expiring
                  Within 24 Hours
                </>
              }
              rows={expiringSoon}
              emptyMessage="No cards expiring in the next 24 hours."
              accentClass="bg-white border border-red-200 shadow-lg"
              remainingBadgeClass="bg-red-100 text-red-700 border border-red-200"
              formatRemaining={formatRemaining}
            />

            <ExpiringSection
              id="expiring30d"
              title={
                <>
                  <Calendar className="w-5 h-5 mr-2 text-yellow-600" /> Expiring
                  Within 30 Days
                </>
              }
              rows={expiringIn30Days}
              emptyMessage="No cards expiring in the next 30 days (beyond 24h)."
              accentClass="bg-white border border-yellow-200 shadow-lg"
              remainingBadgeClass="bg-yellow-100 text-yellow-700 border border-yellow-200"
              formatRemaining={formatRemaining}
            />

            <ExpiringSection
              id="expiring6m"
              title={
                <>
                  <Calendar className="w-5 h-5 mr-2 text-blue-600" /> Expiring
                  Within 6 Months
                </>
              }
              rows={expiringIn6Months}
              emptyMessage="No cards expiring in the next 6 months (beyond 30 days)."
              accentClass="bg-white border border-blue-200 shadow-lg"
              remainingBadgeClass="bg-blue-100 text-blue-700 border border-blue-200"
              formatRemaining={formatRemaining}
            />
            {/* Leaderboard */}
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-yellow-600" /> Top Cards by
                Views
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Chart */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <h3 className="text-slate-700 text-sm font-semibold mb-4">
                    Top 10 ({metric === "total" ? "Total Views" : "Views/Day"})
                  </h3>
                  <BarChartHorizontal
                    data={leaderboardChartData}
                    maxBars={10}
                    height={260}
                    ariaLabel="Top cards by views chart"
                  />
                </div>
                {/* Table */}
                <div className="overflow-x-auto">
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow min-w-[720px]">
                    <div className="grid grid-cols-12 gap-0 px-4 py-3 text-slate-600 text-xs font-medium border-b border-slate-200 bg-slate-50">
                      <div className="col-span-1">#</div>
                      <div className="col-span-4">Business</div>
                      <div className="col-span-3">Slug</div>
                      <div className="col-span-2 flex items-center gap-1">
                        <Eye className="w-4 h-4" /> Views
                      </div>
                      <div className="col-span-2 flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        /day
                      </div>
                    </div>
                    {leaderboard.length === 0 ? (
                      <div className="p-6 text-slate-500 text-center">
                        No data
                      </div>
                    ) : (
                      leaderboard.map((c, idx) => {
                        const days = Math.max(
                          1,
                          Math.round(
                            (Date.now() - new Date(c.createdAt).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )
                        );
                        const perDay = ((c.viewCount || 0) / days).toFixed(2);
                        return (
                          <div
                            key={c.id}
                            className="grid grid-cols-12 gap-0 px-4 py-3 text-slate-700 border-t border-slate-200 hover:bg-slate-50 transition-colors"
                          >
                            <div className="col-span-1 font-mono text-slate-500">
                              {idx + 1}
                            </div>
                            <div className="col-span-4">
                              <div className="font-semibold text-slate-800">
                                {c.businessName}
                              </div>
                              <div className="text-xs text-slate-500">
                                {c.category} • {c.type}
                              </div>
                            </div>
                            <div className="col-span-3 font-mono text-xs text-blue-600">
                              /{c.slug}
                            </div>
                            <div className="col-span-2 font-semibold">
                              {metric === "total"
                                ? (c.viewCount || 0).toLocaleString()
                                : perDay}
                            </div>
                            <div className="col-span-2">
                              <div className="flex items-center gap-2 justify-end">
                                <a
                                  href={`/${c.slug}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-sm"
                                  title={`Open /${c.slug}`}
                                  aria-label={`Open /${c.slug} in new tab`}
                                >
                                  <Eye className="w-4 h-4" />
                                </a>
                                <button
                                  onClick={() => {
                                    navigator.clipboard
                                      .writeText(
                                        `${window.location.origin}/${c.slug}`
                                      )
                                      .then(() => {
                                        setCopyFeedback(`Copied /${c.slug}`);
                                        setTimeout(
                                          () => setCopyFeedback(null),
                                          1500
                                        );
                                      })
                                      .catch(() => {
                                        setCopyFeedback("Copy failed");
                                        setTimeout(
                                          () => setCopyFeedback(null),
                                          1500
                                        );
                                      });
                                  }}
                                  className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm"
                                  title={`Copy link /${c.slug}`}
                                  aria-label={`Copy link /${c.slug}`}
                                >
                                  <CopyIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Category breakdown */}
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                <ListOrdered className="w-5 h-5 mr-2 text-blue-600" /> Category
                Breakdown
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Donut chart */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                  {categoryChartData.length === 0 ? (
                    <div className="text-slate-500">No data</div>
                  ) : (
                    <DonutChart
                      data={categoryChartData}
                      size={260}
                      thickness={26}
                      ariaLabel="Category share by views"
                    />
                  )}
                </div>
                {/* List */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="space-y-4">
                    {categoryBreakdown.length === 0 && (
                      <div className="text-slate-500 text-center">No data</div>
                    )}
                    {categoryBreakdown.map((row) => (
                      <div
                        key={row.category}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <LegendDot index={row.category} />
                          <div className="text-slate-800 font-semibold">
                            {row.category}
                          </div>
                          <div className="text-slate-500 text-xs flex items-center gap-1 bg-slate-200 px-2 py-1 rounded-full">
                            <Calendar className="w-3 h-3" /> {row.count} cards
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-slate-700 font-semibold">
                            {row.views.toLocaleString()} views
                          </div>
                          <div className="text-slate-500 text-xs">
                            avg {row.avg}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* View velocity */}
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                <LineChart className="w-5 h-5 mr-2 text-green-600" /> Fastest
                Growing (views/day)
              </h2>
              <div className="overflow-x-auto">
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow min-w-[720px]">
                  <div className="grid grid-cols-12 gap-0 px-4 py-3 text-slate-600 text-xs font-medium border-b border-slate-200 bg-slate-50">
                    <div className="col-span-1">#</div>
                    <div className="col-span-5">Business</div>
                    <div className="col-span-3">Slug</div>
                    <div className="col-span-3">Views/day</div>
                  </div>
                  {velocity.length === 0 ? (
                    <div className="p-6 text-slate-500 text-center">
                      No data
                    </div>
                  ) : (
                    velocity.map((c, idx) => (
                      <div
                        key={c.id}
                        className="grid grid-cols-12 gap-0 px-4 py-3 text-slate-700 border-t border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        <div className="col-span-1 font-mono text-slate-500">
                          {idx + 1}
                        </div>
                        <div className="col-span-5">
                          <div className="font-semibold text-slate-800">
                            {c.businessName}
                          </div>
                          <div className="text-xs text-slate-500">
                            Created {formatDate(c.createdAt)} • {c.days} days
                          </div>
                        </div>
                        <div className="col-span-3 font-mono text-xs text-blue-600">
                          /{c.slug}
                        </div>
                        <div className="col-span-3 font-semibold text-green-600">
                          {c.perDay.toFixed(2)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            {/* Zero view nudge - table */}
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-red-600" /> Needs
                Attention (0 views)
              </h2>
              <div className="overflow-x-auto">
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow min-w-[720px]">
                  <div className="grid grid-cols-12 gap-0 px-4 py-3 text-slate-600 text-xs font-medium border-b border-slate-200 bg-slate-50">
                    <div className="col-span-1">#</div>
                    <div className="col-span-6">Business</div>
                    <div className="col-span-2">Created</div>
                    <div className="col-span-3 text-right">Actions</div>
                  </div>
                  {zeroViewCards.length === 0 ? (
                    <div className="p-6 text-green-600 text-center font-medium">
                      Great! All cards have views.
                    </div>
                  ) : (
                    zeroViewCards.map((c, idx) => (
                      <div
                        key={c.id}
                        className="grid grid-cols-12 gap-0 px-4 py-3 text-slate-700 border-t border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        <div className="col-span-1 font-mono text-slate-500">
                          {idx + 1}
                        </div>
                        <div className="col-span-6">
                          <div className="font-semibold text-slate-800">
                            {c.businessName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {c.category} • {c.type}
                          </div>
                        </div>
                        <div className="col-span-2 text-xs text-slate-500">
                          {formatDate(c.createdAt)}
                        </div>
                        <div className="col-span-3">
                          <div className="flex items-center gap-2 justify-end">
                            <a
                              href={`/${c.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-sm"
                              title="Open"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => {
                                navigator.clipboard
                                  .writeText(
                                    `${window.location.origin}/${c.slug}`
                                  )
                                  .then(() => {
                                    setCopyFeedback(`Copied /${c.slug}`);
                                    setTimeout(
                                      () => setCopyFeedback(null),
                                      1500
                                    );
                                  })
                                  .catch(() => {
                                    setCopyFeedback("Copy failed");
                                    setTimeout(
                                      () => setCopyFeedback(null),
                                      1500
                                    );
                                  });
                              }}
                              className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm"
                              title="Copy link"
                            >
                              <CopyIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
      <div className="sr-only" aria-live="polite">
        {refreshing ? "Refreshing data" : "Idle"} {copyFeedback || ""}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
