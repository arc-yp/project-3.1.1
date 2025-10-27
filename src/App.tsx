import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useParams,
} from "react-router-dom";
import ReactGA from "react-ga4";

import { AdminDashboard } from "./components/Admin/AdminDashboard";
import { AnalyticsDashboard } from "./components/Admin/AnalyticsDashboard";
import { CompactReviewCardView } from "./components/ReviewCard/CompactReviewCardView";
import { LoginPage } from "./components/Admin/LoginPage";
import { ProtectedRoute } from "./components/Admin/ProtectedRoute";
import { UserAdminLogin, UserAdminDashboard } from "./components/UserAdmin";
import { storage } from "./utils/storage";
import { ReviewCard } from "./types";
import { preWarmModels } from "./utils/categoryAIServices/shared";
import { ShieldX } from "lucide-react";

ReactGA.initialize("G-J7T5QPZPQ9"); // your measurement ID

function App() {
  const location = useLocation();

  // Track every route change (GA4)
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: location.pathname });
  }, [location]);

  // Non-blocking model pre-warm at startup to reduce first-token latency
  useEffect(() => {
    (async () => {
      try {
        // Try to find any stored card to read API key/model for pre-warm
        const local = localStorage.getItem("scc_review_cards");
        if (local) {
          const cards: ReviewCard[] = JSON.parse(local);
          const first = cards.find((c) => !!c.geminiApiKey);
          if (first?.geminiApiKey) {
            await preWarmModels(first.geminiApiKey, [
              first.geminiModel || "gemini-2.0-flash",
            ]);
          }
        }
      } catch {
        // noop
      }
    })();
  }, []);

  return (
    <Routes>
      {/* Auth / Static */}
      <Route path="/" element={<LoginPage />} />
      <Route
        path="/ai-admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-admin/analytics"
        element={
          <ProtectedRoute>
            <AnalyticsDashboard />
          </ProtectedRoute>
        }
      />

      {/* User Admin Routes - Must be before dynamic card route */}
      <Route path="/:slug/admin" element={<UserAdminLogin />} />
      <Route path="/:slug/admin/dashboard" element={<UserAdminDashboard />} />

      {/* Dynamic card at root level */}
      <Route path="/:slug" element={<DynamicReviewCard />} />

      {/* Fallback */}
      <Route path="*" element={<NotFoundFallback />} />
    </Routes>
  );
}

// Wrap App with Router (moved Router out so useLocation works)
const AppWithRouter = () => (
  <Router>
    <App />
  </Router>
);

// Component to handle dynamic review card routing
const DynamicReviewCard: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [card, setCard] = React.useState<ReviewCard | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    const loadCard = async () => {
      setLoading(true);
      try {
        const invalid = !slug || slug.includes(".") || slug === "favicon.ico";
        if (invalid) {
          if (!cancelled) {
            setCard(null);
            setLoading(false);
          }
          return;
        }
        const foundCard = await storage.getCardBySlug(slug);
        if (!cancelled) setCard(foundCard);
      } catch {
        if (!cancelled) setCard(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadCard();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Guard: ignore blank or asset-like slugs (after hooks)
  if (!slug || slug.includes(".") || slug === "favicon.ico") {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-yellow-50 to-green-50 p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Loading Review Card
          </h1>
          <p className="text-slate-600">Please wait...</p>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-yellow-50 to-green-50 flex items-center justify-center p-4">
        <div className="text-center max-w-2xl mx-auto">
          <div className="w-24 h-24 bg-gradient-to-b from-rose-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <ShieldX className="w-12 h-12 text-white" />
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xl mb-6">
            <img
              src="/aireviewsystm_qrcode.png"
              alt="AI Review System QR Code"
              className="mx-auto mb-6 w-40 max-w-full border-4 border-blue-500 rounded-xl shadow-lg bg-white"
            />
          </div>
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xl">
            <h1 className="text-xl font-bold text-slate-800 mb-4">
              Card Not Found
            </h1>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4">
              Please Contact Admin
            </h2>
            <a
              href="https://www.aireviewsystem.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 mb-6"
            >
              Visit AIReviewSystem.com
            </a>
            <p className="text-slate-600 text-sm sm:text-base">
              The review card for "/{slug}" doesn't exist or has been removed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (card.active === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-yellow-50 to-green-50 flex items-center justify-center p-4">
        <div className="text-center max-w-lg mx-auto">
          <div className="w-24 h-24 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
            <span className="text-4xl">⚠️</span>
          </div>
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xl">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4">
              Temporarily Unavailable
            </h1>
            <p className="text-slate-700 mb-4">
              The review card for "/{slug}" is currently inactive.
            </p>
            <p className="text-slate-600 text-sm mb-6">
              Please check back later or contact the business owner if you
              believe this is an error.
            </p>
            <div className="border-t border-slate-200 pt-6">
              <p className="text-sm text-slate-700 mb-4">
                Need assistance? Contact Admin:
              </p>
              <a
                href="https://www.aireviewsystem.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Visit AIReviewSystem.com
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <CompactReviewCardView card={card} />;
};

// Simple fallback for any unmatched path
const NotFoundFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-yellow-50 to-green-50 p-4">
    <div className="text-center max-w-md mx-auto">
      <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
        <span className="text-4xl font-bold text-white">404</span>
      </div>
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xl">
        <h1 className="text-3xl font-bold text-slate-800 mb-4">
          Page Not Found
        </h1>
        <p className="text-slate-600 mb-6">
          The page you're looking for doesn't exist.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Go Home
        </a>
      </div>
    </div>
  </div>
);

export default AppWithRouter;
