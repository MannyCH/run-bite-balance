console.log('Content script loading on:', window.location.href);

class QuantityParser {
  constructor() {
    this.unitMappings = {
      'g': 1, 'gr': 1, 'gram': 1, 'gramm': 1,
      'kg': 1000, 'kilo': 1000, 'kilogram': 1000,
      'ml': 1, 'milliliter': 1,
      'l': 1000, 'liter': 1000, 'litre': 1000,
      'dl': 100, 'deciliter': 100,
      'cl': 10, 'centiliter': 10,
      'stk': 1, 'stück': 1, 'piece': 1, 'pieces': 1,
      'pc': 1, 'pcs': 1, 'x': 1
    };
  }

  parseQuantity(quantityStr) {
    if (!quantityStr || typeof quantityStr !== 'string') {
      return { amount: 1, unit: 'piece', originalText: quantityStr || '' };
    }

    const cleanStr = quantityStr.toLowerCase().trim();
    const patterns = [
      /^(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)$/,
      /^(\d+(?:[.,]\d+)?)$/,
    ];

    for (const pattern of patterns) {
      const match = cleanStr.match(pattern);
      if (match) {
        const amount = parseFloat(match[1].replace(',', '.'));
        const unit = match[2] || 'piece';
        return { amount, unit: unit.toLowerCase(), originalText: quantityStr };
      }
    }

    return { amount: 1, unit: 'piece', originalText: quantityStr };
  }

  parsePackageSizeText(text) {
    if (!text) return null;
    const cleanText = text.toLowerCase().trim();

    const patterns = [
      /(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|dl|cl)\b/g
    ];

    for (const pattern of patterns) {
      const matches = [...cleanText.matchAll(pattern)];
      if (matches.length > 0) {
        matches.sort((a, b) => parseFloat(b[1]) - parseFloat(a[1]));
        const match = matches[0];
        const amount = parseFloat(match[1].replace(',', '.'));
        const unit = match[2];

        let normalizedAmount = amount;
        let normalizedUnit = unit;

        if (unit === 'kg') normalizedAmount *= 1000;
        if (unit === 'l') { normalizedAmount *= 1000; normalizedUnit = 'ml'; }
        if (unit === 'dl') { normalizedAmount *= 100; normalizedUnit = 'ml'; }
        if (unit === 'cl') { normalizedAmount *= 10; normalizedUnit = 'ml'; }

        return { amount: normalizedAmount, unit: normalizedUnit, originalText: match[0] };
      }
    }

    return null;
  }

  extractMigrosPackageSize(productElement) {
    const quantityElement = productElement.querySelector('mo-product-quantity');
    if (!quantityElement) return null;

    const spans = quantityElement.querySelectorAll('span');
    for (const span of spans) {
      const text = span.textContent.trim();
      if (text) {
        const parsed = this.parsePackageSizeText(text);
        if (parsed) return parsed;
      }
    }

    return null;
  }

  convertToBaseUnits(quantity, unit) {
    const multiplier = this.unitMappings[unit.toLowerCase()] || 1;
    return quantity * multiplier;
  }

  calculateRequiredQuantityFromElement(itemName, requiredQuantity, productElement) {
    const parsed = this.parseQuantity(requiredQuantity);
    const packageSize = this.extractMigrosPackageSize(productElement);

    if (packageSize && ['g', 'ml'].includes(packageSize.unit)) {
      const requiredBase = this.convertToBaseUnits(parsed.amount, parsed.unit);
      if (packageSize.amount > 0) {
        return Math.max(1, Math.ceil(requiredBase / packageSize.amount));
      }
    }

    return Math.max(1, Math.round(parsed.amount));
  }
}

class MigrosAutomation {
  constructor(quantityParser) {
    this.quantityParser = quantityParser;
  }

  async addToMigros(item) {
    const searchInput = document.querySelector('input#autocompleteSearchInput');
    if (!searchInput) return false;

    searchInput.focus();
    searchInput.value = item.name;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    searchInput.dispatchEvent(new Event('change', { bubbles: true }));

    await this.delay(1500);

    const suggestedProducts = document.querySelector('ul#suggestedProducts');
    const firstProduct = suggestedProducts?.querySelector('li:first-child article');

    if (!firstProduct) return false;

    let targetQuantity = 1;
    try {
      targetQuantity = this.quantityParser.calculateRequiredQuantityFromElement(item.name, item.quantity, firstProduct);
    } catch (e) {
      console.warn('Quantity calc error:', e);
    }

    const plusButton = firstProduct.querySelector('button[aria-label*="+"]');
    for (let i = 1; i < targetQuantity; i++) {
      plusButton?.click();
      await this.delay(300);
    }

    const addToCart = firstProduct.querySelector('button[data-cy*="add-to-cart"]');
    addToCart?.click();

    return true;
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
    this.progress = 0;
    this.totalItems = 0;
    this.isReady = true;
  }

  detectSite() {
    const hostname = window.location.hostname;
    if (hostname.includes('migros')) return 'migros';
    if (hostname.includes('coop')) return 'coop';
    return null;
  }

  async addItemsToCart(items) {
    if (!this.isReady) {
      return { success: [], failed: items, error: 'Automation not ready' };
    }

    this.totalItems = items.length;
    const results = { success: [], failed: [] };

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      this.progress = ((i + 1) / this.totalItems) * 100;

      chrome.runtime.sendMessage({
        action: 'updateProgress',
        progress: this.progress,
        message: `Adding ${item.quantity} ${item.name}...`
      });

      try {
        const success = await this.addSingleItem(item);
        if (success) results.success.push(item);
        else results.failed.push(item);
      } catch (error) {
        console.error('Error adding item:', item.name, error);
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
    const searchInput = document.querySelector('input[placeholder*="Suchen"]') ||
                        document.querySelector('input[name="search"]');
    if (!searchInput) return false;

    searchInput.focus();
    searchInput.value = item.name;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    searchInput.dispatchEvent(new Event('change', { bubbles: true }));

    const form = searchInput.closest('form');
    if (form) form.dispatchEvent(new Event('submit'));
    else searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    await this.delay(3000);

    const addToCartButton = document.querySelector('button[data-cy="add-to-cart"]');
    if (addToCartButton && !addToCartButton.disabled) {
      addToCartButton.click();
      await this.delay(1000);
      return true;
    }

    return false;
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
