
// Content script for Migros and Coop automation
console.log('Content script loading on:', window.location.href);

class ShoppingAutomation {
  constructor() {
    this.currentSite = this.detectSite();
    this.progress = 0;
    this.totalItems = 0;
    this.isReady = false;
    
    console.log('ShoppingAutomation initialized for site:', this.currentSite);
    this.initializeWhenReady();
  }

  async initializeWhenReady() {
    // Wait for DOM to be ready
    if (document.readyState !== 'complete') {
      await new Promise(resolve => {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', resolve);
        } else {
          window.addEventListener('load', resolve);
        }
      });
    }
    
    // Give additional time for any dynamic content to load
    setTimeout(() => {
      this.isReady = true;
      console.log('ShoppingAutomation ready');
    }, 1000);
  }

  detectSite() {
    const hostname = window.location.hostname;
    if (hostname.includes('migros')) return 'migros';
    if (hostname.includes('coop')) return 'coop';
    return null;
  }

  async addItemsToCart(items) {
    if (!this.isReady) {
      console.log('Automation not ready yet, waiting...');
      await new Promise(resolve => {
        const checkReady = () => {
          if (this.isReady) {
            resolve();
          } else {
            setTimeout(checkReady, 500);
          }
        };
        checkReady();
      });
    }
    
    console.log(`Starting automation for ${items.length} items on ${this.currentSite}`);
    
    this.totalItems = items.length;
    const results = { success: [], failed: [] };

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      this.progress = ((i + 1) / this.totalItems) * 100;
      
      console.log(`Processing item ${i + 1}/${this.totalItems}: ${item.name}`);
      
      chrome.runtime.sendMessage({
        action: 'updateProgress',
        progress: this.progress,
        message: `Adding ${item.name}...`
      });

      try {
        const success = await this.addSingleItem(item);
        if (success) {
          results.success.push(item);
          console.log(`Successfully added: ${item.name}`);
        } else {
          results.failed.push(item);
          console.log(`Failed to add: ${item.name}`);
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
    if (this.currentSite === 'migros') {
      return await this.addToMigros(item);
    } else if (this.currentSite === 'coop') {
      return await this.addToCoop(item);
    }
    return false;
  }

  async addToMigros(item) {
    try {
      console.log('Adding to Migros:', item.name);
      
      // Find the correct search input
      const searchInput = document.querySelector('input#autocompleteSearchInput') || 
                         document.querySelector('input[data-cy="autocompleteSearchInput"]');
      
      if (!searchInput) {
        console.error('Could not find Migros search input');
        return false;
      }

      console.log('Found Migros search input:', searchInput);

      // Clear and set search value
      searchInput.focus();
      searchInput.value = '';
      await this.delay(200);
      
      // Type the search term
      searchInput.value = item.name;
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      console.log('Typed search term:', item.name);

      // Wait for the dropdown to appear
      await this.delay(1500);
      
      // Look for the suggestions dropdown
      const suggestedProducts = document.querySelector('ul#suggestedProducts[data-cy="suggested-products"]');
      
      if (!suggestedProducts) {
        console.error('No search results dropdown found for:', item.name);
        return false;
      }

      console.log('Found suggestions dropdown');

      // Get the first product item
      const firstProduct = suggestedProducts.querySelector('li:first-child article[mo-instant-search-product-item]');
      
      if (!firstProduct) {
        console.error('No products found in dropdown for:', item.name);
        return false;
      }

      console.log('Found first product in dropdown');

      // Find the add to cart button in the first product
      const addToCartButton = firstProduct.querySelector('button.btn-add-to-basket');
      
      if (!addToCartButton) {
        console.error('No add to cart button found in first product');
        return false;
      }

      console.log('Found add to cart button, clicking...');

      // Click the add to cart button
      addToCartButton.click();
      
      // Wait for the action to complete
      await this.delay(1000);
      
      // Clear the search to close dropdown for next item
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      return true;

    } catch (error) {
      console.error('Migros automation error:', error);
      return false;
    }
  }

  async addToCoop(item) {
    try {
      console.log('Adding to Coop:', item.name);
      
      // This is a placeholder - we need the actual Coop HTML structure
      // Similar implementation for Coop with flexible selectors
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
