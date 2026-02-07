-- Add category column to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('signal', 'noise')) DEFAULT 'signal';

-- Add task_id and category columns to focus_sessions table
ALTER TABLE focus_sessions 
ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('signal', 'noise'));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_category ON focus_sessions(category);
