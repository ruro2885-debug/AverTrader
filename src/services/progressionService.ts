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
    let currentLoginStreak = Number(user.loginStreak ?? localProfile?.loginStreak ?? 1) || 1;
    let currentAiTrades = user.aiTradesCount ?? localProfile?.aiTradesCount ?? 0;
    let lastLoginDate = user.lastLoginDate || localProfile?.lastLoginDate;

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
      case 'login':
        const lastLoginDateOnly = lastLoginDate ? lastLoginDate.split('T')[0] : null;
        const lastLoginMs = lastLoginDate ? new Date(lastLoginDate).getTime() : 0;
        const nowMs = now.getTime();
        const diffHours = lastLoginMs ? (nowMs - lastLoginMs) / (1000 * 60 * 60) : 999999;

        const yesterdayLocal = new Date(now);
        yesterdayLocal.setDate(yesterdayLocal.getDate() - 1);
        const yYear = yesterdayLocal.getFullYear();
        const yMonth = String(yesterdayLocal.getMonth() + 1).padStart(2, '0');
        const yDay = String(yesterdayLocal.getDate()).padStart(2, '0');
        const yesterdayLocalStr = `${yYear}-${yMonth}-${yDay}`;

        if (!lastLoginDateOnly || diffHours > 48 || (lastLoginDateOnly !== todayLocalStr && lastLoginDateOnly !== yesterdayLocalStr && diffHours > 48)) {
          // If no last login, or logged in after 48 hours -> restart streak from 1
          currentLoginStreak = 1;
          xpGain = 10;
        } else if (lastLoginDateOnly === todayLocalStr || diffHours < 12) {
          // Already logged in today or within same day window -> keep current login streak
          currentLoginStreak = Math.max(1, currentLoginStreak);
          xpGain = 0;
        } else if (lastLoginDateOnly === yesterdayLocalStr || (diffHours >= 12 && diffHours <= 48)) {
          // Logged in after 24 hours (consecutive next day) -> increment streak by 1 (+2 / +1 progression)
          currentLoginStreak = Math.max(1, currentLoginStreak) + 1;
          xpGain = 10;
        } else {
          // Default fallback for 48h+ gap -> reset streak to 1
          currentLoginStreak = 1;
          xpGain = 10;
        }
        lastLoginDate = now.toISOString();
        updates.loginStreak = currentLoginStreak;
        updates.lastLoginDate = lastLoginDate;
        break;
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

