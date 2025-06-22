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
    this.initializationAttempts = 0;
    this.maxInitializationAttempts = 3;
    
    console.log('ShoppingAutomation initialized for site:', this.currentSite);
    this.initializeWhenReady();
  }

  async initializeWhenReady() {
    console.log('Starting initialization attempt:', this.initializationAttempts + 1);
    this.initializationAttempts++;
    
    try {
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
      
      console.log('DOM ready, loading scripts sequentially...');
      
      // Load scripts sequentially to ensure proper dependency order
      await this.loadScript('quantity-parser.js');
      console.log('QuantityParser script loaded');
      
      // Wait for QuantityParser to be available
      await this.waitForModule('QuantityParser', 'QuantityParser class');
      
      await this.loadScript('migros-automation.js');
      console.log('MigrosAutomation script loaded');
      
      // Wait for MigrosAutomation to be available
      await this.waitForModule('MigrosAutomation', 'MigrosAutomation class');
      
      // Initialize modules with proper dependency injection
      console.log('Initializing QuantityParser...');
      this.quantityParser = new window.QuantityParser();
      console.log('QuantityParser initialized successfully:', !!this.quantityParser);
      
      console.log('Initializing MigrosAutomation with QuantityParser dependency...');
      this.migrosAutomation = new window.MigrosAutomation(this.quantityParser);
      console.log('MigrosAutomation initialized successfully:', !!this.migrosAutomation);
      
      // Validate that all required methods are available
      const isValid = this.validateModules();
      if (!isValid) {
        throw new Error('Module validation failed');
      }
      
      console.log('All modules initialized and validated successfully');
      
      // Give additional time for any dynamic content to load
      setTimeout(() => {
        this.isReady = true;
        console.log('ShoppingAutomation ready for use');
      }, 1000);
      
    } catch (error) {
      console.error('Initialization failed:', error);
      
      if (this.initializationAttempts < this.maxInitializationAttempts) {
        console.log(`Retrying initialization in 2 seconds... (attempt ${this.initializationAttempts + 1}/${this.maxInitializationAttempts})`);
        setTimeout(() => {
          this.initializeWhenReady();
        }, 2000);
      } else {
        console.error('Maximum initialization attempts reached. Automation will not be available.');
      }
    }
  }

  loadScript(filename) {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      if (document.querySelector(`script[src*="${filename}"]`)) {
        console.log(`Script ${filename} already loaded`);
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL(filename);
      script.onload = () => {
        console.log(`Script loaded successfully: ${filename}`);
        resolve();
      };
      script.onerror = (error) => {
        console.error(`Failed to load script: ${filename}`, error);
        reject(new Error(`Failed to load ${filename}`));
      };
      document.head.appendChild(script);
    });
  }

  async waitForModule(moduleName, description) {
    console.log(`Waiting for ${description} to be available...`);
    let retries = 0;
    const maxRetries = 30;
    const retryDelay = 200;
    
    while (retries < maxRetries) {
      if (window[moduleName] && typeof window[moduleName] === 'function') {
        console.log(`${description} is now available`);
        return;
      }
      
      if (retries % 5 === 0) {
        console.log(`${description} not ready yet, retry ${retries + 1}/${maxRetries}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      retries++;
    }
    
    throw new Error(`${description} failed to load after ${maxRetries} retries`);
  }

  validateModules() {
    console.log('Validating modules...');
    
    // Check QuantityParser
    if (!this.quantityParser) {
      console.error('QuantityParser is not initialized');
      return false;
    }
    
    if (typeof this.quantityParser.parseQuantity !== 'function') {
      console.error('QuantityParser.parseQuantity method is not available');
      return false;
    }
    
    // Check MigrosAutomation
    if (!this.migrosAutomation) {
      console.error('MigrosAutomation is not initialized');
      return false;
    }
    
    if (typeof this.migrosAutomation.addToMigros !== 'function') {
      console.error('MigrosAutomation.addToMigros method is not available');
      return false;
    }
    
    console.log('All modules validated successfully');
    return true;
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
      const maxWaitRetries = 30;
      
      while (!this.isReady && waitRetries < maxWaitRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        waitRetries++;
        console.log(`Waiting for automation to be ready... ${waitRetries}/${maxWaitRetries}`);
      }
      
      if (!this.isReady) {
        console.error('Automation failed to become ready after waiting');
        return { 
          success: [], 
          failed: items,
          error: 'Automation modules failed to initialize. Please refresh the page and try again.'
        };
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
