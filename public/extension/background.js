
// Background script for the shopping assistant extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background script received message:', request);
  
  if (request.action === 'getShoppingList') {
    // Communicate with the RunBiteFit app to get shopping list
    fetch(request.apiUrl + '/api/shopping-list/export')
      .then(response => response.json())
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'startAutomation') {
    console.log('Starting automation for:', request.site, 'with items:', request.items);
    
    // More flexible URL patterns to handle redirects
    const sitePatterns = {
      migros: ['https://www.migros.ch/*', 'https://migros.ch/*'],
      coop: ['https://www.coop.ch/*', 'https://coop.ch/*']
    };
    
    const baseUrl = request.site === 'migros' 
      ? 'https://www.migros.ch' 
      : 'https://www.coop.ch';
    
    // Try to find existing tab with flexible pattern matching
    const patterns = sitePatterns[request.site];
    let foundTab = null;
    
    const checkExistingTabs = async () => {
      for (const pattern of patterns) {
        try {
          const tabs = await chrome.tabs.query({ url: pattern });
          if (tabs.length > 0) {
            foundTab = tabs[0];
            console.log('Found existing tab:', foundTab.url);
            break;
          }
        } catch (error) {
          console.log('Pattern failed:', pattern, error);
        }
      }
    };
    
    const sendAutomationMessage = (tabId, retryCount = 0) => {
      const maxRetries = 5;
      const retryDelay = 1000;
      
      console.log(`Attempting to send automation message to tab ${tabId}, retry ${retryCount}`);
      
      chrome.tabs.sendMessage(tabId, {
        action: 'startAutomation',
        items: request.items
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Message send failed:', chrome.runtime.lastError.message);
          
          if (retryCount < maxRetries) {
            console.log(`Retrying in ${retryDelay}ms...`);
            setTimeout(() => {
              sendAutomationMessage(tabId, retryCount + 1);
            }, retryDelay * (retryCount + 1)); // Exponential backoff
          } else {
            console.error('Max retries reached, giving up');
            sendResponse({ 
              error: 'Failed to connect to shopping site. Please make sure the page is fully loaded.' 
            });
          }
        } else {
          console.log('Automation message sent successfully:', response);
          sendResponse(response || { success: true });
        }
      });
    };
    
    checkExistingTabs().then(() => {
      if (foundTab) {
        // Use existing tab
        chrome.tabs.update(foundTab.id, { active: true }, () => {
          // Wait a bit for tab to become active
          setTimeout(() => {
            sendAutomationMessage(foundTab.id);
          }, 500);
        });
      } else {
        // Create new tab
        console.log('Creating new tab:', baseUrl);
        chrome.tabs.create({ url: baseUrl }, (tab) => {
          console.log('New tab created:', tab.id, tab.url);
          
          // Wait for the tab to load completely
          const listener = (tabId, changeInfo, updatedTab) => {
            if (tabId === tab.id && changeInfo.status === 'complete') {
              console.log('Tab loading complete:', updatedTab.url);
              chrome.tabs.onUpdated.removeListener(listener);
              
              // Give content script additional time to initialize
              setTimeout(() => {
                sendAutomationMessage(tab.id);
              }, 1500);
            }
          };
          
          chrome.tabs.onUpdated.addListener(listener);
          
          // Fallback timeout in case onUpdated doesn't fire
          setTimeout(() => {
            chrome.tabs.onUpdated.removeListener(listener);
            console.log('Fallback: attempting to send message after timeout');
            sendAutomationMessage(tab.id);
          }, 5000);
        });
      }
    });
    
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'updateProgress') {
    // Send progress updates to popup if it's open
    chrome.runtime.sendMessage({
      action: 'progressUpdate',
      progress: request.progress,
      message: request.message
    }).catch(() => {
      // Popup might not be open, that's fine
    });
  }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('RunBiteFit Shopping Assistant installed');
});
