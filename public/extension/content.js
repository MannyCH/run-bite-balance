if (window.__runBiteFitContentScriptInjected) {
  console.log('RunBiteFit content.js already injected. Skipping...');
  return;
}
window.__runBiteFitContentScriptInjected = true;


// Content script for Migros and Coop automation
console.log('Content script loading on:', window.location.href);

// === PART 1: QuantityParser Class (Setup and Constructor) ===
class QuantityParser {
  constructor() {
    this.unitMappings = {
      'g': 1, 'gr': 1, 'gram': 1, 'gramm': 1,
      'kg': 1000, 'kilo': 1000, 'kilogram': 1000,
      'ml': 1, 'milliliter': 1,
      'l': 1000, 'liter': 1000, 'litre': 1000,
      'dl': 100, 'deciliter': 100,
      'cl': 10, 'centiliter': 10,
      'stk': 1, 'stück': 1, 'piece': 1, 'pieces': 1, 'pc': 1, 'pcs': 1, 'x': 1,
      'pkg': 1, 'package': 1, 'pack': 1, 'packs': 1, 'packet': 1, 'packets': 1,
      'box': 1, 'boxes': 1, 'can': 1, 'cans': 1, 'bottle': 1, 'bottles': 1,
      'jar': 1, 'jars': 1, 'bag': 1, 'bags': 1, 'bunch': 1, 'bunches': 1,
      'head': 1, 'heads': 1
    };

    this.defaultWeights = {
      'broccoli': 500, 'karotten': 150, 'rüebli': 150, 'zwiebeln': 100,
      'salat': 300, 'gurken': 300, 'zucchini': 250, 'tomaten': 150,
      'paprika': 200, 'blumenkohl': 800, 'äpfel': 180, 'bananen': 120,
      'kartoffeln': 200
    };

    this.freshItems = [
      'tomaten', 'kartoffeln', 'zwiebeln', 'karotten', 'rüebli', 'äpfel', 'bananen', 
      'orangen', 'zitronen', 'trauben', 'beeren', 'salat', 'broccoli', 'blumenkohl', 
      'paprika', 'gurken', 'zucchini', 'auberginen', 'fleisch', 'fisch', 'hackfleisch', 
      'rindfleisch', 'schweinefleisch', 'poulet', 'chicken', 'lachs', 'forelle', 
      'kabeljau', 'thunfisch', 'garnelen', 'crevetten'
    ];

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

  convertToBaseUnits(quantity, unit) {
    const unitMappings = this.unitMappings;
    const multiplier = unitMappings[unit.toLowerCase()] || 1;
    return quantity * multiplier;
  }

  parsePackageSizeText(text) {
    if (!text) return null;
    const cleanText = text.toLowerCase().trim();
    const patterns = [
      /(\d+(?:[.,]\d+)?)\s+(kg|g|gram|gr|l|ml|dl|cl)/g,
      /(\d+(?:[.,]\d+)?)(kg|g|gram|gr|l|ml|dl|cl)\b/g
    ];

    for (const pattern of patterns) {
      const matches = [...cleanText.matchAll(pattern)];
      if (matches.length > 0) {
        const match = matches[0];
        const amount = parseFloat(match[1].replace(',', '.'));
        const unit = match[2];
        let normalized = amount;

        if (unit.includes('kg')) normalized *= 1000;
        else if (unit.includes('l')) normalized *= 1000;
        else if (unit.includes('dl')) normalized *= 100;
        else if (unit.includes('cl')) normalized *= 10;

        return {
          amount: normalized,
          unit: unit.includes('l') ? 'ml' : 'g',
          originalText: match[0]
        };
      }
    }

    return null;
  }

  extractMigrosPackageSize(productElement) {
    const text = productElement.textContent;
    return this.parsePackageSizeText(text);
  }


  calculateRequiredQuantityFromElement(itemName, requiredQuantity, productElement) {
    const parsed = this.parseQuantity(requiredQuantity);
    const packageSize = this.extractMigrosPackageSize(productElement);

    if (packageSize && ['g', 'kg', 'ml', 'l'].includes(parsed.unit)) {
      const requiredInBase = this.convertToBaseUnits(parsed.amount, parsed.unit);
      const unitsMatch = (
        (packageSize.unit === 'g' && ['g', 'kg'].includes(parsed.unit)) ||
        (packageSize.unit === 'ml' && ['ml', 'l'].includes(parsed.unit))
      );

      if (unitsMatch && packageSize.amount > 0) {
        const packagesNeeded = Math.ceil(requiredInBase / packageSize.amount);
        return packagesNeeded < 1 ? 1 : packagesNeeded;
      }
    }

    return this.calculateRequiredQuantity(itemName, requiredQuantity, productElement.textContent || '');
  }

  calculateRequiredQuantity(itemName, requiredQuantity, productDescription) {
    const parsed = this.parseQuantity(requiredQuantity);
    const isPackaged = this.isPackagedItem(itemName, productDescription);

    if (isPackaged) {
      const packageSize = this.parsePackageSizeText(productDescription);
      if (packageSize && ['g', 'kg', 'ml', 'l'].includes(parsed.unit)) {
        const required = this.convertToBaseUnits(parsed.amount, parsed.unit);
        const unitsMatch = (
          (packageSize.unit === 'g' && ['g', 'kg'].includes(parsed.unit)) ||
          (packageSize.unit === 'ml' && ['ml', 'l'].includes(parsed.unit))
        );
        if (unitsMatch) {
          const packagesNeeded = Math.ceil(required / packageSize.amount);
          return packagesNeeded < 1 ? 1 : packagesNeeded;
        }
      }
    }

    const estimate = this.estimateWeight(itemName, requiredQuantity);
    if (estimate) return Math.max(1, estimate.pieces);
    return Math.max(1, Math.round(parsed.amount));
  }

  estimateWeight(itemName, quantity) {
    const parsed = this.parseQuantity(quantity);
    const estimates = {
      'tomaten': 150, 'kartoffeln': 200, 'zwiebeln': 100, 'äpfel': 180, 'bananen': 120,
      'paprika': 200, 'gurken': 300, 'zucchini': 250
    };

    const key = Object.keys(estimates).find(k => itemName.toLowerCase().includes(k));
    if (key) {
      const totalWeight = parsed.amount * estimates[key];
      return { pieces: Math.ceil(totalWeight / estimates[key]), unit: 'g' };
    }

    return null;
  }

  isPackagedItem(itemName, productDescription) {
    const name = itemName.toLowerCase();
    const desc = productDescription.toLowerCase();
    const isPackaged = this.packagedItems.some(k => name.includes(k) || desc.includes(k));
    const isFresh = this.freshItems.some(k => name.includes(k) || desc.includes(k));
    if (!isPackaged && !isFresh) {
      const indicators = ['pack', 'dose', 'bottle', 'flasche', 'jar', 'becher', 'cup'];
      return indicators.some(k => desc.includes(k));
    }
    return isPackaged;
  }
}

// === ONE-TIME GUARD to prevent duplicate execution ===
if (window.__runBiteFitContentScriptInjected) {
  console.log('RunBiteFit content.js already injected. Skipping...');
  return;
}
window.__runBiteFitContentScriptInjected = true;

// === Main automation logic ===
const parser = new QuantityParser();

window.addEventListener('message', async (event) => {
  if (event.data?.source !== 'runbitefit-app' || event.data.action !== 'startAutomation') return;

  const items = event.data.items || [];
  console.log('[RunBiteFit] Automation started with items:', items);

  for (const item of items) {
    const query = item.name;
    const requiredQty = item.quantity;
    console.log('Searching for item:', query);

    const searchBox = document.querySelector('input[type="search"], input[type="text"]');
    if (!searchBox) {
      console.warn('No search input found on page');
      continue;
    }

    searchBox.value = query;
    searchBox.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 1500)); // wait for results to load

    const resultItem = document.querySelector('[data-cy^="product-list-item"]:not([data-cy*="sponsored"])');
    if (!resultItem) {
      console.warn('No product found for:', query);
      continue;
    }

    const qty = parser.calculateRequiredQuantityFromElement(query, requiredQty, resultItem);
    console.log(`Adding ${qty}x of:`, query);

    const plusBtn = resultItem.querySelector('button[data-cy*="add-button"]');
    if (!plusBtn) {
      console.warn('No add button found for:', query);
      continue;
    }

    for (let i = 0; i < qty; i++) {
      plusBtn.click();
      await new Promise(r => setTimeout(r, 300));
    }
  }

  console.log('[RunBiteFit] Automation finished');
  window.postMessage({
    source: 'runbitefit-extension',
    action: 'automationResponse',
    response: { success: true }
  }, window.location.origin);
});
