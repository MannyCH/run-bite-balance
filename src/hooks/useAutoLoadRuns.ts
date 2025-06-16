
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';

export const useAutoLoadRuns = () => {
  const { user } = useAuth();
  const { importRunsFromIcal, isLoadingImportedRuns } = useApp();

  useEffect(() => {
    const loadRunsFromProfile = async () => {
      if (!user?.id || isLoadingImportedRuns) return;

      try {
        console.log('useAutoLoadRuns: Fetching user profile for iCal URL...');
        
        // Fetch user profile to get iCal feed URL
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('ical_feed_url')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('useAutoLoadRuns: Error fetching profile:', error);
          return;
        }

        if (profile?.ical_feed_url) {
          console.log('useAutoLoadRuns: Found iCal URL, importing runs...');
          await importRunsFromIcal(profile.ical_feed_url);
          console.log('useAutoLoadRuns: Successfully loaded runs from profile iCal URL');
        } else {
          console.log('useAutoLoadRuns: No iCal URL found in user profile');
        }
      } catch (error) {
        console.error('useAutoLoadRuns: Error loading runs from profile:', error);
      }
    };

    loadRunsFromProfile();
  }, [user?.id, importRunsFromIcal, isLoadingImportedRuns]);
};
