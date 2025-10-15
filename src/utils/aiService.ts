import {
  generateHash,
  isReviewUnique,
  markReviewAsUsed,
  validateReview,
  getLanguageInstruction,
  getSentimentGuide,
  buildServiceInstructions,
  clearUsedHashes as clearSharedHashes,
  getUsageStats as getSharedUsageStats,
  getOrCreateModel,
} from "./categoryAIServices/shared";

export interface ReviewRequest {
  businessName: string;
  category: string;
  type: string;
  highlights?: string;
  selectedServices?: string[];
  starRating: number;
  language?: string;
  tone?: "Professional" | "Friendly" | "Casual" | "Grateful";
  useCase?: "Customer review" | "Student feedback" | "Patient experience";
  geminiApiKey?: string;
  geminiModel?: string;
}

export interface GeneratedReview {
  text: string;
  hash: string;
  language: string;
  rating: number;
}

export class AIReviewService {
  private createModel(apiKey: string, modelName: string = "gemini-2.0-flash") {
    if (!apiKey) return null;
    return getOrCreateModel(apiKey, modelName);
  }

  async generateReview(
    request: ReviewRequest,
    maxRetries: number = 5
  ): Promise<GeneratedReview> {
    const {
      geminiApiKey,
      geminiModel = "gemini-2.0-flash",
      category,
    } = request;

    const model = this.createModel(geminiApiKey || "", geminiModel);
    if (!model) {
      console.warn(
        "Gemini API key not provided or invalid, using fallback review"
      );
      return this.getFallbackReview(request);
    }

    const {
      businessName,
      type,
      highlights,
      selectedServices,
      starRating,
      language,
      tone,
    } = request;

    const languageOptions = ["English", "Gujarati", "Hindi"];
    const selectedLanguage =
      language ||
      languageOptions[Math.floor(Math.random() * languageOptions.length)];
    const selectedTone = tone || "Friendly";

    // Try to use category-specific service if available
    try {
      const { generateCategoryBasedReview } = await import(
        "./categoryAIServices"
      );

      const categoryRequest = {
        businessName,
        category,
        type,
        highlights,
        selectedServices,
        starRating,
        language: selectedLanguage,
        tone: selectedTone,
        geminiApiKey,
        geminiModel,
      };

      const result = await generateCategoryBasedReview(
        categoryRequest,
        maxRetries
      );

      if (result && isReviewUnique(result.text)) {
        markReviewAsUsed(result.text);
        return {
          text: result.text,
          hash: generateHash(result.text),
          language: result.language,
          rating: result.rating,
        };
      }
    } catch (error) {
      console.warn(
        "Category-based review generation failed, falling back to generic:",
        error
      );
    }

    // Fallback to generic generation if category-specific fails
    const sentimentGuide = getSentimentGuide("general");
    const serviceInstructions = buildServiceInstructions(
      selectedServices,
      starRating
    );
    const languageInstruction = getLanguageInstruction(selectedLanguage);

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const prompt = `Generate a realistic Google review for "${businessName}" which is a ${type} in the ${category} category.

Star Rating: ${starRating}/5
Sentiment: ${sentimentGuide[starRating as keyof typeof sentimentGuide]}
Tone: ${selectedTone}
${highlights ? `Customer highlights: ${highlights}` : ""}
${serviceInstructions}

Strict instructions:
- Review must be between 300 and 350 characters.
- No repetition of ideas or sentence structures.
- First sentence must always be different.
- Use fresh adjectives and sentence tone.
- Tone: Human, real, warm, and natural.
- in gujarati starting line not write "Kem chho!"
- not use exclamation mark

Requirements:
- ${businessName} is shown always different place in review
- Sound natural and human-like with regional authenticity
- DO NOT repeat phrasing or meaning from previous reviews
- not write any place name in the review.
- Avoid overused lines like "I felt safe", "highly recommend", "Dr. is amazing".
- Mention 1 unique point in each review (emotional detail).
- Match the ${starRating}-star sentiment exactly
- Be specific to the business type (${type}) and category (${category})
- No fake exaggeration, keep it credible and locally relevant
- Don't mention the star rating in the text
- Make it unique - avoid common phrases or structures
${
  highlights
    ? `- Try to incorporate these highlights naturally: ${highlights}`
    : ""
}
${
  selectedServices && selectedServices.length > 0
    ? `- Naturally incorporate these service experiences: ${selectedServices.join(
        ", "
      )}`
    : ""
}
- ${languageInstruction}
- Use authentic regional expressions and terminology
- Avoid generic templates or repetitive structures
- Return only the review text, no quotes, no instructions, no extra formatting, and no introductory sentences.`;

      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const reviewText = response.text().trim();

        const validation = validateReview(reviewText, selectedLanguage);

        if (!validation.valid) {
          console.log(
            `Attempt ${attempt + 1}: Validation failed - ${
              validation.reason
            }, retrying...`
          );
          continue;
        }

        if (isReviewUnique(reviewText)) {
          markReviewAsUsed(reviewText);
          return {
            text: reviewText,
            hash: generateHash(reviewText),
            language: selectedLanguage,
            rating: starRating,
          };
        }

        console.log(
          `Attempt ${attempt + 1}: Generated duplicate review, retrying...`
        );
      } catch (error) {
        console.error(
          `AI Review Generation Error (attempt ${attempt + 1}):`,
          error
        );
      }
    }

    return this.getFallbackReview(request);
  }

  private getFallbackReview(request: ReviewRequest): GeneratedReview {
    const { businessName, starRating, language } = request;

    const fallbacks: Record<number, Record<string, string[]>> = {
      4: {
        English: [
          `Professional service and quality work, just a minor wait time. Team stayed helpful and the process felt smooth from start to finish.`,
          `Good experience overall with attentive staff and neat handling. A tiny delay, but the outcome showed care and consistency.`,
          `Friendly approach and reliable work made the visit easy. One small area to improve, yet the value was clear.`,
        ],
        Gujarati: [
          `Seva sari ane kaam ni quality pan jamti hati. Thodu wait karvu padiyu, pan staff madadru hato ane process saral lagi.`,
          `${businessName} par anubhav saru rahyo. Team vinamra hati, ane karya shantithi puru thayu. Nanakdu sudharo shakya che.`,
        ],
        Hindi: [
          `${businessName} par anubhav accha raha. Staff sahayak tha aur kaam dhang se hua. Bas thoda intezar karna pada.`,
          `Seva badhiya lagi, prakriya bhi asan rahi. Chhota sa sudhar ho sakta hai, par kul mila kar santusht hoon.`,
        ],
      },
      5: {
        English: [
          `Warm service, clear guidance, and careful work made the whole experience effortless and genuinely satisfying. Staff stayed attentive and respectful throughout.`,
          `Excellent care with smooth coordination and thoughtful follow-up. Everything felt simple, timely, and genuinely customer-focused from start to end.`,
          `From greeting to finish, the process felt easy and precise. Courteous team, clean handling, and result matched expectation well.`,
        ],
        Gujarati: [
          `Namr service, spasht margdarshan ane dhyanpurvak kaam thi anubhav saral ane santoshjanak lagyo. Team lagatar dhyanma rahi.`,
          `Saras care, yogya samay par kaam ane vinamra vyavhar. Badhu saral rite thayu ane grahak par kendrit rahyu.`,
        ],
        Hindi: [
          `Namr seva, spasht nirdesh aur dhyan se kiya gaya kaam. Puri prakriya aaram se aur samay par puri hui, anubhav santoshjanak raha.`,
          `Shuruaat se ant tak sab kuchh aasan aur samay par raha. Team vinamra rahi aur parinam ummeed ke anuroop the.`,
        ],
      },
    };

    const ratingFallbacks = fallbacks[starRating] || fallbacks[4];
    const langKey =
      language && ratingFallbacks[language] ? language : "English";
    const languageFallbacks = ratingFallbacks[langKey];
    const randomIndex = Math.floor(Math.random() * languageFallbacks.length);
    const selectedFallback = languageFallbacks[randomIndex].trim();

    // Mark as used and return consistent hash based on content
    markReviewAsUsed(selectedFallback);
    return {
      text: selectedFallback,
      hash: generateHash(selectedFallback),
      language: langKey,
      rating: starRating,
    };
  }

  // Generate tagline for business
  async generateTagline(
    businessName: string,
    category: string,
    type: string,
    geminiApiKey?: string,
    geminiModel?: string
  ): Promise<string> {
    const prompt = `Generate a catchy, professional tagline for "${businessName}" which is a ${type} in the ${category} category.

- Keep it under 8 words
- Make it memorable and professional
- Reflect the business type and category
- Use action words or emotional appeal
- Avoid clichés like "Your trusted partner"
- Make it unique and specific to the business

Return only the tagline, no quotes or extra text.`;

    const model = this.createModel(
      geminiApiKey || "",
      geminiModel || "gemini-2.0-flash"
    );

    if (!model) {
      console.warn("Gemini API key not provided, using fallback tagline");
      // Return fallback tagline
      const fallbackTaglines: Record<string, string[]> = {
        Services: [
          "Excellence in Every Service",
          "Your Service Solution",
          "Quality You Can Trust",
        ],
        "Food & Beverage": [
          "Taste the Difference",
          "Fresh & Delicious Always",
          "Where Flavor Meets Quality",
        ],
        "Health & Medical": [
          "Your Health, Our Priority",
          "Caring for Your Wellness",
          "Expert Care Always",
        ],
        Education: [
          "Learning Made Easy",
          "Knowledge for Success",
          "Education Excellence",
        ],
        "Professional Businesses": [
          "Professional Solutions",
          "Expert Services",
          "Business Excellence",
        ],
      };

      const categoryTaglines =
        fallbackTaglines[category] || fallbackTaglines["Services"];
      return categoryTaglines[
        Math.floor(Math.random() * categoryTaglines.length)
      ];
    }

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error("Tagline generation error:", error);
      // Fallback taglines based on category
      const fallbackTaglines: Record<string, string[]> = {
        Services: [
          "Excellence in Every Service",
          "Your Service Solution",
          "Quality You Can Trust",
        ],
        "Food & Beverage": [
          "Taste the Difference",
          "Fresh & Delicious Always",
          "Where Flavor Meets Quality",
        ],
        "Health & Medical": [
          "Your Health, Our Priority",
          "Caring for Your Wellness",
          "Expert Care Always",
        ],
        Education: [
          "Learning Made Easy",
          "Knowledge for Success",
          "Education Excellence",
        ],
        "Professional Businesses": [
          "Professional Solutions",
          "Expert Services",
          "Business Excellence",
        ],
      };

      const categoryTaglines =
        fallbackTaglines[category] || fallbackTaglines["Services"];
      return categoryTaglines[
        Math.floor(Math.random() * categoryTaglines.length)
      ];
    }
  }

  // Clear used hashes (for testing or reset)
  clearUsedHashes(): void {
    clearSharedHashes();
  }

  // Get usage statistics
  getUsageStats(): { totalGenerated: number } {
    return getSharedUsageStats();
  }
}

export const aiService = new AIReviewService();
