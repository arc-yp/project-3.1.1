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

export const generateHotelsTravelReview = async (
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
    1: "Polite but reserved- mentions accommodation or service issues gently, while appreciating some aspects. Constructive tone.",
    2: "Encouraging with minor suggestions-points out areas for improvement but emphasises some positive hospitality aspects.",
    3: "Balanced review - mentions a mix of good accommodation and small concerns, but overall keeps the tone supportive.",
    4: "Clearly positive- praises room quality, hospitality, and location, maybe with one small suggestion.",
    5: "Highly delighted- warm, detailed praise about excellent stay, wonderful hospitality, and memorable travel experience.",
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
Guest specifically wants to highlight these aspects: ${selectedServices.join(", ")}
- Mention these aspects naturally in the hospitality experience
- Focus on how these specific elements contributed to the ${starRating}-star experience`;
  }

  const prompt = `Generate a realistic Google review for "${businessName}" which is a ${type} in the Hotels & Travel category.

Star Rating: ${starRating}/5
Sentiment: ${sentimentGuide[starRating as keyof typeof sentimentGuide]}
Tone: ${tone}
${highlights ? `Guest highlights: ${highlights}` : ""}
${serviceInstructions}

Hotels & Travel Specific Guidelines:
- Focus on room cleanliness and comfort
- Mention reception behavior and check-in process
- Discuss food quality and dining experience
- Comment on location and accessibility
- Include amenities (Wi-Fi, parking, transport)
- Mention ambience and value for money
- Use hospitality and travel terminology naturally

Strict instructions:
- Review must be between 300 and 350 characters.
- No repetition of ideas or sentence structures.
- First sentence must always be different.
- Use fresh adjectives and sentence tone.
- Tone: Human, real, warm, and natural.
- Not use exclamation mark
- ${businessName} should appear naturally in different positions
- Sound natural with regional authenticity
- Avoid overused lines like "perfect stay", "amazing hospitality", "would visit again"
- Mention 1 unique hospitality detail in each review
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
      console.error(`Hotels & Travel Review Generation Error (attempt ${attempt + 1}):`, error);
    }
  }

  throw new Error("Failed to generate review after maximum retries");
};
