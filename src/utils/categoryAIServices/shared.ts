import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { persistentCache } from "../persistentCache";

export interface CategoryReviewRequest {
  businessName: string;
  category?: string;
  type: string;
  highlights?: string;
  selectedServices?: string[];
  starRating: number;
  language?: string;
  tone?: "Professional" | "Friendly" | "Casual" | "Grateful";
  geminiApiKey?: string;
  geminiModel?: string;
}

export interface GeneratedReview {
  text: string;
  hash: string;
  language: string;
  rating: number;
}

// Store used review hashes to prevent duplicates
const usedReviewHashes = new Set<string>();

// Model cache to reuse instances
const modelCache = new Map<string, GenerativeModel>();

// Prompt cache to avoid regenerating identical prompts
const promptCache = new Map<string, string>();

// Result cache with TTL (Time To Live) - cache generated reviews for similar requests
interface CachedResult {
  result: GeneratedReview;
  timestamp: number;
}
const resultCache = new Map<string, CachedResult>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Persistent cache namespace prefix for review results
const PC_NS = "pcache:review:";

const getPersistentKey = (
  businessName: string,
  category: string,
  type: string,
  starRating: number,
  language: string,
  tone: string
) =>
  `${PC_NS}${generateRequestCacheKey(
    businessName,
    category,
    type,
    starRating,
    language,
    tone
  )}`;

// Pre-warmed models for common configurations
const preWarmedModels = new Set<string>();

/**
 * Creates or retrieves a cached Gemini model instance
 * Enhanced with pre-warming support
 */
export const getOrCreateModel = (
  apiKey: string,
  modelName: string = "gemini-2.0-flash"
) => {
  const cacheKey = `${apiKey.slice(0, 10)}_${modelName}`;

  if (!modelCache.has(cacheKey)) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      modelCache.set(cacheKey, model);
      console.log(`✅ Model created and cached: ${modelName}`);
    } catch (error) {
      console.error("Error creating Gemini model:", error);
      return null;
    }
  } else {
    console.log(`⚡ Using cached model: ${modelName}`);
  }

  return modelCache.get(cacheKey);
};

/**
 * Pre-warm models for faster first call
 * Call this on app initialization with your API key
 */
export const preWarmModels = async (
  apiKey: string,
  models: string[] = ["gemini-2.0-flash"]
): Promise<void> => {
  console.log("🔥 Pre-warming models...");
  const promises = models.map(async (modelName) => {
    const cacheKey = `${apiKey.slice(0, 10)}_${modelName}`;
    if (!preWarmedModels.has(cacheKey)) {
      getOrCreateModel(apiKey, modelName);
      preWarmedModels.add(cacheKey);
    }
  });
  await Promise.all(promises);
  console.log("✅ Models pre-warmed and ready!");
};

/**
 * Generate a cache key for request-based caching
 */
const generateRequestCacheKey = (
  businessName: string,
  category: string,
  type: string,
  starRating: number,
  language: string,
  tone: string
): string => {
  return `${businessName}_${category}_${type}_${starRating}_${language}_${tone}`;
};

/**
 * Check if a cached result exists and is still valid
 */
export const getCachedResult = (
  businessName: string,
  category: string,
  type: string,
  starRating: number,
  language: string,
  tone: string
): GeneratedReview | null => {
  const cacheKey = generateRequestCacheKey(
    businessName,
    category,
    type,
    starRating,
    language,
    tone
  );
  const cached = resultCache.get(cacheKey);

  if (cached) {
    const age = Date.now() - cached.timestamp;
    if (age < CACHE_TTL) {
      console.log(`⚡ Using cached result (age: ${Math.round(age / 1000)}s)`);
      return cached.result;
    } else {
      // Expired, remove from cache
      resultCache.delete(cacheKey);
    }
  }

  // Check persistent cache as a fallback (survives reloads)
  const pKey = getPersistentKey(
    businessName,
    category,
    type,
    starRating,
    language,
    tone
  );
  const persisted = persistentCache.getItem<GeneratedReview>(pKey);
  if (persisted) {
    // Rehydrate in-memory cache for ultra-fast subsequent hits
    resultCache.set(cacheKey, { result: persisted, timestamp: Date.now() });
    console.log("💾 Persistent cache hit for review result");
    return persisted;
  }

  return null;
};

/**
 * Cache a generated result
 */
export const cacheResult = (
  businessName: string,
  category: string,
  type: string,
  starRating: number,
  language: string,
  tone: string,
  result: GeneratedReview
): void => {
  const cacheKey = generateRequestCacheKey(
    businessName,
    category,
    type,
    starRating,
    language,
    tone
  );
  resultCache.set(cacheKey, {
    result,
    timestamp: Date.now(),
  });
  console.log(`💾 Result cached for future use`);

  // Also write to persistent cache so it's instant after reloads
  const pKey = getPersistentKey(
    businessName,
    category,
    type,
    starRating,
    language,
    tone
  );
  persistentCache.setItem(pKey, result, CACHE_TTL, {
    namespacePrefix: PC_NS,
    maxEntries: 1000,
  });
};

/**
 * Clear expired cache entries
 */
export const clearExpiredCache = (): number => {
  const now = Date.now();
  let cleared = 0;

  for (const [key, value] of resultCache.entries()) {
    if (now - value.timestamp >= CACHE_TTL) {
      resultCache.delete(key);
      cleared++;
    }
  }

  if (cleared > 0) {
    console.log(`🧹 Cleared ${cleared} expired cache entries`);
  }

  return cleared;
};

/**
 * Generate a simple hash for review content
 */
export const generateHash = (content: string): string => {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // force 32-bit
  }
  return Math.abs(hash).toString(36);
};

/**
 * Check if review is unique
 */
export const isReviewUnique = (content: string): boolean => {
  const hash = generateHash(content);
  return !usedReviewHashes.has(hash);
};

/**
 * Mark review as used
 */
export const markReviewAsUsed = (content: string): void => {
  const hash = generateHash(content);
  usedReviewHashes.add(hash);
};

/**
 * Enhanced validation for generated reviews
 */
export const validateReview = (
  text: string,
  lang: string,
  minChars: number = 300,
  maxChars: number = 350
): { valid: boolean; reason?: string } => {
  const t = text.trim();

  // Length check
  if (t.length < minChars) {
    return { valid: false, reason: `Too short: ${t.length} < ${minChars}` };
  }
  if (t.length > maxChars) {
    return { valid: false, reason: `Too long: ${t.length} > ${maxChars}` };
  }

  // No exclamation marks
  if (/[!]/.test(t)) {
    return { valid: false, reason: "Contains exclamation marks" };
  }

  // Don't mention star rating explicitly
  if (/\b([1-5]\s*stars?|one|two|three|four|five\s*stars?)\b/i.test(t)) {
    return { valid: false, reason: "Mentions star rating" };
  }

  // Romanization checks: disallow Gujarati/Devanagari scripts
  const hasGujarati = /[\u0A80-\u0AFF]/.test(t);
  const hasDevanagari = /[\u0900-\u097F]/.test(t);

  if (hasGujarati || hasDevanagari) {
    if (lang === "Gujarati" || lang === "Hindi" || lang === "English") {
      return {
        valid: false,
        reason: "Contains native script instead of romanized text",
      };
    }
  }

  return { valid: true };
};

/**
 * Get language instruction for prompts
 */
export const getLanguageInstruction = (language: string): string => {
  switch (language) {
    case "English":
      return "Write the review ONLY in English. Do NOT use any Gujarati, Hindi, or Marathi words. The entire review must be in English.";
    case "Gujarati":
      return "Write the review in Gujarati language, but use only English letters (Romanized Gujarati). Do NOT use Gujarati script. Example: 'Hu khush chu.'";
    case "Hindi":
      return "Write the review in Hindi language, but use only English letters (Romanized Hindi). Do NOT use Hindi script. Example: 'Main khush hoon.'";
    default:
      return "Write the review ONLY in English.";
  }
};

/**
 * Common sentiment guide across all categories
 */
export const getSentimentGuide = (categoryType: string = "general") => {
  const guides: Record<string, Record<number, string>> = {
    general: {
      1: "Polite but reserved- highlights one or two issues gently, while still appreciating the effort. Sounds constructive, not harsh.",
      2: "Encouraging with minor suggestions-points out areas for improvement but emphasises positive aspects more strongly.",
      3: "Balanced review - mentions a mix of pros and small cons, but overall keeps the tone supportive and fair.",
      4: "Clearly positive- praises good service or experience, maybe with one small suggestion.",
      5: "Highly enthusiastic- warm, detailed praise, showing full satisfaction.",
    },
    food: {
      1: "Polite but reserved- mentions food quality or service issues gently, while still appreciating some aspects. Constructive tone.",
      2: "Encouraging with minor suggestions-points out areas for improvement but emphasises taste and positive dining aspects.",
      3: "Balanced review - mentions a mix of good food/service and small cons, but overall keeps the tone supportive.",
      4: "Clearly positive- praises food quality, ambience, and staff behavior, maybe with one small suggestion.",
      5: "Highly enthusiastic- warm, detailed praise about delicious food, excellent service, and wonderful dining experience.",
    },
    health: {
      1: "Polite but reserved- mentions medical care or facility issues gently, while appreciating some effort. Constructive, not harsh.",
      2: "Encouraging with minor suggestions-points out areas for improvement but emphasises caring staff and some positive aspects.",
      3: "Balanced review - mentions a mix of good care and small concerns, but overall keeps the tone respectful and fair.",
      4: "Clearly positive- praises doctor's care, nursing staff, and facility cleanliness, maybe with one small suggestion.",
      5: "Highly grateful- warm, detailed praise about excellent medical care, compassionate doctors, and positive health outcomes.",
    },
    education: {
      1: "Polite but reserved- mentions teaching quality or facility issues gently, while appreciating some aspects. Constructive tone.",
      2: "Encouraging with minor suggestions-points out areas for improvement but emphasises some positive educational aspects.",
      3: "Balanced review - mentions a mix of good teaching and small concerns, but overall keeps the tone supportive.",
      4: "Clearly positive- praises teaching quality, staff behavior, and learning environment, maybe with one small suggestion.",
      5: "Highly appreciative- warm, detailed praise about excellent education, caring teachers, and positive learning outcomes.",
    },
    service: {
      1: "Polite but reserved- mentions service quality or responsiveness issues gently, while appreciating some effort. Constructive tone.",
      2: "Encouraging with minor suggestions-points out areas for improvement but emphasises some positive service aspects.",
      3: "Balanced review - mentions a mix of good service and small concerns, but overall keeps the tone supportive.",
      4: "Clearly positive- praises service quality, staff responsiveness, and timeliness, maybe with one small suggestion.",
      5: "Highly satisfied- warm, detailed praise about excellent service, professional staff, and great value for money.",
    },
  };

  return guides[categoryType] || guides.general;
};

/**
 * Build service-specific instructions
 */
export const buildServiceInstructions = (
  selectedServices: string[] | undefined,
  starRating: number
): string => {
  if (!selectedServices || selectedServices.length === 0) {
    return "";
  }

  return `
Customer specifically wants to highlight these aspects: ${selectedServices.join(
    ", "
  )}
- Mention these aspects naturally in the review context
- Don't list them generically, weave them into the experience narrative
- Focus on how these specific elements contributed to the ${starRating}-star experience
- Use authentic language that reflects real customer experience with these services`;
};

/**
 * Common strict instructions for all categories
 */
export const getCommonStrictInstructions = (
  businessName: string,
  starRating: number,
  language: string,
  categorySpecificAvoidPhrases: string[] = []
): string => {
  const avoidPhrases =
    categorySpecificAvoidPhrases.length > 0
      ? categorySpecificAvoidPhrases.join('", "')
      : 'highly recommend", "amazing", "best ever';

  return `
Strict instructions:
- Review must be between 300 and 350 characters.
- No repetition of ideas or sentence structures.
- First sentence must always be different.
- Use fresh adjectives and sentence tone.
- Tone: Human, real, warm, and natural.
- Not use exclamation mark
- ${businessName} should appear naturally in different positions
- Sound natural with regional authenticity
- Avoid overused lines like "${avoidPhrases}"
- Mention 1 unique detail in each review
- Match the ${starRating}-star sentiment exactly
- No fake exaggeration, keep it credible
- Don't mention the star rating in the text
- Not write any place name in the review
- ${getLanguageInstruction(language)}
- Return only the review text, no quotes, no instructions, no extra formatting.`;
};

/**
 * Core review generation logic with retry, validation, and intelligent caching
 * Enhanced for maximum performance
 */
export const generateReviewWithRetry = async (
  model: GenerativeModel,
  prompt: string,
  language: string,
  starRating: number,
  maxRetries: number = 5,
  categoryName: string = "Category",
  requestParams?: {
    businessName: string;
    category: string;
    type: string;
    tone: string;
  }
): Promise<GeneratedReview> => {
  // Check cache first for ultra-fast response
  if (requestParams) {
    const cached = getCachedResult(
      requestParams.businessName,
      requestParams.category,
      requestParams.type,
      starRating,
      language,
      requestParams.tone
    );
    if (cached) {
      return cached;
    }
  }

  const validationFailures: string[] = [];
  const startTime = Date.now();

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const reviewText = response.text().trim();

      // Validate the review
      const validation = validateReview(reviewText, language);

      if (!validation.valid) {
        validationFailures.push(`Attempt ${attempt + 1}: ${validation.reason}`);
        console.log(
          `${categoryName} - Attempt ${attempt + 1}: Validation failed - ${
            validation.reason
          }`
        );
        continue;
      }

      // Check uniqueness
      if (!isReviewUnique(reviewText)) {
        validationFailures.push(`Attempt ${attempt + 1}: Duplicate review`);
        console.log(
          `${categoryName} - Attempt ${attempt + 1}: Duplicate review detected`
        );
        continue;
      }

      // Success! Mark as used and return
      markReviewAsUsed(reviewText);

      const generatedReview: GeneratedReview = {
        text: reviewText,
        hash: generateHash(reviewText),
        language,
        rating: starRating,
      };

      // Cache the result for future use
      if (requestParams) {
        cacheResult(
          requestParams.businessName,
          requestParams.category,
          requestParams.type,
          starRating,
          language,
          requestParams.tone,
          generatedReview
        );
      }

      const elapsed = Date.now() - startTime;
      console.log(
        `✅ Review generated in ${elapsed}ms (attempt ${attempt + 1})`
      );

      return generatedReview;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(
        `${categoryName} Review Generation Error (attempt ${attempt + 1}):`,
        errorMsg
      );
      validationFailures.push(`Attempt ${attempt + 1}: ${errorMsg}`);
    }
  }

  // All retries failed
  const errorMessage = `Failed to generate unique, valid review after ${maxRetries} attempts.\nFailures: ${validationFailures.join(
    ", "
  )}`;
  console.error(errorMessage);
  throw new Error(errorMessage);
};

/**
 * Batch generate multiple reviews in parallel for maximum throughput
 */
export const generateReviewsBatch = async (
  model: GenerativeModel,
  requests: Array<{
    prompt: string;
    language: string;
    starRating: number;
    categoryName: string;
    requestParams?: {
      businessName: string;
      category: string;
      type: string;
      tone: string;
    };
  }>,
  maxRetries: number = 5
): Promise<GeneratedReview[]> => {
  console.log(`🚀 Batch generating ${requests.length} reviews...`);
  const startTime = Date.now();

  const promises = requests.map((req) =>
    generateReviewWithRetry(
      model,
      req.prompt,
      req.language,
      req.starRating,
      maxRetries,
      req.categoryName,
      req.requestParams
    )
  );

  const results = await Promise.all(promises);
  const elapsed = Date.now() - startTime;

  console.log(
    `✅ Batch completed in ${elapsed}ms (${Math.round(
      elapsed / requests.length
    )}ms avg per review)`
  );

  return results;
};

/**
 * Clear used hashes (for testing or reset)
 */
export const clearUsedHashes = (): void => {
  usedReviewHashes.clear();
  console.log("🧹 Cleared all used review hashes");
};

/**
 * Clear all caches (models, results, prompts)
 */
export const clearAllCaches = (): void => {
  modelCache.clear();
  resultCache.clear();
  promptCache.clear();
  preWarmedModels.clear();
  usedReviewHashes.clear();
  // Clear persistent review namespace
  try {
    persistentCache.clearNamespace(PC_NS);
  } catch (e) {
    console.warn("Failed to clear persistent review cache", e);
  }
  console.log("🧹 Cleared all caches");
};

/**
 * Get comprehensive usage statistics
 */
export const getUsageStats = (): {
  totalGenerated: number;
  cachedModels: number;
  cachedResults: number;
  cacheHitRate: string;
  preWarmedModels: number;
} => {
  return {
    totalGenerated: usedReviewHashes.size,
    cachedModels: modelCache.size,
    cachedResults: resultCache.size,
    cacheHitRate:
      resultCache.size > 0
        ? `${Math.round(
            (resultCache.size / (resultCache.size + usedReviewHashes.size)) *
              100
          )}%`
        : "0%",
    preWarmedModels: preWarmedModels.size,
  };
};

/**
 * Automatic cache cleanup - run periodically
 */
export const setupAutoCacheCleanup = (
  intervalMs: number = 60000
): NodeJS.Timeout => {
  console.log(`🔄 Auto cache cleanup enabled (every ${intervalMs / 1000}s)`);
  return setInterval(() => {
    clearExpiredCache();
  }, intervalMs);
};
