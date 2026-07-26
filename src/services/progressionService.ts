import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';

export const progressionService = {
  async updateProgress(userId: string, actionType: 'trade' | 'win' | 'login') {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    
    const user = userSnap.data() as UserProfile;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    let xpGain = 0;
    let updates: any = {};

    switch (actionType) {
      case 'trade':
        xpGain = 20;
        updates.aiTradesCount = increment(1);
        // Also check if this completes a daily mission
        await this.completeDailyMission(userId, 'm2');
        break;
      case 'win':
        xpGain = 40;
        updates.winRun = increment(1);
        break;
      case 'login':
        const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate) : null;
        
        // Reset daily missions if it's a new day
        if (!user.dailyMissions || user.dailyMissions.lastResetDate !== todayStr) {
          updates.dailyMissions = {
            lastResetDate: todayStr,
            completedIds: []
          };
        }

        if (!lastLogin) {
          updates.loginStreak = 1;
          xpGain = 10;
        } else {
          const diffHours = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60);
          if (diffHours <= 24) {
            updates.loginStreak = increment(1);
            xpGain = 10;
          } else {
            updates.loginStreak = 1;
            xpGain = 10;
          }
        }
        updates.lastLoginDate = now.toISOString();
        break;
    }

    // Leveling logic
    let currentXp = (user.xp || 0) + xpGain;
    let currentLevel = user.level || 1;

    while (currentXp >= 1000) {
      currentLevel += 1;
      currentXp -= 1000;
    }

    updates.xp = currentXp;
    updates.level = currentLevel;

    await updateDoc(userRef, updates);
  },

  async completeDailyMission(userId: string, missionId: string) {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    
    const user = userSnap.data() as UserProfile;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Initialize daily missions if they don't exist
    let dailyMissions = user.dailyMissions;
    if (!dailyMissions || dailyMissions.lastResetDate !== todayStr) {
      dailyMissions = {
        lastResetDate: todayStr,
        completedIds: []
      };
    }

    // If already completed, skip
    if (dailyMissions.completedIds.includes(missionId)) return;

    // Add to completed list
    const updatedCompletedIds = [...dailyMissions.completedIds, missionId];
    
    let progressGain = 0;
    if (missionId === 'm2') progressGain = 1; // Trade
    if (missionId === 'm3' || missionId === 'm4') progressGain = 0.3; // Markets, Portfolio
    if (missionId === 'm5') progressGain = 0.2; // Check News

    const updates: any = {
      'dailyMissions.completedIds': updatedCompletedIds,
      'dailyMissions.lastResetDate': todayStr
    };

    if (progressGain > 0) {
      // Add XP too
      updates.xp = increment(progressGain * 100);
    }

    await updateDoc(userRef, updates);
  }
};
