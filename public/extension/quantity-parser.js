
// Utility for parsing quantities and estimating weights
class QuantityParser {
  constructor() {
    // Average weights for common produce items (in grams)
    this.produceWeights = {
      // Vegetables
      'eggplant': 300,
      'aubergine': 300,
      'tomato': 150,
      'tomate': 150,
      'potato': 200,
      'kartoffel': 200,
      'onion': 150,
      'zwiebel': 150,
      'carrot': 100,
      'rüebli': 100,
      'karotte': 100,
      'bell pepper': 180,
      'paprika': 180,
      'cucumber': 400,
      'gurke': 400,
      'zucchini': 300,
      'broccoli': 500,
      'brokkoli': 500,
      'cauliflower': 1000,
      'blumenkohl': 1000,
      
      // Fruits
      'apple': 180,
      'apfel': 180,
      'banana': 120,
      'banane': 120,
      'orange': 200,
      'pear': 170,
      'birne': 170,
      'lemon': 80,
      'zitrone': 80,
      'lime': 50,
      'limette': 50,
      
      // Leafy greens
      'lettuce': 300,
      'salat': 300,
      'spinach': 100,
      'spinat': 100,
      'spring onion': 30,
      'frühlingszwiebel': 30,
      'lauchzwiebel': 30,
      
      // Root vegetables
      'sweet potato': 200,
      'süsskartoffel': 200,
      'beetroot': 200,
      'rote beete': 200,
      'turnip': 150,
      'rübe': 150
    };
  }

  parseQuantity(quantityString) {
    if (!quantityString || typeof quantityString !== 'string') {
      return { amount: 1, unit: 'piece', originalText: quantityString };
    }

    const text = quantityString.toLowerCase().trim();
    
    // Match patterns like "3", "1.5", "2-3", "250g", "1kg", "500ml"
    const patterns = [
      // Weight patterns
      { regex: /(\d+(?:\.\d+)?)\s*kg/i, unit: 'kg', multiplier: 1000 },
      { regex: /(\d+(?:\.\d+)?)\s*g/i, unit: 'g', multiplier: 1 },
      
      // Volume patterns
      { regex: /(\d+(?:\.\d+)?)\s*l/i, unit: 'l', multiplier: 1000 },
      { regex: /(\d+(?:\.\d+)?)\s*ml/i, unit: 'ml', multiplier: 1 },
      
      // Count patterns
      { regex: /(\d+(?:\.\d+)?)\s*(?:x|stück|pieces?|pcs?)/i, unit: 'piece', multiplier: 1 },
      
      // Just numbers (assume pieces)
      { regex: /^(\d+(?:\.\d+)?)/, unit: 'piece', multiplier: 1 }
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern.regex);
      if (match) {
        const amount = parseFloat(match[1]);
        return {
          amount: amount,
          unit: pattern.unit,
          totalAmount: amount * pattern.multiplier,
          originalText: quantityString
        };
      }
    }

    // Fallback - assume 1 piece
    return { amount: 1, unit: 'piece', totalAmount: 1, originalText: quantityString };
  }

  estimateWeight(itemName, quantity) {
    const normalizedName = itemName.toLowerCase();
    
    // Find matching produce item
    const matchingProduce = Object.keys(this.produceWeights).find(produce => 
      normalizedName.includes(produce)
    );
    
    if (matchingProduce) {
      const unitWeight = this.produceWeights[matchingProduce];
      const parsedQty = this.parseQuantity(quantity);
      
      if (parsedQty.unit === 'piece') {
        return {
          estimatedWeight: parsedQty.amount * unitWeight,
          unitWeight: unitWeight,
          pieces: parsedQty.amount,
          isEstimated: true
        };
      } else if (parsedQty.unit === 'g' || parsedQty.unit === 'kg') {
        return {
          estimatedWeight: parsedQty.totalAmount,
          unitWeight: unitWeight,
          pieces: Math.round(parsedQty.totalAmount / unitWeight),
          isEstimated: false
        };
      }
    }
    
    return null;
  }

  shouldUseWeightCalculation(itemName, productDescription = '') {
    // Check if the product description mentions weight ranges
    const weightRangePattern = /\d+\s*-\s*\d+\s*g/i;
    if (productDescription.match(weightRangePattern)) {
      return true;
    }
    
    // Check if it's a known produce item
    const normalizedName = itemName.toLowerCase();
    return Object.keys(this.produceWeights).some(produce => 
      normalizedName.includes(produce)
    );
  }
}

// Export for use in content script
window.QuantityParser = QuantityParser;
