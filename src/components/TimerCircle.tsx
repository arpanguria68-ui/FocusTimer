import React from 'react';
import { TimerMode } from './FocusTimer';

interface TimerCircleProps {
  timeLeft: number;
  totalTime: number;
  mode: TimerMode;
  isRunning: boolean;
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

export function TimerCircle({ timeLeft, totalTime, mode, isRunning, size = 'lg', children }: TimerCircleProps) {
  const sizes = {
    sm: { radius: 40, strokeWidth: 3 },
    md: { radius: 80, strokeWidth: 4 },
    lg: { radius: 120, strokeWidth: 6 }
  };

  const currentSize = sizes[size];
  const circumference = 2 * Math.PI * currentSize.radius;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  // Invert dashoffset logic to fill clockwise properly or match the glass design
  // The glass design uses: dashoffset = circumference - (progress / 100) * circumference
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width={currentSize.radius * 2 + 40}
        height={currentSize.radius * 2 + 40}
        viewBox={`0 0 ${currentSize.radius * 2 + 40} ${currentSize.radius * 2 + 40}`}
        className="transform -rotate-90 pointer-events-none"
      >
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" /> {/* Cyan-400 */}
            <stop offset="100%" stopColor="#a855f7" /> {/* Purple-500 */}
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background Track */}
        <circle
          cx={currentSize.radius + 20}
          cy={currentSize.radius + 20}
          r={currentSize.radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={currentSize.strokeWidth}
        />

        {/* Dynamic Progress Indicator */}
        <circle
          cx={currentSize.radius + 20}
          cy={currentSize.radius + 20}
          r={currentSize.radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={currentSize.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-linear"
          filter="url(#glow)"
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children ? (
          children
        ) : (
          <div className={`glass rounded-full text-center flex flex-col items-center justify-center ${size === 'sm' ? 'p-2 w-16 h-16' : size === 'md' ? 'p-4 w-24 h-24' : 'p-8 w-32 h-32'
            }`}>
            <div className={`font-medium text-muted-foreground ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
              }`}>
              {mode === 'focus' ? '🎯' : '☕'}
            </div>
            <div className={`mt-1 text-muted-foreground ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-xs' : 'text-sm'
              }`}>
              {Math.round(progress)}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
}