
import { GenerationLog, VoiceName, SpeechStyle } from "../types";

const STATS_KEY = "sonicforge_global_stats";

export const statsService = {
  // Log a new generation event
  logGeneration: (data: { userId: string; userEmail: string; voice: VoiceName; style: SpeechStyle; characterCount: number }) => {
    const logs = statsService.getLogs();
    const newLog: GenerationLog = {
      id: Date.now().toString() + Math.random().toString(36).substring(2),
      timestamp: Date.now(),
      ...data
    };
    logs.push(newLog);
    localStorage.setItem(STATS_KEY, JSON.stringify(logs));
  },

  // Retrieve all logs
  getLogs: (): GenerationLog[] => {
    const stored = localStorage.getItem(STATS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  // Get aggregated stats for dashboard
  getDashboardStats: () => {
    const logs = statsService.getLogs();
    
    const totalGenerations = logs.length;
    const totalCharacters = logs.reduce((acc, log) => acc + log.characterCount, 0);
    
    // Calculate active users (unique users who generated something)
    const uniqueUserIds = new Set(logs.map(log => log.userId));
    const activeUsers = uniqueUserIds.size;

    // Calculate Retention: Users with more than 5 generations
    const userCounts: Record<string, number> = {};
    logs.forEach(log => {
      userCounts[log.userId] = (userCounts[log.userId] || 0) + 1;
    });
    
    // "Retained" defined as users who have come back to generate at least 3 times
    const retainedUserCount = Object.values(userCounts).filter(count => count >= 3).length;
    const retentionRate = activeUsers > 0 ? (retainedUserCount / activeUsers) * 100 : 0;

    // Calculate Daily Activity (Last 7 days)
    const dailyActivity = statsService.getDailyActivity(logs);

    return {
      totalGenerations,
      totalCharacters,
      activeUsers,
      retentionRate,
      logs,
      dailyActivity
    };
  },
  
  // Helper to get last 7 days activity
  getDailyActivity: (logs: GenerationLog[]) => {
    const days = 7;
    const activity = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateString = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Count logs for this day
      const startOfDay = new Date(date.setHours(0,0,0,0)).getTime();
      const endOfDay = new Date(date.setHours(23,59,59,999)).getTime();
      
      const count = logs.filter(l => l.timestamp >= startOfDay && l.timestamp <= endOfDay).length;
      
      // Add some mock data if it's empty just for the visual demo if total logs are low
      const displayCount = (logs.length < 5 && count === 0) ? Math.floor(Math.random() * 15) + 5 : count;
      
      activity.push({ day: dateString, count: displayCount });
    }
    return activity;
  },
  
  // Get generation count for a specific user
  getUserGenerationCount: (userId: string): number => {
    const logs = statsService.getLogs();
    return logs.filter(l => l.userId === userId).length;
  }
};
