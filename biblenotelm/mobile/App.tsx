
import React from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Layout from './components/Layout';
import DailyVerse from './components/DailyVerse';
import UpcomingEvents from './components/UpcomingEvents';
import Events from './components/Events';
import SermonRecorder from './components/SermonRecorder';
import SermonList from './components/SermonList';
import SermonDetail from './components/SermonDetail';
import BibleReader from './components/BibleReader';
import PrayerJournal from './components/PrayerJournal';
import NotesList from './components/NotesList';
import EventDetails from './components/EventDetails';
import UserProfile from './components/UserProfile';
import Settings from './components/Settings';
import SettingsPage from './components/SettingsPage';
import AdminDashboard from './components/AdminDashboard';
import JoinChurch from './components/JoinChurch';
import SubscriptionPage from './components/SubscriptionPage';
import { useUserStore } from './stores/useUserStore';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Announcements Component with Slide Effect
const Announcements = () => (
  <section className="py-4">
    <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-[#111518] dark:text-white text-lg font-bold leading-tight">Announcements</h2>
        <span className="text-xs text-primary font-medium">Swipe for more</span>
    </div>
    <div 
      className="flex overflow-x-auto gap-4 px-4 pb-4 hide-scrollbar snap-x snap-mandatory scroll-smooth"
    >
      {/* Announcement 1 */}
      <Link to="/events/ann-1" className="snap-start shrink-0 w-[280px] h-[160px] relative rounded-xl overflow-hidden group shadow-md transition-all">
        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCTKwmERj_lTYjmJ3cUDiA8SAfubaFghrFdxKPxEBGJn3DSoDRWz56l2FOk_S9RwLdlMl8uiGGV25DilweThaldzga77peCjkJgXNKVOtffFB1r-dBYLgesXxy_Vd1vxibk_8SMm0snwEdXF9oZMLSKy-le-ICoDcGKU10D0dq4vxVOyZargc5U6L2DE9Yx-X8sgGZdmpeclMyN5cHCxIO3Z-XAXXv8ck4zP15nd7-gRFe_y1ro9Fw0q-KaUnhaDJCHm55FgRLuSzz1")'}}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-4 w-full">
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-primary text-white mb-2 shadow-sm">Community</span>
          <h3 className="text-white text-base font-bold leading-tight shadow-sm">Church Picnic</h3>
          <p className="text-white/90 text-xs mt-1 font-medium">Sat, 2pm • Central Park</p>
        </div>
      </Link>
      
      {/* Announcement 2 */}
      <Link to="/events/ann-2" className="snap-start shrink-0 w-[280px] h-[160px] relative rounded-xl overflow-hidden group shadow-md transition-all">
        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCMDXbQHPRD32aAhzMX9M6ggDIWKTG-lSWcZ5yOibyVuDw2MCGL1ZnV2q5ik8JeDcHz748_iopXNTaf2nhXmda4NX7Fv5ILAc1IUUuXyZhZemJjuAE1XHZ_kn4SjHva669YS28DchYGtxBj9lYMr9VlVLSjQ2Y9-XvEc30rOJZX3kmWOUr6fwLuW4qxc6s1xeuAGD4Et8VoiOtLNk7EabX2JunqIDsYzwst3E1ZBoHaOg2bzc82576THMIpB84zUifS_7yogi72a8FI")'}}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-4 w-full">
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500 text-white mb-2 shadow-sm">Series</span>
          <h3 className="text-white text-base font-bold leading-tight shadow-sm">New Series: "Hope"</h3>
          <p className="text-white/90 text-xs mt-1 font-medium">Starts Sunday • 9am & 11am</p>
        </div>
      </Link>

      {/* Announcement 3 */}
      <Link to="/events/ann-3" className="snap-start shrink-0 w-[280px] h-[160px] relative rounded-xl overflow-hidden group shadow-md transition-all">
        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" style={{backgroundImage: 'url("https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=1000&auto=format&fit=crop")'}}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-4 w-full">
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500 text-white mb-2 shadow-sm">Outreach</span>
          <h3 className="text-white text-base font-bold leading-tight shadow-sm">Food Drive</h3>
          <p className="text-white/90 text-xs mt-1 font-medium">Collecting canned goods all month</p>
        </div>
      </Link>

      {/* Spacer for scroll padding */}
      <div className="w-2 shrink-0"></div>
    </div>
  </section>
);

// Quick Actions Component - Role-based visibility
const QuickActions = () => {
  const { can, subscriptionTier } = useUserStore();
  const canRecordSermon = can('record_sermon') || subscriptionTier !== 'free';
  const canManageChurch = can('manage_announcements');
  
  return (
  <section className="px-4 py-2">
    <h2 className="text-[#111518] dark:text-white text-lg font-bold leading-tight mb-3">Quick Actions</h2>
    <div className="flex overflow-x-auto gap-3 pb-2 hide-scrollbar">
      {/* Record Sermon - Only for subscribers or pastor/admin */}
      {canRecordSermon ? (
        <Link to="/sermons" onClick={() => Haptics.impact({ style: ImpactStyle.Light })} className="shrink-0 w-[110px] group flex flex-col items-center gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-700 hover:border-primary/30 transition-all active:scale-95">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-primary dark:bg-slate-700 dark:text-blue-400 group-hover:bg-primary group-hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[24px]">mic</span>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center border border-white dark:border-slate-800" title="AI Powered">
              <span className="material-symbols-outlined text-[10px] text-yellow-900">auto_awesome</span>
            </span>
          </div>
          <span className="text-xs font-medium text-center text-gray-700 dark:text-gray-300 leading-tight">Record Sermon</span>
        </Link>
      ) : (
        <Link to="/subscription" onClick={() => Haptics.impact({ style: ImpactStyle.Light })} className="shrink-0 w-[110px] group flex flex-col items-center gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-700 hover:border-yellow-400/30 transition-all active:scale-95">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400 group-hover:bg-yellow-400 group-hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[24px]">mic</span>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center border border-white dark:border-slate-800">
              <span className="material-symbols-outlined text-[10px] text-yellow-900">lock</span>
            </span>
          </div>
          <span className="text-xs font-medium text-center text-gray-700 dark:text-gray-300 leading-tight">Record Sermon</span>
        </Link>
      )}
      
      <Link to="/bible" onClick={() => Haptics.impact({ style: ImpactStyle.Light })} className="shrink-0 w-[110px] group flex flex-col items-center gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-700 hover:border-primary/30 transition-all active:scale-95">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-primary dark:bg-slate-700 dark:text-blue-400 group-hover:bg-primary group-hover:text-white transition-colors">
          <span className="material-symbols-outlined text-[24px]">menu_book</span>
        </div>
        <span className="text-xs font-medium text-center text-gray-700 dark:text-gray-300 leading-tight">Read Bible</span>
      </Link>
      
      <Link to="/prayers" onClick={() => Haptics.impact({ style: ImpactStyle.Light })} className="shrink-0 w-[110px] group flex flex-col items-center gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-700 hover:border-primary/30 transition-all active:scale-95">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-primary dark:bg-slate-700 dark:text-blue-400 group-hover:bg-primary group-hover:text-white transition-colors">
          <span className="material-symbols-outlined text-[24px]">edit_note</span>
        </div>
        <span className="text-xs font-medium text-center text-gray-700 dark:text-gray-300 leading-tight">Prayer Journal</span>
      </Link>

      <Link to="/notes" onClick={() => Haptics.impact({ style: ImpactStyle.Light })} className="shrink-0 w-[110px] group flex flex-col items-center gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-700 hover:border-primary/30 transition-all active:scale-95">
        <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-primary dark:bg-slate-700 dark:text-blue-400 group-hover:bg-primary group-hover:text-white transition-colors">
          <span className="material-symbols-outlined text-[24px]">note_stack</span>
          {(subscriptionTier === 'premium' || subscriptionTier === 'basic') && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center border border-white dark:border-slate-800" title="AI Powered">
              <span className="material-symbols-outlined text-[10px] text-yellow-900">auto_awesome</span>
            </span>
          )}
        </div>
        <span className="text-xs font-medium text-center text-gray-700 dark:text-gray-300 leading-tight">Bible Notes</span>
      </Link>

      <Link to="/sermons/history" onClick={() => Haptics.impact({ style: ImpactStyle.Light })} className="shrink-0 w-[110px] group flex flex-col items-center gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-700 hover:border-primary/30 transition-all active:scale-95">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-primary dark:bg-slate-700 dark:text-blue-400 group-hover:bg-primary group-hover:text-white transition-colors">
          <span className="material-symbols-outlined text-[24px]">history</span>
        </div>
        <span className="text-xs font-medium text-center text-gray-700 dark:text-gray-300 leading-tight">Sermon Library</span>
      </Link>
      
      {/* Admin Dashboard - Only for pastor/admin */}
      {canManageChurch && (
        <Link to="/admin" onClick={() => Haptics.impact({ style: ImpactStyle.Light })} className="shrink-0 w-[110px] group flex flex-col items-center gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-700 hover:border-indigo-400/30 transition-all active:scale-95">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[24px]">dashboard</span>
          </div>
          <span className="text-xs font-medium text-center text-gray-700 dark:text-gray-300 leading-tight">Dashboard</span>
        </Link>
      )}
      
      {/* Spacer for padding at end of list */}
      <div className="w-1 shrink-0"></div>
    </div>
  </section>
  );
};

// Home Page Composition
const HomePage = () => (
  <div className="w-full">
    <DailyVerse />
    <QuickActions />
    <UpcomingEvents />
    <Announcements />
  </div>
);

const MoreTab = () => {
    const { name, avatar, email } = useUserStore();
    return (
        <div className="px-4 py-6 pb-20">
            <h2 className="text-2xl font-bold mb-4 dark:text-white">More</h2>
            
            {/* Profile Summary Card */}
            <Link to="/profile" className="flex items-center gap-4 p-4 mb-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-primary/50 transition-colors">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/20">
                    <img src={avatar} alt={name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white truncate">{name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{email}</p>
                </div>
                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </Link>

            <div className="space-y-2">
            <Link to="/prayers" className="block p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-slate-700 flex items-center justify-center text-primary dark:text-blue-400">
                    <span className="material-symbols-outlined text-[20px]">edit_note</span>
                    </div>
                    <span className="font-medium text-slate-700 dark:text-slate-200">Prayer Journal</span>
                </div>
                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </Link>
            <Link to="/notes" className="block p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-slate-700 flex items-center justify-center text-primary dark:text-blue-400">
                    <span className="material-symbols-outlined text-[20px]">note_stack</span>
                    </div>
                    <span className="font-medium text-slate-700 dark:text-slate-200">Bible Notes</span>
                </div>
                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </Link>
            <Link to="/sermons" className="block p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-slate-700 flex items-center justify-center text-primary dark:text-blue-400">
                    <span className="material-symbols-outlined text-[20px]">mic</span>
                    </div>
                    <span className="font-medium text-slate-700 dark:text-slate-200">Sermon Recorder</span>
                </div>
                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </Link>
            <Link to="/sermons/history" className="block p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-slate-700 flex items-center justify-center text-primary dark:text-blue-400">
                    <span className="material-symbols-outlined text-[20px]">history</span>
                    </div>
                    <span className="font-medium text-slate-700 dark:text-slate-200">Sermon Library</span>
                </div>
                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </Link>
            <Link to="/settings" className="block p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-slate-700 flex items-center justify-center text-primary dark:text-blue-400">
                    <span className="material-symbols-outlined text-[20px]">settings</span>
                    </div>
                    <span className="font-medium text-slate-700 dark:text-slate-200">Settings</span>
                </div>
                <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </Link>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/sermons" element={
            <div className="px-4 py-6">
               <SermonRecorder />
            </div>
          } />
          <Route path="/sermons/history" element={<SermonList />} />
          <Route path="/sermons/history/:id" element={<SermonDetail />} />
          <Route path="/bible" element={
            <div className="h-[calc(100vh-8rem)]">
              <BibleReader />
            </div>
          } />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/prayers" element={
            <div className="h-[calc(100vh-8rem)] px-4 py-6">
              <PrayerJournal />
            </div>
          } />
          <Route path="/notes" element={<NotesList />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/backup" element={<SettingsPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/join-church" element={<JoinChurch />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/more" element={<MoreTab />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
