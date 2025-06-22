let isAutomationRunning = false;


(function () {
  if (window.__runBiteFitContentScriptInjected) {
    console.log('RunBiteFit content.js already injected. Skipping...');
    return;
  }
  window.__runBiteFitContentScriptInjected = true;

  console.log('Content script loading on:', window.location.href);

  class QuantityParser {
    constructor() {
      this.unitMappings = {
        'g': 1, 'gram': 1, 'gramm': 1, 'gr': 1,
        'kg': 1000, 'kilo': 1000, 'kilogram': 1000,
        'ml': 1, 'milliliter': 1,
        'l': 1000, 'liter': 1000, 'litre': 1000,
        'dl': 100, 'deciliter': 100,
        'cl': 10, 'centiliter': 10,
        'stk': 1, 'stück': 1, 'piece': 1, 'pieces': 1, 'pc': 1, 'pcs': 1, 'x': 1,
        'pkg': 1, 'package': 1, 'pack': 1, 'packs': 1, 'packet': 1, 'packets': 1,
        'box': 1, 'boxes': 1, 'can': 1, 'cans': 1,
        'bottle': 1, 'bottles': 1, 'jar': 1, 'jars': 1,
        'bag': 1, 'bags': 1, 'bunch': 1, 'bunches': 1,
        'head': 1, 'heads': 1
      };

      this.defaultWeights = {
        'banana': 120, 'bananas': 120,
        'apple': 180, 'apples': 180,
        'carrot': 150, 'karotten': 150, 'rüebli': 150,
        'broccoli': 500, 'cauliflower': 800,
        'onion': 100, 'onions': 100, 'zwiebel': 100,
        'pepper': 200, 'paprika': 200,
        'tomato': 150, 'tomaten': 150,
        'zucchini': 250, 'cucumber': 300, 'salad': 300
      };
    }

    parseQuantity(str) {
      if (!str || typeof str !== 'string') return { amount: 1, unit: 'piece', originalText: str };
      const match = str.toLowerCase().match(/(\d+(?:[.,]\d+)?)(\s*[a-zA-Z]*)?/);
      const amount = match ? parseFloat(match[1].replace(',', '.')) : 1;
      const unit = match && match[2] ? match[2].trim().toLowerCase() || 'piece' : 'piece';
      return { amount, unit, originalText: str };
    }

    convertToBaseUnits(amount, unit) {
      const factor = this.unitMappings[unit.toLowerCase()] || 1;
      return amount * factor;
    }

    extractMigrosPackageSize(productElement) {
      const weightNode = productElement.querySelector('.weight-priceUnit');
      if (!weightNode) return null;
      const text = weightNode.textContent.trim().replace(',', '.');
      const match = text.match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l|dl|cl)/i);
      if (!match) return null;

      const number = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      const normalizedUnit = ['kg', 'g'].includes(unit) ? 'g' : 'ml';
      const factor = this.unitMappings[unit] || 1;

      return { amount: number * factor, unit: normalizedUnit };
    }

    calculateRequiredQuantityFromElement(itemName, requiredQuantity, productElement) {
      const parsed = this.parseQuantity(requiredQuantity);
      const packageSize = this.extractMigrosPackageSize(productElement);
      const requiredGrams = this.convertToBaseUnits(parsed.amount, parsed.unit);

      if (packageSize && packageSize.amount > 0) {
        const compatible =
          (packageSize.unit === 'g' && ['g', 'kg'].includes(parsed.unit)) ||
          (packageSize.unit === 'ml' && ['ml', 'l', 'dl', 'cl'].includes(parsed.unit));
        if (compatible) {
          return requiredGrams > packageSize.amount
            ? Math.ceil(requiredGrams / packageSize.amount)
            : 1;
        }
      }

      return this.calculateFallbackPackages(itemName, parsed, packageSize?.amount || 150);
    }

    calculateFallbackPackages(itemName, parsed, packageWeight) {
      const itemKey = Object.keys(this.defaultWeights).find(k =>
        itemName.toLowerCase().includes(k)
      );
      const assumedWeight = itemKey ? this.defaultWeights[itemKey] : 150;
      const estimatedWeight =
        parsed.unit === 'piece'
          ? parsed.amount * assumedWeight
          : this.convertToBaseUnits(parsed.amount, parsed.unit);

      return estimatedWeight > packageWeight
        ? Math.ceil(estimatedWeight / packageWeight)
        : 1;
    }
  }

    class MigrosAutomation {
    constructor(quantityParser) {
      this.quantityParser = quantityParser;
      this.addedProductNames = new Set();
    }

async addToMigros(item) {
  try {
    this.addedItemNames = this.addedItemNames || new Set();

    if (this.addedItemNames.has(item.name)) {
      console.log('[Migros] Skipping duplicate item:', item.name);
      return true;
    }

    console.log('[Migros] Attempting to add:', item.name, item.quantity || '');

    const searchInput = document.querySelector('input#autocompleteSearchInput') ||
                        document.querySelector('input[data-cy="autocompleteSearchInput"]');

    if (!searchInput) {
      console.warn('[Migros] Search input not found');
      return false;
    }

    searchInput.focus();
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    searchInput.dispatchEvent(new Event('change', { bubbles: true }));

    await this.delay(300); // Small pause before typing
    searchInput.value = item.name;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    searchInput.dispatchEvent(new Event('change', { bubbles: true }));

    let firstProduct = null;
    for (let tries = 0; tries < 10; tries++) {
      await this.delay(300); // Check every 300ms
      const suggestedProducts = document.querySelector('ul#suggestedProducts[data-cy="suggested-products"]');
      if (suggestedProducts) {
        firstProduct = suggestedProducts.querySelector('li:first-child article[mo-instant-search-product-item]');
        if (firstProduct) break;
      }
    }

    if (!firstProduct) {
      console.warn('[Migros] No suggested products list');
      return false;
    }



    // Calculate quantity
    let targetQuantity = 1;
    try {
      targetQuantity = this.quantityParser.calculateRequiredQuantityFromElement(item.name, item.quantity, firstProduct);
    } catch (e) {
      console.warn('[Migros] Quantity calculation failed:', e);
    }

    const success = await this.setQuantityAndAddToCart(firstProduct, targetQuantity);
    if (success) {
      this.addedItemNames.add(item.name); // ✅ Only mark as added after success
      console.log('[Migros] ✅ Added:', item.name, '| Quantity:', targetQuantity);

      // Clear input after success
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    } else {
      console.warn('[Migros] ❌ Failed to add:', item.name);
      return false;
    }
  } catch (err) {
    console.error('[Migros] Unexpected error adding item:', item.name, err);
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
          await this.delay(300);
        }

        const addToCartButton = productElement.querySelector('button.btn-add-to-basket') ||
                                productElement.querySelector('button[data-cy*="add-to-cart"]');

        if (!addToCartButton || addToCartButton.disabled) return false;

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

      for (const item of items) {
        try {
          const success = await this.addSingleItem(item);
          if (success) results.success.push(item);
          else results.failed.push(item);
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
        const input = document.querySelector('input[placeholder*="Suchen"]') ||
                      document.querySelector('input[name="search"]');
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
})();
