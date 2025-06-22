
// Content script for Migros and Coop automation
console.log('Content script loading on:', window.location.href);

class ShoppingAutomation {
  constructor() {
    this.currentSite = this.detectSite();
    this.progress = 0;
    this.totalItems = 0;
    this.isReady = false;
    this.quantityParser = null;
    this.migrosAutomation = null;
    
    console.log('ShoppingAutomation initialized for site:', this.currentSite);
    this.initializeWhenReady();
  }

  async initializeWhenReady() {
    console.log('Starting initialization...');
    
    // Wait for DOM to be ready
    if (document.readyState !== 'complete') {
      console.log('Waiting for DOM to be ready...');
      await new Promise(resolve => {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', resolve);
        } else {
          window.addEventListener('load', resolve);
        }
      });
    }
    
    console.log('DOM ready, loading scripts...');
    
    // Load scripts sequentially to ensure proper dependency order
    try {
      await this.loadScript('quantity-parser.js');
      console.log('QuantityParser script loaded');
      
      await this.loadScript('migros-automation.js');
      console.log('MigrosAutomation script loaded');
      
      // Wait for modules to be available
      await this.waitForModules();
      
      // Initialize modules
      this.quantityParser = new window.QuantityParser();
      this.migrosAutomation = new window.MigrosAutomation();
      
      console.log('All modules initialized successfully');
      
    } catch (error) {
      console.error('Failed to load scripts:', error);
      return;
    }
    
    // Give additional time for any dynamic content to load
    setTimeout(() => {
      this.isReady = true;
      console.log('ShoppingAutomation ready');
    }, 1000);
  }

  loadScript(filename) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL(filename);
      script.onload = () => {
        console.log(`Script loaded: ${filename}`);
        resolve();
      };
      script.onerror = (error) => {
        console.error(`Failed to load script: ${filename}`, error);
        reject(error);
      };
      document.head.appendChild(script);
    });
  }

  async waitForModules() {
    console.log('Waiting for modules to be available...');
    let retries = 0;
    const maxRetries = 20;
    const retryDelay = 250;
    
    while (retries < maxRetries) {
      if (window.QuantityParser && window.MigrosAutomation) {
        console.log('All modules are available');
        return;
      }
      
      console.log(`Modules not ready yet, retry ${retries + 1}/${maxRetries}`);
      console.log('QuantityParser available:', !!window.QuantityParser);
      console.log('MigrosAutomation available:', !!window.MigrosAutomation);
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      retries++;
    }
    
    throw new Error('Modules failed to load after maximum retries');
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
      console.log('Automation not ready yet, waiting...');
      let waitRetries = 0;
      const maxWaitRetries = 20;
      
      while (!this.isReady && waitRetries < maxWaitRetries) {
        await new Promise(resolve => setTimeout(resolve, 500));
        waitRetries++;
        console.log(`Waiting for automation to be ready... ${waitRetries}/${maxWaitRetries}`);
      }
      
      if (!this.isReady) {
        console.error('Automation failed to become ready');
        return { success: [], failed: items };
      }
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
