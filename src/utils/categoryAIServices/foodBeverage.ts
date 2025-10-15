import {
  type CategoryReviewRequest,
  type GeneratedReview,
  getOrCreateModel,
  getSentimentGuide,
  buildServiceInstructions,
  getCommonStrictInstructions,
  generateReviewWithRetry,
} from "./shared";

export const generateFoodBeverageReview = async (
  request: CategoryReviewRequest,
  maxRetries: number = 5
): Promise<GeneratedReview> => {
  const {
    businessName,
    type,
    highlights,
    selectedServices,
    starRating,
    language = "English",
    tone = "Friendly",
    geminiApiKey,
    geminiModel = "gemini-2.0-flash",
  } = request;

  if (!geminiApiKey) {
    throw new Error(
      "Gemini API key is required for Food & Beverage review generation"
    );
  }

  const model = getOrCreateModel(geminiApiKey, geminiModel);
  if (!model) {
    throw new Error("Failed to initialize Gemini model");
  }

  const sentimentGuide = getSentimentGuide("food");
  const serviceInstructions = buildServiceInstructions(
    selectedServices,
    starRating
  );
  const avoidPhrases = [
    "mouth-watering",
    "must try",
    "delicious food",
    "tasty",
    "yummy",
  ];

  const prompt = `Generate a realistic Google review for "${businessName}" which is a ${type} in the Food & Beverage category.

Star Rating: ${starRating}/5
Sentiment: ${sentimentGuide[starRating]}
Tone: ${tone}
${highlights ? `Customer highlights: ${highlights}` : ""}
${serviceInstructions}

Food & Beverage Specific Guidelines:
- Focus on food taste, quality, and presentation
- Mention staff behavior and hospitality naturally
- Discuss restaurant ambience and cleanliness
- Comment on serving time and portion sizes
- Include hygiene standards where appropriate
- Mention specific dishes organically (don't force it)
- Use dining and food-related terminology naturally

${getCommonStrictInstructions(
  businessName,
  starRating,
  language,
  avoidPhrases
)}`;

  return await generateReviewWithRetry(
    model,
    prompt,
    language,
    starRating,
    maxRetries,
    "Food & Beverage",
    {
      businessName,
      category: "Food & Beverage",
      type,
      tone,
    }
  );
};
