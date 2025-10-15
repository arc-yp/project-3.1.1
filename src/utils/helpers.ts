export const generateSlug = (businessName: string): string => {
  return businessName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
};

export const generateId = (): string => {
  return crypto.randomUUID();
};

export const formatDate = (dateString: string): string => {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  const datePart = d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const timePart = d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return `${datePart} ${timePart}`; // e.g. 31/01/2025 14:05
};

export const addDays = (dateString: string, days: number): string => {
  const d = new Date(dateString);
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

export const validateGoogleMapsUrl = (url: string): boolean => {
  const googleMapsPatterns = [
    /^https:\/\/maps\.google\.com/,
    /^https:\/\/www\.google\.com\/maps/,
    /^https:\/\/search\.google\.com\/local\/writereview/,
    /^https:\/\/goo\.gl\/maps/
  ];
  
  return googleMapsPatterns.some(pattern => pattern.test(url));
};