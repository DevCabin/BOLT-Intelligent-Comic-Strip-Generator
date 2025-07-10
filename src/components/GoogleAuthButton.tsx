import React from 'react';
import { LogIn, LogOut, Cloud } from 'lucide-react';
import { useGoogleAuth } from '../hooks/useGoogleAuth';

export default function GoogleAuthButton() {
  const { isSignedIn, user, isLoading, signIn, signOut, isConfigured } = useGoogleAuth();

  if (!isConfigured) {
    return (
      <div className="flex items-center gap-2">
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Cloud size={12} />
          Local storage only
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
        Loading...
      </div>
    );
  }

  if (isSignedIn && user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <img
            src={user.picture}
            alt={user.name}
            className="w-6 h-6 rounded-full"
          />
          <span className="text-gray-300">{user.name}</span>
        </div>
        <button
          onClick={signOut}
          className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded-lg flex items-center gap-2 transition-colors text-sm"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={signIn}
      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
    >
      <LogIn size={16} />
      Sign in with Google
    </button>
  );
}