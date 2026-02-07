// Preview Data Service - Provides realistic demo data for preview mode

export interface PreviewTask {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
  createdAt: string;
  completedAt?: string;
  estimatedTime?: number;
  actualTime?: number;
}

export interface PreviewSession {
  id: string;
  taskId?: string;
  duration: number;
  completedAt: string;
  type: 'focus' | 'break';
  productivity: number;
}

export interface PreviewGoal {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string;
  category: string;
  completed: boolean;
}

export interface PreviewQuote {
  id: string;
  text: string;
  author: string;
  category: string;
  isFavorite: boolean;
  createdAt: string;
}

class PreviewDataService {
  private static instance: PreviewDataService;
  private tasks: PreviewTask[] = [];
  private sessions: PreviewSession[] = [];
  private goals: PreviewGoal[] = [];
  private quotes: PreviewQuote[] = [];

  private constructor() {
    this.initializePreviewData();
  }

  static getInstance(): PreviewDataService {
    if (!PreviewDataService.instance) {
      PreviewDataService.instance = new PreviewDataService();
    }
    return PreviewDataService.instance;
  }

  private initializePreviewData() {
    // Initialize with realistic demo data
    this.tasks = [
      {
        id: '1',
        title: 'Complete project proposal',
        completed: true,
        priority: 'high',
        category: 'Work',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedTime: 120,
        actualTime: 105
      },
      {
        id: '2',
        title: 'Review marketing materials',
        completed: false,
        priority: 'medium',
        category: 'Work',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedTime: 60
      },
      {
        id: '3',
        title: 'Plan weekend trip',
        completed: false,
        priority: 'low',
        category: 'Personal',
        createdAt: new Date().toISOString(),
        estimatedTime: 30
      },
      {
        id: '4',
        title: 'Learn React hooks',
        completed: true,
        priority: 'medium',
        category: 'Learning',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedTime: 90,
        actualTime: 85
      },
      {
        id: '5',
        title: 'Organize workspace',
        completed: false,
        priority: 'low',
        category: 'Personal',
        createdAt: new Date().toISOString(),
        estimatedTime: 45
      }
    ];

    this.sessions = [
      {
        id: '1',
        taskId: '1',
        duration: 25,
        completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        type: 'focus',
        productivity: 85
      },
      {
        id: '2',
        taskId: '1',
        duration: 25,
        completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        type: 'focus',
        productivity: 92
      },
      {
        id: '3',
        duration: 5,
        completedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        type: 'break',
        productivity: 100
      },
      {
        id: '4',
        taskId: '4',
        duration: 25,
        completedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        type: 'focus',
        productivity: 78
      },
      {
        id: '5',
        taskId: '4',
        duration: 25,
        completedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        type: 'focus',
        productivity: 88
      }
    ];

    this.goals = [
      {
        id: '1',
        title: 'Complete 100 focus sessions',
        description: 'Build a consistent focus habit',
        targetValue: 100,
        currentValue: 67,
        unit: 'sessions',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'Productivity',
        completed: false
      },
      {
        id: '2',
        title: 'Read 12 books this year',
        description: 'Expand knowledge and learning',
        targetValue: 12,
        currentValue: 8,
        unit: 'books',
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'Learning',
        completed: false
      },
      {
        id: '3',
        title: 'Exercise 3 times per week',
        description: 'Maintain physical health',
        targetValue: 156,
        currentValue: 156,
        unit: 'workouts',
        deadline: new Date().toISOString(),
        category: 'Health',
        completed: true
      }
    ];

    this.quotes = [
      {
        id: '1',
        text: 'The way to get started is to quit talking and begin doing.',
        author: 'Walt Disney',
        category: 'Motivation',
        isFavorite: true,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
        author: 'Winston Churchill',
        category: 'Success',
        isFavorite: false,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        text: 'Focus on being productive instead of busy.',
        author: 'Tim Ferriss',
        category: 'Productivity',
        isFavorite: true,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '4',
        text: 'The future depends on what you do today.',
        author: 'Mahatma Gandhi',
        category: 'Motivation',
        isFavorite: false,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  // Task methods
  getTasks(): PreviewTask[] {
    return [...this.tasks];
  }

  addTask(task: Omit<PreviewTask, 'id' | 'createdAt'>): PreviewTask {
    const newTask: PreviewTask = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    this.tasks.push(newTask);
    return newTask;
  }

  updateTask(id: string, updates: Partial<PreviewTask>): PreviewTask | null {
    const index = this.tasks.findIndex(task => task.id === id);
    if (index === -1) return null;
    
    this.tasks[index] = { ...this.tasks[index], ...updates };
    return this.tasks[index];
  }

  deleteTask(id: string): boolean {
    const index = this.tasks.findIndex(task => task.id === id);
    if (index === -1) return false;
    
    this.tasks.splice(index, 1);
    return true;
  }

  // Session methods
  getSessions(): PreviewSession[] {
    return [...this.sessions];
  }

  addSession(session: Omit<PreviewSession, 'id'>): PreviewSession {
    const newSession: PreviewSession = {
      ...session,
      id: Date.now().toString()
    };
    this.sessions.push(newSession);
    return newSession;
  }

  // Goal methods
  getGoals(): PreviewGoal[] {
    return [...this.goals];
  }

  addGoal(goal: Omit<PreviewGoal, 'id'>): PreviewGoal {
    const newGoal: PreviewGoal = {
      ...goal,
      id: Date.now().toString()
    };
    this.goals.push(newGoal);
    return newGoal;
  }

  updateGoal(id: string, updates: Partial<PreviewGoal>): PreviewGoal | null {
    const index = this.goals.findIndex(goal => goal.id === id);
    if (index === -1) return null;
    
    this.goals[index] = { ...this.goals[index], ...updates };
    return this.goals[index];
  }

  deleteGoal(id: string): boolean {
    const index = this.goals.findIndex(goal => goal.id === id);
    if (index === -1) return false;
    
    this.goals.splice(index, 1);
    return true;
  }

  // Quote methods
  getQuotes(): PreviewQuote[] {
    return [...this.quotes];
  }

  addQuote(quote: Omit<PreviewQuote, 'id' | 'createdAt'>): PreviewQuote {
    const newQuote: PreviewQuote = {
      ...quote,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    this.quotes.push(newQuote);
    return newQuote;
  }

  updateQuote(id: string, updates: Partial<PreviewQuote>): PreviewQuote | null {
    const index = this.quotes.findIndex(quote => quote.id === id);
    if (index === -1) return null;
    
    this.quotes[index] = { ...this.quotes[index], ...updates };
    return this.quotes[index];
  }

  deleteQuote(id: string): boolean {
    const index = this.quotes.findIndex(quote => quote.id === id);
    if (index === -1) return false;
    
    this.quotes.splice(index, 1);
    return true;
  }

  // Analytics methods
  getProductivityStats() {
    const completedTasks = this.tasks.filter(task => task.completed);
    const totalSessions = this.sessions.filter(session => session.type === 'focus');
    const avgProductivity = totalSessions.length > 0 
      ? totalSessions.reduce((sum, session) => sum + session.productivity, 0) / totalSessions.length 
      : 0;

    return {
      totalTasks: this.tasks.length,
      completedTasks: completedTasks.length,
      completionRate: this.tasks.length > 0 ? (completedTasks.length / this.tasks.length) * 100 : 0,
      totalFocusTime: totalSessions.reduce((sum, session) => sum + session.duration, 0),
      totalSessions: totalSessions.length,
      averageProductivity: Math.round(avgProductivity),
      streak: 7, // Demo streak
      goalsCompleted: this.goals.filter(goal => goal.completed).length,
      totalGoals: this.goals.length
    };
  }

  // Reset data for fresh demo
  resetData() {
    this.initializePreviewData();
  }
}

export default PreviewDataService;