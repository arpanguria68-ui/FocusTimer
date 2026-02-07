
import { Id } from "../../convex/_generated/dataModel";

export interface LocalTask {
    id: string;
    user_id: string;
    title: string;
    description?: string;
    completed: boolean;
    priority: 'low' | 'medium' | 'high';
    due_date?: string;
    category: 'signal' | 'noise';
    created_at: string;
    updated_at: string;
}

export interface LocalQuote {
    id: string;
    user_id: string;
    content: string;
    author?: string;
    category?: string;
    is_custom: boolean;
    created_at: string;
}

export const adaptConvexTask = (convexTask: any): LocalTask => ({
    id: convexTask._id,
    user_id: convexTask.user_id,
    title: convexTask.title,
    description: convexTask.description,
    completed: convexTask.completed,
    priority: convexTask.priority,
    due_date: convexTask.due_date,
    category: convexTask.category,
    created_at: convexTask.created_at,
    updated_at: convexTask.updated_at,
});

export const adaptConvexQuote = (convexQuote: any): LocalQuote => ({
    id: convexQuote._id,
    user_id: convexQuote.user_id,
    content: convexQuote.content,
    author: convexQuote.author,
    category: convexQuote.category,
    is_custom: convexQuote.is_custom,
    created_at: convexQuote.created_at,
});
