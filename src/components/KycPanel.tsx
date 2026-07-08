import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Upload, FileText, CheckCircle, AlertTriangle, Cloud } from 'lucide-react';

export default function KycPanel({ theme }: { theme: 'light' | 'dark' }) {
  const { user, updateUserKyc } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === 'dark';

  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textSecondary = isDark ? "text-slate-400" : "text-slate-500";
  const cardClasses = isDark
    ? "bg-slate-900/40 backdrop-blur-md border border-white/5"
    : "bg-white border border-slate-200/50 shadow-md";

  // Drag-and-drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const processFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/') && selectedFile.type !== 'application/pdf') {
      alert('Only images and PDF documents are supported for identity verification.');
      return;
    }
    setFile(selectedFile);

    // Generate Base64 Preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUploadSubmit = async () => {
    if (!preview) return;
    setUploading(true);
    try {
      // Securely store preview dataURL in Firestore (representing Cloud Storage path)
      await updateUserKyc(preview);
    } catch (err) {
      console.error(err);
      alert('Verification submission failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`rounded-3xl p-6 ${cardClasses} space-y-6`}>
      <div className="flex items-start space-x-3 pb-4 border-b border-slate-500/10">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h4 className={`text-base font-black tracking-tight ${textPrimary}`}>KYC Identity Verification</h4>
          <p className={`text-xs ${textSecondary}`}>Required under international compliance to unlock withdrawals and premium trade scripts.</p>
        </div>
      </div>

      {user?.kycStatus === 'verified' && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-start space-x-3 text-xs font-bold leading-normal">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <h5 className="font-extrabold">Identity Fully Verified</h5>
            <p className="text-[11px] text-emerald-400/80 mt-0.5 font-medium">Your account limits are lifted. You have unlimited deposits, withdrawals, and pro bot accesses.</p>
          </div>
        </div>
      )}

      {user?.kycStatus === 'pending' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-start space-x-3 text-xs font-bold leading-normal">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-pulse" />
          <div>
            <h5 className="font-extrabold">Verification Document Under Review</h5>
            <p className="text-[11px] text-amber-400/80 mt-0.5 font-medium">Compliance officers are actively reviewing your photo ID and proof of residence. Standard time: 4-6 hours.</p>
          </div>
        </div>
      )}

      {user?.kycStatus === 'unverified' && (
        <div className="space-y-4">
          <p className={`text-xs leading-relaxed ${textSecondary}`}>
            Upload a high-quality photo of your government-issued passport, national identity card, or driver’s license. Make sure all text is fully visible.
          </p>

          {/* Drag and Drop Zone */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              dragging
                ? 'border-indigo-500 bg-indigo-500/5'
                : isDark
                ? 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              className="hidden" 
              accept="image/*,application/pdf"
            />
            {preview ? (
              <div className="space-y-3">
                <div className="h-28 max-w-xs mx-auto rounded-lg overflow-hidden border border-white/10 relative">
                  {preview.startsWith('data:application/pdf') ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400">
                      <FileText className="w-8 h-8" />
                      <span className="text-[10px] font-mono mt-1">PDF File</span>
                    </div>
                  ) : (
                    <img src={preview} alt="ID preview" className="w-full h-full object-cover" />
                  )}
                </div>
                <p className={`text-xs font-bold ${textPrimary}`}>{file?.name}</p>
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreview(null);
                    setFile(null);
                  }}
                  className="text-xs text-red-500 hover:underline font-bold"
                >
                  Remove Document
                </button>
              </div>
            ) : (
              <div className="space-y-2 py-4">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <p className={`text-xs font-bold ${textPrimary}`}>Drag and drop document, or <span className="text-indigo-500 underline">browse</span></p>
                  <p className="text-[10px] text-slate-500 mt-1">JPEG, PNG or PDF (Max 10MB)</p>
                </div>
              </div>
            )}
          </div>

          {/* Upload and Submit Button */}
          {preview && (
            <button
              onClick={handleUploadSubmit}
              disabled={uploading}
              className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer"
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Submit Securely</span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
