import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import { safeStorage } from '../utils/storage';

export const progressionService = {
  async updateProgress(userId: string, actionType: 'trade' | 'win' | 'loss' | 'login') {
    if (!userId || safeStorage.getItem('aver_logged_out') === 'true') return;

    const profileKey = `user_profile_${userId}`;
    const activeUserKey = `aver_active_user`;

    // 1. Get current profile from local storage if available
    let localProfile: UserProfile | null = null;
    try {
      const pStr = safeStorage.getItem(profileKey) || safeStorage.getItem(activeUserKey);
      if (pStr) {
        const parsed = JSON.parse(pStr);
        if (parsed && (!parsed.uid || parsed.uid === userId)) {
          localProfile = parsed;
        }
      }
    } catch (e) {}

    // 2. Fetch from Firestore if possible
    let fsUser: UserProfile | null = null;
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        fsUser = userSnap.data() as UserProfile;
      }
    } catch (err) {}

    const user: UserProfile = fsUser || localProfile || { uid: userId } as UserProfile;

    const now = new Date();
    const lYear = now.getFullYear();
    const lMonth = String(now.getMonth() + 1).padStart(2, '0');
    const lDay = String(now.getDate()).padStart(2, '0');
    const todayLocalStr = `${lYear}-${lMonth}-${lDay}`;
    
    let xpGain = 0;
    let updates: any = {};

    let currentWinRun = user.winRun ?? localProfile?.winRun ?? 0;
    let currentLoginStreak = typeof user.loginStreak === 'number'
      ? user.loginStreak
      : (typeof localProfile?.loginStreak === 'number' ? localProfile.loginStreak : 0);
    let currentAiTrades = user.aiTradesCount ?? localProfile?.aiTradesCount ?? 0;
    
    let rawLastLogin = user.lastLoginDate || localProfile?.lastLoginDate || user.lastLogin;
    let lastLoginDate: string | undefined = undefined;
    if (rawLastLogin) {
      if (typeof rawLastLogin === 'string') {
        lastLoginDate = rawLastLogin;
      } else if (typeof rawLastLogin?.toDate === 'function') {
        lastLoginDate = rawLastLogin.toDate().toISOString();
      } else if (rawLastLogin instanceof Date) {
        lastLoginDate = rawLastLogin.toISOString();
      }
    }

    switch (actionType) {
      case 'trade':
        xpGain = 20;
        currentAiTrades += 1;
        updates.aiTradesCount = currentAiTrades;
        await this.completeDailyMission(userId, 'm2');
        break;
      case 'win':
        xpGain = 40;
        currentWinRun += 1;
        updates.winRun = currentWinRun;
        break;
      case 'loss':
        currentWinRun = 0;
        updates.winRun = 0;
        break;
      case 'login': {
        // Accurate calendar day streak calculation
        let calculatedStreak = typeof currentLoginStreak === 'number' && currentLoginStreak > 0 ? currentLoginStreak : 1;
        
        if (lastLoginDate) {
          const lastDate = new Date(lastLoginDate);
          if (!isNaN(lastDate.getTime())) {
            // Compare calendar days normalized to midnight
            const lastMidnight = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime();
            const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            const daysDiff = Math.round((todayMidnight - lastMidnight) / (1000 * 60 * 60 * 24));

            if (daysDiff === 0) {
              // Same calendar day: preserve current streak, no duplicate increment
              calculatedStreak = Math.max(1, calculatedStreak);
              xpGain = 0;
            } else if (daysDiff === 1) {
              // Consecutive day login (active yesterday and today): increment streak!
              calculatedStreak = Math.max(1, calculatedStreak) + 1;
              xpGain = 10;
            } else if (daysDiff > 1) {
              // Missed one or more full calendar days: streak resets to 1 day (active today)
              calculatedStreak = 1;
              xpGain = 0;
            }
          } else {
            calculatedStreak = Math.max(1, calculatedStreak);
          }
        } else {
          // First recorded login
          calculatedStreak = Math.max(1, calculatedStreak);
          xpGain = 10;
        }

        currentLoginStreak = calculatedStreak;
        lastLoginDate = now.toISOString();
        updates.loginStreak = currentLoginStreak;
        updates.lastLoginDate = lastLoginDate;
        break;
      }
    }

    // Leveling logic: 1000 XP per level
    const calculatedXp = (currentAiTrades * 20) + (currentWinRun * 15) + (currentLoginStreak * 10);
    let currentXp = Math.max((user.xp || localProfile?.xp || 0) + xpGain, calculatedXp);
    let currentLevel = Math.max(1, Math.floor(currentXp / 1000) + 1);

    let insignias: string[] = [];
    if (currentLevel >= 5) {
      const milestone = Math.floor(currentLevel / 5) * 5;
      insignias.push(`Level ${milestone} Vanguard`);
    }

    updates.xp = currentXp;
    updates.level = currentLevel;
    updates.insignias = insignias;

    // 3. Update local storage caches for immediate UI update
    const updatedProfile = {
      ...user,
      ...localProfile,
      winRun: currentWinRun,
      loginStreak: currentLoginStreak,
      aiTradesCount: currentAiTrades,
      xp: currentXp,
      level: currentLevel,
      insignias,
      lastLoginDate
    };

    try {
      safeStorage.setItem(profileKey, JSON.stringify(updatedProfile));
      safeStorage.setItem(activeUserKey, JSON.stringify(updatedProfile));
      window.dispatchEvent(new Event('aver_user_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (err) {}

    // 4. Update Firestore if accessible
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, updates);
    } catch (err) {}
  },

  async completeDailyMission(userId: string, missionId: string) {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;
      
      const user = userSnap.data() as UserProfile;
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      let dailyMissions = user.dailyMissions;
      if (!dailyMissions || dailyMissions.lastResetDate !== todayStr) {
        dailyMissions = {
          lastResetDate: todayStr,
          completedIds: []
        };
      }

      if (dailyMissions.completedIds.includes(missionId)) return;

      const updatedCompletedIds = [...dailyMissions.completedIds, missionId];
      
      let progressGain = 0;
      if (missionId === 'm2') progressGain = 1;
      if (missionId === 'm3' || missionId === 'm4') progressGain = 0.3;
      if (missionId === 'm5') progressGain = 0.2;

      const updates: any = {
        'dailyMissions.completedIds': updatedCompletedIds,
        'dailyMissions.lastResetDate': todayStr
      };

      if (progressGain > 0) {
        updates.xp = increment(progressGain * 100);
      }

      await updateDoc(userRef, updates);
    } catch (err) {}
  }
};

