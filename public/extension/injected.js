
(function() {
  console.log('Injecting RunBiteFit extension API on:', window.location.href);
  console.log('Chrome runtime available:', typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined');
  
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
  if (typeof chrome === 'undefined') {
    console.log('Creating chrome object since it does not exist');
    window.chrome = {};
  }
  if (!window.chrome.runtime) {
    console.log('Creating chrome.runtime object');
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
  } else {
    console.log('chrome.runtime already exists');
  }
  
  console.log('RunBiteFit extension API injected successfully');
  console.log('Final chrome object:', typeof chrome !== 'undefined' ? 'exists' : 'undefined');
  console.log('Final chrome.runtime:', typeof chrome !== 'undefined' && typeof chrome.runtime !== 'undefined' ? 'exists' : 'undefined');
  
  // Dispatch custom events to let the page know the extension is ready
  window.dispatchEvent(new CustomEvent('runBiteFitExtensionReady'));
  window.dispatchEvent(new CustomEvent('runBiteFitExtensionLoaded'));
  
  // Also set a flag on window for immediate detection
  window.__runBiteFitExtensionReady = true;
  
  console.log('Extension initialization complete - all APIs should be available now');
})();
