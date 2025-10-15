import {
  type CategoryReviewRequest,
  type GeneratedReview,
  getOrCreateModel,
  getSentimentGuide,
  buildServiceInstructions,
  getCommonStrictInstructions,
  generateReviewWithRetry,
} from "./shared";

export const generateEducationReview = async (
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
    tone = "Professional",
    geminiApiKey,
    geminiModel = "gemini-2.0-flash",
  } = request;

  if (!geminiApiKey) {
    throw new Error(
      "Gemini API key is required for Education review generation"
    );
  }

  const model = getOrCreateModel(geminiApiKey, geminiModel);
  if (!model) {
    throw new Error("Failed to initialize Gemini model");
  }

  const sentimentGuide = getSentimentGuide("education");
  const serviceInstructions = buildServiceInstructions(
    selectedServices,
    starRating
  );
  const avoidPhrases = [
    "best school",
    "amazing teachers",
    "excellent education",
    "top institution",
    "brilliant",
  ];

  const prompt = `Generate a realistic Google review for "${businessName}" which is a ${type} in the Education category.

Star Rating: ${starRating}/5
Sentiment: ${sentimentGuide[starRating]}
Tone: ${tone}
${highlights ? `Parent/Student highlights: ${highlights}` : ""}
${serviceInstructions}

Education Specific Guidelines:
- Focus on teaching quality and methodology
- Mention staff behavior and teacher dedication naturally
- Discuss infrastructure (classrooms, labs, library, playground)
- Comment on discipline and student care
- Include extracurricular activities if relevant
- Mention parent communication and transparency
- Discuss cleanliness and safety measures
- Use educational terminology naturally

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
    "Education",
    {
      businessName,
      category: "Education",
      type,
      tone,
    }
  );
};
