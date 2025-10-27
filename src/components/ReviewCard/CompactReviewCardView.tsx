import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Copy,
  CheckCircle,
  Sparkles,
  RefreshCw,
  Languages,
} from "lucide-react";
import { ReviewCard } from "../../types";
import { StarRating } from "./StarRating";
import { SegmentedButtonGroup } from "./SegmentedButtonGroup";
import { ServiceSelector } from "./ServiceSelector";
import { aiService } from "../../utils/aiService";
import { storage } from "../../utils/storage";

// Prevent double increments in React 18 Strict Mode
// Track view increments per card id for this page load to avoid double increments in Strict Mode
const hasIncrementedThisLoad: Record<string, boolean> = {};

interface CompactReviewCardViewProps {
  card: ReviewCard;
}

export const CompactReviewCardView: React.FC<CompactReviewCardViewProps> = ({
  card,
}) => {
  // Hooks must be called unconditionally
  const isInactive = card.active === false;
  const [currentReview, setCurrentReview] = useState("");
  const [selectedRating, setSelectedRating] = useState(5);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [selectedTone] = useState<
    "Professional" | "Friendly" | "Casual" | "Grateful"
  >("Friendly");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const languageOptions = useMemo(
    () =>
      card.allowedLanguages && card.allowedLanguages.length > 0
        ? card.allowedLanguages
        : ["English", "Gujarati", "Hindi"],
    [card.allowedLanguages]
  );

  const generateReviewForRating = useCallback(
    async (
      rating: number,
      language?: string,
      tone?: "Professional" | "Friendly" | "Casual" | "Grateful",
      services?: string[]
    ) => {
      setIsGenerating(true);
      try {
        const review = await aiService.generateReview({
          businessName: card.businessName,
          category: card.category,
          type: card.type,
          highlights: card.description,
          selectedServices: services || selectedServices,
          starRating: rating,
          language: language || selectedLanguage,
          tone: tone || selectedTone,
          useCase: "Customer review",
          geminiApiKey: card.geminiApiKey,
          geminiModel: card.geminiModel,
        });
        setCurrentReview(review.text);
      } catch (error) {
        console.error("Failed to generate review:", error);
        // Use contextual fallback review
        const includedServices = (services || selectedServices || [])
          .slice(0, 3)
          .join(", ");
        const fallback = `${rating} star experience at ${card.businessName}${
          includedServices ? " for " + includedServices : ""
        }. Great service and friendly staff.`;
        setCurrentReview(fallback);
      } finally {
        setIsGenerating(false);
      }
    },
    [card, selectedLanguage, selectedTone, selectedServices]
  );

  useEffect(() => {
    if (isInactive) return; // skip effects if card is inactive
    // Generate initial review when component loads
    generateReviewForRating(5, "English", "Friendly", []);

    // Increment view count when component loads
    const incrementView = async () => {
      // Guard: if we've already incremented this card during this page load, skip
      if (hasIncrementedThisLoad[card.id]) return;

      hasIncrementedThisLoad[card.id] = true;
      try {
        await storage.incrementViewCount(card.id);
      } catch (error) {
        console.error("Failed to increment view count:", error);
        // In case of error, allow retry on next render attempt
        delete hasIncrementedThisLoad[card.id];
      }
    };

    incrementView();
  }, [card.id, isInactive, generateReviewForRating]);

  const handleRatingChange = (rating: number) => {
    setSelectedRating(rating);
    generateReviewForRating(
      rating,
      selectedLanguage,
      selectedTone,
      selectedServices
    );
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    generateReviewForRating(
      selectedRating,
      language,
      selectedTone,
      selectedServices
    );
  };

  const handleServicesChange = (services: string[]) => {
    setSelectedServices(services);
    generateReviewForRating(
      selectedRating,
      selectedLanguage,
      selectedTone,
      services
    );
  };

  const handleCopyAndRedirect = async () => {
    try {
      await navigator.clipboard.writeText(currentReview);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      window.location.href = card.googleMapsUrl;
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleRegenerateReview = () => {
    generateReviewForRating(
      selectedRating,
      selectedLanguage,
      selectedTone,
      selectedServices
    );
  };

  const renderReviewText = () => (
    <blockquote className="text-gray-800 text-sm leading-relaxed whitespace-pre-line">
      {currentReview}
    </blockquote>
  );

  useEffect(() => {
    // if allowed languages changed (unlikely after mount), keep valid selection
    if (!languageOptions.includes(selectedLanguage)) {
      setSelectedLanguage(languageOptions[0]);
    }
  }, [languageOptions, selectedLanguage]);

  // Render inactive card UI (after hooks to satisfy rules of hooks)
  if (isInactive) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-neutral-50 p-6">
        <div className="max-w-md w-full text-center bg-white rounded-xl border border-neutral-200 p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-neutral-800 mb-2">
            {card.businessName}
          </h1>
          <p className="text-neutral-500 text-sm mb-4">
            This review card is currently inactive.
          </p>
          <p className="text-neutral-400 text-xs">Please check back later.</p>
          <h1 className="text-sm text-white mb-4">
            Please! Contact Admin&nbsp;
            <a
              href="https://www.aireviewsystem.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-400 hover:text-blue-600"
            >
              https://www.aireviewsystem.com/
            </a>
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-neutral-50 p-4 sm:p-6 md:p-10 lg:p-16 bg-gradient-to-br from-blue-200 via-purple-200 to-slate-200">
      <div className="w-full max-w-xl sm:max-w-2xl">
        {/* Main Card */}
        <div className="relative bg-white w-full rounded-xl sm:rounded-2xl p-4 sm:p-8 border-4 border-neutral-200 duration-200 shadow-[0_10px_18px_rgba(59,131,246,0.36),0_2px_8px_rgba(199,29,251,0.58)]">
          {/* Colored Dots (Top-Left) */}
          <div className="absolute top-4 right-4 sm:top-5 sm:right-10 flex gap-2">
            <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-blue-500 shadow-sm shadow-blue-300" />
            <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-red-500 shadow-sm shadow-red-300" />
            <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-yellow-400 shadow-sm shadow-yellow-200" />
            <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-green-500 shadow-sm shadow-green-300" />
          </div>
          {/* Simple Header */}
          <div className="flex flex-row xs:flex-row sm:flex-row items-start xs:items-center sm:items-center gap-3 sm:gap-4 mb-4 mt-4 sm:mt-0">
            {card.logoUrl ? (
              <img
                src={card.logoUrl}
                alt={`${card.businessName} Logo`}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-contain border border-neutral-300 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg sm:text-xl font-semibold">
                {card.businessName.charAt(0)}
              </div>
            )}
            <div className="min-w-0 w-full">
              <h1 className="text-lg sm:text-xl font-semibold text-neutral-800 leading-tight break-words">
                {card.businessName}
              </h1>
              {card.location && (
                <div className="mt-1 relative group flex items-start sm:items-center gap-0 w-full">
                  <img
                    src="/map.png"
                    alt="Map icon"
                    className="w-6 h-6 sm:w-6 sm:h-6 object-contain shrink-0 mt-0 sm:mt-0"
                  />

                  <a
                    href={
                      card.googleMapsUrl ||
                      `https://www.google.com/maps/search/${encodeURIComponent(
                        card.location
                      )}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] sm:text-sm text-neutral-600 hover:text-blue-700 underline-offset-2 hover:underline leading-snug break-words"
                  >
                    <span className="sm:hidden break-words">
                      {card.location}
                    </span>
                    <span className="hidden sm:inline" title={card.location}>
                      {card.location}
                    </span>
                  </a>
                </div>
              )}
            </div>
          </div>
          {/* Star Rating Selector */}
          <div className="text-center mb-2">
            {/* <p className="text-neutral-700 font-medium mb-2">Rate your experience</p> */}
            <div className="flex justify-center mb-1 ">
              <StarRating
                rating={selectedRating}
                onRatingChange={handleRatingChange}
                size="lg"
              />
            </div>
            {/* <p className="text-xs text-neutral-500">
              {selectedRating === 1 && "Very dissatisfied"}
              {selectedRating === 2 && "Below average"}
              {selectedRating === 3 && "Average experience"}
              {selectedRating === 4 && "Good experience"}
              {selectedRating === 5 && "Excellent experience"}
            </p> */}
          </div>

          {/* Language & Tone Selectors */}
          <div className="grid grid-cols-1 gap-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 flex items-center mb-2">
                <Languages className="w-4 h-4 mr-2 text-orange-600" />
                Language
              </label>
              <SegmentedButtonGroup
                options={languageOptions}
                selected={selectedLanguage}
                onChange={(value: string | string[]) =>
                  handleLanguageChange(value as string)
                }
                size="sm"
              />
            </div>
          </div>

          {/* Service Selection */}
          {card.services && card.services.length > 0 && (
            <ServiceSelector
              services={card.services}
              selectedServices={selectedServices}
              onSelectionChange={handleServicesChange}
              className="mb-4"
            />
          )}

          {/* Review Text */}
          <div className="mb-3">
            <div className="rounded-xl p-4 border border-neutral-500 bg-neutral-50 min-h-[110px] flex items-center">
              {isGenerating ? (
                <div className="flex items-center justify-center w-full">
                  <div className="text-center">
                    <RefreshCw className="animate-spin h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <span className="text-neutral-600 text-sm font-medium">
                      Generating review...
                    </span>
                    <p className="text-[10px] text-neutral-500 mt-1">
                      {selectedServices.length > 0
                        ? `${selectedServices.length} services included`
                        : "Personalizing text"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="w-full">{renderReviewText()}</div>
              )}
            </div>
            {currentReview && !isGenerating && (
              <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
                <span>
                  {selectedLanguage} • {selectedRating}★
                </span>
                <span className="font-mono">{currentReview.length} chars</span>
              </div>
            )}
          </div>

          {/* Action Buttons - stack on very small screens */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-2 w-full">
            <button
              onClick={handleCopyAndRedirect}
              disabled={!currentReview || isGenerating}
              className={`w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm sm:text-base transition-colors ${
                copied
                  ? "bg-green-500 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label="Copy review text and open Google Maps review page"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span className="whitespace-nowrap">
                    Copied! Opening Google...
                  </span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span className="whitespace-nowrap">
                    Copy & Post to Google
                  </span>
                </>
              )}
            </button>

            <button
              onClick={handleRegenerateReview}
              disabled={isGenerating}
              className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors duration-200 disabled:opacity-50 border border-neutral-300 text-sm sm:text-base"
              aria-label="Generate a new review"
            >
              {isGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span className="whitespace-nowrap">Generate New Review</span>
            </button>
          </div>
        </div>

        {/* View Counter */}
        {/* <div className="flex items-center justify-center gap-2 mb-4 mt-3">
          <div className="px-3 py-1.5 rounded-full bg-white border border-neutral-200 shadow-sm flex items-center gap-2">
            <Eye className="w-4 h-4 text-neutral-500" />
            <span className="text-xs text-neutral-600 font-medium">
              {viewCount.toLocaleString()} {viewCount === 1 ? "view" : "views"}
            </span>
          </div>
        </div> */}
      </div>
    </div>
  );
};
