
import React, { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import SearchModal from './SearchModal';
import NotificationsPanel from './NotificationsPanel';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // UI State
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2); // Mock initial unread count

  // Define the main navigation cycle order: Home -> Bible -> Events -> Prayer Journal -> Sermon Recorder -> Settings
  const NAV_CYCLE = ['/', '/bible', '/events', '/prayers', '/sermons', '/settings'];

  const isActive = (path: string) => {
    // Keep 'More' active for the nested routes if they are accessed
    if (path === '/more') {
        return ['/more', '/prayers', '/sermons', '/settings', '/profile', '/sermons/history'].includes(location.pathname) || location.pathname.startsWith('/sermons/history');
    }
    return location.pathname === path;
  };

  // Swipe Logic
  const touchStart = useRef<{x: number, y: number} | null>(null);
  const touchEnd = useRef<{x: number, y: number} | null>(null);
  const minSwipeDistance = 60; 

  const onTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null; 
    touchStart.current = {
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
    };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = {
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
    };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current || !touchEnd.current) return;
    
    const distanceX = touchStart.current.x - touchEnd.current.x;
    const distanceY = touchStart.current.y - touchEnd.current.y;
    
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;

    // 1. Must be a significant horizontal swipe
    if (!isLeftSwipe && !isRightSwipe) return;

    // 2. Ignore if vertical distance is greater than horizontal (user is likely scrolling down/up)
    if (Math.abs(distanceY) > Math.abs(distanceX)) return;
    
    // 3. Check if swipe was on a horizontally scrollable element
    let target = e.target as HTMLElement;
    let isScrollable = false;
    
    while (target && target !== e.currentTarget) {
        // We only check elements that are potentially scrollable (content wider than container)
        if (target.scrollWidth > target.clientWidth) {
            const style = window.getComputedStyle(target);
            // Check for overflow-x scroll/auto
            if (['auto', 'scroll'].includes(style.overflowX)) {
                 isScrollable = true;
                 break;
            }
        }
        target = target.parentElement as HTMLElement;
    }

    if (isScrollable) return;

    const currentIndex = NAV_CYCLE.indexOf(location.pathname);
    if (currentIndex === -1) return; // Not in the main cycle (e.g. detail pages)

    if (isLeftSwipe) {
        // Next
        if (currentIndex < NAV_CYCLE.length - 1) {
            Haptics.impact({ style: ImpactStyle.Light });
            navigate(NAV_CYCLE[currentIndex + 1]);
        }
    } else {
        // Previous
        if (currentIndex > 0) {
            Haptics.impact({ style: ImpactStyle.Light });
            navigate(NAV_CYCLE[currentIndex - 1]);
        }
    }
  };

  return (
    <>
      <div 
          className="relative flex min-h-screen w-full flex-col group/design-root overflow-x-hidden pb-24 bg-background-light dark:bg-background-dark touch-pan-y"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
      >
        {/* Header */}
        <header className="sticky top-0 z-50 flex items-center bg-white/90 dark:bg-[#101a22]/90 backdrop-blur-md px-4 pt-safe pb-3 justify-between border-b border-gray-100 dark:border-gray-800">
          <h1 className="text-[#111518] dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center">
            BibleNoteLM
          </h1>
          <div className="flex items-center justify-end gap-1">
            <button 
              onClick={() => {
                Haptics.impact({ style: ImpactStyle.Light });
                setShowSearch(true);
              }}
              className="flex items-center justify-center text-[#111518] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-full transition-colors"
            >
              <span className="material-symbols-outlined">search</span>
            </button>
            <button 
              onClick={() => {
                Haptics.impact({ style: ImpactStyle.Light });
                setShowNotifications(true);
              }}
              className="flex items-center justify-center text-[#111518] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-full transition-colors relative"
            >
              <span className="material-symbols-outlined">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-[#101a22]"></span>
              )}
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full">
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 w-full bg-white/95 dark:bg-[#101a22]/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 pb-safe z-40">
          <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
            <Link to="/" onClick={() => Haptics.impact({ style: ImpactStyle.Light })} className={`flex flex-col items-center justify-center w-full h-full gap-1 ${isActive('/') ? 'text-primary' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}`}>
              <span className={`material-symbols-outlined text-[26px] ${isActive('/') ? 'filled' : ''}`}>home</span>
              <span className="text-[10px] font-medium">Home</span>
            </Link>
            <Link to="/bible" onClick={() => Haptics.impact({ style: ImpactStyle.Light })} className={`flex flex-col items-center justify-center w-full h-full gap-1 ${isActive('/bible') ? 'text-primary' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}`}>
              <span className={`material-symbols-outlined text-[26px] ${isActive('/bible') ? 'filled' : ''}`}>auto_stories</span>
              <span className="text-[10px] font-medium">Bible</span>
            </Link>
            <Link to="/events" onClick={() => Haptics.impact({ style: ImpactStyle.Light })} className={`flex flex-col items-center justify-center w-full h-full gap-1 ${isActive('/events') ? 'text-primary' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}`}>
              <span className={`material-symbols-outlined text-[26px] ${isActive('/events') ? 'filled' : ''}`}>calendar_month</span>
              <span className="text-[10px] font-medium">Events</span>
            </Link>
            <Link to="/more" onClick={() => Haptics.impact({ style: ImpactStyle.Light })} className={`flex flex-col items-center justify-center w-full h-full gap-1 ${isActive('/more') ? 'text-primary' : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'}`}>
              <span className={`material-symbols-outlined text-[26px] ${isActive('/more') ? 'filled' : ''}`}>more_horiz</span>
              <span className="text-[10px] font-medium">More</span>
            </Link>
          </div>
        </nav>
      </div>

      {/* Overlays */}
      {showSearch && (
        <SearchModal onClose={() => setShowSearch(false)} />
      )}

      {showNotifications && (
        <NotificationsPanel 
          onClose={() => setShowNotifications(false)} 
          onMarkAllRead={() => setUnreadCount(0)}
        />
      )}
    </>
  );
};

export default Layout;
