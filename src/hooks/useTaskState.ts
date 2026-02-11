import { useTaskContext } from '@/contexts/TaskContext';

export function useTaskState() {
  return useTaskContext();
}