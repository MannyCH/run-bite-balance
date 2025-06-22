
// Content script for Migros and Coop automation
console.log('Content script loading on:', window.location.href);

// QuantityParser class - moved directly into content.js
class QuantityParser {
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
    
    // Look for weight patterns: "500g", "2.5kg", "1,5kg", etc.
    const weightPatterns = [
      /(\d+(?:[.,]\d+)?)\s*(kg|kilo|kilogram)/g,
      /(\d+(?:[.,]\d+)?)\s*(g|gr|gram|gramm)/g,
      /(\d+(?:[.,]\d+)?)\s*(ml|l|liter|litre|dl|cl)/g
    ];

    for (const pattern of weightPatterns) {
      const matches = [...desc.matchAll(pattern)];
      if (matches.length > 0) {
        // Use the first match found
        const match = matches[0];
        const amount = parseFloat(match[1].replace(',', '.'));
        const unit = match[2];
        
        // Convert to grams or ml for consistency
        let normalizedAmount = amount;
        if (unit.includes('kg') || unit.includes('kilo')) {
          normalizedAmount = amount * 1000; // Convert kg to g
        }
        if (unit.includes('l') && !unit.includes('ml')) {
          normalizedAmount = amount * 1000; // Convert l to ml
        }
        if (unit.includes('dl')) {
          normalizedAmount = amount * 100; // Convert dl to ml
        }
        if (unit.includes('cl')) {
          normalizedAmount = amount * 10; // Convert cl to ml
        }
        
        const result = {
          amount: normalizedAmount,
          unit: unit.includes('kg') || unit.includes('g') || unit.includes('gram') ? 'g' : 'ml',
          originalText: match[0]
        };
        
        console.log('Extracted package size:', result);
        return result;
      }
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
    return isPackaged;
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
      console.log('Package size:', packageSize);
      
      if (packageSize && (parsed.unit === 'g' || parsed.unit === 'kg' || parsed.unit === 'ml' || parsed.unit === 'l')) {
        // Convert required amount to same units as package
        const requiredInBaseUnits = this.convertToBaseUnits(parsed.amount, parsed.unit);
        console.log('Required in base units:', requiredInBaseUnits, packageSize.unit);
        
        // Only calculate if units match (both weight or both volume)
        const unitsMatch = (
          (packageSize.unit === 'g' && (parsed.unit.includes('g') || parsed.unit.includes('kg'))) ||
          (packageSize.unit === 'ml' && (parsed.unit.includes('ml') || parsed.unit.includes('l')))
        );
        
        if (unitsMatch) {
          const packagesNeeded = Math.ceil(requiredInBaseUnits / packageSize.amount);
          console.log('Calculation: ceil(', requiredInBaseUnits, '/', packageSize.amount, ') =', packagesNeeded);
          console.log('Final quantity:', packagesNeeded);
          return packagesNeeded;
        }
      }
    }
    
    // For fresh items or when package calculation fails, use piece-based estimation
    console.log('Using piece-based calculation');
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

  shouldUseWeightCalculation(itemName, productDescription) {
    const itemLower = itemName.toLowerCase();
    const descLower = productDescription.toLowerCase();
    
    // Check if item name contains weight-related keywords
    const hasWeightKeyword = this.freshItems.some(keyword => 
      itemLower.includes(keyword) || descLower.includes(keyword)
    );

    // Check if product description mentions weight units
    const hasWeightUnit = /\b\d+\s*(g|gr|kg|gram|gramm)\b/i.test(descLower);

    const result = hasWeightKeyword || hasWeightUnit;
    console.log('Should use weight calculation:', result, 'for:', itemName);
    return result;
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

// MigrosAutomation class - moved directly into content.js
class MigrosAutomation {
  constructor(quantityParser) {
    this.quantityParser = quantityParser;
    console.log('MigrosAutomation initialized with QuantityParser:', !!this.quantityParser);
  }

  async addToMigros(item) {
    try {
      console.log('Adding to Migros with quantity:', item.name, item.quantity);
      
      // Find the search input
      const searchInput = document.querySelector('input#autocompleteSearchInput') || 
                         document.querySelector('input[data-cy="autocompleteSearchInput"]');
      
      if (!searchInput) {
        console.error('Could not find Migros search input');
        return false;
      }

      // Clear and search for the item
      searchInput.focus();
      searchInput.value = '';
      await this.delay(200);
      
      searchInput.value = item.name;
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      console.log('Searching for:', item.name);
      await this.delay(1500);
      
      // Find the suggestions dropdown
      const suggestedProducts = document.querySelector('ul#suggestedProducts[data-cy="suggested-products"]');
      
      if (!suggestedProducts) {
        console.error('No search results dropdown found for:', item.name);
        return false;
      }

      // Get the first product
      const firstProduct = suggestedProducts.querySelector('li:first-child article[mo-instant-search-product-item]');
      
      if (!firstProduct) {
        console.error('No products found in dropdown for:', item.name);
        return false;
      }

      // Get product description for quantity calculation
      const productDescription = firstProduct.textContent || '';
      console.log('Product description:', productDescription);

      let targetQuantity = 1; // Default fallback

      // Use improved quantity calculation
      if (this.quantityParser) {
        try {
          targetQuantity = this.quantityParser.calculateRequiredQuantity(
            item.name, 
            item.quantity, 
            productDescription
          );
        } catch (quantityError) {
          console.warn('Error calculating quantity, using default:', quantityError);
          targetQuantity = 1;
        }
      } else {
        console.warn('QuantityParser not available, using default quantity of 1');
      }

      console.log('Target quantity to add:', targetQuantity);

      // Try to set the quantity before adding to cart
      const success = await this.setQuantityAndAddToCart(firstProduct, targetQuantity);
      
      if (success) {
        // Clear the search
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }

      return false;

    } catch (error) {
      console.error('Migros automation error:', error);
      return false;
    }
  }

  async setQuantityAndAddToCart(productElement, targetQuantity) {
    try {
      // Method 1: Look for quantity input field
      const quantityInput = productElement.querySelector('input[type="number"]') ||
                           productElement.querySelector('input.quantity-input') ||
                           productElement.querySelector('[data-cy*="quantity"]');

      if (quantityInput) {
        console.log('Found quantity input, setting value to:', targetQuantity);
        quantityInput.focus();
        quantityInput.value = targetQuantity.toString();
        quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
        quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
        await this.delay(500);
      } else {
        // Method 2: Look for + button and click it multiple times
        const plusButton = productElement.querySelector('button[data-cy*="increase"]') ||
                          productElement.querySelector('button[aria-label*="+"]') ||
                          productElement.querySelector('button.btn-increase') ||
                          productElement.querySelector('button:contains("+")');

        if (plusButton && targetQuantity > 1) {
          console.log('Found plus button, clicking', (targetQuantity - 1), 'times');
          for (let i = 1; i < targetQuantity; i++) {
            plusButton.click();
            await this.delay(300);
          }
        } else {
          console.log('No quantity controls found, using default quantity');
        }
      }

      // Now find and click the add to cart button
      const addToCartButton = productElement.querySelector('button.btn-add-to-basket') ||
                             productElement.querySelector('button[data-cy*="add-to-cart"]') ||
                             productElement.querySelector('button[data-cy*="add-to-basket"]');
      
      if (!addToCartButton) {
        console.error('No add to cart button found');
        return false;
      }

      console.log('Clicking add to cart button...');
      addToCartButton.click();
      
      await this.delay(1000);
      return true;

    } catch (error) {
      console.error('Error setting quantity and adding to cart:', error);
      return false;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main ShoppingAutomation class
class ShoppingAutomation {
  constructor() {
    this.currentSite = this.detectSite();
    this.progress = 0;
    this.totalItems = 0;
    this.isReady = false;
    
    console.log('ShoppingAutomation initialized for site:', this.currentSite);
    this.initializeAutomation();
  }

  initializeAutomation() {
    try {
      console.log('Initializing automation classes...');
      
      // Create instances directly - no more dynamic loading
      this.quantityParser = new QuantityParser();
      this.migrosAutomation = new MigrosAutomation(this.quantityParser);
      
      console.log('All automation classes initialized successfully');
      this.isReady = true;
      
    } catch (error) {
      console.error('Failed to initialize automation:', error);
      this.isReady = false;
    }
  }

  detectSite() {
    const hostname = window.location.hostname;
    if (hostname.includes('migros')) return 'migros';
    if (hostname.includes('coop')) return 'coop';
    return null;
  }

  async addItemsToCart(items) {
    console.log('addItemsToCart called with items:', items);
    
    if (!this.isReady) {
      console.error('Automation not ready');
      return { 
        success: [], 
        failed: items,
        error: 'Automation failed to initialize properly'
      };
    }
    
    console.log(`Starting automation for ${items.length} items on ${this.currentSite}`);
    
    this.totalItems = items.length;
    const results = { success: [], failed: [] };

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      this.progress = ((i + 1) / this.totalItems) * 100;
      
      console.log(`Processing item ${i + 1}/${this.totalItems}: ${item.name} (${item.quantity})`);
      
      chrome.runtime.sendMessage({
        action: 'updateProgress',
        progress: this.progress,
        message: `Adding ${item.quantity} ${item.name}...`
      });

      try {
        const success = await this.addSingleItem(item);
        if (success) {
          results.success.push(item);
          console.log(`Successfully added: ${item.quantity} ${item.name}`);
        } else {
          results.failed.push(item);
          console.log(`Failed to add: ${item.quantity} ${item.name}`);
        }
      } catch (error) {
        console.error('Error adding item:', item.name, error);
        results.failed.push(item);
      }

      // Wait between requests to avoid being blocked
      await this.delay(2000);
    }

    console.log('Automation complete:', results);
    return results;
  }

  async addSingleItem(item) {
    if (this.currentSite === 'migros' && this.migrosAutomation) {
      return await this.migrosAutomation.addToMigros(item);
    } else if (this.currentSite === 'coop') {
      return await this.addToCoop(item);
    }
    return false;
  }

  async addToCoop(item) {
    try {
      console.log('Adding to Coop:', item.name, 'quantity:', item.quantity);
      
      const searchSelectors = [
        'input[placeholder*="Suchen"]',
        'input[name="search"]',
        '.search-field input',
        'input[data-testid*="search"]'
      ];
      
      let searchInput = null;
      for (const selector of searchSelectors) {
        searchInput = document.querySelector(selector);
        if (searchInput) {
          console.log('Found Coop search input with selector:', selector);
          break;
        }
      }
      
      if (!searchInput) {
        console.error('Could not find Coop search input');
        return false;
      }

      searchInput.focus();
      searchInput.value = '';
      searchInput.value = item.name;
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Trigger search
      const searchForm = searchInput.closest('form');
      if (searchForm) {
        console.log('Submitting Coop search form');
        searchForm.dispatchEvent(new Event('submit'));
      } else {
        console.log('Using Enter key for Coop search');
        searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      }

      // Wait for search results
      await this.delay(3000);

      // Find and click first add to cart button
      const addToCartSelectors = [
        'button[data-cy="add-to-cart"]',
        '.add-to-cart',
        'button:contains("In den Warenkorb")',
        'button[title*="Warenkorb"]'
      ];
      
      for (const selector of addToCartSelectors) {
        const addToCartButton = document.querySelector(selector);
        if (addToCartButton && !addToCartButton.disabled) {
          console.log('Clicking Coop add to cart button:', selector);
          addToCartButton.click();
          await this.delay(1000);
          return true;
        }
      }

      console.log('No Coop add to cart button found');
      return false;
    } catch (error) {
      console.error('Coop automation error:', error);
      return false;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize automation
const automation = new ShoppingAutomation();

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  if (request.action === 'startAutomation') {
    console.log('Starting automation with items:', request.items);
    
    automation.addItemsToCart(request.items)
      .then(results => {
        console.log('Automation completed:', results);
        sendResponse(results);
      })
      .catch(error => {
        console.error('Automation failed:', error);
        sendResponse({ error: error.message });
      });
    
    return true; // Keep message channel open
  }
});

console.log('Content script setup complete');
