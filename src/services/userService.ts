import { convex } from '@/components/ConvexClientProvider';
import { api } from '../../convex/_generated/api';

// Types (simplified/adapted for Convex migration)
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  onboarding_completed?: boolean;
  profile_completion_score?: number;
  // Add other fields as they become relevant
}

export class UserService {
  // ===== PROFILE MANAGEMENT =====

  static async createUserProfile(userData: any): Promise<UserProfile> {
    const result = await convex.mutation(api.user_service.createUserProfile, {
      id: userData.id,
      email: userData.email,
      full_name: userData.full_name,
      avatar_url: userData.avatar_url,
      onboarding_completed: userData.onboarding_completed
    });
    return result as UserProfile;
  }

  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    const result = await convex.query(api.user_service.getUserProfile, { id: userId });
    return result as UserProfile | null;
  }

  static async updateUserProfile(userId: string, updates: any): Promise<UserProfile> {
    // For now, just a placeholder or mapped to create (upsert)
    // In a real app, implement a specific update mutation
    const result = await convex.mutation(api.user_service.createUserProfile, {
      id: userId,
      ...updates
    });
    return result as UserProfile;
  }

  // ===== PREFERENCES MANAGEMENT =====

  static async updateUserPreferences(userId: string, preferences: any): Promise<any> {
    return await convex.mutation(api.user_service.updateUserPreferences, {
      user_id: userId,
      ...preferences
    });
  }

  static async getUserPreferences(userId: string): Promise<any> {
    // Implement if needed for settings page
    return null;
  }

  // Legacy compatibility for "user_settings" table
  static async upsertUserSettings(userId: string, settings: any) {
    return await convex.mutation(api.user_service.upsertUserSettings, {
      user_id: userId,
      ...settings
    });
  }

  // ===== STATISTICS MANAGEMENT =====

  static async updateUserStatistics(userId: string, stats: any): Promise<any> {
    return await convex.mutation(api.user_service.updateUserStatistics, {
      user_id: userId,
      ...stats
    });
  }

  static async getUserStatistics(userId: string): Promise<any> {
    // Implement query if needed
    return null;
  }

  // ===== GOALS MANAGEMENT =====

  static async createUserGoal(goalData: any): Promise<any> {
    return await convex.mutation(api.user_service.createUserGoal, {
      user_id: goalData.user_id,
      goal_type: goalData.goal_type,
      goal_name: goalData.goal_name,
      goal_description: goalData.goal_description,
      target_value: goalData.target_value,
      unit: goalData.unit,
      start_date: goalData.start_date,
      is_active: goalData.is_active
    });
  }

  // ===== UTILITY / PLACEHOLDERS =====

  static calculateProfileCompletion(userData: any): number {
    const fields = ['full_name', 'avatar_url'];
    const completedFields = fields.filter(field => userData[field] && userData[field].trim() !== '');
    return Math.round((completedFields.length / fields.length) * 100);
  }

  // Stubs to prevent build errors in components that call these
  static async initializeUserProfile(userId: string) {
    // Handled via individual mutations in new flow
  }

  static async logUserActivity(userId: string, type: string, desc: string) {
    // Optional: Implement activity logging in Convex later
  }

  static async addExperiencePoints(userId: string, points: number) {
    // Placeholder
  }
}