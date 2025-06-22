
// Content script for the RunBiteFit web app
// This bridges communication between the web page and the extension

console.log('RunBiteFit Shopping Assistant: App bridge loaded on:', window.location.href);

// Initialize the extension bridge with retry mechanism
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

  // Inject the extension API script with better error handling
  try {
    const script = document.createElement('script');
    script.textContent = `
      (function() {
        console.log('Injecting RunBiteFit extension API on:', window.location.href);
        
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
        
        // Dispatch custom events to let the page know the extension is ready
        window.dispatchEvent(new CustomEvent('runBiteFitExtensionReady'));
        window.dispatchEvent(new CustomEvent('runBiteFitExtensionLoaded'));
        
        // Also set a flag on window for immediate detection
        window.__runBiteFitExtensionReady = true;
      })();
    `;
    
    // Insert the script into the page
    const target = document.head || document.documentElement;
    if (target) {
      target.appendChild(script);
      script.remove();
      console.log('Extension API script injected successfully');
    } else {
      console.error('Could not find head or documentElement to inject script');
    }
  } catch (error) {
    console.error('Error injecting extension API script:', error);
  }
  
  console.log('Extension bridge initialization complete');
}

// Initialize with multiple strategies
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtensionBridge);
  // Also try after a short delay in case DOMContentLoaded already fired
  setTimeout(initializeExtensionBridge, 100);
} else {
  initializeExtensionBridge();
}

// Also initialize after page load as a fallback
window.addEventListener('load', initializeExtensionBridge);
