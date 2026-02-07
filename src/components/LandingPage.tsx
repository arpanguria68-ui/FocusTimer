import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Timer, 
  Target, 
  BarChart3, 
  Users, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  Play,
  Lock,
  Star,
  Coffee,
  Trophy,
  Brain,
  RefreshCw
} from 'lucide-react';

interface LandingPageProps {
  onStartApp: () => void;
  onTryGuestTimer: () => void;
  onAuthRequired: () => void;
}

export function LandingPage({ onStartApp, onTryGuestTimer, onAuthRequired }: LandingPageProps) {
  const [showDemo, setShowDemo] = useState(false);

  const features = [
    {
      icon: Timer,
      title: 'Pomodoro Timer',
      description: 'Stay focused with proven 25-minute work sessions',
      free: true
    },
    {
      icon: Target,
      title: 'Goal Tracking',
      description: 'Set and achieve your daily productivity goals',
      free: false
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Track your progress with detailed insights',
      free: false
    },
    {
      icon: Brain,
      title: 'AI Assistant',
      description: 'Get personalized productivity coaching',
      free: false
    },
    {
      icon: RefreshCw,
      title: 'Cross-Device Sync',
      description: 'Access your data from anywhere',
      free: false
    },
    {
      icon: Trophy,
      title: 'Achievement System',
      description: 'Earn badges and celebrate milestones',
      free: false
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Software Developer',
      content: 'Focus Timer transformed my productivity. I complete 40% more tasks daily!',
      rating: 5,
      avatar: '👩‍💻'
    },
    {
      name: 'Marcus Johnson',
      role: 'Designer',
      content: 'The AI coaching feature is incredible. It knows exactly when I need a break.',
      rating: 5,
      avatar: '👨‍🎨'
    },
    {
      name: 'Elena Rodriguez',
      role: 'Student',
      content: 'Finally, a focus app that actually works. My study sessions are so much better!',
      rating: 5,
      avatar: '👩‍🎓'
    }
  ];

  const steps = [
    {
      number: 1,
      title: 'Start Your Timer',
      description: 'Choose your focus duration and begin your productive session'
    },
    {
      number: 2,
      title: 'Stay Focused',
      description: 'Work distraction-free with our gentle reminders and progress tracking'
    },
    {
      number: 3,
      title: 'Track Progress',
      description: 'See your productivity patterns and celebrate your achievements'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b border-blue-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Timer className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Focus Timer</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onAuthRequired}>
              Sign In
            </Button>
            <Button onClick={onStartApp} className="bg-blue-600 hover:bg-blue-700">
              Get Started Free
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-800 hover:bg-blue-100">
            ✨ No Credit Card Required
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Master Your Focus,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Achieve Your Goals
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Transform your productivity with the world's most intelligent focus timer. 
            Start with our free Pomodoro timer, then unlock AI-powered insights to reach your full potential.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              onClick={onTryGuestTimer}
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4 h-auto"
            >
              <Play className="w-5 h-5 mr-2" />
              Try Free Timer Now
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={onStartApp}
              className="text-lg px-8 py-4 h-auto border-blue-200 hover:bg-blue-50"
            >
              Sign Up for Full Access
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Free forever
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              No credit card
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Instant access
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Stay Focused
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start with our free timer, then unlock premium features to supercharge your productivity
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="relative border-gray-200 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <Badge 
                        variant={feature.free ? "default" : "secondary"}
                        className={feature.free ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
                      >
                        {feature.free ? "Free" : "Pro"}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                  {!feature.free && (
                    <div className="absolute inset-0 bg-gray-50/50 backdrop-blur-[1px] rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Button size="sm" onClick={onStartApp}>
                        <Lock className="w-4 h-4 mr-2" />
                        Unlock with Account
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in seconds with our simple 3-step process
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Loved by Thousands of Users
            </h2>
            <div className="flex items-center justify-center gap-2 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="text-lg font-semibold text-gray-900 ml-2">4.9/5</span>
              <span className="text-gray-600">from 2,847 reviews</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{testimonial.avatar}</div>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Productivity?
          </h2>
          <p className="text-xl mb-10 opacity-90">
            Join thousands of users who've already mastered their focus. 
            Start with our free timer or unlock the full experience.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={onTryGuestTimer}
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4 h-auto"
            >
              <Play className="w-5 h-5 mr-2" />
              Try Free Timer
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={onStartApp}
              className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-4 h-auto"
            >
              Get Full Access Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          <p className="text-sm mt-6 opacity-75">
            No credit card required • Free forever • Upgrade anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Timer className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">Focus Timer</span>
          </div>
          <p className="text-gray-400 mb-6">
            The intelligent focus timer that adapts to your productivity style
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
            <span>© 2024 Focus Timer</span>
            <span>•</span>
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}