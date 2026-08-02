import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, ShieldCheck, CheckCircle2, XCircle, Clock, FileText, User, 
  AlertTriangle, Eye, Check, X, ArrowLeft, RefreshCcw, MapPin, Calendar, Globe, Phone 
} from 'lucide-react';
import { collection, onSnapshot, updateDoc, doc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db, auth } from '../../../lib/firebase';

interface KYC {
  id: string;
  userId: string;
  name: string;
  email: string;
  profilePhoto?: string;
  tier: string;
  idType: string;
  personalInfo?: {
    dob?: string;
    nationality?: string;
    phone?: string;
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  frontIdUrl?: string;
  backIdUrl?: string;
  selfieUrl?: string;
  documents: string[];
  status: 'pending' | 'verified' | 'rejected' | 'requires_resubmission';
  rejectionReason?: string;
  submittedAt: string;
}

export default function AdminKYC({ theme }: { theme: 'light' | 'dark' }) {
  const [submissions, setSubmissions] = useState<KYC[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<KYC | null>(null);
  const [actionModal, setActionModal] = useState<'reject' | 'resubmit' | null>(null);
  const [reasonText, setReasonText] = useState('');

  const isDark = theme === 'dark';

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'admin_kyc'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as KYC));
      // Memory sort by submittedAt descending
      data.sort((a, b) => {
        const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return timeB - timeA;
      });
      setSubmissions(data);
      setLoading(false);
    }, (err) => {
      console.error("Error loading KYC submissions:", err);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleAction = async (id: string, status: 'verified' | 'rejected' | 'requires_resubmission', reason = '') => {
    try {
      const submission = submissions.find(s => s.id === id);
      const updatePayload: any = { 
        status,
        reviewedAt: serverTimestamp(),
        reviewedByAdmin: auth.currentUser?.email || 'admin@aver.io'
      };
      if (reason) {
        updatePayload.rejectionReason = reason;
      }

      await updateDoc(doc(db, 'admin_kyc', id), updatePayload);

      if (submission?.userId) {
        const userUpdate: any = {
          kycStatus: status === 'verified' ? 'verified' : status === 'rejected' ? 'rejected' : 'requires_resubmission',
          lastUpdated: serverTimestamp()
        };

        if (status === 'verified') {
          userUpdate.kycRewardUnlocked = true;
          userUpdate.kycApprovedAt = new Date().toISOString();
          userUpdate.kycRejectionReason = null;
        } else if (status === 'rejected') {
          userUpdate.kycRewardUnlocked = false;
          userUpdate.kycRejectionReason = reason;
        } else if (status === 'requires_resubmission') {
          userUpdate.kycRewardUnlocked = false;
          userUpdate.kycResubmissionReason = reason;
        }

        await updateDoc(doc(db, 'users', submission.userId), userUpdate).catch((err) => console.warn("Failed to sync kycStatus to user doc:", err));

        // Create notification for the user
        let notifTitle = '';
        let notifBody = '';
        if (status === 'verified') {
          notifTitle = 'Identity Verification Approved';
          notifBody = 'Your identity verification application has been approved. High transaction limits and premium features are now active.';
        } else if (status === 'rejected') {
          notifTitle = 'Identity Verification Rejected';
          notifBody = `Your application was rejected by compliance. Reason: ${reason || 'Document verification failed.'}`;
        } else {
          notifTitle = 'KYC Resubmission Required';
          notifBody = `Please re-upload your identity document. Reason: ${reason || 'Additional clarity required.'}`;
        }

        await addDoc(collection(db, 'notifications'), {
          userId: submission.userId,
          category: 'security',
          priority: 'high',
          title: notifTitle,
          body: notifBody,
          createdAt: serverTimestamp(),
          read: false
        }).catch(() => {});
      }

      setSelectedSubmission(null);
      setActionModal(null);
      setReasonText('');
    } catch (err) {
      console.error("Failed to update KYC status:", err);
    }
  };

  const filtered = submissions.filter(s => 
    s.email?.toLowerCase().includes(search.toLowerCase()) || 
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.userId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight mb-2">Identity Governance</h1>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Review and verify institutional KYC submissions for regulatory compliance and platform security.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className={`flex-1 max-w-md flex items-center gap-3 px-4 py-2.5 rounded-2xl border ${
          isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <Search className="w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by name, email or UID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">Total Submissions:</span>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-black text-xs">
            {submissions.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-6 rounded-[2rem] border flex flex-col justify-between transition-all ${
              isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200 shadow-sm'
            } ${item.status === 'pending' ? 'ring-1 ring-amber-500/30' : ''}`}
          >
            <div>
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center font-bold text-lg ${
                    isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900'
                  }`}>
                    {item.profilePhoto || item.selfieUrl ? (
                      <img src={item.profilePhoto || item.selfieUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      item.name?.charAt(0) || <User className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{item.name || 'Anonymous User'}</h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.email}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  item.status === 'verified' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                  item.status === 'rejected' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                  item.status === 'requires_resubmission' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                  'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}>
                  {item.status.replace('_', ' ')}
                </span>
              </div>

              <div className="space-y-2 mb-6 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">ID Type</span>
                  <span className="font-bold">{item.idType || 'Passport'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">UID</span>
                  <span className="font-mono text-[10px] text-slate-400">{item.userId?.slice(0, 10)}...</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Submitted</span>
                  <span className="font-semibold">{new Date(item.submittedAt || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-white/5">
              <button
                onClick={() => setSelectedSubmission(item)}
                className={`flex-1 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                  isDark ? 'border-white/10 hover:bg-white/5 text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-800'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Review Details</span>
              </button>
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && !loading && (
          <div className="col-span-full py-16 text-center text-slate-500">
            <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-bold">No KYC submissions found</p>
          </div>
        )}
      </div>

      {/* DETAILED REVIEW MODAL */}
      <AnimatePresence>
        {selectedSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-[2.5pax] border p-8 space-y-6 ${
                isDark ? 'bg-slate-900 border-white/10 text-slate-100' : 'bg-white border-slate-200 text-slate-950 shadow-2xl'
              }`}
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-800">
                    {selectedSubmission.selfieUrl ? (
                      <img src={selectedSubmission.selfieUrl} alt="Selfie" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 m-auto text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-black">{selectedSubmission.name}</h2>
                    <p className="text-xs text-slate-400">{selectedSubmission.email} • UID: {selectedSubmission.userId}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedSubmission(null)}
                  className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Submission Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-5 rounded-2xl border space-y-3 ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">Personal Information</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-slate-400">ID Type:</span> <span className="font-bold">{selectedSubmission.idType}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Date of Birth:</span> <span className="font-bold">{selectedSubmission.personalInfo?.dob || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Nationality:</span> <span className="font-bold">{selectedSubmission.personalInfo?.nationality || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Phone:</span> <span className="font-bold">{selectedSubmission.personalInfo?.phone || 'N/A'}</span></div>
                  </div>
                </div>

                <div className={`p-5 rounded-2xl border space-y-3 ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">Residential Address</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-slate-400">Street:</span> <span className="font-bold">{selectedSubmission.address?.street || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">City / State:</span> <span className="font-bold">{selectedSubmission.address?.city}, {selectedSubmission.address?.state}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Postal Code:</span> <span className="font-bold">{selectedSubmission.address?.postalCode || 'N/A'}</span></div>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Uploaded Verification Documents</h4>
                <div className="grid grid-cols-3 gap-4">
                  {selectedSubmission.frontIdUrl && (
                    <div className="h-36 rounded-2xl overflow-hidden border border-white/10 relative group">
                      <img src={selectedSubmission.frontIdUrl} alt="Front ID" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 text-[9px] bg-black/80 px-2 py-0.5 rounded text-white font-bold">Front ID</span>
                    </div>
                  )}
                  {selectedSubmission.backIdUrl && (
                    <div className="h-36 rounded-2xl overflow-hidden border border-white/10 relative group">
                      <img src={selectedSubmission.backIdUrl} alt="Back ID" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 text-[9px] bg-black/80 px-2 py-0.5 rounded text-white font-bold">Back ID</span>
                    </div>
                  )}
                  {selectedSubmission.selfieUrl && (
                    <div className="h-36 rounded-2xl overflow-hidden border border-white/10 relative group">
                      <img src={selectedSubmission.selfieUrl} alt="Selfie" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1 text-[9px] bg-black/80 px-2 py-0.5 rounded text-white font-bold">Selfie</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                {actionModal ? (
                  <div className="w-full space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400">
                        {actionModal === 'reject' ? 'Rejection Reason *' : 'Resubmission Instructions *'}
                      </label>
                      <input 
                        type="text" 
                        value={reasonText}
                        onChange={e => setReasonText(e.target.value)}
                        placeholder={actionModal === 'reject' ? 'e.g. Document image is blurry or expired' : 'e.g. Please upload a clear color photo of your passport'}
                        className={`w-full p-3 rounded-xl border text-xs bg-transparent ${isDark ? 'border-white/10' : 'border-slate-300'}`}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button 
                        onClick={() => { setActionModal(null); setReasonText(''); }}
                        className="px-4 py-2 rounded-xl border text-xs font-bold"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => handleAction(
                          selectedSubmission.id, 
                          actionModal === 'reject' ? 'rejected' : 'requires_resubmission', 
                          reasonText
                        )}
                        disabled={!reasonText}
                        className={`px-6 py-2 rounded-xl text-xs font-black text-white ${
                          actionModal === 'reject' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-blue-600 hover:bg-blue-500'
                        }`}
                      >
                        Confirm {actionModal === 'reject' ? 'Rejection' : 'Resubmission Request'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setActionModal('resubmit')}
                      className="px-5 py-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 font-bold text-xs transition-all"
                    >
                      Request Resubmission
                    </button>
                    <button
                      onClick={() => setActionModal('reject')}
                      className="px-5 py-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 font-bold text-xs transition-all"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleAction(selectedSubmission.id, 'verified')}
                      className="px-6 py-3 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve KYC</span>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
