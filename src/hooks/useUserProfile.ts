import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  username: string | null;
  avatar_url: string | null;
  role: string | null;
  displayName: string;
  initials: string;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        // Fetch profile data without email exposure
        const { data, error } = await supabase
          .from('profiles')
          .select('username, avatar_url, role')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
          setProfile(null);
          return;
        }

        // Create safe display information
        const username = data?.username || user.user_metadata?.username;
        const displayName = username || 'User';
        const initials = displayName.charAt(0).toUpperCase();

        setProfile({
          username: data?.username || null,
          avatar_url: data?.avatar_url || null,
          role: data?.role || 'user',
          displayName,
          initials
        });
      } catch (error) {
        console.error('Error in useUserProfile:', error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  return { profile, loading };
};