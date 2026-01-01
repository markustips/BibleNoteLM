import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/useUserStore';
import { useChurchStore } from '../stores/useChurchStore';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const JoinChurch: React.FC = () => {
  const navigate = useNavigate();
  const { joinChurch, churchId, churchName, leaveChurch } = useUserStore();
  const { validateChurchCode } = useChurchStore();
  
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = () => {
    if (!code.trim()) {
      setError('Please enter a church code');
      return;
    }
    
    const church = validateChurchCode(code.trim());
    
    if (church) {
      Haptics.impact({ style: ImpactStyle.Medium });
      joinChurch(church.code, church.name, church.id);
      setSuccess(true);
      setError('');
      setTimeout(() => navigate('/'), 1500);
    } else {
      Haptics.impact({ style: ImpactStyle.Heavy });
      setError('Invalid church code. Please check and try again.');
    }
  };
  
  const handleLeave = () => {
    if (confirm('Are you sure you want to leave this church? You will lose access to church-specific content.')) {
      Haptics.impact({ style: ImpactStyle.Medium });
      leaveChurch();
      navigate('/');
    }
  };

  // Already in a church - show church info
  if (churchId && churchName) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center gap-3 p-4 bg-white/95 dark:bg-[#101a22]/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
          <button 
            onClick={() => {
              Haptics.impact({ style: ImpactStyle.Light });
              navigate(-1);
            }}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-slate-700 dark:text-white">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white flex-1">My Church</h1>
        </div>
        
        <div className="p-4 space-y-6">
          {/* Current Church Card */}
          <div className="bg-white dark:bg-card-dark rounded-2xl p-6 border border-gray-100 dark:border-gray-800 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-primary text-4xl">church</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{churchName}</h2>
            <p className="text-sm text-slate-500 mt-1">You're a member of this church</p>
            
            <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
              <p className="text-xs text-slate-400 mb-1">Church Code</p>
              <p className="font-mono text-lg font-bold text-primary">{useUserStore.getState().churchCode}</p>
            </div>
          </div>
          
          {/* Leave Church */}
          <button 
            onClick={handleLeave}
            className="w-full py-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-xl transition-all active:scale-[0.98]"
          >
            Leave Church
          </button>
          
          <p className="text-xs text-slate-400 text-center">
            Leaving will remove your access to church announcements, events, and prayer requests.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 p-4 bg-white/95 dark:bg-[#101a22]/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <button 
          onClick={() => {
            Haptics.impact({ style: ImpactStyle.Light });
            navigate(-1);
          }}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="material-symbols-outlined text-slate-700 dark:text-white">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white flex-1">Join a Church</h1>
      </div>
      
      <div className="p-4 space-y-6">
        {/* Info Card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-primary text-3xl">group_add</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Connect with Your Church</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
            Enter the church code provided by your pastor or church admin to access church announcements, events, and community features.
          </p>
        </div>
        
        {/* Input */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Church Code</label>
          <input 
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError('');
            }}
            placeholder="Enter code (e.g., GRACE2024)"
            className="w-full p-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-0 text-slate-900 dark:text-white font-mono text-lg text-center tracking-wider uppercase"
            maxLength={20}
          />
          
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
          )}
          
          {success && (
            <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
              <span className="material-symbols-outlined">check_circle</span>
              <p className="text-sm font-medium">Successfully joined!</p>
            </div>
          )}
        </div>
        
        {/* Submit Button */}
        <button 
          onClick={handleSubmit}
          disabled={!code.trim() || success}
          className="w-full py-4 bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-[0.98]"
        >
          {success ? 'Redirecting...' : 'Join Church'}
        </button>
        
        {/* Demo hint */}
        <p className="text-xs text-slate-400 text-center">
          Demo code: <span className="font-mono font-bold">GRACE2024</span>
        </p>
      </div>
    </div>
  );
};

export default JoinChurch;
