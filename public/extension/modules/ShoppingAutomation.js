
// Main ShoppingAutomation class - orchestrates the automation process
import { QuantityParser } from './QuantityParser.js';
import { MigrosAutomation } from './MigrosAutomation.js';

export class ShoppingAutomation {
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
      
      // Create instances
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
