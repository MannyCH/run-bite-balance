
// Background script for the shopping assistant extension
let activeAutomations = new Map(); // Track active automations to prevent duplicates

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
    
    // Prevent duplicate automations for the same site
    const automationKey = `${request.site}-${Date.now()}`;
    if (activeAutomations.has(request.site)) {
      console.log('Automation already in progress for', request.site);
      sendResponse({ error: 'Automation already in progress for this site' });
      return;
    }

    activeAutomations.set(request.site, automationKey);
    
    // Clean up after 30 seconds
    setTimeout(() => {
      activeAutomations.delete(request.site);
    }, 30000);
    
    const baseUrl = request.site === 'migros' 
      ? 'https://www.migros.ch' 
      : 'https://www.coop.ch';
    
    const urlPattern = request.site === 'migros' 
      ? '*://www.migros.ch/*' 
      : '*://www.coop.ch/*';
    
    console.log('Looking for existing tab with pattern:', urlPattern);
    
    // Find existing tab with improved logic
    chrome.tabs.query({ url: urlPattern }, (tabs) => {
      console.log(`Found ${tabs.length} existing tabs`);
      
      // Filter for active/loaded tabs
      const activeTabs = tabs.filter(tab => tab.status === 'complete' && !tab.discarded);
      console.log(`Found ${activeTabs.length} active tabs`);
      
      if (activeTabs.length > 0) {
        // Use the most recent active tab
        const existingTab = activeTabs[0];
        console.log('Using existing tab:', existingTab.id, existingTab.url);
        
        chrome.tabs.update(existingTab.id, { active: true }, () => {
          console.log('Tab activated, sending automation message');
          setTimeout(() => {
            sendAutomationMessage(existingTab.id);
          }, 1000);
        });
      } else {
        // Create new tab only if no active tabs exist
        console.log('No active tab found, creating new one:', baseUrl);
        chrome.tabs.create({ url: baseUrl }, (tab) => {
          console.log('New tab created:', tab.id, tab.url);
          
          // Wait for the tab to load completely
          const listener = (tabId, changeInfo, updatedTab) => {
            if (tabId === tab.id && changeInfo.status === 'complete') {
              console.log('Tab loading complete:', updatedTab.url);
              chrome.tabs.onUpdated.removeListener(listener);
              
              setTimeout(() => {
                sendAutomationMessage(tab.id);
              }, 2000);
            }
          };
          
          chrome.tabs.onUpdated.addListener(listener);
          
          // Fallback timeout
          setTimeout(() => {
            chrome.tabs.onUpdated.removeListener(listener);
            console.log('Fallback: attempting to send message after timeout');
            sendAutomationMessage(tab.id);
          }, 8000);
        });
      }
    });
    
    const sendAutomationMessage = (tabId, retryCount = 0) => {
      const maxRetries = 3;
      const retryDelay = 2000;
      
      console.log(`Sending automation message to tab ${tabId}, attempt ${retryCount + 1}`);
      
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
            }, retryDelay);
          } else {
            console.error('Max retries reached');
            activeAutomations.delete(request.site); // Clean up
            sendResponse({ 
              error: 'Failed to connect to shopping site. Please refresh the page and try again.' 
            });
          }
        } else {
          console.log('Automation message sent successfully:', response);
          activeAutomations.delete(request.site); // Clean up on success
          sendResponse(response || { success: true });
        }
      });
    };
    
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
