// Enhanced Migros automation with quantity handling
class MigrosAutomation {
  constructor(quantityParser = null) {
    this.quantityParser = quantityParser;
    
    if (!this.quantityParser) {
      console.warn('MigrosAutomation initialized without QuantityParser dependency');
      // Create a fallback instance if none provided
      if (window.QuantityParser) {
        this.quantityParser = new window.QuantityParser();
        console.log('Created fallback QuantityParser instance');
      } else {
        console.error('QuantityParser not available for fallback');
      }
    }
    
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

      // Get product description for weight detection
      const productDescription = firstProduct.textContent || '';
      console.log('Product description:', productDescription);

      let targetQuantity = 1; // Default fallback

      // Only use quantity parsing if QuantityParser is available
      if (this.quantityParser) {
        try {
          // Parse the quantity and determine if we need weight calculation
          const shouldUseWeight = this.quantityParser.shouldUseWeightCalculation(item.name, productDescription);
          const parsedQuantity = this.quantityParser.parseQuantity(item.quantity);
          
          console.log('Parsed quantity:', parsedQuantity);
          console.log('Should use weight calculation:', shouldUseWeight);

          if (shouldUseWeight) {
            const weightEstimate = this.quantityParser.estimateWeight(item.name, item.quantity);
            if (weightEstimate) {
              console.log('Weight estimate:', weightEstimate);
              // For weight-based items, try to get close to the estimated weight
              // Migros usually sells in ranges, so we'll use pieces as approximation
              targetQuantity = Math.max(1, Math.round(weightEstimate.pieces));
            }
          } else {
            // For non-weight items, use the parsed amount directly
            targetQuantity = Math.max(1, Math.round(parsedQuantity.amount));
          }
        } catch (quantityError) {
          console.warn('Error parsing quantity, using default:', quantityError);
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

// Export for use in content script
window.MigrosAutomation = MigrosAutomation;
