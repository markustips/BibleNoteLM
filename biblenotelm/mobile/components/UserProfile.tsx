import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/useUserStore';

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const { name, email, avatar, updateUser } = useUserStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(name);
  const [tempEmail, setTempEmail] = useState(email);
  const [isSaving, setIsSaving] = useState(false);
  
  // Ref for file input (mocking image upload)
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      updateUser({ name: tempName, email: tempEmail });
      setIsEditing(false);
      setIsSaving(false);
    }, 800);
  };

  const handleCancel = () => {
    setTempName(name);
    setTempEmail(email);
    setIsEditing(false);
  };

  const handleImageClick = () => {
    if (isEditing && fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen pb-safe">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 p-4 bg-white/95 dark:bg-[#101a22]/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="material-symbols-outlined text-slate-700 dark:text-white">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white flex-1 text-center pr-8">My Profile</h1>
      </div>

      <div className="p-6 flex flex-col items-center">
        {/* Avatar Section */}
        <div className="relative mb-8 group">
            <div 
                className={`w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl ${isEditing ? 'cursor-pointer' : ''}`}
                onClick={handleImageClick}
            >
                <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                {isEditing && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-3xl">camera_alt</span>
                    </div>
                )}
            </div>
            {/* Hidden file input for mock upload */}
            <input type="file" ref={fileInputRef} className="hidden" />
            
            {!isEditing && (
                <div className="absolute bottom-1 right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 text-white shadow-sm">
                     <span className="material-symbols-outlined text-[16px]">verified</span>
                </div>
            )}
        </div>

        {/* Form Section */}
        <div className="w-full max-w-md space-y-6 bg-white dark:bg-card-dark p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            {/* Name Field */}
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                {isEditing ? (
                    <input 
                        type="text" 
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white font-medium"
                    />
                ) : (
                    <div className="flex items-center gap-3">
                         <h2 className="text-xl font-bold text-slate-900 dark:text-white">{name}</h2>
                    </div>
                )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                {isEditing ? (
                    <input 
                        type="email" 
                        value={tempEmail}
                        onChange={(e) => setTempEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white font-medium"
                    />
                ) : (
                    <div className="flex items-center gap-3">
                         <p className="text-base text-slate-600 dark:text-slate-300">{email}</p>
                    </div>
                )}
            </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-md mt-8">
            {isEditing ? (
                <div className="flex gap-4">
                    <button 
                        onClick={handleCancel}
                        className="flex-1 py-3.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                        {isSaving && <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            ) : (
                <button 
                    onClick={() => setIsEditing(true)}
                    className="w-full py-3.5 rounded-xl bg-white dark:bg-card-dark border border-gray-200 dark:border-gray-700 text-primary font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                >
                    Edit Profile
                </button>
            )}

            {!isEditing && (
                 <button className="w-full mt-4 py-3.5 rounded-xl text-red-500 font-medium hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-sm">
                    Sign Out
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;