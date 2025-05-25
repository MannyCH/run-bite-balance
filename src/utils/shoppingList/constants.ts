
// Basic ingredients that should be treated as single items without quantities and marked as bought
export const BASIC_INGREDIENTS = [
  "olive oil", "olivenöl", "olivenoel", "vegetable oil", "sunflower oil", "canola oil", "coconut oil",
  "salt", "salz", "pepper", "pfeffer", "black pepper", "white pepper", 
  "sugar", "zucker", "brown sugar", "powdered sugar",
  "flour", "mehl", "all-purpose flour", "wheat flour",
  "water", "wasser",
  "butter", "margarine",
  "vinegar", "essig", "balsamic vinegar", "white vinegar",
  "spices", "herbs", "gewürze", "kräuter",
  "garlic", "knoblauch", "knoblauchzehe",
  "cinnamon", "zimt",
];

// Items that should be summarized with quantities
export const QUANTITY_SUMMARIZE_ITEMS = [
  "eggplant", "aubergine", 
  "tomato", "tomate",
  "potato", "kartoffel",
  "onion", "zwiebel",
  "apple", "apfel",
  "banana", "banane",
  "carrot", "rüebli", "karotte",
  "egg", "ei", "eier",
  "cheese", "käse",
  "milk", "milch",
  "yogurt", "joghurt",
  "bread", "brot",
  "rice", "reis",
  "pasta", "nudeln",
  "meat", "fleisch",
  "chicken", "huhn", "poulet",
];

// Words to remove from quantities
export const MEASUREMENT_ABBREVIATIONS = [
  "EL", "TL", "TSP", "TBSP", "esslöffel", "teelöffel", "teaspoon", "tablespoon"
];
