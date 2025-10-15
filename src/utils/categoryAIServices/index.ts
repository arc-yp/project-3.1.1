import { generateRetailShoppingReview } from "./retailShopping";
import { generateFoodBeverageReview } from "./foodBeverage";
import { generateHealthMedicalReview } from "./healthMedical";
import { generateEducationReview } from "./education";
import { generateServicesReview } from "./services";
import { generateProfessionalBusinessesReview } from "./professionalBusinesses";
import { generateHotelsTravelReview } from "./hotelsTravel";
import { generateEntertainmentRecreationReview } from "./entertainmentRecreation";

export interface CategoryReviewRequest {
  businessName: string;
  category: string;
  type: string;
  highlights?: string;
  selectedServices?: string[];
  starRating: number;
  language?: string;
  tone?: "Professional" | "Friendly" | "Casual" | "Grateful";
  geminiApiKey?: string;
  geminiModel?: string;
}

export const generateCategoryBasedReview = async (
  request: CategoryReviewRequest,
  maxRetries: number = 5
) => {
  const { category } = request;

  const categoryMap: Record<
    string,
    (req: any, retries: number) => Promise<any>
  > = {
    "Retail & Shopping": generateRetailShoppingReview,
    "Food & Beverage": generateFoodBeverageReview,
    "Health & Medical": generateHealthMedicalReview,
    Education: generateEducationReview,
    Services: generateServicesReview,
    "Professional Businesses": generateProfessionalBusinessesReview,
    "Hotels & Travel": generateHotelsTravelReview,
    "Entertainment & Recreation": generateEntertainmentRecreationReview,
  };

  const generatorFunction = categoryMap[category];

  if (!generatorFunction) {
    throw new Error(`No review generator found for category: ${category}`);
  }

  return await generatorFunction(request, maxRetries);
};

export {
  generateRetailShoppingReview,
  generateFoodBeverageReview,
  generateHealthMedicalReview,
  generateEducationReview,
  generateServicesReview,
  generateProfessionalBusinessesReview,
  generateHotelsTravelReview,
  generateEntertainmentRecreationReview,
};
