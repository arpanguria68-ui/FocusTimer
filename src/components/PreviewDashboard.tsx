import React, { useState } from 'react';
import { usePreviewMode } from './PreviewMode';
import { usePreviewTasks, usePreviewSessions, usePreviewGoals, usePreviewQuotes, usePreviewAnalytics } from '@/hooks/usePreviewData';
import { FocusTimer } from './FocusTimer';
import { TaskList } from './TaskList';
import { SessionAnalytics } from './SessionAnalytics';
import { GoalCreationDialog } from './GoalCreationDialog';
import { EnhancedQuotesDashboard } from './EnhancedQuotesDashboard';
import { Settings } from './Settings';
import { AiAssistant } from './AiAssistant';

interface PreviewDashboardProps {
  className?: string;
}

export const PreviewDashboard: React.FC<PreviewDashboardProps> = ({ className = '' }) => {
  const { isPreviewMode, previewUser } = usePreviewMode();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showGoalDialog, setShowGoalDialog] = useState(false);

  // Preview data hooks
  const { tasks, addTask, updateTask, deleteTask, toggleTask } = usePreviewTasks();
  const { sessions, addSession } = usePreviewSessions();
  const { goals, addGoal, updateGoal, deleteGoal } = usePreviewGoals();
  const { quotes, addQuote, updateQuote, deleteQuote, toggleFavorite } = usePreviewQuotes();
  const { stats, refreshStats } = usePreviewAnalytics();

  if (!isPreviewMode) {
    return null;
  }

  const handleTimerComplete = (duration: number, taskId?: string) => {
    // Add session to preview data
    addSession({
      taskId,
      duration,
      completedAt: new Date().toISOString(),
      type: 'focus',
      productivity: Math.floor(Math.random() * 20) + 80 // Random productivity 80-100%
    });

    // Mark task as completed if it was associated
    if (taskId) {
      toggleTask(taskId);
    }

    refreshStats();
  };

  const tabs = [
    { id: 'dashboard', label: '🎯 Dashboard', icon: '📊' },
    { id: 'timer', label: 'Focus Timer', icon: '⏱️' },
    { id: 'tasks', label: 'Tasks', icon: '✅' },
    { id: 'goals', label: 'Goals', icon: '🎯' },
    { id: 'quotes', label: 'Quotes', icon: '💭' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'ai', label: 'AI Assistant', icon: '🤖' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome back, {previewUser.name}! 👋
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats?.totalSessions || 0}</div>
                  <div className="text-sm text-blue-600">Focus Sessions</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats?.completedTasks || 0}</div>
                  <div className="text-sm text-green-600">Tasks Completed</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats?.streak || 0}</div>
                  <div className="text-sm text-purple-600">Day Streak</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Quick Focus</h3>
                  <FocusTimer 
                    onComplete={handleTimerComplete}
                    tasks={tasks}
                    className="border rounded-lg p-4"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Recent Tasks</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {tasks.slice(0, 5).map(task => (
                      <div key={task.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask(task.id)}
                          className="rounded"
                        />
                        <span className={`flex-1 ${task.completed ? 'line-through text-gray-500' : ''}`}>
                          {task.title}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          task.priority === 'high' ? 'bg-red-100 text-red-600' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'timer':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Focus Timer</h2>
            <FocusTimer 
              onComplete={handleTimerComplete}
              tasks={tasks}
            />
          </div>
        );

      case 'tasks':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
              <button
                onClick={() => {
                  const title = prompt('Enter task title:');
                  if (title) {
                    addTask({
                      title,
                      completed: false,
                      priority: 'medium',
                      category: 'General'
                    });
                  }
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Add Task
              </button>
            </div>
            <TaskList 
              tasks={tasks}
              onToggle={toggleTask}
              onUpdate={updateTask}
              onDelete={deleteTask}
            />
          </div>
        );

      case 'goals':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Goals</h2>
              <button
                onClick={() => setShowGoalDialog(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Create Goal
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {goals.map(goal => (
                <div key={goal.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2">{goal.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{goal.description}</p>
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{goal.currentValue}/{goal.targetValue} {goal.unit}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min((goal.currentValue / goal.targetValue) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-1 text-xs rounded ${
                      goal.completed ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {goal.completed ? 'Completed' : 'In Progress'}
                    </span>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {showGoalDialog && (
              <GoalCreationDialog
                onClose={() => setShowGoalDialog(false)}
                onSave={(goalData) => {
                  addGoal({
                    ...goalData,
                    currentValue: 0,
                    completed: false
                  });
                  setShowGoalDialog(false);
                }}
              />
            )}
          </div>
        );

      case 'quotes':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Inspirational Quotes</h2>
            <EnhancedQuotesDashboard 
              quotes={quotes}
              onAdd={addQuote}
              onUpdate={updateQuote}
              onDelete={deleteQuote}
              onToggleFavorite={toggleFavorite}
            />
          </div>
        );

      case 'analytics':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics</h2>
            <SessionAnalytics 
              sessions={sessions}
              tasks={tasks}
              goals={goals}
            />
          </div>
        );

      case 'ai':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">AI Assistant</h2>
            <AiAssistant />
          </div>
        );

      case 'settings':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
            <Settings />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Preview Mode Banner Space */}
      <div className="h-12"></div>
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {renderTabContent()}

        {/* Preview Mode Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>🎯 Preview Mode - All data is simulated for demonstration purposes</p>
          <p>Sign up to save your real progress and unlock all features!</p>
        </div>
      </div>
    </div>
  );
};