
// Background script for the shopping assistant extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getShoppingList') {
    // Communicate with the RunBiteFit app to get shopping list
    fetch(request.apiUrl + '/api/shopping-list/export')
      .then(response => response.json())
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'updateProgress') {
    // Send progress updates to popup
    chrome.runtime.sendMessage({
      action: 'progressUpdate',
      progress: request.progress,
      message: request.message
    });
  }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('RunBiteFit Shopping Assistant installed');
});
