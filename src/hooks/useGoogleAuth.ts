import { useState, useEffect } from 'react';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture: string;
}

export const useGoogleAuth = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInstance, setAuthInstance] = useState<any>(null);

  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
  const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
  const SCOPES = 'https://www.googleapis.com/auth/drive.file';

  useEffect(() => {
    const initializeGapi = async () => {
      if (!CLIENT_ID || !API_KEY) {
        console.warn('Google API credentials not configured');
        setIsLoading(false);
        return;
      }

      try {
        // Load Google API script
        if (!window.gapi) {
          await loadGoogleScript();
        }

        await window.gapi.load('auth2', async () => {
          await window.gapi.auth2.init({
            client_id: CLIENT_ID,
          });

          const auth = window.gapi.auth2.getAuthInstance();
          setAuthInstance(auth);

          const isSignedIn = auth.isSignedIn.get();
          setIsSignedIn(isSignedIn);

          if (isSignedIn) {
            const googleUser = auth.currentUser.get();
            const profile = googleUser.getBasicProfile();
            setUser({
              id: profile.getId(),
              name: profile.getName(),
              email: profile.getEmail(),
              picture: profile.getImageUrl(),
            });
          }

          setIsLoading(false);
        });

        // Initialize Google API client
        await window.gapi.load('client', async () => {
          await window.gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: [DISCOVERY_DOC],
            scope: SCOPES,
          });
        });
      } catch (error) {
        console.error('Error initializing Google API:', error);
        setIsLoading(false);
      }
    };

    initializeGapi();
  }, [CLIENT_ID, API_KEY]);

  const loadGoogleScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const signIn = async () => {
    if (!authInstance) return;

    try {
      const googleUser = await authInstance.signIn();
      const profile = googleUser.getBasicProfile();
      
      setUser({
        id: profile.getId(),
        name: profile.getName(),
        email: profile.getEmail(),
        picture: profile.getImageUrl(),
      });
      setIsSignedIn(true);
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const signOut = async () => {
    if (!authInstance) return;

    try {
      await authInstance.signOut();
      setUser(null);
      setIsSignedIn(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    isSignedIn,
    user,
    isLoading,
    signIn,
    signOut,
    isConfigured: !!(CLIENT_ID && API_KEY),
  };
};