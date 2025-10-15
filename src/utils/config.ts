// Application configuration using environment variables

export const config = {
  // Supabase Configuration
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },

  // AI Service Configuration
  ai: {
    geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
  },

  // Netlify Configuration (for future use)
  netlify: {
    apiKey: import.meta.env.VITE_NETLIFY_API_KEY || '',
  },

  // Application Configuration
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Review Automation System',
    description: import.meta.env.VITE_APP_DESCRIPTION || 'Streamline your reviews',
    isDevelopment: import.meta.env.VITE_DEV_MODE === 'true',
  },

  // Validation helpers
  isSupabaseConfigured(): boolean {
    return !!(
      this.supabase.url && 
      this.supabase.anonKey && 
      this.supabase.url !== 'your_supabase_project_url_here' &&
      this.supabase.url.includes('supabase.co')
    );
  },

  isGeminiConfigured(): boolean {
    return !!(
      this.ai.geminiApiKey && 
      this.ai.geminiApiKey !== 'your_gemini_api_key_here'
    );
  },

  isNetlifyConfigured(): boolean {
    return !!(
      this.netlify.apiKey && 
      this.netlify.apiKey !== 'your_netlify_api_key_here'
    );
  }
};

// Log configuration status in development
if (config.app.isDevelopment) {
  console.log('Configuration Status:', {
    supabase: config.isSupabaseConfigured() ? '✅ Configured' : '❌ Not configured',
    gemini: config.isGeminiConfigured() ? '✅ Configured' : '❌ Not configured',
    netlify: config.isNetlifyConfigured() ? '✅ Configured' : '❌ Not configured'
  });
}