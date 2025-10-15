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

export const generateProfessionalBusinessesReview = async (
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
    tone = "Professional",
    geminiApiKey,
    geminiModel = "gemini-2.0-flash",
  } = request;

  if (!geminiApiKey) {
    throw new Error("Gemini API key is required");
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: geminiModel });

  const sentimentGuide = {
    1: "Polite but reserved- mentions expertise or service delivery issues gently, while appreciating some effort. Professional and constructive.",
    2: "Encouraging with minor suggestions-points out areas for improvement but emphasises some positive professional aspects.",
    3: "Balanced review - mentions a mix of good expertise and small concerns, but overall keeps the tone professional and fair.",
    4: "Clearly positive- praises expertise, professionalism, and service delivery, maybe with one small suggestion.",
    5: "Highly impressed- detailed praise about exceptional expertise, professional handling, and excellent consultation quality.",
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
Client specifically wants to highlight these aspects: ${selectedServices.join(", ")}
- Mention these aspects naturally in the professional service experience
- Focus on how these specific elements contributed to the ${starRating}-star experience`;
  }

  const prompt = `Generate a realistic Google review for "${businessName}" which is a ${type} in the Professional Businesses category.

Star Rating: ${starRating}/5
Sentiment: ${sentimentGuide[starRating as keyof typeof sentimentGuide]}
Tone: ${tone}
${highlights ? `Client highlights: ${highlights}` : ""}
${serviceInstructions}

Professional Businesses Specific Guidelines:
- Focus on expertise and technical skills
- Mention professional behavior and client handling
- Discuss consultation quality and advice
- Comment on response time and follow-up
- Include service transparency and confidentiality
- Mention office environment and professionalism
- Use business and professional terminology naturally

Strict instructions:
- Review must be between 300 and 350 characters.
- No repetition of ideas or sentence structures.
- First sentence must always be different.
- Use fresh adjectives and sentence tone.
- Tone: Human, real, professional, and credible.
- Not use exclamation mark
- ${businessName} should appear naturally in different positions
- Sound natural with regional authenticity
- Avoid overused lines like "highly skilled", "best consultant", "expert advice"
- Mention 1 unique professional detail in each review
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
      console.error(`Professional Businesses Review Generation Error (attempt ${attempt + 1}):`, error);
    }
  }

  throw new Error("Failed to generate review after maximum retries");
};
