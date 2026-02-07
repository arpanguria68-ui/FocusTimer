import React, { createContext, useContext, useState, useEffect } from 'react';

interface PreviewModeContextType {
  isPreviewMode: boolean;
  previewUser: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    plan: 'free' | 'premium';
    joinedDate: string;
  };
  togglePreviewMode: () => void;
  setPreviewPlan: (plan: 'free' | 'premium') => void;
}

const PreviewModeContext = createContext<PreviewModeContextType | undefined>(undefined);

export const usePreviewMode = () => {
  const context = useContext(PreviewModeContext);
  if (!context) {
    throw new Error('usePreviewMode must be used within PreviewModeProvider');
  }
  return context;
};

interface PreviewModeProviderProps {
  children: React.ReactNode;
}

export const PreviewModeProvider: React.FC<PreviewModeProviderProps> = ({ children }) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewPlan, setPreviewPlan] = useState<'free' | 'premium'>('free');

  // Check for preview mode from URL params or localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const previewParam = urlParams.get('preview');
    const storedPreviewMode = localStorage.getItem('focusTimer_previewMode');
    
    if (previewParam === 'true' || storedPreviewMode === 'true') {
      setIsPreviewMode(true);
    }

    const storedPlan = localStorage.getItem('focusTimer_previewPlan') as 'free' | 'premium';
    if (storedPlan) {
      setPreviewPlan(storedPlan);
    }
  }, []);

  const previewUser = {
    id: 'preview-user-123',
    email: 'demo@focustimer.app',
    name: 'Demo User',
    avatar: '🎯',
    plan: previewPlan,
    joinedDate: new Date().toISOString()
  };

  const togglePreviewMode = () => {
    const newMode = !isPreviewMode;
    setIsPreviewMode(newMode);
    localStorage.setItem('focusTimer_previewMode', newMode.toString());
    
    // Update URL without page reload
    const url = new URL(window.location.href);
    if (newMode) {
      url.searchParams.set('preview', 'true');
    } else {
      url.searchParams.delete('preview');
    }
    window.history.replaceState({}, '', url.toString());
  };

  const handleSetPreviewPlan = (plan: 'free' | 'premium') => {
    setPreviewPlan(plan);
    localStorage.setItem('focusTimer_previewPlan', plan);
  };

  return (
    <PreviewModeContext.Provider
      value={{
        isPreviewMode,
        previewUser,
        togglePreviewMode,
        setPreviewPlan: handleSetPreviewPlan
      }}
    >
      {children}
    </PreviewModeContext.Provider>
  );
};

// Preview Mode Banner Component
export const PreviewModeBanner: React.FC = () => {
  const { isPreviewMode, previewUser, togglePreviewMode, setPreviewPlan } = usePreviewMode();

  if (!isPreviewMode) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 z-50 shadow-lg">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <span className="font-semibold">🎯 Preview Mode</span>
          <span className="text-sm opacity-90">
            Testing as: {previewUser.name} ({previewUser.plan})
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => setPreviewPlan('free')}
              className={`px-3 py-1 rounded text-xs ${
                previewUser.plan === 'free' 
                  ? 'bg-white text-purple-600' 
                  : 'bg-purple-500 hover:bg-purple-400'
              }`}
            >
              Free Plan
            </button>
            <button
              onClick={() => setPreviewPlan('premium')}
              className={`px-3 py-1 rounded text-xs ${
                previewUser.plan === 'premium' 
                  ? 'bg-white text-purple-600' 
                  : 'bg-purple-500 hover:bg-purple-400'
              }`}
            >
              Premium Plan
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm opacity-90">
            All features available for testing
          </span>
          <button
            onClick={togglePreviewMode}
            className="bg-white text-purple-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100"
          >
            Exit Preview
          </button>
        </div>
      </div>
    </div>
  );
};