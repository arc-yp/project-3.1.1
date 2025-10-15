# Category-Based AI Review Services

This directory contains specialized AI review generation services for different business categories. Each category has its own dedicated file with tailored prompts and guidelines for generating authentic, category-specific reviews.

## Architecture

### Category Files

Each business category has its own service file:

1. **retailShopping.ts** - Retail & Shopping
2. **foodBeverage.ts** - Food & Beverage
3. **healthMedical.ts** - Health & Medical
4. **education.ts** - Education
5. **services.ts** - Services
6. **professionalBusinesses.ts** - Professional Businesses
7. **hotelsTravel.ts** - Hotels & Travel
8. **entertainmentRecreation.ts** - Entertainment & Recreation

### How It Works

When the admin selects a business category:

1. The system automatically routes to the appropriate category-specific service
2. Each service uses specialized prompts tailored to that industry
3. Reviews include terminology, sentiment, and details specific to that business type
4. Falls back to generic generation if category-specific generation fails

## Usage

```typescript
import { generateCategoryBasedReview } from './categoryAIServices';

const review = await generateCategoryBasedReview({
  businessName: "XYZ Restaurant",
  category: "Food & Beverage",
  type: "Restaurant",
  starRating: 5,
  language: "English",
  tone: "Friendly",
  geminiApiKey: "your-api-key",
  geminiModel: "gemini-2.0-flash",
  highlights: "excellent food quality, great ambience",
  selectedServices: ["Food Quality", "Staff Behavior", "Ambience"]
});
```

## Category-Specific Features

### Retail & Shopping
- Focus on product variety, pricing, and customer service
- Mentions store cleanliness and organization
- Discusses billing experience and parking

### Food & Beverage
- Emphasizes food taste, quality, and presentation
- Mentions staff behavior and hospitality
- Discusses ambience, cleanliness, and serving time

### Health & Medical
- Professional and respectful tone
- Focus on doctor expertise and consultation quality
- Mentions nursing staff, facility cleanliness, and patient care
- Uses appropriate medical terminology

### Education
- Focus on teaching quality and methodology
- Mentions staff dedication and infrastructure
- Discusses discipline, student care, and parent communication
- References classrooms, labs, library, playground

### Services
- Emphasizes service quality and professionalism
- Focus on staff responsiveness and communication
- Discusses timeliness, efficiency, and problem resolution

### Professional Businesses
- Highly professional tone
- Focus on expertise and technical skills
- Mentions consultation quality and confidentiality
- Discusses response time and follow-up

### Hotels & Travel
- Focus on room cleanliness and comfort
- Mentions reception behavior and check-in process
- Discusses amenities, location, and value for money

### Entertainment & Recreation
- Casual and enthusiastic tone
- Focus on experience quality and fun factor
- Mentions crowd management, ambience, and facilities
- Discusses ticketing, seating, and security

## Benefits

1. **Better Reviews**: Each category gets industry-specific terminology and context
2. **Easy Maintenance**: Update one file to change reviews for an entire category
3. **Scalability**: Easy to add new categories or modify existing ones
4. **Fallback Support**: Generic generation still works if category-specific fails
5. **Consistency**: All reviews for a category follow the same quality standards

## Adding New Categories

To add a new category:

1. Create a new file in this directory (e.g., `automotive.ts`)
2. Copy the structure from an existing category file
3. Customize the sentiment guide and guidelines
4. Add the category to the `categoryMap` in `index.ts`

## Configuration

Each category service supports:

- Star ratings (1-5)
- Multiple languages (English, Gujarati, Hindi - Romanized)
- Multiple tones (Professional, Friendly, Casual, Grateful)
- Highlighted services/features
- Custom highlights and business details
- Configurable Gemini API model

## Review Quality

All category services enforce:

- Length: 300-350 characters
- No exclamation marks
- No star rating mentions in text
- Unique, non-repetitive content
- Natural, human-like language
- Regional authenticity
- Appropriate sentiment matching
