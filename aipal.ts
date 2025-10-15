import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "./config";

const genAI = config.isGeminiConfigured()
  ? new GoogleGenerativeAI(config.ai.geminiApiKey)
  : null;

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
}

export interface GeneratedReview {
  text: string;
  hash: string;
  language: string;
  rating: number;
}

// Store used review hashes to prevent duplicates
const usedReviewHashes = new Set<string>();

export class AIReviewService {
  private model =
    genAI?.getGenerativeModel({ model: "gemini-2.0-flash" }) || null;

  // Generate a simple hash for review content
  private generateHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Check if review is unique
  private isReviewUnique(content: string): boolean {
    const hash = this.generateHash(content);
    return !usedReviewHashes.has(hash);
  }

  // Mark review as used
  private markReviewAsUsed(content: string): void {
    const hash = this.generateHash(content);
    usedReviewHashes.add(hash);
  }

  async generateReview(
    request: ReviewRequest,
    maxRetries: number = 2 // Lowered for speed
  ): Promise<GeneratedReview> {
    // Check if Gemini is configured
    if (!config.isGeminiConfigured() || !this.model) {
      console.warn("Gemini API not configured, using fallback review");
      return this.getFallbackReview(request);
    }

    const {
      businessName,
      category,
      type,
      highlights,
      selectedServices,
      starRating,
      language,
      tone,
      useCase,
    } = request;

    const sentimentGuide = {
      1: "Very negative, expressing frustration and dissatisfaction with specific issues",
      2: "Below average experience, mentioning problems but being constructive",
      3: "Mixed or neutral review with both positive and negative aspects",
      4: "Positive experience with good aspects, maybe one small downside",
      5: "Enthusiastic and praise-worthy, fully satisfied customer",
    };

    // Language options and random selection logic
    const languageOptions = ["English", "Gujarati", "Hindi"];

    const selectedLanguage =
      language ||
      languageOptions[Math.floor(Math.random() * languageOptions.length)];
    const selectedTone = tone || "Friendly";
    const selectedUseCase = useCase || "Customer review";

    // Build service-specific instructions
    let serviceInstructions = "";
    if (selectedServices && selectedServices.length > 0) {
      serviceInstructions = `
Customer specifically wants to highlight these services: ${selectedServices.join(
        ", "
      )}
- Mention these services naturally in the review context
- Don't list them generically, weave them into the experience narrative
- Focus on how these specific aspects contributed to the ${starRating}-star experience
- Use authentic language that reflects real customer experience with these services`;
    }

    // Language-specific instructions
    let languageInstruction = "";
    switch (selectedLanguage) {
      case "English":
        languageInstruction =
          "Write the review strictly in English. Do not use any Gujarati or regional language words.";
        break;
      case "Gujarati":
        languageInstruction =
          "Write the review entirely in Gujarati. use English transliteration. Place business name naturally in middle or end of sentences, never at start.";
        break;
      case "Hindi":
        languageInstruction =
          "Write the review entirely in Hindi. use English transliteration. Place business name naturally in middle or end of sentences, never at start";
        break;
    }

    // Tone instructions
    const toneInstructions = {
      Professional:
        "Use formal, professional language appropriate for business contexts.",
      Friendly:
        "Use warm, approachable language that feels personal and genuine.",
      Casual:
        "Use relaxed, informal language that sounds conversational and natural.",
      Grateful:
        "Use appreciative, thankful language that expresses genuine gratitude.",
    };

    // Use case instructions
    const useCaseInstructions = {
      "Customer review":
        "Write from the perspective of a satisfied customer who used the service.",
      "Student feedback":
        "Write from the perspective of a student or learner who benefited from the education/training.",
      "Patient experience":
        "Write from the perspective of a patient who received medical care or treatment.",
    };

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const prompt = `Generate a realistic Google review for "${businessName}" which is a ${type} in the ${category} category.

Star Rating: ${starRating}/5
Sentiment: ${sentimentGuide[starRating as keyof typeof sentimentGuide]}
Tone: ${selectedTone} - ${toneInstructions[selectedTone]}
Use Case: ${selectedUseCase} - ${useCaseInstructions[selectedUseCase]}
${highlights ? `Customer highlights: ${highlights}` : ""}
${serviceInstructions}

Strict instructions:
- No repetition of ideas or sentence structures.
- Use fresh adjectives and sentence tone.
Tone: Human, real, warm, and natural.

Requirements:
- First sentence always different
- ${businessName} is shown always different place in review.
- Sound natural and human-like with regional authenticity.
- DO NOT repeat phrasing or meaning from previous reviews.
- write reviews without using any punctuation marks.
- Avoid overused lines like "I felt safe", "highly recommend", "Dr. is amazing".
- Mention 1 unique point in each review (like a emotional detail).
- Match the ${starRating}-star sentiment exactly.
- Be specific to the business type (${type}) and category (${category}).
- Use realistic customer language for ${selectedUseCase}.
- No fake exaggeration, keep it credible and locally relevant.
- Don't mention the star rating in the text.
- Make it unique - avoid common phrases or structures.
- Use varied sentence structures and vocabulary.
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

Return only the review text, no quotes or extra formatting.`;

      try {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const reviewText = response.text().trim();

        // Enforce review length between 150 and 200 characters
        if (reviewText.length < 450 || reviewText.length > 500) {
          // Optionally, you can retry or trim/pad the review
          // Here, we simply retry by continuing the loop
          console.log(
            `Attempt ${attempt + 1}: Review length (${reviewText.length}) out of bounds, retrying...`
          );
          continue;
        }

        // Check if review is unique
        if (this.isReviewUnique(reviewText)) {
          this.markReviewAsUsed(reviewText);
          return {
            text: reviewText,
            hash: this.generateHash(reviewText),
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

    // Fallback to unique hardcoded review if all attempts fail
    return this.getFallbackReview(request);
  }

  private getFallbackReview(request: ReviewRequest): GeneratedReview {
    const {
      businessName,
      category,
      type,
      selectedServices,
      starRating,
      language,
    } = request;
    const timestamp = Date.now();

    // Generate service-specific text
    let serviceText = "";
    if (selectedServices && selectedServices.length > 0) {
      if (selectedServices.length === 1) {
        serviceText = ` The ${selectedServices[0]} was particularly good.`;
      } else if (selectedServices.length === 2) {
        serviceText = ` The ${selectedServices[0]} and ${selectedServices[1]} were particularly good.`;
      } else {
        serviceText = ` The ${selectedServices
          .slice(0, 2)
          .join(", ")} and other services were particularly good.`;
      }
    }

    const fallbacks: Record<number, Record<string, string[]>> = {
      4: {
        English: [
          `Overall, a great experience with ${businessName}. Just a slight delay in response, but the service quality made up for it.`,
          `${businessName} provided very good service. Staff was helpful, though the place was a bit crowded.`,
          `Nice experience at ${businessName}. The work was well done, just wished the waiting time was shorter.`,
          `Good quality and friendly service from ${businessName}. Could be better with time management.`,
          `Really liked the professionalism. ${businessName} delivered well, just some improvement needed in coordination.`,
        ],
        Gujarati: [
          `${businessName} ni service saras hati, pan thoduk time manage karvu joiye.${serviceText}`,
          `Mane ${businessName} pase ek saro experience malkyo. Staff helpful hato, pan thodi vaar ni rah jovi padi.`,
          `Service kharekhar sari hati, pan location thodi jamavti hati. ${businessName} ae biju badhu fine aapyu.`,
          `${businessName} ma kaam to perfect hatu, pan appointment ni system ma thodi khot hati.`,
          `Sambhalva jevu kaam and polite staff. ${businessName} ni service ma improvement ni jagya chhe, pan overall fine.`,
        ],
        Hindi: [
          `${businessName} ki service acchi thi, lekin thoda coordination better ho sakta tha.`,
          `Staff supportive tha aur kaam bhi accha tha. Bas ${businessName} me thoda wait karna pada.`,
          `${businessName} ne acchi service di. Bas timing thoda better ho to perfect ho jaye.`,
          `Kaafi achha anubhav tha, lekin jagah thodi bheedbhad wali thi.${serviceText}`,
          `Mujhe ${businessName} se milne wali service pasand aayi. Thoda aur professionalism ho to 5-star deserved karta.`,
        ],
      },
      5: {
        English: [
          `Highly impressed by the professional ${type}. ${businessName} truly knows how to deliver!${serviceText} A solid choice for any ${category.toLowerCase()} need.`,
          `The experience was seamless and the service was top-notch. I chose ${businessName} for their trusted ${type} work.${serviceText}`,
          `From staff behavior to service quality, everything was on point at ${businessName}.${serviceText} Would surely visit again for ${category.toLowerCase()}.`,
          `Their ${type} approach was efficient and well-organized.${serviceText} I'm glad I went with ${businessName}.`,
          `You won't regret choosing ${businessName}. They provide excellent ${category.toLowerCase()} service with great attention to detail.${serviceText}`,
          `I had a fantastic time interacting with the team. Their ${type} was smooth and stress-free.${serviceText} Kudos to ${businessName}!`,
          `Trusting ${businessName} for my ${category.toLowerCase()} needs was a great decision. The ${type} they offer is reliable and professional.${serviceText}`,
          `${serviceText} What really impressed me was how ${businessName} handled the entire process — truly top-tier ${type}.`,
          `If you're looking for quality in ${category.toLowerCase()}, ${businessName} is the way to go. Their ${type} stands out.`,
          `Professionalism and attention to detail were amazing. Hats off to the ${type} team at ${businessName}!${serviceText}`,
        ],

        Gujarati: [
          `Professional ${type} ane timely seva thi khubaj khushi thayi.${serviceText} ${businessName} ek vishwasniya jagya chhe.`,
          `Mane ${businessName} ni seva ma ek alagaj satisfaction malkyu.${serviceText} ${category} mate aa perfect jagya chhe.`,
          `${serviceText} Staff ni behaviour ane ${type} ma perfection hato, jem ke ${businessName} jova male.`,
          `Ekdam friendly staff ane helpful support.${serviceText} ${category} ma to ${businessName} first choice chhe.`,
          `Great experience with service, and specially the ${type} quality.${businessName} ekdam worth chhe.`,
          `Mane jem joyu tem ${businessName} ni seva ekdam alag level ni hati.${serviceText} Enu ${type} khubaj upyogi rahyu.`,
          `Jo tame best ${category} ni talash ma cho to ${businessName} perfect chhe. ${type} service ekdam professional hati.`,
          `Biju kai kahu etla badle kahish ke ${businessName} ni seva etli saras hati ke mane ekdam relax feel thayu.`,
          `Saral ane friendly staff, plus tamne madse ekdam sarvottam ${type}. Thank you ${businessName}!${serviceText}`,
        ],

        Hindi: [
          `Staff ka behavior aur ${type} service dono bahut acchi thi. Is baar ${businessName} choose karke sahi decision liya.${serviceText}`,
          `Jo quality ${businessName} ne di, wo expected se kahin zyada thi.${serviceText} ${category} ke liye trusted option.`,
          `${serviceText} Timely response, neat work aur proper guidance mila. ${businessName} ka kaam pasand aaya.`,
          `${category} ke area me mujhe sabse achha experience ${businessName} ke sath mila. Highly recommended!`,
          `Ek baar ${businessName} ka service leke dekhiye. Unka ${type} aur professionalism behtareen tha.${serviceText}`,
          `Mujhe ${businessName} ki taraf se mile ${type} ne poori tarah se impress kiya.${serviceText} Staff bhi bahut helpful tha.`,
          `Service lene ke baad hi samajh aaya ki ${businessName} kyu itna popular hai in ${category.toLowerCase()}. Truly amazing!`,
          `Agar aapko chaahiye professional ${type}, to bina soche ${businessName} try kijiye. Aap nirash nahi honge.${serviceText}`,
          `${category} mein aaj tak ka sabse behtareen anubhav tha yeh. ${businessName} ne har expectation poori ki.`,
          `Mujhe shuruaat mein doubt tha, lekin ${businessName} ne ${type} service se dil jeet liya.${serviceText}`,
        ],
      },
    };

    // Select random fallback from available options
    const ratingFallbacks = fallbacks[starRating] || fallbacks[5];
    const langKey =
      language && ratingFallbacks[language] ? language : "English";
    const languageFallbacks = ratingFallbacks[langKey];
    const randomIndex = Math.floor(Math.random() * languageFallbacks.length);
    const selectedFallback = languageFallbacks[randomIndex];
    // Make it unique by adding timestamp-based variation
    const uniqueFallback = `${selectedFallback} (${timestamp})`.replace(
      ` (${timestamp})`,
      ""
    );
    return {
      text: uniqueFallback,
      hash: this.generateHash(uniqueFallback + timestamp),
      language: langKey,
      rating: starRating,
    };
  }

  // Generate tagline for business
  async generateTagline(
    businessName: string,
    category: string,
    type: string
  ): Promise<string> {
    const prompt = `Generate a catchy, professional tagline for "${businessName}" which is a ${type} in the ${category} category.

Requirements:
- Keep it under 8 words
- Make it memorable and professional
- Reflect the business type and category
- Use action words or emotional appeal
- Avoid clichés like "Your trusted partner"
- Make it unique and specific to the business

Return only the tagline, no quotes or extra text.`;

    try {
      const result = await this.model.generateContent(prompt);
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
          "Service with a Smile",
          "Driven by Customer Satisfaction",
          "Tailored Solutions, Trusted Results",
          "Where Service Meets Standards",
          "Reliable. Responsive. Remarkable.",
          "Committed to Serve",
          "Your Satisfaction, Our Priority",
          "Solutions Beyond Expectations",
          "Service that Speaks for Itself",
          "Efficiency You Can Rely On",
          "Delivering Peace of Mind",
          "Simplifying Your World",
          "We Serve with Purpose",
          "Support That Never Stops",
          "Experience the Professional Difference",
          "One Call. Endless Solutions.",
          "Built on Service. Backed by Trust.",
        ],
        "Food & Beverage": [
          "Taste the Difference",
          "Fresh & Delicious Always",
          "Where Flavor Meets Quality",
          "Taste the Tradition",
          "Flavors You'll Crave",
          "Made with Love & Spices",
          "Freshness Delivered Daily",
          "Delight in Every Bite",
          "Where Taste Meets Quality",
          "Savor the Flavor",
          "A Feast for Your Senses",
          "Crave It. Love It.",
          "Eat Well. Live Well.",
        ],
        "Health & Medical": [
          "Your Health, Our Priority",
          "Caring for Your Wellness",
          "Expert Care Always",
          "Compassionate Care, Advanced Medicine",
          "Healing with Heart",
          "Where Healing Begins",
          "Committed to Your Care",
          "Trusted for Generations",
          "A Tradition of Trust",
          "Excellence in Healthcare",
          "Your Family's Health Partner",
          "Health You Can Rely On",
          "Nurturing Life Everyday",
          "Dedicated to Better Health",
          "Precision Care with a Personal Touch",
        ],
        Education: [
          "Learning Made Easy",
          "Knowledge for Success",
          "Education Excellence",
          "Empowering Future Minds",
          "Learning that Inspires",
          "Unlock Your Potential",
          "Driven by Knowledge",
          "Success Begins Here",
          "Smart Learning for Smart People",
          "Fueling Dreams Through Education",
          "Where Leaders Are Made",
          "Ignite Curiosity, Inspire Growth",
          "Education with Purpose",
        ],
        "Professional Businesses": [
          "Professional Solutions",
          "Expert Services",
          "Business Excellence",
          "Driven by Excellence",
          "Your Partner in Progress",
          "Solutions You Can Trust",
          "Where Expertise Meets Integrity",
          "Empowering Smart Decisions",
          "Professionalism with a Purpose",
          "Commitment to Your Success",
          "Strategic Minds. Practical Solutions.",
          "Crafting Confidence, Delivering Results",
          "Results-Oriented, Client-Focused",
          "Precision. Performance. Professionalism.",
          "Business Made Better",
          "Elevate Your Expectations",
          "Reliable Service. Real Impact.",
          "Expert Guidance, Trusted Support",
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
    usedReviewHashes.clear();
  }

  // Get usage statistics
  getUsageStats(): { totalGenerated: number } {
    return {
      totalGenerated: usedReviewHashes.size,
    };
  }
}

export const aiService = new AIReviewService();
