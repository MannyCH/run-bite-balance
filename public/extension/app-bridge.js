
// Content script for the RunBiteFit web app
// This bridges communication between the web page and the extension

console.log('RunBiteFit Shopping Assistant: App bridge loaded on:', window.location.href);
console.log('Extension manifest version check:', chrome.runtime.getManifest?.()?.version || 'undefined');

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

  // Inject the extension API script using a separate file to avoid CSP issues
  try {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    script.onload = function() {
      console.log('Extension API script injected successfully');
      this.remove();
    };
    script.onerror = function() {
      console.error('Failed to load extension API script');
      this.remove();
    };
    
    // Insert the script into the page
    const target = document.head || document.documentElement;
    if (target) {
      target.appendChild(script);
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
