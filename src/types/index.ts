export interface ReviewCard {
  id: string;
  businessName: string;
  category: string;
  type: string;
  description: string;
  location: string;
  services: string[];
  slug: string;
  logoUrl: string;
  googleMapsUrl: string;
  geminiApiKey?: string;
  geminiModel?: string;
  viewCount?: number;
  // Whether the card is active (visible/usable). Newly created cards default to true.
  active?: boolean;
  // When the card should automatically become inactive. ISO string timestamp.
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  allowedLanguages?: string[]; // NEW
}

export interface ReviewTemplates {
  openings: string[];
  qualities: string[];
  achievements: string[];
  endings: string[];
}

export interface ReviewVariations {
  connectors: string[];
  intensifiers: string[];
  timeframes: string[];
}