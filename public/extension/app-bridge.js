
// Content script for the RunBiteFit web app
// This bridges communication between the web page and the extension

console.log('RunBiteFit Shopping Assistant: App bridge loaded');

// Listen for messages from the web page
window.addEventListener('message', (event) => {
  // Only accept messages from the same origin
  if (event.origin !== window.location.origin) return;
  
  if (event.data.source === 'runbitefit-app' && event.data.action === 'startAutomation') {
    console.log('App bridge received automation request:', event.data);
    
    // Forward the message to the background script
    chrome.runtime.sendMessage({
      action: 'startAutomation',
      site: event.data.site,
      items: event.data.items
    }, (response) => {
      // Send response back to the web page
      window.postMessage({
        source: 'runbitefit-extension',
        action: 'automationResponse',
        response: response
      }, window.location.origin);
    });
  }
});

// Inject a script to make chrome.runtime available to the web page
const script = document.createElement('script');
script.textContent = `
  // Make extension available to the web app
  window.runBiteFitExtension = {
    startAutomation: function(site, items) {
      window.postMessage({
        source: 'runbitefit-app',
        action: 'startAutomation',
        site: site,
        items: items
      }, window.location.origin);
    }
  };
  
  // Also expose a chrome-like API for compatibility
  if (!window.chrome) {
    window.chrome = {};
  }
  if (!window.chrome.runtime) {
    window.chrome.runtime = {
      sendMessage: function(message, callback) {
        window.postMessage({
          source: 'runbitefit-app',
          action: 'startAutomation',
          site: message.site,
          items: message.items
        }, window.location.origin);
        
        // Listen for response
        function responseListener(event) {
          if (event.data.source === 'runbitefit-extension' && event.data.action === 'automationResponse') {
            window.removeEventListener('message', responseListener);
            if (callback) callback(event.data.response);
          }
        }
        window.addEventListener('message', responseListener);
      }
    };
  }
`;
document.head.appendChild(script);
