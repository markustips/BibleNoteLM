import React, { useState } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'alert' | 'success';
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', title: 'Service Time Change', message: 'Sunday service will start at 10:30 AM this week.', time: '2h ago', read: false, type: 'alert' },
  { id: '2', title: 'Prayer Request Update', message: 'John D. posted a praise report regarding his job.', time: '5h ago', read: false, type: 'info' },
  { id: '3', title: 'Volunteer Reminder', message: 'Don\'t forget the volunteer meeting tomorrow evening.', time: '1d ago', read: true, type: 'info' },
  { id: '4', title: 'Donation Received', message: 'Thank you for your generous tithe.', time: '2d ago', read: true, type: 'success' },
];

interface NotificationsPanelProps {
  onClose: () => void;
  onMarkAllRead: () => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ onClose, onMarkAllRead }) => {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const handleDismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleMarkRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" onClick={onClose}></div>
      
      {/* Panel */}
      <div className="relative w-full max-w-sm h-full bg-white dark:bg-[#101a22] shadow-2xl animate-slideInRight flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pt-safe px-4 pb-4 border-b border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-[#101a22]/95 backdrop-blur-md">
           <h2 className="text-lg font-bold text-slate-900 dark:text-white">Notifications</h2>
           <div className="flex items-center gap-1">
             <button 
               onClick={() => {
                   setNotifications(prev => prev.map(n => ({...n, read: true})));
                   onMarkAllRead();
               }}
               className="text-xs font-medium text-primary hover:text-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
             >
               Mark all read
             </button>
             <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
               <span className="material-symbols-outlined">close</span>
             </button>
           </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <span className="material-symbols-outlined text-4xl mb-2">notifications_off</span>
                <p>No notifications</p>
             </div>
          ) : (
            notifications.map(n => (
              <div 
                key={n.id} 
                className={`relative p-4 rounded-xl border transition-all ${
                  n.read 
                    ? 'bg-white dark:bg-card-dark border-gray-100 dark:border-gray-800 opacity-80' 
                    : 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30'
                }`}
                onClick={() => handleMarkRead(n.id)}
              >
                 <div className="flex gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!n.read ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                    <div className="flex-1">
                       <div className="flex justify-between items-start mb-1">
                          <h4 className={`text-sm ${!n.read ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-600 dark:text-slate-300'}`}>
                            {n.title}
                          </h4>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{n.time}</span>
                       </div>
                       <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed pr-6">
                         {n.message}
                       </p>
                    </div>
                    
                    {/* Dismiss Button */}
                    <button 
                      onClick={(e) => {
                          e.stopPropagation();
                          handleDismiss(n.id);
                      }}
                      className="absolute bottom-2 right-2 p-1.5 text-gray-300 hover:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                 </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPanel;