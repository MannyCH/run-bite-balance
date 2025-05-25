
/**
 * Normalize basic ingredient names to consistent forms
 */
export function normalizeBasicIngredient(name: string): string {
  const lowerName = name.toLowerCase();
  
  // Map of normalized names
  const normalizationMap: Record<string, string[]> = {
    "olive oil": ["olivenöl", "olivenoel", "extra virgin olive oil", "virgin olive oil"],
    "sugar": ["zucker", "brown sugar", "powdered sugar"],
    "salt": ["salz", "sea salt", "kosher salt"],
    "pepper": ["pfeffer", "black pepper", "white pepper"],
    "flour": ["mehl", "all-purpose flour", "wheat flour"],
    "water": ["wasser"],
    "butter": ["margarine", "butter"],
    "garlic": ["knoblauch", "knoblauchzehe"],
    "cinnamon": ["zimt"],
  };
  
  // Check if the name matches any normalized form
  for (const [normalName, variations] of Object.entries(normalizationMap)) {
    if (normalName === lowerName || variations.some(v => lowerName.includes(v))) {
      return normalName;
    }
  }
  
  return lowerName;
}

/**
 * Normalize item names for quantity summarization
 */
export function normalizeItemName(name: string): string {
  const lowerName = name.toLowerCase();
  
  // Map of normalized names
  const normalizationMap: Record<string, string[]> = {
    "eggplant": ["aubergine"],
    "tomato": ["tomate", "tomaten", "pomodoro"],
    "potato": ["kartoffel", "kartoffeln"],
    "onion": ["zwiebel", "zwiebeln"],
    "apple": ["apfel", "äpfel"],
    "banana": ["banane", "bananen"],
    "carrot": ["rüebli", "karotte", "möhre"],
    "egg": ["ei", "eier"],
    "chicken": ["huhn", "poulet", "hähnchen"],
  };
  
  // Check if the name matches any normalized form
  for (const [normalName, variations] of Object.entries(normalizationMap)) {
    if (normalName === lowerName || variations.some(v => lowerName.includes(v))) {
      return normalName;
    }
  }
  
  return lowerName;
}

/**
 * Clean quantity by removing measurement abbreviations
 */
export function cleanQuantity(quantity: string): string {
  if (!quantity) return "";
  
  const MEASUREMENT_ABBREVIATIONS = [
    "EL", "TL", "TSP", "TBSP", "esslöffel", "teelöffel", "teaspoon", "tablespoon"
  ];
  
  let cleanedQuantity = quantity;
  
  // Remove measurement abbreviations
  MEASUREMENT_ABBREVIATIONS.forEach(abbr => {
    const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
    cleanedQuantity = cleanedQuantity.replace(regex, '');
  });
  
  // Clean up extra spaces and trim
  cleanedQuantity = cleanedQuantity.replace(/\s+/g, ' ').trim();
  
  return cleanedQuantity;
}

/**
 * Extract numeric quantity from a string
 */
export function extractNumericQuantity(quantity: string): { value: number | null; unit: string } {
  if (!quantity) return { value: null, unit: '' };
  
  // Match patterns like "2", "2.5", "2,5", "500g", "2 kg", etc.
  const match = quantity.match(/^(\d+(?:[.,]\d+)?)\s*([a-zA-Z]*)$/);
  
  if (match) {
    const value = parseFloat(match[1].replace(',', '.'));
    const unit = match[2] || '';
    return { value, unit };
  }
  
  return { value: null, unit: '' };
}
