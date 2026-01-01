import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Link } from 'react-router-dom';

// Data Interfaces
interface EventData {
  id: string;
  title: string;
  description?: string;
  time: string;
  location?: string; // Short location
  month: string;
  day: string;
  color: string;
  image?: string;
  isFeatured?: boolean;
  isSaved?: boolean;
}

// Centralized Mock Data
const ALL_MOCK_EVENTS: EventData[] = [
  {
    id: '3',
    title: "Special Sunday Service",
    description: "Join us for a celebration with special musical guests.",
    time: "9:00 AM & 11:00 AM",
    month: "Oct",
    day: "14",
    color: "text-primary",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDN1nS1EYFukMWUghWnfGyFFFJaBD8i_zs4ETsltyCr3wwpAZ8tJ0J0VVRb2LUcETcrGDg6l5Ghc2PDsW-ayOf1RLlf6lD9xR-jRMJ9ueksqp2WFfypTrmIinSW8u66s8mHPAgxsawK78qW_sIuzIiS2-b_unC-rH39pgGzE46monZGuEFh3TLI0TYloGklD5VygOXhhMRE-qY2DPgNRlYAFnKId9zhBLRko4yF5FQkDAKSjyq813qpvCsf3ntHlpa99xGj4eZDx6TH",
    isFeatured: true,
    isSaved: false
  },
  {
    id: '1',
    title: "Wednesday Night Bible Study",
    time: "7:00 PM",
    location: "Main Hall",
    month: "Oct",
    day: "24",
    color: "text-red-500",
    isFeatured: false,
    isSaved: false
  },
  {
    id: '2',
    title: "Youth Group Hangout",
    time: "6:30 PM",
    location: "The Loft",
    month: "Oct",
    day: "26",
    color: "text-primary",
    isFeatured: false,
    isSaved: true
  },
  {
    id: '4',
    title: "Community Potluck",
    time: "5:00 PM",
    location: "Courtyard",
    month: "Nov",
    day: "02",
    color: "text-orange-500",
    isFeatured: false,
    isSaved: true
  },
  {
    id: '5',
    title: "Worship Night",
    time: "8:00 PM",
    location: "Chapel",
    month: "Nov",
    day: "05",
    color: "text-purple-500",
    isFeatured: false,
    isSaved: false
  }
];

const NOTICES = [
  {
    id: 1,
    title: "Volunteer Meeting Moved",
    content: "Please note the time change for this week's coordination meeting. We will meet in Room 3B.",
    priority: true
  },
  {
    id: 2,
    title: "Food Drive Results",
    content: "We collected over 500lbs of food! Thank you to everyone who contributed to the community pantry.",
    priority: false
  }
];

const Events: React.FC = () => {
  const [activeTab, setActiveTab] = useState('This Week');
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  
  // Date Range State
  const [dateRange, setDateRange] = useState<{ start: number | null; end: number | null }>({
    start: null,
    end: null
  });

  // Filter helpers
  const featuredEvent = ALL_MOCK_EVENTS.find(e => e.isFeatured);
  const upcomingThisWeek = ALL_MOCK_EVENTS.filter(e => !e.isFeatured && e.month === 'Oct'); // Simple filter for demo
  const allEvents = ALL_MOCK_EVENTS;
  const savedEvents = ALL_MOCK_EVENTS.filter(e => e.isSaved);

  // Calendar Helpers
  // Just for demo, we'll assume October 2023 starts on a Sunday (it actually does!)
  const daysInMonth = 31;
  const startDayOffset = 0; // Sunday = 0
  
  // Memoized filtered events based on range
  const selectedDateEvents = useMemo(() => {
    if (!dateRange.start) return [];

    return ALL_MOCK_EVENTS.filter(e => {
        if (e.month !== 'Oct') return false; // Demo limited to Oct for calendar interaction
        const dayNum = parseInt(e.day);
        
        if (dateRange.end) {
            return dayNum >= dateRange.start! && dayNum <= dateRange.end;
        }
        return dayNum === dateRange.start;
    }).sort((a, b) => parseInt(a.day) - parseInt(b.day));
  }, [dateRange]);

  const handleDateClick = (day: number) => {
    if (!dateRange.start || (dateRange.start && dateRange.end)) {
        // Start new range
        setDateRange({ start: day, end: null });
    } else {
        // Complete range
        if (day < dateRange.start) {
            setDateRange({ start: day, end: dateRange.start });
        } else {
            setDateRange({ ...dateRange, end: day });
        }
    }
  };

  const clearDateFilter = () => {
    setDateRange({ start: null, end: null });
  };

  // Gemini Integration for Summary
  const handleSummarize = async () => {
    if (summary) return;
    setLoadingSummary(true);
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        setSummary("API Key required for AI summary.");
        setLoadingSummary(false);
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `Summarize the following church schedule for this week:
      Featured: ${featuredEvent?.title} - ${featuredEvent?.description}.
      Upcoming: ${upcomingThisWeek.map(e => `${e.title} on ${e.month} ${e.day} at ${e.time}`).join('. ')}.
      Notices: ${NOTICES.map(n => n.title).join(', ')}.
      
      Keep it brief, friendly and inviting (under 40 words).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setSummary(response.text || "Join us this week for the Special Service and Bible Study! Don't miss out.");
    } catch (e) {
      console.error(e);
      setSummary("Unable to generate summary right now.");
    } finally {
      setLoadingSummary(false);
    }
  };

  const renderEventList = (events: EventData[], emptyMessage: string) => {
      if (events.length === 0) {
          return (
              <div className="flex flex-col items-center justify-center py-12 px-4 opacity-50">
                  <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">event_busy</span>
                  <p className="text-gray-500 font-medium text-center">{emptyMessage}</p>
              </div>
          );
      }
      return (
        <div className="flex flex-col gap-3 px-4 py-4">
            {events.map(event => (
              <Link to={`/events/${event.id}`} key={event.id} className="group flex items-center gap-4 bg-white dark:bg-[#1a2630] px-4 py-3 justify-between hover:bg-gray-50 dark:hover:bg-[#253341] transition-colors cursor-pointer rounded-lg shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                <div className="flex items-center gap-4 w-full">
                  {/* Date Badge */}
                  <div className="flex flex-col items-center justify-center rounded-lg bg-gray-50 dark:bg-[#253341] shadow-sm shrink-0 size-[60px] border border-gray-100 dark:border-gray-700">
                    <span className={`text-xs font-bold uppercase tracking-wide ${event.color}`}>{event.month}</span>
                    <span className="text-xl font-bold text-[#111518] dark:text-white leading-none mt-0.5">{event.day}</span>
                  </div>
                  <div className="flex flex-col justify-center flex-1 min-w-0">
                    <p className="text-[#111518] dark:text-white text-base font-semibold leading-normal line-clamp-1 group-hover:text-primary transition-colors">{event.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[#60778a] dark:text-gray-400 text-sm font-normal">{event.time}</span>
                      {event.location && (
                          <>
                            <span className="text-[#dbe1e6] dark:text-gray-600 text-xs">•</span>
                            <span className="text-[#60778a] dark:text-gray-400 text-sm font-normal truncate">{event.location}</span>
                          </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-[#dbe1e6] dark:text-gray-600">
                  <span className="material-symbols-outlined">chevron_right</span>
                </div>
              </Link>
            ))}
        </div>
      );
  }

  return (
    <div className="relative flex flex-col w-full min-h-screen bg-background-light dark:bg-background-dark shadow-2xl overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between bg-white dark:bg-[#1a2630] p-4 pb-2 sticky top-0 z-10 shadow-sm">
        <h2 className="text-xl font-bold leading-tight tracking-[-0.015em] flex-1 text-[#111518] dark:text-white">Church Life</h2>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowCalendarModal(true)}
            className="flex items-center justify-center text-[#111518] dark:text-white transition-colors hover:text-primary"
          >
            <span className="material-symbols-outlined">calendar_month</span>
          </button>
          <button className="flex items-center justify-center text-[#111518] dark:text-white transition-colors hover:text-primary">
            <span className="material-symbols-outlined">tune</span>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-white dark:bg-[#1a2630] pt-2 sticky top-[60px] z-10">
        <div className="flex border-b border-[#dbe1e6] dark:border-gray-700 px-4 justify-between">
          {['This Week', 'All Events', 'Saved'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex flex-col items-center justify-center border-b-[3px] pb-3 pt-2 flex-1 transition-colors ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-[#60778a] dark:text-gray-400 hover:text-[#111518] dark:hover:text-white'
              }`}
            >
              <p className="text-sm font-bold leading-normal tracking-[0.015em]">{tab}</p>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content Scroll Area */}
      <main className="flex-1 overflow-y-auto pb-20">
        {activeTab === 'This Week' && (
            <div className="animate-fadeIn">
                {/* AI Summary Pill */}
                <div className="px-4 py-4">
                {summary ? (
                    <div className="w-full bg-primary/10 rounded-xl p-4 animate-fadeIn">
                        <div className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">auto_awesome</span>
                            <p className="text-sm text-[#111518] dark:text-white leading-relaxed">{summary}</p>
                        </div>
                    </div>
                ) : (
                    <button 
                    onClick={handleSummarize}
                    disabled={loadingSummary}
                    className="w-full bg-gradient-to-r from-primary/10 to-blue-100/50 dark:from-primary/20 dark:to-blue-900/20 rounded-full py-2 px-4 flex items-center justify-center gap-2 group transition-all active:scale-95 disabled:opacity-70"
                    >
                    <span className={`material-symbols-outlined text-primary text-[20px] ${loadingSummary ? 'animate-spin' : ''}`}>
                        {loadingSummary ? 'refresh' : 'auto_awesome'}
                    </span>
                    <span className="text-primary text-sm font-medium">
                        {loadingSummary ? 'Generating summary...' : 'Summarize this week for me'}
                    </span>
                    </button>
                )}
                </div>

                {/* Pinned Section (Featured) */}
                {featuredEvent && (
                    <div className="px-4 pb-2 @container">
                    <Link to={`/events/${featuredEvent.id}`} className="block flex flex-col items-stretch justify-start rounded-xl shadow-md bg-white dark:bg-[#1a2630] overflow-hidden hover:shadow-lg transition-shadow">
                        <div 
                            className="w-full aspect-video bg-cover bg-center relative" 
                            style={{ backgroundImage: `url("${featuredEvent.image}")` }}
                        >
                        <div className="absolute inset-0 bg-black/20"></div>
                        </div>
                        <div className="flex w-full grow flex-col items-stretch justify-center gap-1 py-4 px-4">
                        <div className="flex justify-between items-start">
                            <div>
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary mb-2">Featured</span>
                            <h3 className="text-[#111518] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">{featuredEvent.title}</h3>
                            </div>
                        </div>
                        {featuredEvent.description && <p className="text-[#60778a] dark:text-gray-300 text-sm font-normal leading-normal mt-1">{featuredEvent.description}</p>}
                        <div className="flex items-end gap-3 justify-between mt-4">
                            <div className="flex flex-col">
                            <p className="text-[#60778a] dark:text-gray-400 text-sm font-medium">{featuredEvent.time}</p>
                            </div>
                            <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-5 bg-primary hover:bg-blue-600 transition-colors text-white text-sm font-bold leading-normal shadow-sm">
                            RSVP
                            </button>
                        </div>
                        </div>
                    </Link>
                    </div>
                )}

                {/* Upcoming Events Section */}
                <div className="mt-4">
                <h3 className="text-[#111518] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2">Happening Soon</h3>
                <div className="flex flex-col gap-0 px-2">
                    {upcomingThisWeek.map(event => (
                    <Link to={`/events/${event.id}`} key={event.id} className="group flex items-center gap-4 bg-background-light dark:bg-background-dark px-4 py-3 justify-between hover:bg-white dark:hover:bg-[#1a2630] transition-colors cursor-pointer rounded-lg mx-2">
                        <div className="flex items-center gap-4 w-full">
                        {/* Date Badge */}
                        <div className="flex flex-col items-center justify-center rounded-lg bg-white dark:bg-[#253341] shadow-sm shrink-0 size-[60px] border border-gray-100 dark:border-gray-700">
                            <span className={`text-xs font-bold uppercase tracking-wide ${event.color}`}>{event.month}</span>
                            <span className="text-xl font-bold text-[#111518] dark:text-white leading-none mt-0.5">{event.day}</span>
                        </div>
                        <div className="flex flex-col justify-center flex-1 min-w-0">
                            <p className="text-[#111518] dark:text-white text-base font-semibold leading-normal line-clamp-1 group-hover:text-primary transition-colors">{event.title}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[#60778a] dark:text-gray-400 text-sm font-normal">{event.time}</span>
                            {event.location && (
                                <>
                                    <span className="text-[#dbe1e6] dark:text-gray-600 text-xs">•</span>
                                    <span className="text-[#60778a] dark:text-gray-400 text-sm font-normal truncate">{event.location}</span>
                                </>
                            )}
                            </div>
                        </div>
                        </div>
                        <div className="shrink-0 text-[#dbe1e6] dark:text-gray-600">
                        <span className="material-symbols-outlined">chevron_right</span>
                        </div>
                    </Link>
                    ))}
                </div>
                </div>

                {/* Announcements Section */}
                <div className="mt-6 mb-8">
                <h3 className="text-[#111518] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2">Notices</h3>
                <div className="flex flex-col gap-3 px-4">
                    {NOTICES.map(notice => (
                    <div 
                        key={notice.id} 
                        className={`flex flex-col p-4 bg-white dark:bg-[#1a2630] rounded-lg shadow-sm border-l-4 ${notice.priority ? 'border-primary' : 'border-gray-200 dark:border-gray-700'}`}
                    >
                        <div className="flex justify-between items-start mb-1">
                        <p className="text-[#111518] dark:text-white text-base font-bold leading-normal">{notice.title}</p>
                        {notice.priority && <span className="flex size-2 bg-primary rounded-full mt-2"></span>}
                        </div>
                        <p className="text-[#60778a] dark:text-gray-400 text-sm font-normal leading-relaxed">{notice.content}</p>
                    </div>
                    ))}
                </div>
                </div>
            </div>
        )}

        {activeTab === 'All Events' && (
            <div className="animate-fadeIn">
                <div className="px-4 py-4">
                    <h3 className="text-[#111518] dark:text-white text-lg font-bold leading-tight mb-4">Calendar</h3>
                    {renderEventList(allEvents, "No events scheduled.")}
                </div>
            </div>
        )}

        {activeTab === 'Saved' && (
            <div className="animate-fadeIn">
                 <div className="px-4 py-4">
                    <h3 className="text-[#111518] dark:text-white text-lg font-bold leading-tight mb-4">My Saved Events</h3>
                    {renderEventList(savedEvents, "No saved events yet.")}
                </div>
            </div>
        )}

        {/* Empty State Illustration / Footer graphic */}
        <div className="flex flex-col items-center justify-center pt-8 pb-12 opacity-50">
          <span className="material-symbols-outlined text-4xl text-[#dbe1e6] dark:text-gray-700 mb-2">church</span>
          <p className="text-xs text-[#60778a] dark:text-gray-500 font-medium">Holy Simplicity</p>
        </div>
      </main>

      {/* Calendar Modal */}
      {showCalendarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn" onClick={() => setShowCalendarModal(false)}>
            <div className="bg-white dark:bg-[#1a2630] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
                {/* Calendar Header */}
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/20 shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">October 2023</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Select start and end dates</p>
                    </div>
                    <button onClick={() => setShowCalendarModal(false)} className="p-2 rounded-full bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors shadow-sm">
                        <span className="material-symbols-outlined text-slate-500 dark:text-slate-300 text-[20px]">close</span>
                    </button>
                </div>
                
                {/* Scrollable Content Container */}
                <div className="overflow-y-auto">
                    {/* Calendar Grid */}
                    <div className="p-5">
                        <div className="grid grid-cols-7 text-center mb-4">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                                <div key={d} className="text-xs font-bold text-slate-400">{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-y-3 gap-x-0 text-center">
                            {Array.from({length: startDayOffset}).map((_, i) => <div key={`empty-${i}`}></div>)}
                            {Array.from({length: daysInMonth}, (_, i) => i + 1).map(day => {
                                // Check if day has an event (mock data uses strings "14", "24", etc. for October)
                                const hasEvent = ALL_MOCK_EVENTS.some(e => e.month === 'Oct' && e.day === day.toString());
                                const isToday = day === 12; // Just a mock today
                                
                                // Range Logic
                                const isStart = dateRange.start === day;
                                const isEnd = dateRange.end === day;
                                const isInRange = dateRange.start && dateRange.end && day > dateRange.start && day < dateRange.end;
                                const isSelected = isStart || isEnd;
                                
                                return (
                                    <div key={day} className={`relative flex items-center justify-center aspect-square
                                        ${isInRange ? 'bg-primary/10' : ''}
                                        ${isStart && dateRange.end ? 'bg-gradient-to-r from-transparent to-primary/10 rounded-l-full' : ''}
                                        ${isEnd && dateRange.start ? 'bg-gradient-to-l from-transparent to-primary/10 rounded-r-full' : ''}
                                    `}>
                                        <button 
                                            onClick={() => handleDateClick(day)}
                                            className={`w-9 h-9 flex items-center justify-center rounded-full text-sm transition-all relative z-10
                                            ${isSelected ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold scale-110 shadow-md' : ''}
                                            ${!isSelected && isToday ? 'border-2 border-primary text-primary font-bold' : ''}
                                            ${!isSelected && hasEvent ? 'text-primary font-bold' : ''}
                                            ${!isSelected && !isToday && !hasEvent ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700' : ''}
                                        `}>
                                            {day}
                                            {hasEvent && !isSelected && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"></div>}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Selected Date Events Section */}
                    <div className="bg-gray-50/50 dark:bg-[#152028] border-t border-gray-100 dark:border-gray-700 px-5 py-4 min-h-[150px]">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px] text-slate-400">event</span>
                                {dateRange.start ? (
                                    dateRange.end 
                                     ? `Events: Oct ${dateRange.start} - ${dateRange.end}`
                                     : `Events: Oct ${dateRange.start}`
                                ) : 'Select dates to filter'}
                            </h4>
                            {dateRange.start && (
                                <button onClick={clearDateFilter} className="text-xs text-primary font-medium hover:underline">
                                    Clear
                                </button>
                            )}
                        </div>
                        
                        {dateRange.start ? (
                            selectedDateEvents.length > 0 ? (
                                <div className="flex flex-col gap-2">
                                    {selectedDateEvents.map(event => (
                                        <Link to={`/events/${event.id}`} key={event.id} className="flex items-center gap-3 bg-white dark:bg-[#1a2630] p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-primary/50 transition-colors">
                                            <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary dark:bg-slate-700/50 shrink-0">
                                                 <span className="text-xs font-bold">{event.day}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="text-sm font-bold text-slate-900 dark:text-white truncate">{event.title}</h5>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{event.time}</p>
                                            </div>
                                            <span className="material-symbols-outlined text-slate-300 text-[18px]">chevron_right</span>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                                    <span className="material-symbols-outlined text-3xl mb-1 opacity-50">event_busy</span>
                                    <p className="text-xs font-medium">No events in range</p>
                                </div>
                            )
                        ) : (
                            <div className="flex items-center gap-4 text-xs font-medium py-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-primary/20 border border-primary/50"></div>
                                    <span className="text-slate-600 dark:text-slate-400">Range</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full border-2 border-primary"></div>
                                    <span className="text-slate-600 dark:text-slate-400">Today</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Events;