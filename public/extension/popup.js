
// Popup script for the shopping assistant
class PopupController {
  constructor() {
    this.init();
  }

  init() {
    document.getElementById('addToMigros').addEventListener('click', () => {
      this.startAutomation('migros');
    });
    
    document.getElementById('addToCoop').addEventListener('click', () => {
      this.startAutomation('coop');
    });

    // Listen for progress updates
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'progressUpdate') {
        this.updateProgress(message.progress, message.message);
      }
    });
  }

  async startAutomation(site) {
    try {
      this.showProgress();
      this.updateProgress(0, 'Getting shopping list...');

      // Get shopping list from the app
      const shoppingList = await this.getShoppingList();
      
      if (!shoppingList || shoppingList.length === 0) {
        this.showError('No items in shopping list');
        return;
      }

      // Check if we're on the correct site
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentSite = this.detectSiteFromUrl(activeTab.url);
      
      if (currentSite !== site) {
        // Open the correct site
        const siteUrl = site === 'migros' 
          ? 'https://www.migros.ch' 
          : 'https://www.coop.ch';
        
        await chrome.tabs.create({ url: siteUrl });
        this.showError(`Please visit ${site.charAt(0).toUpperCase() + site.slice(1)} and try again`);
        return;
      }

      // Start automation
      this.updateProgress(10, 'Starting automation...');
      
      chrome.tabs.sendMessage(activeTab.id, {
        action: 'startAutomation',
        items: shoppingList
      }, (response) => {
        if (response && response.error) {
          this.showError(response.error);
        } else if (response) {
          this.showResults(response);
        }
      });

    } catch (error) {
      this.showError(error.message);
    }
  }

  async getShoppingList() {
    return new Promise((resolve) => {
      // Try to get the current app URL
      const appUrl = 'https://your-app.lovable.app'; // This will be dynamically determined
      
      chrome.runtime.sendMessage({
        action: 'getShoppingList',
        apiUrl: appUrl
      }, (response) => {
        if (response && response.success) {
          resolve(response.data);
        } else {
          resolve([]);
        }
      });
    });
  }

  detectSiteFromUrl(url) {
    if (url.includes('migros')) return 'migros';
    if (url.includes('coop')) return 'coop';
    return null;
  }

  showProgress() {
    document.getElementById('progressContainer').style.display = 'block';
    document.querySelectorAll('.button').forEach(btn => btn.disabled = true);
  }

  updateProgress(percentage, message) {
    document.getElementById('progressFill').style.width = percentage + '%';
    document.getElementById('statusText').textContent = message;
  }

  showResults(results) {
    const resultsDiv = document.getElementById('results');
    let html = '';
    
    if (results.success && results.success.length > 0) {
      html += `<div class="success">✓ Added ${results.success.length} items successfully</div>`;
    }
    
    if (results.failed && results.failed.length > 0) {
      html += `<div class="error">✗ Failed to add ${results.failed.length} items</div>`;
    }
    
    resultsDiv.innerHTML = html;
    this.hideProgress();
  }

  showError(message) {
    document.getElementById('results').innerHTML = `<div class="error">Error: ${message}</div>`;
    this.hideProgress();
  }

  hideProgress() {
    document.getElementById('progressContainer').style.display = 'none';
    document.querySelectorAll('.button').forEach(btn => btn.disabled = false);
  }
}

// Initialize popup when loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
