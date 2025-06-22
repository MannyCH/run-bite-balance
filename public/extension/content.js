
// Content script for Migros and Coop automation
class ShoppingAutomation {
  constructor() {
    this.currentSite = this.detectSite();
    this.progress = 0;
    this.totalItems = 0;
  }

  detectSite() {
    const hostname = window.location.hostname;
    if (hostname.includes('migros')) return 'migros';
    if (hostname.includes('coop')) return 'coop';
    return null;
  }

  async addItemsToCart(items) {
    this.totalItems = items.length;
    const results = { success: [], failed: [] };

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      this.progress = ((i + 1) / this.totalItems) * 100;
      
      chrome.runtime.sendMessage({
        action: 'updateProgress',
        progress: this.progress,
        message: `Adding ${item.name}...`
      });

      try {
        const success = await this.addSingleItem(item);
        if (success) {
          results.success.push(item);
        } else {
          results.failed.push(item);
        }
      } catch (error) {
        console.error('Error adding item:', item.name, error);
        results.failed.push(item);
      }

      // Wait between requests to avoid being blocked
      await this.delay(1000);
    }

    return results;
  }

  async addSingleItem(item) {
    if (this.currentSite === 'migros') {
      return await this.addToMigros(item);
    } else if (this.currentSite === 'coop') {
      return await this.addToCoop(item);
    }
    return false;
  }

  async addToMigros(item) {
    try {
      // Search for the item
      const searchInput = document.querySelector('input[data-testid="search-input"], input[name="search"], .search-input input');
      if (!searchInput) return false;

      searchInput.value = item.name;
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Trigger search
      const searchButton = document.querySelector('button[data-testid="search-button"], .search-button, button[type="submit"]');
      if (searchButton) {
        searchButton.click();
      } else {
        searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      }

      // Wait for search results
      await this.delay(2000);

      // Find and click first add to cart button
      const addToCartButton = document.querySelector(
        'button[data-testid*="add-to-cart"], button[aria-label*="Add to cart"], .add-to-cart-button, button:contains("In den Warenkorb")'
      );

      if (addToCartButton && !addToCartButton.disabled) {
        addToCartButton.click();
        await this.delay(1000);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Migros automation error:', error);
      return false;
    }
  }

  async addToCoop(item) {
    try {
      // Similar implementation for Coop
      const searchInput = document.querySelector('input[placeholder*="Suchen"], input[name="search"], .search-field input');
      if (!searchInput) return false;

      searchInput.value = item.name;
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Trigger search
      const searchForm = searchInput.closest('form');
      if (searchForm) {
        searchForm.dispatchEvent(new Event('submit'));
      } else {
        searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      }

      // Wait for search results
      await this.delay(2000);

      // Find and click first add to cart button
      const addToCartButton = document.querySelector(
        'button[data-cy="add-to-cart"], .add-to-cart, button:contains("In den Warenkorb")'
      );

      if (addToCartButton && !addToCartButton.disabled) {
        addToCartButton.click();
        await this.delay(1000);
        return true;
      }

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

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startAutomation') {
    const automation = new ShoppingAutomation();
    automation.addItemsToCart(request.items)
      .then(results => sendResponse(results))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep message channel open
  }
});
