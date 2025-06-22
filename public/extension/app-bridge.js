
// Content script for the RunBiteFit web app
// This bridges communication between the web page and the extension

console.log('RunBiteFit Shopping Assistant: App bridge loaded');

// Wait for the page to be fully loaded
function initializeExtensionBridge() {
  console.log('Initializing extension bridge...');

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
        console.log('Background script response:', response);
        // Send response back to the web page
        window.postMessage({
          source: 'runbitefit-extension',
          action: 'automationResponse',
          response: response
        }, window.location.origin);
      });
    }
  });

  // Inject a script to make the extension API available to the web page
  const script = document.createElement('script');
  script.textContent = `
    (function() {
      console.log('Injecting RunBiteFit extension API...');
      
      // Make extension available to the web app
      window.runBiteFitExtension = {
        startAutomation: function(site, items) {
          console.log('runBiteFitExtension.startAutomation called:', site, items);
          window.postMessage({
            source: 'runbitefit-app',
            action: 'startAutomation',
            site: site,
            items: items
          }, window.location.origin);
          
          return new Promise((resolve) => {
            function responseListener(event) {
              if (event.data.source === 'runbitefit-extension' && event.data.action === 'automationResponse') {
                window.removeEventListener('message', responseListener);
                resolve(event.data.response);
              }
            }
            window.addEventListener('message', responseListener);
          });
        }
      };
      
      // Also expose a chrome-like API for compatibility
      if (!window.chrome) {
        window.chrome = {};
      }
      if (!window.chrome.runtime) {
        window.chrome.runtime = {
          sendMessage: function(message, callback) {
            console.log('chrome.runtime.sendMessage called:', message);
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
      
      console.log('RunBiteFit extension API injected successfully');
      
      // Dispatch a custom event to let the page know the extension is ready
      window.dispatchEvent(new CustomEvent('runBiteFitExtensionReady'));
    })();
  `;
  
  // Insert the script into the page
  (document.head || document.documentElement).appendChild(script);
  script.remove();
  
  console.log('Extension bridge initialization complete');
}

// Initialize when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtensionBridge);
} else {
  initializeExtensionBridge();
}
