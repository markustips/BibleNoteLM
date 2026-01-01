import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye, EyeOff, Users, Bell, Calendar, Settings as SettingsIcon } from 'lucide-react';
import { useChurchStore } from '../stores/useChurchStore';
import { useUserStore } from '../stores/useUserStore';
import { Announcement } from '../types';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const ANNOUNCEMENT_CATEGORIES = ['General', 'Community', 'Youth', 'Series', 'Urgent'] as const;

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { role, churchName, can } = useUserStore();
  const { 
    announcements, 
    events, 
    currentChurch,
    addAnnouncement, 
    updateAnnouncement, 
    deleteAnnouncement,
    toggleAnnouncementActive,
    deleteEvent 
  } = useChurchStore();
  
  const [activeTab, setActiveTab] = useState<'announcements' | 'events' | 'members'>('announcements');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  
  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<typeof ANNOUNCEMENT_CATEGORIES[number]>('General');
  const [formImage, setFormImage] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  
  const churchAnnouncements = announcements.filter(a => a.churchId === currentChurch?.id);
  
  const handleTabChange = (tab: typeof activeTab) => {
    Haptics.impact({ style: ImpactStyle.Light });
    setActiveTab(tab);
  };
  
  const openAddModal = () => {
    Haptics.impact({ style: ImpactStyle.Light });
    setEditingAnnouncement(null);
    setFormTitle('');
    setFormContent('');
    setFormCategory('General');
    setFormImage('');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setShowAddModal(true);
  };
  
  const openEditModal = (announcement: Announcement) => {
    Haptics.impact({ style: ImpactStyle.Light });
    setEditingAnnouncement(announcement);
    setFormTitle(announcement.title);
    setFormContent(announcement.content);
    setFormCategory(announcement.category);
    setFormImage(announcement.image || '');
    setFormStartDate(announcement.startDate);
    setShowAddModal(true);
  };
  
  const handleSave = () => {
    if (!formTitle.trim() || !formContent.trim()) return;
    
    Haptics.impact({ style: ImpactStyle.Medium });
    
    if (editingAnnouncement) {
      updateAnnouncement(editingAnnouncement.id, {
        title: formTitle,
        content: formContent,
        category: formCategory,
        image: formImage || undefined,
        startDate: formStartDate,
      });
    } else {
      addAnnouncement({
        churchId: currentChurch?.id || '',
        title: formTitle,
        content: formContent,
        category: formCategory,
        image: formImage || undefined,
        startDate: formStartDate,
        isActive: true,
        createdBy: 'user-1',
      });
    }
    
    setShowAddModal(false);
  };
  
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      Haptics.impact({ style: ImpactStyle.Medium });
      deleteAnnouncement(id);
    }
  };
  
  const handleToggleActive = (id: string) => {
    Haptics.impact({ style: ImpactStyle.Light });
    toggleAnnouncementActive(id);
  };

  if (!can('manage_announcements')) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">lock</span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-4">You don't have permission to access the dashboard.</p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary text-white font-bold rounded-xl"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-[#101a22]/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 p-4">
          <button 
            onClick={() => {
              Haptics.impact({ style: ImpactStyle.Light });
              navigate(-1);
            }}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-slate-700 dark:text-white">arrow_back</span>
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Church Dashboard</h1>
            <p className="text-xs text-slate-500">{churchName}</p>
          </div>
          <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full capitalize">{role}</span>
        </div>
        
        {/* Tabs */}
        <div className="flex px-4 gap-6 border-t border-gray-50 dark:border-gray-800">
          <button 
            onClick={() => handleTabChange('announcements')}
            className={`py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'announcements' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Bell className="w-4 h-4" />
            Announcements
          </button>
          <button 
            onClick={() => handleTabChange('events')}
            className={`py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'events' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Events
          </button>
          {can('view_members') && (
            <button 
              onClick={() => handleTabChange('members')}
              className={`py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'members' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <Users className="w-4 h-4" />
              Members
            </button>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {activeTab === 'announcements' && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{churchAnnouncements.filter(a => a.isActive).length}</p>
                <p className="text-xs text-slate-500">Active</p>
              </div>
              <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{churchAnnouncements.length}</p>
                <p className="text-xs text-slate-500">Total</p>
              </div>
            </div>
            
            {/* List */}
            <div className="space-y-3">
              {churchAnnouncements.map(announcement => (
                <div 
                  key={announcement.id}
                  className={`bg-white dark:bg-card-dark p-4 rounded-xl border transition-all ${
                    announcement.isActive 
                      ? 'border-gray-100 dark:border-gray-800' 
                      : 'border-gray-200 dark:border-gray-700 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          announcement.category === 'Urgent' 
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {announcement.category}
                        </span>
                        {!announcement.isActive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                            Hidden
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white truncate">{announcement.title}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2 mt-1">{announcement.content}</p>
                      <p className="text-xs text-slate-400 mt-2">Starts: {announcement.startDate}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={() => handleToggleActive(announcement.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          announcement.isActive 
                            ? 'bg-green-50 text-green-600 dark:bg-green-900/20' 
                            : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                        }`}
                      >
                        {announcement.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => openEditModal(announcement)}
                        className="p-2 rounded-lg bg-blue-50 text-primary dark:bg-blue-900/20"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(announcement.id)}
                        className="p-2 rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {churchAnnouncements.length === 0 && (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-slate-500">No announcements yet</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'events' && (
          <div className="space-y-3">
            {events.map(event => (
              <div 
                key={event.id}
                className="bg-white dark:bg-card-dark p-4 rounded-xl border border-gray-100 dark:border-gray-800"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary mb-1 inline-block">
                      {event.type}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white">{event.title}</h3>
                    <p className="text-sm text-slate-500">{event.date} • {event.time}</p>
                    <p className="text-xs text-slate-400">{event.location}</p>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-2 rounded-lg bg-blue-50 text-primary dark:bg-blue-900/20">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteEvent(event.id)}
                      className="p-2 rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activeTab === 'members' && (
          <div className="space-y-3">
            <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{currentChurch?.memberIds.length || 0}</p>
              <p className="text-sm text-slate-500">Total Members</p>
            </div>
            <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">Church Code</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-gray-100 dark:bg-slate-800 rounded-lg font-mono text-primary">
                  {currentChurch?.code}
                </code>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(currentChurch?.code || '');
                    Haptics.impact({ style: ImpactStyle.Light });
                  }}
                  className="p-2 bg-primary text-white rounded-lg"
                >
                  <span className="material-symbols-outlined text-[20px]">content_copy</span>
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2">Share this code with members to join your church</p>
            </div>
          </div>
        )}
      </div>
      
      {/* FAB */}
      {activeTab === 'announcements' && (
        <button 
          onClick={openAddModal}
          className="fixed bottom-24 right-4 w-14 h-14 bg-primary hover:bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-300/50 flex items-center justify-center transition-transform active:scale-95 z-20"
        >
          <Plus className="w-8 h-8" />
        </button>
      )}
      
      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={() => setShowAddModal(false)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-[#1e293b] rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slideUp overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <span className="material-symbols-outlined text-slate-500">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Title */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Title</label>
                <input 
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Announcement title..."
                  className="w-full mt-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white"
                />
              </div>
              
              {/* Category */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {ANNOUNCEMENT_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFormCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                        formCategory === cat 
                          ? 'bg-primary text-white' 
                          : 'bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Content */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Content</label>
                <textarea 
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Write your announcement..."
                  className="w-full mt-2 h-24 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white resize-none"
                />
              </div>
              
              {/* Image URL */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Image URL (optional)</label>
                <input 
                  type="url"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full mt-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white"
                />
              </div>
              
              {/* Start Date */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
                <input 
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="w-full mt-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-[#1e293b] pb-safe">
              <button 
                onClick={handleSave}
                disabled={!formTitle.trim() || !formContent.trim()}
                className="w-full py-4 bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-[0.98]"
              >
                {editingAnnouncement ? 'Save Changes' : 'Create Announcement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
