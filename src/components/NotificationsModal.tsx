import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, writeBatch, deleteDoc } from 'firebase/firestore';
import { 
  X, Bell, TrendingUp, ArrowDownRight, ArrowUpRight, 
  Percent, ShieldAlert, Settings, CheckCheck, Trash2 
} from 'lucide-react';

interface Notification {
  id: string;
  userId: string;
  type: 'trade' | 'deposit' | 'withdrawal' | 'profit' | 'maintenance' | 'security';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsModalProps {
  theme: 'light' | 'dark';
  onClose: () => void;
}

export default function NotificationsModal({ theme, onClose }: NotificationsModalProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const isDark = theme === 'dark';

  // Listen to live notifications from Firestore
  useEffect(() => {
    if (!user) return;
    const notifRef = collection(db, `users/${user.uid}/notifications`);
    const q = query(notifRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Notification[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Notification);
      });
      setNotifications(list);
    });
    return unsubscribe;
  }, [user]);

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    if (!user || notifications.length === 0) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach((notif) => {
        if (!notif.read) {
          const ref = doc(db, `users/${user.uid}/notifications`, notif.id);
          batch.update(ref, { read: true });
        }
      });
      await batch.commit();
    } catch (err) {
      console.error(err);
    }
  };

  // Clear all notifications
  const handleClearAll = async () => {
    if (!user || notifications.length === 0) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach((notif) => {
        const ref = doc(db, `users/${user.uid}/notifications`, notif.id);
        batch.delete(ref);
      });
      await batch.commit();
    } catch (err) {
      console.error(err);
    }
  };

  // Mark single notification as read
  const handleReadSingle = async (notifId: string) => {
    if (!user) return;
    try {
      const ref = doc(db, `users/${user.uid}/notifications`, notifId);
      await updateDoc(ref, { read: true });
    } catch (err) {
      console.error(err);
    }
  };

  // Delete single notification
  const handleDeleteSingle = async (notifId: string) => {
    if (!user) return;
    try {
      const ref = doc(db, `users/${user.uid}/notifications`, notifId);
      await deleteDoc(ref);
    } catch (err) {
      console.error(err);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownRight className="w-4 h-4 text-emerald-400" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-indigo-400" />;
      case 'profit':
        return <Percent className="w-4 h-4 text-emerald-400" />;
      case 'security':
        return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case 'maintenance':
        return <Settings className="w-4 h-4 text-amber-400" />;
      default:
        return <TrendingUp className="w-4 h-4 text-blue-400" />;
    }
  };

  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";
  const cardClasses = isDark ? "bg-[#0b0f19] border border-white/5" : "bg-white border border-slate-200 shadow-2xl";

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
      />

      {/* Slide-out Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className={`relative w-full max-w-sm h-full flex flex-col overflow-hidden z-10 ${cardClasses}`}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-500/10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-emerald-500" />
            <h3 className={`text-base font-black tracking-tight ${textPrimary}`}>Alert Center</h3>
            {unreadCount > 0 && (
              <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button 
            onClick={onClose}
            className={`p-1.5 rounded-full hover:scale-105 transition-transform ${isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Toolbar */}
        {notifications.length > 0 && (
          <div className="px-5 py-2.5 bg-slate-950/20 border-b border-slate-500/10 flex justify-between items-center text-[10px] font-bold tracking-wider font-mono uppercase text-slate-400">
            <button 
              onClick={handleMarkAllRead}
              className="hover:text-emerald-400 flex items-center space-x-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
            <button 
              onClick={handleClearAll}
              className="hover:text-red-400 flex items-center space-x-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear all</span>
            </button>
          </div>
        )}

        {/* List of Notifications */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-500/10">
          {notifications.length === 0 ? (
            <div className="p-8 text-center space-y-3 h-full flex flex-col items-center justify-center">
              <Bell className="w-10 h-10 text-slate-600 stroke-1" />
              <div>
                <p className={`text-sm font-bold ${textPrimary}`}>All quiet for now</p>
                <p className="text-xs text-slate-500 mt-1">You will receive real-time updates for trade executions, profit cycles, and deposits here.</p>
              </div>
            </div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif.id} 
                onClick={() => handleReadSingle(notif.id)}
                className={`p-4 flex items-start space-x-3.5 cursor-pointer transition-colors relative ${
                  notif.read ? 'opacity-70 hover:bg-white/[0.01]' : 'bg-emerald-500/[0.02] hover:bg-emerald-500/[0.04]'
                }`}
              >
                {/* Unread Indicator Dot */}
                {!notif.read && (
                  <div className="absolute left-1.5 top-[22px] w-2 h-2 bg-emerald-500 rounded-full" />
                )}

                {/* Notif Icon container */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                  notif.type === 'security'
                    ? 'bg-red-500/10 border-red-500/20'
                    : notif.type === 'maintenance'
                    ? 'bg-amber-500/10 border-amber-500/20'
                    : 'bg-emerald-500/10 border-emerald-500/20'
                }`}>
                  {getNotifIcon(notif.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-xs font-bold truncate pr-2 ${textPrimary}`}>{notif.title}</h4>
                    <span className="text-[8px] font-mono font-medium text-slate-500 tracking-wider">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed break-words">{notif.message}</p>
                </div>

                {/* Delete button */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSingle(notif.id);
                  }}
                  className="p-1 rounded text-slate-600 hover:text-red-400 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
