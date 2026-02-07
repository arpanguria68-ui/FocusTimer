import React from 'react';
import { usePreviewMode } from './PreviewMode';

export const PreviewLandingPage: React.FC = () => {
  const { togglePreviewMode, setPreviewPlan } = usePreviewMode();

  const features = [
    {
      icon: '⏱️',
      title: 'Pomodoro Timer',
      description: 'Customizable focus sessions with break reminders'
    },
    {
      icon: '✅',
      title: 'Task Management',
      description: 'Organize and track your daily tasks efficiently'
    },
    {
      icon: '🎯',
      title: 'Goal Tracking',
      description: 'Set and achieve your productivity goals'
    },
    {
      icon: '📊',
      title: 'Analytics',
      description: 'Detailed insights into your productivity patterns'
    },
    {
      icon: '💭',
      title: 'Inspirational Quotes',
      description: 'Stay motivated with curated quotes'
    },
    {
      icon: '🤖',
      title: 'AI Assistant',
      description: 'Get personalized productivity advice'
    }
  ];

  const handleStartPreview = (plan: 'free' | 'premium') => {
    setPreviewPlan(plan);
    togglePreviewMode();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="mb-8">
              <span className="text-6xl mb-4 block">🎯</span>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Focus Timer
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Boost your productivity with the ultimate focus and task management app. 
                Try it now with our interactive preview!
              </p>
            </div>

            {/* Preview CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={() => handleStartPreview('free')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                🚀 Try Free Version
              </button>
              <button
                onClick={() => handleStartPreview('premium')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                ✨ Try Premium Version
              </button>
            </div>

            <div className="text-sm text-gray-500 mb-8">
              No signup required • Full functionality • Instant access
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Everything you need to stay focused
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Preview Benefits */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why try our preview?
            </h2>
            <p className="text-xl text-gray-600">
              Experience the full power of Focus Timer before you commit
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎮</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Interactive Demo</h3>
              <p className="text-gray-600">
                All features work exactly like the real app. Create tasks, run timers, track goals.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Access</h3>
              <p className="text-gray-600">
                No forms, no emails, no waiting. Start exploring immediately.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔄</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Compare Plans</h3>
              <p className="text-gray-600">
                Switch between Free and Premium to see what works best for you.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Trusted by productive people worldwide
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="text-yellow-400 text-2xl mb-4">⭐⭐⭐⭐⭐</div>
                <p className="text-gray-600 mb-4">
                  "Focus Timer completely transformed my productivity. The preview convinced me instantly!"
                </p>
                <div className="font-semibold text-gray-900">Sarah Chen</div>
                <div className="text-sm text-gray-500">Product Manager</div>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="text-yellow-400 text-2xl mb-4">⭐⭐⭐⭐⭐</div>
                <p className="text-gray-600 mb-4">
                  "The interactive demo showed me exactly what I needed. No surprises, just results."
                </p>
                <div className="font-semibold text-gray-900">Marcus Rodriguez</div>
                <div className="text-sm text-gray-500">Software Developer</div>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="text-yellow-400 text-2xl mb-4">⭐⭐⭐⭐⭐</div>
                <p className="text-gray-600 mb-4">
                  "Being able to test everything first made my decision easy. Highly recommend trying it!"
                </p>
                <div className="font-semibold text-gray-900">Emily Watson</div>
                <div className="text-sm text-gray-500">Freelance Designer</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to boost your productivity?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Try Focus Timer now and see the difference it makes
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => handleStartPreview('free')}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all duration-200"
            >
              Start Free Preview
            </button>
            <button
              onClick={() => handleStartPreview('premium')}
              className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-yellow-300 transform hover:scale-105 transition-all duration-200"
            >
              Try Premium Preview
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2024 Focus Timer. Made with ❤️ for productive people.
          </p>
        </div>
      </div>
    </div>
  );
};