import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSermonHistoryStore } from '../stores/useSermonHistoryStore';

const SermonList: React.FC = () => {
  const navigate = useNavigate();
  const { sermons, deleteSermon } = useSermonHistoryStore();

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this recording?')) {
        deleteSermon(id);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen pb-safe">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 p-4 bg-white/95 dark:bg-[#101a22]/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <button 
          onClick={() => navigate('/')} 
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="material-symbols-outlined text-slate-700 dark:text-white">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white flex-1">Sermon Library</h1>
      </div>

      <div className="p-4 space-y-4">
        {sermons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <span className="material-symbols-outlined text-5xl mb-4 opacity-50">mic_off</span>
                <p className="font-medium">No recordings yet</p>
                <button 
                    onClick={() => navigate('/sermons')}
                    className="mt-4 text-primary font-bold hover:underline"
                >
                    Record your first sermon
                </button>
            </div>
        ) : (
            sermons.map((sermon) => (
                <div 
                    key={sermon.id}
                    onClick={() => navigate(`/sermons/history/${sermon.id}`)}
                    className="group bg-white dark:bg-card-dark p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 active:scale-[0.98] transition-all cursor-pointer"
                >
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight mb-1">{sermon.title}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                {sermon.date}
                            </p>
                        </div>
                        <button 
                            onClick={(e) => handleDelete(e, sermon.id)}
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                            <span className="material-symbols-outlined text-[16px]">schedule</span>
                            <span className="text-xs font-bold">{sermon.duration}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                            <span className="material-symbols-outlined text-[16px]">edit_note</span>
                            <span className="text-xs font-bold">{sermon.notes.length} Notes</span>
                        </div>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default SermonList;