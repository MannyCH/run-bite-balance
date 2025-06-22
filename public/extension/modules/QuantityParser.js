
// QuantityParser class - handles quantity parsing and calculations
export class QuantityParser {
  constructor() {
    this.unitMappings = {
      // Weight units (grams)
      'g': 1,
      'gr': 1,
      'gram': 1,
      'gramm': 1,
      'kg': 1000,
      'kilo': 1000,
      'kilogram': 1000,
      
      // Volume units (ml)
      'ml': 1,
      'milliliter': 1,
      'l': 1000,
      'liter': 1000,
      'litre': 1000,
      'dl': 100,
      'deciliter': 100,
      'cl': 10,
      'centiliter': 10,
      
      // Piece units
      'stk': 1,
      'stück': 1,
      'piece': 1,
      'pieces': 1,
      'pc': 1,
      'pcs': 1,
      'x': 1,
      
      // Package units
      'pkg': 1,
      'package': 1,
      'pack': 1,
      'packs': 1,
      'packet': 1,
      'packets': 1,
      'box': 1,
      'boxes': 1,
      'can': 1,
      'cans': 1,
      'bottle': 1,
      'bottles': 1,
      'jar': 1,
      'jars': 1,
      'bag': 1,
      'bags': 1,
      'bunch': 1,
      'bunches': 1,
      'head': 1,
      'heads': 1
    };

    // Items that are typically sold fresh/loose (by weight)
    this.freshItems = [
      'tomaten', 'kartoffeln', 'zwiebeln', 'karotten', 'rüebli', 'äpfel', 'bananen', 
      'orangen', 'zitronen', 'trauben', 'beeren', 'salat', 'broccoli', 'blumenkohl', 
      'paprika', 'gurken', 'zucchini', 'auberginen', 'fleisch', 'fisch', 'hackfleisch', 
      'rindfleisch', 'schweinefleisch', 'poulet', 'chicken', 'lachs', 'forelle', 
      'kabeljau', 'thunfisch', 'garnelen', 'crevetten'
    ];

    // Items that are typically sold in packages
    this.packagedItems = [
      'sahne', 'cream', 'sauerrahm', 'sour cream', 'joghurt', 'yogurt', 'milch', 'milk',
      'butter', 'käse', 'cheese', 'quark', 'frischkäse', 'mozzarella', 'parmesan',
      'reis', 'rice', 'pasta', 'nudeln', 'spaghetti', 'mehl', 'flour', 'zucker', 'sugar',
      'öl', 'oil', 'essig', 'vinegar', 'honig', 'honey', 'marmelade', 'jam'
    ];

    console.log('QuantityParser initialized');
  }

  parseQuantity(quantityStr) {
    if (!quantityStr || typeof quantityStr !== 'string') {
      return { amount: 1, unit: 'piece', originalText: quantityStr || '' };
    }

    const cleanStr = quantityStr.toLowerCase().trim();
    console.log('Parsing quantity:', cleanStr);

    // Match patterns like "2kg", "500g", "3 stk", "1.5 l", etc.
    const patterns = [
      /^(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)$/,
      /^(\d+(?:[.,]\d+)?)\s+([a-zA-Z]+)$/,
      /^(\d+(?:[.,]\d+)?)\s*x\s*$/,
      /^(\d+(?:[.,]\d+)?)\s*$/
    ];

    for (const pattern of patterns) {
      const match = cleanStr.match(pattern);
      if (match) {
        const amount = parseFloat(match[1].replace(',', '.'));
        const unit = match[2] || 'piece';
        
        console.log('Parsed:', { amount, unit, originalText: quantityStr });
        return { amount, unit: unit.toLowerCase(), originalText: quantityStr };
      }
    }

    // If no pattern matches, try to extract just numbers
    const numberMatch = cleanStr.match(/(\d+(?:[.,]\d+)?)/);
    if (numberMatch) {
      const amount = parseFloat(numberMatch[1].replace(',', '.'));
      console.log('Extracted number:', { amount, unit: 'piece', originalText: quantityStr });
      return { amount, unit: 'piece', originalText: quantityStr };
    }

    console.log('Using fallback:', { amount: 1, unit: 'piece', originalText: quantityStr });
    return { amount: 1, unit: 'piece', originalText: quantityStr };
  }

  // Extract package size from product description
  extractPackageSize(productDescription) {
    const desc = productDescription.toLowerCase();
    console.log('Extracting package size from:', desc);
    
    // Enhanced regex patterns to better detect package sizes
    const weightPatterns = [
      // Match patterns like "2.5kg", "1,5kg", "500g" with better boundary detection
      /(\d+(?:[.,]\d+)?)\s*(kg|kilo|kilogram)(?!\w)/gi,
      /(\d+(?:[.,]\d+)?)\s*(g|gr|gram|gramm)(?!\w)/gi,
      /(\d+(?:[.,]\d+)?)\s*(ml|milliliter)(?!\w)/gi,
      /(\d+(?:[.,]\d+)?)\s*(l|liter|litre)(?!\w)/gi,
      /(\d+(?:[.,]\d+)?)\s*(dl|deciliter)(?!\w)/gi,
      /(\d+(?:[.,]\d+)?)\s*(cl|centiliter)(?!\w)/gi
    ];

    // Collect all matches and find the most specific one
    const allMatches = [];
    
    for (const pattern of weightPatterns) {
      const matches = [...desc.matchAll(pattern)];
      allMatches.push(...matches);
    }

    if (allMatches.length > 0) {
      // Sort by position to get the first occurrence
      allMatches.sort((a, b) => a.index - b.index);
      const match = allMatches[0];
      
      const amount = parseFloat(match[1].replace(',', '.'));
      const unit = match[2].toLowerCase();
      
      // Convert to standard base units (grams or ml)
      let normalizedAmount = amount;
      let baseUnit = 'g'; // default to grams
      
      if (unit.includes('kg') || unit.includes('kilo')) {
        normalizedAmount = amount * 1000;
        baseUnit = 'g';
      } else if (unit.includes('l') && !unit.includes('ml')) {
        normalizedAmount = amount * 1000;
        baseUnit = 'ml';
      } else if (unit.includes('dl')) {
        normalizedAmount = amount * 100;
        baseUnit = 'ml';
      } else if (unit.includes('cl')) {
        normalizedAmount = amount * 10;
        baseUnit = 'ml';
      } else if (unit.includes('ml')) {
        baseUnit = 'ml';
      }
      
      const result = {
        amount: normalizedAmount,
        unit: baseUnit,
        originalText: match[0],
        originalAmount: amount,
        originalUnit: unit
      };
      
      console.log('Extracted package size:', result);
      return result;
    }
    
    console.log('No package size found in description');
    return null;
  }

  // Convert required quantity to base units (grams or ml)
  convertToBaseUnits(quantity, unit) {
    const unitMappings = {
      'g': 1, 'gr': 1, 'gram': 1, 'gramm': 1,
      'kg': 1000, 'kilo': 1000, 'kilogram': 1000,
      'ml': 1, 'milliliter': 1,
      'l': 1000, 'liter': 1000, 'litre': 1000,
      'dl': 100, 'deciliter': 100,
      'cl': 10, 'centiliter': 10
    };
    
    const multiplier = unitMappings[unit.toLowerCase()] || 1;
    return quantity * multiplier;
  }

  // Determine if item should be treated as fresh/loose or packaged
  isPackagedItem(itemName, productDescription) {
    const itemLower = itemName.toLowerCase();
    const descLower = productDescription.toLowerCase();
    
    // Check if it's in the packaged items list
    const isPackaged = this.packagedItems.some(keyword => 
      itemLower.includes(keyword) || descLower.includes(keyword)
    );
    
    // Check if it's in the fresh items list
    const isFresh = this.freshItems.some(keyword => 
      itemLower.includes(keyword) || descLower.includes(keyword)
    );
    
    // If both or neither match, try to detect from description
    if (!isPackaged && !isFresh) {
      // If description contains package indicators, treat as packaged
      const packageIndicators = ['pack', 'dose', 'flasche', 'bottle', 'becher', 'cup', 'glas', 'jar'];
      const hasPackageIndicator = packageIndicators.some(indicator => 
        descLower.includes(indicator)
      );
      
      return hasPackageIndicator;
    }
    
    console.log('Item classification:', itemName, '-> packaged:', isPackaged, 'fresh:', isFresh);
    return isPackaged && !isFresh; // Prefer fresh classification if both match
  }

  // Calculate the correct quantity to add to cart
  calculateRequiredQuantity(itemName, requiredQuantity, productDescription) {
    const parsed = this.parseQuantity(requiredQuantity);
    console.log('=== Quantity Calculation Debug ===');
    console.log('Item:', itemName);
    console.log('Required quantity:', requiredQuantity);
    console.log('Parsed required:', parsed);
    console.log('Product description:', productDescription);
    
    // Check if this is a packaged item
    const isPackaged = this.isPackagedItem(itemName, productDescription);
    console.log('Is packaged item:', isPackaged);
    
    if (isPackaged) {
      // Extract package size from product description
      const packageSize = this.extractPackageSize(productDescription);
      console.log('Package size detected:', packageSize);
      
      if (packageSize && (parsed.unit === 'g' || parsed.unit === 'kg' || parsed.unit === 'ml' || parsed.unit === 'l' || parsed.unit === 'gram' || parsed.unit === 'gramm')) {
        // Convert required amount to same base units as package
        const requiredInBaseUnits = this.convertToBaseUnits(parsed.amount, parsed.unit);
        console.log('Required in base units:', requiredInBaseUnits, packageSize.unit);
        
        // Check if units are compatible (both weight or both volume)
        const bothWeight = packageSize.unit === 'g' && ['g', 'gr', 'gram', 'gramm', 'kg', 'kilo', 'kilogram'].includes(parsed.unit);
        const bothVolume = packageSize.unit === 'ml' && ['ml', 'milliliter', 'l', 'liter', 'litre', 'dl', 'cl'].includes(parsed.unit);
        
        console.log('Units compatibility - bothWeight:', bothWeight, 'bothVolume:', bothVolume);
        
        if (bothWeight || bothVolume) {
          const packagesNeeded = Math.ceil(requiredInBaseUnits / packageSize.amount);
          console.log('CALCULATION:', requiredInBaseUnits, '÷', packageSize.amount, '= ceil(', (requiredInBaseUnits / packageSize.amount), ') =', packagesNeeded);
          console.log('Final quantity for packaged item:', packagesNeeded);
          return Math.max(1, packagesNeeded); // Ensure at least 1
        }
      }
    }
    
    // For fresh items or when package calculation fails, use piece-based estimation
    console.log('Using piece-based calculation for fresh item or fallback');
    const weightEstimate = this.estimateWeight(itemName, requiredQuantity);
    if (weightEstimate) {
      console.log('Weight estimate result:', weightEstimate.pieces);
      return Math.max(1, weightEstimate.pieces);
    }
    
    // Final fallback - use parsed amount or 1
    const fallbackQuantity = Math.max(1, Math.round(parsed.amount));
    console.log('Using fallback quantity:', fallbackQuantity);
    return fallbackQuantity;
  }

  estimateWeight(itemName, quantity) {
    const parsed = this.parseQuantity(quantity);
    
    // Simple weight estimation based on common items
    const weightEstimates = {
      'tomaten': { perPiece: 150, unit: 'g' },
      'kartoffeln': { perPiece: 200, unit: 'g' },
      'zwiebeln': { perPiece: 100, unit: 'g' },
      'äpfel': { perPiece: 180, unit: 'g' },
      'bananen': { perPiece: 120, unit: 'g' },
      'paprika': { perPiece: 200, unit: 'g' },
      'gurken': { perPiece: 300, unit: 'g' },
      'zucchini': { perPiece: 250, unit: 'g' }
    };

    const itemLower = itemName.toLowerCase();
    for (const [key, estimate] of Object.entries(weightEstimates)) {
      if (itemLower.includes(key)) {
        const totalWeight = estimate.perPiece * parsed.amount;
        const pieces = Math.max(1, Math.round(totalWeight / estimate.perPiece));
        
        console.log('Weight estimate for', itemName, ':', {
          totalWeight: totalWeight + estimate.unit,
          pieces
        });
        
        return {
          totalWeight,
          unit: estimate.unit,
          pieces
        };
      }
    }

    return null;
  }
}
