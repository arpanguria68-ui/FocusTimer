import React, { useState } from 'react';
import {
  Plus,
  Check,
  X,
  Edit3,
  Loader2,
  Search,
  Calendar,
  MoreVertical,
  Play,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useTaskState } from '@/hooks/useTaskState';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function TaskList() {
  const { user } = useAuth();
  const {
    tasks,
    activeTasks,
    completedTasks,
    isLoading,
    isSyncing,
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
    selectTask,
    selectedTaskId,
    reorderTasks
  } = useTaskState();

  const [newTask, setNewTask] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const activeTask = tasks.find(t => t.id === selectedTaskId);
  const otherTasks = tasks.filter(t => t.id !== selectedTaskId);

  // Filter tasks based on search
  const filteredTasks = otherTasks.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addTask = async () => {
    if (!newTask.trim()) return;
    // userTaskState handles creating local task immediately (optimistic)
    // If sync fails, it logs/toasts but returns the task.
    // For offline-first, creation is always "successful" locally.
    await createTask({
      title: newTask.trim(),
      completed: false,
      priority: 'medium',
      category: 'signal'
    });
    setNewTask('');
    toast.success('Task created successfully!');
  };

  const handleToggleTask = async (taskId: string) => {
    await toggleTask(taskId);
    // Error handled by hook
  };

  const saveEdit = async () => {
    if (!editText.trim() || !editingId) return;
    const success = await updateTask(editingId, { title: editText.trim() });

    if (success) {
      setEditingId(null);
      setEditText('');
      toast.success('Task updated');
    }
    // If failed, hook showed toast. We can choose to keep edit mode open or close it.
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 px-2">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
            Focus Tasks
          </h1>
          <p className="text-sm font-medium text-slate-300 mt-1 flex items-center gap-2">
            <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-xs font-bold font-mono">
              {activeTasks.length}
            </span>
            <span className="opacity-80">active sessions remaining</span>
          </p>
        </div>
        <div className="w-10 h-10 rounded-full glass flex items-center justify-center overflow-hidden border border-white/10">
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="User" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white font-bold">
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
          )}
        </div>
      </div>

      {/* Add Task Input */}
      <div className="flex gap-3 mb-6 relative">
        <div className="flex-1 relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Plus className="w-5 h-5" />
          </div>
          <input
            type="text"
            className="w-full bg-white/40 dark:bg-white/5 border-none rounded-2xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary transition-all glass placeholder:text-slate-400 text-foreground"
            placeholder="Add a new focus task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
          />
        </div>
        <button
          onClick={addTask}
          disabled={!newTask.trim() || isLoading}
          className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSyncing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 glass p-4 rounded-3xl bg-white/5 border border-white/5">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-1">Active</p>
          <p className="text-2xl font-bold text-foreground">{activeTasks.length}</p>
        </div>
        <div className="flex-1 glass p-4 rounded-3xl bg-white/5 border border-white/5">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-1">Completed</p>
          <p className="text-2xl font-bold text-emerald-500">{completedTasks.length}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 -mr-1 scroll-smooth">
        {/* Current Session / Active Task */}
        {activeTask && (
          <div>
            <div className="flex items-center justify-between px-1 mb-2">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">Current Session</h2>
              <button
                onClick={() => selectTask(null)}
                className="text-primary text-xs font-medium hover:underline"
              >
                Clear Focus
              </button>
            </div>

            <div className="glass p-5 rounded-[2rem] relative overflow-hidden group active-glow border-primary/30 bg-primary/5">
              <div className="absolute top-0 right-0 p-4">
                <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              </div>

              <div className="flex items-start gap-4">
                {/* Checkbox/Status */}
                <div
                  onClick={() => handleToggleTask(activeTask.id)}
                  className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center mt-1 cursor-pointer hover:bg-primary/20 transition-colors"
                >
                  {activeTask.completed && <div className="w-3 h-3 bg-primary rounded-full"></div>}
                </div>

                <div className="flex-1">
                  <h3 className={`font-semibold text-lg leading-tight mb-1 text-foreground ${activeTask.completed ? 'line-through opacity-50' : ''}`}>
                    {activeTask.title}
                  </h3>
                  <div className="flex gap-2 flex-wrap mt-2">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-0 text-[10px] font-bold uppercase tracking-wide">
                      Focus Mode
                    </Badge>
                    {activeTask.priority !== 'medium' && (
                      <Badge variant="outline" className={`border-0 text-[10px] font-bold uppercase tracking-wide ${activeTask.priority === 'high' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-500/10 text-slate-500'}`}>
                        {activeTask.priority}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Today, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Task List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
            </div>
          ) : filteredTasks.map((task, index) => (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', index.toString())}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                // Complex reorder logic needed if using filtered list...
                // For simplified demo, ignoring drag-drop on filtered list for safety
              }}
              className={`glass p-5 rounded-[2rem] hover:bg-white/10 transition-colors group relative border border-white/5 ${task.completed ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div
                  onClick={() => handleToggleTask(task.id)}
                  className={`w-6 h-6 rounded-full border-2 mt-1 flex items-center justify-center cursor-pointer transition-colors ${task.completed ? 'border-primary bg-primary/20' : 'border-slate-300 dark:border-slate-700 hover:border-primary'}`}
                >
                  {task.completed && <Check className="w-3 h-3 text-primary" />}
                </div>

                <div className="flex-1" onClick={() => selectTask(task.id)}>
                  {editingId === task.id ? (
                    <input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                      onBlur={saveEdit}
                      autoFocus
                      className="bg-transparent border-none text-foreground font-medium w-full focus:ring-0 p-0"
                    />
                  ) : (
                    <h3 className={`font-medium text-slate-700 dark:text-slate-200 cursor-pointer ${task.completed ? 'line-through' : ''}`}>
                      {task.title}
                    </h3>
                  )}

                  <div className="flex gap-2 mt-1">
                    <Badge variant="secondary" className="bg-slate-100 dark:bg-white/5 text-slate-500 text-[10px] font-bold uppercase tracking-wide border-0">
                      {task.category}
                    </Badge>
                    {task.priority !== 'medium' && (
                      <Badge variant="outline" className={`border-0 text-[10px] font-bold uppercase tracking-wide ${task.priority === 'high' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-500/10 text-slate-500'}`}>
                        {task.priority}
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(task.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingId(task.id); setEditText(task.title); }} className="text-slate-400 hover:text-white p-1">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteTask(task.id)} className="text-slate-400 hover:text-red-400 p-1">
                    <X className="w-4 h-4" />
                  </button>
                  <button className="text-slate-400 hover:text-slate-200 p-1">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredTasks.length === 0 && !isLoading && (
            <div className="text-center py-10 text-slate-500">
              <p>No tasks found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}