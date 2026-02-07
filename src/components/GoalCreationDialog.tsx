import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Target, Plus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useCreateUserGoal } from '@/hooks/useConvexQueries';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface GoalCreationDialogProps {
  children: React.ReactNode;
}

export function GoalCreationDialog({ children }: GoalCreationDialogProps) {
  const { user } = useAuth();
  const createGoal = useCreateUserGoal();
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const [formData, setFormData] = useState({
    goal_name: '',
    goal_description: '',
    goal_type: 'daily' as 'daily' | 'weekly' | 'monthly' | 'custom',
    target_value: '',
    unit: 'sessions',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please sign in to create goals');
      return;
    }

    if (!formData.goal_name.trim() || !formData.target_value) {
      toast.error('Please fill in all required fields');
      return;
    }

    const targetValue = parseInt(formData.target_value);
    if (isNaN(targetValue) || targetValue <= 0) {
      toast.error('Target value must be a positive number');
      return;
    }

    try {
      const goalData = {
        user_id: user.id,
        goal_name: formData.goal_name.trim(),
        goal_description: formData.goal_description.trim() || undefined,
        goal_type: formData.goal_type,
        target_value: targetValue,
        unit: formData.unit,
        start_date: (startDate || new Date()).toISOString(),
        end_date: endDate?.toISOString(),
        is_active: true,
        is_completed: false,
        current_value: 0,
      };

      await createGoal.mutateAsync(goalData);

      toast.success('Goal created successfully! 🎯');
      setOpen(false);

      // Reset form
      setFormData({
        goal_name: '',
        goal_description: '',
        goal_type: 'daily',
        target_value: '',
        unit: 'sessions',
      });
      setStartDate(undefined);
      setEndDate(undefined);
    } catch (error) {
      console.error('Failed to create goal:', error);
      toast.error('Failed to create goal. Please try again.');
    }
  };

  const getDefaultEndDate = (goalType: string, startDate: Date) => {
    const date = new Date(startDate);
    switch (goalType) {
      case 'daily':
        return date; // Same day
      case 'weekly':
        date.setDate(date.getDate() + 7);
        return date;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        return date;
      default:
        return undefined;
    }
  };

  const handleGoalTypeChange = (goalType: 'daily' | 'weekly' | 'monthly' | 'custom') => {
    setFormData(prev => ({ ...prev, goal_type: goalType }));

    if (goalType !== 'custom' && startDate) {
      const defaultEnd = getDefaultEndDate(goalType, startDate);
      if (defaultEnd) {
        setEndDate(defaultEnd);
      }
    }
  };

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);

    if (date && formData.goal_type !== 'custom') {
      const defaultEnd = getDefaultEndDate(formData.goal_type, date);
      if (defaultEnd) {
        setEndDate(defaultEnd);
      }
    }
  };

  const goalTypeDescriptions = {
    daily: 'Complete this goal within a single day',
    weekly: 'Complete this goal within a week',
    monthly: 'Complete this goal within a month',
    custom: 'Set your own timeline for this goal'
  };

  const unitOptions = [
    { value: 'sessions', label: 'Focus Sessions' },
    { value: 'minutes', label: 'Minutes' },
    { value: 'hours', label: 'Hours' },
    { value: 'tasks', label: 'Tasks' },
    { value: 'days', label: 'Days' },
    { value: 'points', label: 'Points' },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Create New Goal
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Goal Name */}
          <div className="space-y-2">
            <Label htmlFor="goal_name">Goal Name *</Label>
            <Input
              id="goal_name"
              value={formData.goal_name}
              onChange={(e) => setFormData(prev => ({ ...prev, goal_name: e.target.value }))}
              placeholder="e.g., Complete 25 focus sessions"
              required
            />
          </div>

          {/* Goal Description */}
          <div className="space-y-2">
            <Label htmlFor="goal_description">Description (Optional)</Label>
            <Textarea
              id="goal_description"
              value={formData.goal_description}
              onChange={(e) => setFormData(prev => ({ ...prev, goal_description: e.target.value }))}
              placeholder="Describe what you want to achieve..."
              className="min-h-20"
            />
          </div>

          {/* Goal Type */}
          <div className="space-y-2">
            <Label>Goal Type</Label>
            <Select value={formData.goal_type} onValueChange={handleGoalTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily Goal</SelectItem>
                <SelectItem value="weekly">Weekly Goal</SelectItem>
                <SelectItem value="monthly">Monthly Goal</SelectItem>
                <SelectItem value="custom">Custom Timeline</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {goalTypeDescriptions[formData.goal_type]}
            </p>
          </div>

          {/* Target Value and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target_value">Target Value *</Label>
              <Input
                id="target_value"
                type="number"
                min="1"
                value={formData.target_value}
                onChange={(e) => setFormData(prev => ({ ...prev, target_value: e.target.value }))}
                placeholder="25"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={formData.unit} onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {unitOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={handleStartDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {formData.goal_type === 'custom' && (
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Select end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => startDate ? date < startDate : false}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* Auto-calculated end date display */}
          {formData.goal_type !== 'custom' && endDate && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                This {formData.goal_type} goal will end on {format(endDate, "PPP")}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createGoal.isPending}>
              {createGoal.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Goal
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}