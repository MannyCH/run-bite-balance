// Content script for Migros and Coop automation
console.log('Content script loading on:', window.location.href);

// QuantityParser class - moved directly into content.js
class QuantityParser {
  constructor() {
    this.unitMappings = {
      // Weight units (grams)
      'g': 1, 'gr': 1, 'gram': 1, 'gramm': 1, 'kg': 1000, 'kilo': 1000, 'kilogram': 1000,
      // Volume units (ml)
      'ml': 1, 'milliliter': 1, 'l': 1000, 'liter': 1000, 'litre': 1000, 'dl': 100, 'deciliter': 100, 'cl': 10, 'centiliter': 10,
      // Piece units
      'stk': 1, 'stück': 1, 'piece': 1, 'pieces': 1, 'pc': 1, 'pcs': 1, 'x': 1,
      // Package units
      'pkg': 1, 'package': 1, 'pack': 1, 'packs': 1, 'packet': 1, 'packets': 1,
      'box': 1, 'boxes': 1, 'can': 1, 'cans': 1, 'bottle': 1, 'bottles': 1,
      'jar': 1, 'jars': 1, 'bag': 1, 'bags': 1, 'bunch': 1, 'bunches': 1,
      'head': 1, 'heads': 1
    };

    // Items sold fresh/loose
    this.freshItems = [
      'tomaten', 'kartoffeln', 'zwiebeln', 'karotten', 'rüebli', 'äpfel', 'bananen',
      'orangen', 'zitronen', 'trauben', 'beeren', 'salat', 'broccoli', 'blumenkohl',
      'paprika', 'gurken', 'zucchini', 'auberginen', 'fleisch', 'fisch', 'hackfleisch',
      'rindfleisch', 'schweinefleisch', 'poulet', 'chicken', 'lachs', 'forelle',
      'kabeljau', 'thunfisch', 'garnelen', 'crevetten'
    ];

    // Items typically sold in packages
    this.packagedItems = [
      'sahne', 'cream', 'sauerrahm', 'sour cream', 'joghurt', 'yogurt', 'milch', 'milk',
      'butter', 'käse', 'cheese', 'quark', 'frischkäse', 'mozzarella', 'parmesan',
      'reis', 'rice', 'pasta', 'nudeln', 'spaghetti', 'mehl', 'flour', 'zucker', 'sugar',
      'öl', 'oil', 'essig', 'vinegar', 'honig', 'honey', 'marmelade', 'jam'
    ];

    // Weight estimates per piece (used in fallback logic)
    this.defaultWeights = {
      'tomaten': 150, 'kartoffeln': 200, 'zwiebeln': 100, 'karotten': 150, 'rüebli': 150,
      'äpfel': 180, 'bananen': 120, 'paprika': 200, 'gurken': 300, 'zucchini': 250
    };

    console.log('QuantityParser initialized');
  }

  parseQuantity(quantityStr) {
    if (!quantityStr || typeof quantityStr !== 'string') {
      return { amount: 1, unit: 'piece', originalText: quantityStr || '' };
    }

    const cleanStr = quantityStr.toLowerCase().trim();
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
        return { amount, unit: unit.toLowerCase(), originalText: quantityStr };
      }
    }

    const numberMatch = cleanStr.match(/(\d+(?:[.,]\d+)?)/);
    if (numberMatch) {
      const amount = parseFloat(numberMatch[1].replace(',', '.'));
      return { amount, unit: 'piece', originalText: quantityStr };
    }

    return { amount: 1, unit: 'piece', originalText: quantityStr };
  }

  parsePackageSizeText(text) {
    if (!text) return null;
    const cleanText = text.toLowerCase().trim();
    const patterns = [
      /(\d+(?:[.,]\d+)?)\s+(kg|kilo|kilogram|g|gr|gram|gramm|l|liter|litre|ml|milliliter|dl|cl)\b/g,
      /(\d+(?:[.,]\d+)?)(kg|kilo|kilogram|g|gr|gram|gramm|l|liter|litre|ml|milliliter|dl|cl)\b/g,
      /.*?(\d+(?:[.,]\d+)?)\s*(kg|kilo|kilogram|g|gr|gram|gramm|l|liter|litre|ml|milliliter|dl|cl)\b.*?/g
    ];

    for (const pattern of patterns) {
      const matches = [...cleanText.matchAll(pattern)];
      if (matches.length > 0) {
        const match = matches[0];
        const amount = parseFloat(match[1].replace(',', '.'));
        const unit = match[2];
        let normalizedAmount = amount;
        let normalizedUnit = 'g';

        if (unit.includes('kg') || unit.includes('kilo')) {
          normalizedAmount = amount * 1000;
        } else if (unit.includes('ml')) {
          normalizedAmount = amount;
          normalizedUnit = 'ml';
        } else if (unit.includes('dl')) {
          normalizedAmount = amount * 100;
          normalizedUnit = 'ml';
        } else if (unit.includes('cl')) {
          normalizedAmount = amount * 10;
          normalizedUnit = 'ml';
        } else if (unit.includes('l')) {
          normalizedAmount = amount * 1000;
          normalizedUnit = 'ml';
        }

        return {
          amount: normalizedAmount,
          unit: normalizedUnit,
          originalText: match[0]
        };
      }
    }
    return null;
  }

    extractMigrosPackageSize(productElement) {
    const priceUnitElements = productElement.querySelectorAll('.weight-priceUnit, [class*="weight"], [class*="price"]');
    for (const element of priceUnitElements) {
      const parsed = this.parsePackageSizeText(element.textContent.trim());
      if (parsed) return parsed;
    }

    const moQuantityElement = productElement.querySelector('mo-product-quantity');
    if (moQuantityElement) {
      const accessibleSize = moQuantityElement.querySelector('span[data-testid="accessible-product-size"]');
      if (accessibleSize) {
        const parsed = this.parsePackageSizeText(accessibleSize.textContent.trim());
        if (parsed) return parsed;
      }
      const defaultSize = moQuantityElement.querySelector('span[data-testid="default-product-size"]');
      if (defaultSize) {
        const parsed = this.parsePackageSizeText(defaultSize.textContent.trim());
        if (parsed) return parsed;
      }
      const weightSpans = moQuantityElement.querySelectorAll('span');
      for (const span of weightSpans) {
        const parsed = this.parsePackageSizeText(span.textContent.trim());
        if (parsed) return parsed;
      }
    }

    const testIdElements = productElement.querySelectorAll('[data-testid*="product-size"], [data-testid*="weight"], [data-testid*="quantity"]');
    for (const element of testIdElements) {
      const parsed = this.parsePackageSizeText(element.textContent.trim());
      if (parsed) return parsed;
    }

    const allText = productElement.textContent || '';
    return this.parsePackageSizeText(allText);
  }

  convertToBaseUnits(amount, unit) {
    const factor = this.unitMappings[unit] || 1;
    return amount * factor;
  }

  calculateRequiredQuantityFromElement(itemName, requiredQuantity, productElement) {
    const parsed = this.parseQuantity(requiredQuantity);
    console.log('=== Enhanced Quantity Calculation Debug ===');
    console.log('Item:', itemName);
    console.log('Required quantity:', requiredQuantity);
    console.log('Parsed required:', parsed);
    console.log('Product element:', productElement);
    
    // Try to extract package size from the DOM
    const packageSize = this.extractMigrosPackageSize(productElement);
    console.log('Extracted package size:', packageSize);

    if (
      packageSize &&
      (parsed.unit === 'g' || parsed.unit === 'kg' || parsed.unit === 'ml' || parsed.unit === 'l')
    ) {
      const requiredInBaseUnits = this.convertToBaseUnits(parsed.amount, parsed.unit);
      console.log(`Required in base units: ${requiredInBaseUnits}, package size: ${packageSize.amount} ${packageSize.unit}`);

      const unitsMatch = (
        (packageSize.unit === 'g' && (parsed.unit.includes('g') || parsed.unit.includes('kg'))) ||
        (packageSize.unit === 'ml' && (parsed.unit.includes('ml') || parsed.unit.includes('l')))
      );

      if (unitsMatch && packageSize.amount > 0) {
        const packagesNeeded =
          requiredInBaseUnits > packageSize.amount
            ? Math.ceil(requiredInBaseUnits / packageSize.amount)
            : 1;

        console.log(`Calculated packages needed: ${packagesNeeded}`);
        return packagesNeeded;
      } else {
        console.log('Units do not match or invalid package size');
      }
    } else {
      console.log('No compatible package size found or invalid required quantity format');
    }

    // Fallback to legacy method
    console.log('Using legacy calculation method');
    return this.calculateRequiredQuantity(itemName, requiredQuantity, productElement.textContent || '');
  }


  calculateRequiredQuantity(itemName, requiredQuantity, productDescription) {
    const parsed = this.parseQuantity(requiredQuantity);
    const isPackaged = this.isPackagedItem(itemName, productDescription);

    if (isPackaged) {
      const packageSize = this.parsePackageSizeText(productDescription);
      if (packageSize && ['g', 'ml'].includes(packageSize.unit)) {
        const requiredInBase = this.convertToBaseUnits(parsed.amount, parsed.unit);
        const unitsMatch = (packageSize.unit === 'g' && parsed.unit.includes('g')) ||
                           (packageSize.unit === 'ml' && parsed.unit.includes('l') || parsed.unit.includes('ml'));

        if (unitsMatch) {
          return Math.max(1, Math.ceil(requiredInBase / packageSize.amount));
        }
      }
    }

    const weightEstimate = this.estimateWeight(itemName, requiredQuantity);
    if (weightEstimate) {
      return Math.max(1, weightEstimate.pieces);
    }

    return Math.max(1, Math.round(parsed.amount));
  }

  estimateWeight(itemName, quantity) {
    const parsed = this.parseQuantity(quantity);
    const itemKey = Object.keys(this.defaultWeights).find(k => itemName.toLowerCase().includes(k));
    if (itemKey) {
      const perPiece = this.defaultWeights[itemKey];
      const totalWeight = parsed.amount * perPiece;
      const pieces = Math.ceil(totalWeight / perPiece);
      return { totalWeight, unit: 'g', pieces };
    }
    return null;
  }

    isPackagedItem(itemName, productDescription) {
    const itemLower = itemName.toLowerCase();
    const descLower = productDescription.toLowerCase();

    const isPackaged = this.packagedItems.some(keyword => itemLower.includes(keyword) || descLower.includes(keyword));
    const isFresh = this.freshItems.some(keyword => itemLower.includes(keyword) || descLower.includes(keyword));

    if (!isPackaged && !isFresh) {
      const packageIndicators = ['pack', 'dose', 'flasche', 'bottle', 'becher', 'cup', 'glas', 'jar'];
      return packageIndicators.some(indicator => descLower.includes(indicator));
    }

    return isPackaged;
  }
}

// MigrosAutomation class
class MigrosAutomation {
  constructor(quantityParser) {
    this.quantityParser = quantityParser;
  }

  async addToMigros(item) {
    try {
      const searchInput = document.querySelector('input#autocompleteSearchInput') ||
                          document.querySelector('input[data-cy="autocompleteSearchInput"]');

      if (!searchInput) return false;

      searchInput.focus();
      searchInput.value = '';
      await this.delay(200);
      searchInput.value = item.name;
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.dispatchEvent(new Event('change', { bubbles: true }));

      await this.delay(1500);

      const suggestedProducts = document.querySelector('ul#suggestedProducts[data-cy="suggested-products"]');
      if (!suggestedProducts) return false;

      const firstProduct = suggestedProducts.querySelector('li:first-child article[mo-instant-search-product-item]');
      if (!firstProduct) return false;

      let targetQuantity = 1;
      if (this.quantityParser) {
        try {
          targetQuantity = this.quantityParser.calculateRequiredQuantityFromElement(item.name, item.quantity, firstProduct);
        } catch {
          targetQuantity = 1;
        }
      }

      const success = await this.setQuantityAndAddToCart(firstProduct, targetQuantity);

      if (success) {
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  async setQuantityAndAddToCart(productElement, targetQuantity) {
    try {
      const quantityInput = productElement.querySelector('input[type="number"]');
      if (quantityInput) {
        quantityInput.focus();
        quantityInput.value = targetQuantity.toString();
        quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
        quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
        await this.delay(500);
      }

      const addToCartButton = productElement.querySelector('button.btn-add-to-basket') ||
                              productElement.querySelector('button[data-cy*="add-to-cart"]');

      if (!addToCartButton) return false;

      addToCartButton.click();
      await this.delay(1000);
      return true;
    } catch {
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
    this.quantityParser = new QuantityParser();
    this.migrosAutomation = new MigrosAutomation(this.quantityParser);
    this.isReady = true;
  }

  detectSite() {
    const hostname = window.location.hostname;
    if (hostname.includes('migros')) return 'migros';
    if (hostname.includes('coop')) return 'coop';
    return null;
  }

  async addItemsToCart(items) {
    if (!this.isReady) return { success: [], failed: items, error: 'Automation not ready' };

    const results = { success: [], failed: [] };

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      try {
        const success = await this.addSingleItem(item);
        if (success) {
          results.success.push(item);
        } else {
          results.failed.push(item);
        }
      } catch {
        results.failed.push(item);
      }

      await this.delay(2000);
    }

    return results;
  }

  async addSingleItem(item) {
    if (this.currentSite === 'migros') {
      return await this.migrosAutomation.addToMigros(item);
    } else if (this.currentSite === 'coop') {
      return await this.addToCoop(item);
    }
    return false;
  }

  async addToCoop(item) {
    try {
      const input = document.querySelector('input[placeholder*="Suchen"]') || document.querySelector('input[name="search"]');
      if (!input) return false;

      input.focus();
      input.value = item.name;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await this.delay(3000);

      const addToCartButton = document.querySelector('button[data-cy="add-to-cart"]');
      if (addToCartButton && !addToCartButton.disabled) {
        addToCartButton.click();
        await this.delay(1000);
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const automation = new ShoppingAutomation();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startAutomation') {
    automation.addItemsToCart(request.items)
      .then(results => sendResponse(results))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
});

console.log('Content script setup complete');
