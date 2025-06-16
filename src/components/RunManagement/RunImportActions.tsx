
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Route, RefreshCw, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/context/ProfileContext";

interface RunImportActionsProps {
  onImportRuns: (url: string) => Promise<void>;
  isLoading: boolean;
}

export const RunImportActions: React.FC<RunImportActionsProps> = ({ 
  onImportRuns, 
  isLoading 
}) => {
  const [customUrl, setCustomUrl] = useState("");
  const [isImportingCustom, setIsImportingCustom] = useState(false);
  const { profile } = useProfile();
  const { toast } = useToast();

  const handleRefreshProfileRuns = async () => {
    if (!profile?.ical_feed_url) {
      toast({
        title: "No iCal URL",
        description: "Please add an iCal feed URL in your profile settings first.",
        variant: "destructive",
      });
      return;
    }

    try {
      await onImportRuns(profile.ical_feed_url);
      toast({
        title: "Runs Refreshed",
        description: "Your running calendar has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to refresh runs from your profile iCal URL.",
        variant: "destructive",
      });
    }
  };

  const handleImportCustomUrl = async () => {
    if (!customUrl.trim()) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid iCal URL.",
        variant: "destructive",
      });
      return;
    }

    setIsImportingCustom(true);
    try {
      await onImportRuns(customUrl);
      setCustomUrl("");
      toast({
        title: "Runs Imported",
        description: "Runs have been imported from the custom URL successfully.",
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import runs from the provided URL.",
        variant: "destructive",
      });
    } finally {
      setIsImportingCustom(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="h-5 w-5" />
          Import Runs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {profile?.ical_feed_url && (
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Refresh runs from your profile iCal URL
            </p>
            <Button 
              onClick={handleRefreshProfileRuns}
              disabled={isLoading}
              className="w-full"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? "Refreshing..." : "Refresh Profile Runs"}
            </Button>
          </div>
        )}
        
        <div>
          <p className="text-sm text-gray-600 mb-2">
            Import from a custom iCal URL
          </p>
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://example.com/calendar.ics"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleImportCustomUrl}
              disabled={isImportingCustom || !customUrl.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Import
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
