import { GoogleGenerativeAI } from "@google/generative-ai";

export interface CategoryReviewRequest {
  businessName: string;
  type: string;
  highlights?: string;
  selectedServices?: string[];
  starRating: number;
  language?: string;
  tone?: "Professional" | "Friendly" | "Casual" | "Grateful";
  geminiApiKey?: string;
  geminiModel?: string;
}

export const generateRetailShoppingReview = async (
  request: CategoryReviewRequest,
  maxRetries: number = 5
) => {
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
    throw new Error("Gemini API key is required");
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: geminiModel });

  const sentimentGuide = {
    1: "Polite but reserved- highlights one or two issues gently, while still appreciating the effort. Sounds constructive, not harsh.",
    2: "Encouraging with minor suggestions-points out areas for improvement but emphasises positive aspects more strongly.",
    3: "Balanced review - mentions a mix of pros and small cons, but overall keeps the tone supportive and fair.",
    4: "Clearly positive- praises good service, product quality, and store experience, maybe with one small suggestion.",
    5: "Highly enthusiastic- warm, detailed praise about product variety, pricing, and excellent service.",
  };

  let languageInstruction = "";
  switch (language) {
    case "English":
      languageInstruction = "Write the review ONLY in English. Do NOT use any Gujarati, Hindi, or Marathi words.";
      break;
    case "Gujarati":
      languageInstruction = "Write the review in Gujarati language, but use only English letters (Romanized Gujarati). Do NOT use Gujarati script.";
      break;
    case "Hindi":
      languageInstruction = "Write the review in Hindi language, but use only English letters (Romanized Hindi). Do NOT use Hindi script.";
      break;
  }

  let serviceInstructions = "";
  if (selectedServices && selectedServices.length > 0) {
    serviceInstructions = `
Customer specifically wants to highlight these aspects: ${selectedServices.join(", ")}
- Mention these aspects naturally in the shopping experience
- Focus on how these specific elements contributed to the ${starRating}-star experience`;
  }

  const prompt = `Generate a realistic Google review for "${businessName}" which is a ${type} in the Retail & Shopping category.

Star Rating: ${starRating}/5
Sentiment: ${sentimentGuide[starRating as keyof typeof sentimentGuide]}
Tone: ${tone}
${highlights ? `Customer highlights: ${highlights}` : ""}
${serviceInstructions}

Retail & Shopping Specific Guidelines:
- Focus on product variety, quality, and availability
- Mention pricing and value for money where appropriate
- Discuss customer service and staff helpfulness
- Comment on store cleanliness and organization
- Include shopping experience details (billing, parking, store ambience)
- Use shopping-related terminology naturally

Strict instructions:
- Review must be between 300 and 350 characters.
- No repetition of ideas or sentence structures.
- First sentence must always be different.
- Use fresh adjectives and sentence tone.
- Tone: Human, real, warm, and natural.
- Not use exclamation mark
- ${businessName} should appear naturally in different positions
- Sound natural with regional authenticity
- Avoid overused lines like "highly recommend", "amazing collection"
- Mention 1 unique shopping detail in each review
- Match the ${starRating}-star sentiment exactly
- No fake exaggeration, keep it credible
- Don't mention the star rating in the text
- ${languageInstruction}
- Return only the review text, no quotes, no instructions, no extra formatting.`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const reviewText = response.text().trim();

      if (reviewText.length >= 250 && reviewText.length <= 350) {
        return {
          text: reviewText,
          language,
          rating: starRating,
        };
      }
    } catch (error) {
      console.error(`Retail & Shopping Review Generation Error (attempt ${attempt + 1}):`, error);
    }
  }

  throw new Error("Failed to generate review after maximum retries");
};
