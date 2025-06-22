import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ExternalLink, Download, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { formatShoppingListForExport } from "@/api/shoppingListApi";
import { ShoppingList } from "@/types/shoppingList";

interface AutomationButtonsProps {
  shoppingList: ShoppingList;
}

// Type declaration for extension API
declare global {
  interface Window {
    runBiteFitExtension?: {
      startAutomation: (site: string, items: any[]) => void;
    };
    chrome?: {
      runtime?: {
        sendMessage: (message: any, callback?: (response: any) => void) => void;
      };
    };
  }
}

export const AutomationButtons: React.FC<AutomationButtonsProps> = ({ shoppingList }) => {
  const [showExtensionAlert, setShowExtensionAlert] = useState(false);
  const [extensionAvailable, setExtensionAvailable] = useState(false);

  const uncompletedItems = shoppingList.filter(item => !item.isBought);

  // Check for extension availability
  useEffect(() => {
    const checkExtension = () => {
      // Check for our custom extension API
      const hasExtension = typeof window !== 'undefined' && 
        (window.runBiteFitExtension || window.chrome?.runtime);
      
      console.log('Extension check:', {
        runBiteFitExtension: !!window.runBiteFitExtension,
        chromeRuntime: !!window.chrome?.runtime,
        hasExtension
      });
      
      setExtensionAvailable(hasExtension);
    };

    // Check immediately
    checkExtension();

    // Also check after a short delay to allow the content script to load
    const timer = setTimeout(checkExtension, 2000);

    // Listen for extension ready event
    const handleExtensionReady = () => {
      console.log('Extension ready event received');
      checkExtension();
    };

    window.addEventListener('runBiteFitExtensionReady', handleExtensionReady);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('runBiteFitExtensionReady', handleExtensionReady);
    };
  }, []);

  const handleAutomatedShopping = (site: 'migros' | 'coop') => {
    const exportData = formatShoppingListForExport(shoppingList);
    console.log('Starting automation for:', site, 'with items:', exportData);

    if (extensionAvailable && window.runBiteFitExtension) {
      // Use our custom extension API
      console.log('Using runBiteFitExtension API');
      window.runBiteFitExtension.startAutomation(site, exportData);
      toast.success(`Starting automated shopping on ${site.charAt(0).toUpperCase() + site.slice(1)}`);
    } else if (extensionAvailable && window.chrome?.runtime) {
      // Fallback to chrome.runtime API
      console.log('Using chrome.runtime API');
      window.chrome.runtime.sendMessage({
        action: 'startAutomation',
        site: site,
        items: exportData
      }, (response) => {
        console.log('Extension response:', response);
        if (response?.error) {
          toast.error(`Automation failed: ${response.error}`);
        } else {
          toast.success(`Starting automated shopping on ${site.charAt(0).toUpperCase() + site.slice(1)}`);
        }
      });
    } else {
      // Extension not available, show installation instructions
      console.log('Extension not available, showing alert');
      setShowExtensionAlert(true);
    }
  };

  const handleManualExport = (site: 'migros' | 'coop') => {
    const exportData = formatShoppingListForExport(shoppingList);
    const exportText = exportData.map(item => `${item.quantity} ${item.name}`).join('\n');
    
    navigator.clipboard.writeText(exportText).then(() => {
      toast.success(`Shopping list copied to clipboard for ${site.charAt(0).toUpperCase() + site.slice(1)}`);
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });

    // Open the site
    const siteUrl = site === 'migros' ? 'https://www.migros.ch' : 'https://www.coop.ch';
    window.open(siteUrl, '_blank');
  };

  const downloadExtension = () => {
    // Create a zip file with extension files or provide download link
    toast.info('Extension download will be available soon. Use manual export for now.');
  };

  if (uncompletedItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Debug info for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
          Extension Status: {extensionAvailable ? 'Available' : 'Not Available'} | 
          runBiteFitExtension: {window.runBiteFitExtension ? 'Yes' : 'No'} | 
          chrome.runtime: {window.chrome?.runtime ? 'Yes' : 'No'}
        </div>
      )}

      {showExtensionAlert && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="space-y-2">
              <p>Install our browser extension for automated shopping:</p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={downloadExtension}
                  className="text-blue-700 border-blue-300"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Install Extension
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setShowExtensionAlert(false)}
                  className="text-blue-700"
                >
                  Use Manual Export
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleAutomatedShopping('migros')}
            className="bg-orange-600 hover:bg-orange-700 text-white"
            disabled={!extensionAvailable}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Auto-add to Migros
            <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800">
              {uncompletedItems.length}
            </Badge>
          </Button>

          <Button
            onClick={() => handleAutomatedShopping('coop')}
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={!extensionAvailable}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Auto-add to Coop
            <Badge variant="secondary" className="ml-2 bg-red-100 text-red-800">
              {uncompletedItems.length}
            </Badge>
          </Button>
        </div>

        <div className="flex items-center gap-1 text-sm text-gray-500">
          <span>or</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleManualExport('migros')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Export to Migros
          </Button>

          <Button
            variant="outline"
            onClick={() => handleManualExport('coop')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Export to Coop
          </Button>
        </div>
      </div>
    </div>
  );
};
