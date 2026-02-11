import React, { createContext, useContext, ReactNode } from 'react';
import { useTaskState as useTaskStateLogic } from '@/hooks/useTaskStateLogic';

// Define the shape of the context
// We'll infer it from the return type of the logic hook to keep it synced
// But to avoid circular deps, we might need to define accessors.
// For now, let's just use `any` or explicit type if possible, or better:
// We extract the logic from `useTaskState.ts` into `useTaskStateLogic.ts`
// and make `useTaskState.ts` the context consumer.

// Actually, simpler: Copy the logic here or import it.
// Let's reuse the existing hook logic but move it to a new file `hooks/useTaskStateLogic.ts` 
// and make `hooks/useTaskState.ts` the public API that uses Context.
// NO w8, `useTaskState` IS the logic currently.
// So renaming `useTaskState.ts` to `useTaskStateLogic.ts` is a good first step.
// But that breaks imports.
// Plan:
// 1. Rename `useTaskState.ts` -> `useTaskStateInternal.ts` (or similar)
// 2. Create `contexts/TaskContext.tsx` which uses `useTaskStateInternal` and provides the value.
// 3. Create `hooks/useTaskState.ts` which uses `useContext(TaskContext)`.

// Checking imports... straightforward.

interface TaskContextType {
    tasks: any[];
    activeTasks: any[];
    completedTasks: any[];
    isLoading: boolean;
    isSyncing: boolean;
    createTask: (data: any) => Promise<any>;
    updateTask: (id: string, data: any) => Promise<boolean>;
    deleteTask: (id: string) => Promise<boolean>;
    toggleTask: (id: string) => Promise<boolean>;
    selectTask: (id: string | null) => void;
    selectedTaskId: string | null;
    reorderTasks: (order: string[]) => void;
    setFilter: (filter: any) => void; // taskState.filter type
    setSortBy: (sort: any) => void;
    syncLocalTasks: () => Promise<void>;
    localTaskCount: number;
    allTasks: any[];
    selectedTask: any | null;
    filter: any;
    sortBy: any;
}

const TaskContext = createContext<TaskContextType | null>(null);

export function TaskProvider({ children }: { children: ReactNode }) {
    const taskState = useTaskStateLogic();

    return (
        <TaskContext.Provider value={taskState}>
            {children}
        </TaskContext.Provider>
    );
}

export const useTaskContext = () => {
    const context = useContext(TaskContext);
    if (!context) {
        throw new Error("useTaskContext must be used within a TaskProvider");
    }
    return context;
};

// We need to import useTaskStateLogic. 
// I will assume successful rename of current `useTaskState.ts` to `useTaskStateLogic.ts`
import { useTaskState as useTaskStateLogic } from '@/hooks/useTaskStateLogic';
