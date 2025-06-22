
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
    
    // Find or create a tab for the target site
    const siteUrl = request.site === 'migros' 
      ? 'https://www.migros.ch' 
      : 'https://www.coop.ch';
    
    chrome.tabs.query({ url: siteUrl + '/*' }, (tabs) => {
      if (tabs.length > 0) {
        // Use existing tab
        const tab = tabs[0];
        chrome.tabs.update(tab.id, { active: true }, () => {
          // Send automation message to the content script
          chrome.tabs.sendMessage(tab.id, {
            action: 'startAutomation',
            items: request.items
          }, (response) => {
            sendResponse(response);
          });
        });
      } else {
        // Create new tab
        chrome.tabs.create({ url: siteUrl }, (tab) => {
          // Wait for the tab to load before sending the message
          chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === tab.id && info.status === 'complete') {
              chrome.tabs.onUpdated.removeListener(listener);
              chrome.tabs.sendMessage(tab.id, {
                action: 'startAutomation',
                items: request.items
              }, (response) => {
                sendResponse(response);
              });
            }
          });
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
