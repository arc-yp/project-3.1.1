import {
  type CategoryReviewRequest,
  type GeneratedReview,
  getOrCreateModel,
  getSentimentGuide,
  buildServiceInstructions,
  getCommonStrictInstructions,
  generateReviewWithRetry,
} from "./shared";

export const generateServicesReview = async (
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
      "Gemini API key is required for Services review generation"
    );
  }

  const model = getOrCreateModel(geminiApiKey, geminiModel);
  if (!model) {
    throw new Error("Failed to initialize Gemini model");
  }

  const sentimentGuide = getSentimentGuide("service");
  const serviceInstructions = buildServiceInstructions(
    selectedServices,
    starRating
  );
  const avoidPhrases = [
    "highly professional",
    "excellent service",
    "prompt response",
    "top-notch",
    "outstanding",
  ];

  const prompt = `Generate a realistic Google review for "${businessName}" which is a ${type} in the Services category.

Star Rating: ${starRating}/5
Sentiment: ${sentimentGuide[starRating]}
Tone: ${tone}
${highlights ? `Customer highlights: ${highlights}` : ""}
${serviceInstructions}

Services Specific Guidelines:
- Focus on service quality and professionalism
- Mention staff responsiveness and communication naturally
- Discuss timeliness and efficiency
- Comment on customer support and problem resolution
- Include value for money where appropriate
- Mention waiting time and satisfaction level
- Use service-related terminology naturally

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
    "Services",
    {
      businessName,
      category: "Services",
      type,
      tone,
    }
  );
};
