import {
  type CategoryReviewRequest,
  type GeneratedReview,
  getOrCreateModel,
  getSentimentGuide,
  buildServiceInstructions,
  getCommonStrictInstructions,
  generateReviewWithRetry,
} from "./shared";

export const generateHealthMedicalReview = async (
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
    tone = "Grateful",
    geminiApiKey,
    geminiModel = "gemini-2.0-flash",
  } = request;

  if (!geminiApiKey) {
    throw new Error(
      "Gemini API key is required for Health & Medical review generation"
    );
  }

  const model = getOrCreateModel(geminiApiKey, geminiModel);
  if (!model) {
    throw new Error("Failed to initialize Gemini model");
  }

  const sentimentGuide = getSentimentGuide("health");
  const serviceInstructions = buildServiceInstructions(
    selectedServices,
    starRating
  );
  const avoidPhrases = [
    "doctor is amazing",
    "felt safe",
    "life-saving",
    "best doctor",
    "miracle",
  ];

  const prompt = `Generate a realistic Google review for "${businessName}" which is a ${type} in the Health & Medical category.

Star Rating: ${starRating}/5
Sentiment: ${sentimentGuide[starRating]}
Tone: ${tone}
${highlights ? `Patient highlights: ${highlights}` : ""}
${serviceInstructions}

Health & Medical Specific Guidelines:
- Focus on doctor's expertise and consultation quality
- Mention nursing staff behavior and patient care naturally
- Discuss facility cleanliness and hygiene
- Comment on waiting time and appointment management
- Include emergency handling if relevant
- Mention pharmacy support and billing transparency where appropriate
- Use medical and healthcare terminology appropriately
- Show gratitude and respect for medical professionals

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
    "Health & Medical",
    {
      businessName,
      category: "Health & Medical",
      type,
      tone,
    }
  );
};
