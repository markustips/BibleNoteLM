import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Centralized mock data for demo purposes
const ALL_EVENTS = [
  {
    id: '3',
    title: "Sunday Worship Service",
    date: "Sunday, Oct 14",
    time: "10:00 AM - 11:30 AM",
    location: "Main Sanctuary",
    type: "Service",
    description: "Join us for our weekly Sunday worship service. We will have a time of praise and worship followed by a sermon from Pastor John. Children's church is available for ages 4-10.",
    image: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2073&auto=format&fit=crop"
  },
  {
    id: '2',
    title: "Youth Group Meetup",
    date: "Wednesday, Oct 17",
    time: "6:00 PM - 8:00 PM",
    location: "The Loft",
    type: "Youth",
    description: "Calling all high schoolers! Come hang out for games, pizza, and a short devotional. Bring a friend!",
    image: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=2070&auto=format&fit=crop"
  },
  {
    id: '1',
    title: "Wednesday Night Bible Study",
    date: "Wednesday, Oct 24",
    time: "7:00 PM",
    location: "Main Hall",
    type: "Community",
    description: "Deep dive into the book of Romans. Open to all adults.",
    image: "https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?q=80&w=2070&auto=format&fit=crop"
  },
  // Announcements Data
  {
    id: 'ann-1',
    title: "Church Picnic",
    date: "Saturday, Oct 20",
    time: "2:00 PM - 5:00 PM",
    location: "Central Park",
    type: "Community",
    description: "Join us for a fun afternoon of food, games, and fellowship at Central Park. We'll be at Pavilion 4 near the playground. Burgers and hot dogs will be provided; please bring a side dish or dessert to share! Don't forget your lawn chairs.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCTKwmERj_lTYjmJ3cUDiA8SAfubaFghrFdxKPxEBGJn3DSoDRWz56l2FOk_S9RwLdlMl8uiGGV25DilweThaldzga77peCjkJgXNKVOtffFB1r-dBYLgesXxy_Vd1vxibk_8SMm0snwEdXF9oZMLSKy-le-ICoDcGKU10D0dq4vxVOyZargc5U6L2DE9Yx-X8sgGZdmpeclMyN5cHCxIO3Z-XAXXv8ck4zP15nd7-gRFe_y1ro9Fw0q-KaUnhaDJCHm55FgRLuSzz1"
  },
  {
    id: 'ann-2',
    title: "New Series: \"Hope\"",
    date: "Starts Sunday, Oct 21",
    time: "9:00 AM & 11:00 AM",
    location: "Main Sanctuary",
    type: "Series",
    description: "In a world that often feels chaotic, where do we find our anchor? Join us for our new 4-week sermon series exploring the book of 1 Peter. We will discover how to cultivate a living hope that endures through every season of life.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCMDXbQHPRD32aAhzMX9M6ggDIWKTG-lSWcZ5yOibyVuDw2MCGL1ZnV2q5ik8JeDcHz748_iopXNTaf2nhXmda4NX7Fv5ILAc1IUUuXyZhZemJjuAE1XHZ_kn4SjHva669YS28DchYGtxBj9lYMr9VlVLSjQ2Y9-XvEc30rOJZX3kmWOUr6fwLuW4qxc6s1xeuAGD4Et8VoiOtLNk7EabX2JunqIDsYzwst3E1ZBoHaOg2bzc82576THMIpB84zUifS_7yogi72a8FI"
  },
  {
    id: 'ann-3',
    title: "Food Drive",
    date: "Entire Month of October",
    time: "Drop-off: 9AM - 5PM (Mon-Fri)",
    location: "Church Lobby",
    type: "Outreach",
    description: "We are partnering with the local food bank to feed families in our community this Thanksgiving. We are collecting canned goods, dry pasta, rice, and non-perishable items. Donation bins are located in the main lobby.",
    image: "https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=1000&auto=format&fit=crop"
  }
];

const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isRSVP, setIsRSVP] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const event = ALL_EVENTS.find(e => e.id === id);

  const handleToggleRSVP = () => {
    setIsLoading(true);
    // Simulate API delay
    setTimeout(() => {
        setIsRSVP(prev => !prev);
        setIsLoading(false);
    }, 800);
  };

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 bg-background-light dark:bg-background-dark">
        <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-white">Event not found</h2>
        <button onClick={() => navigate(-1)} className="text-primary font-medium">Go Back</button>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen pb-24 relative z-50">
       {/* Header with Back Button */}
       <div className="sticky top-0 z-10 flex items-center gap-3 p-4 bg-white/95 dark:bg-[#101a22]/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined text-slate-700 dark:text-white">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white flex-1 truncate">{event.title}</h1>
          <button className="p-2 -mr-2 text-slate-400 hover:text-primary transition-colors">
            <span className="material-symbols-outlined">share</span>
          </button>
       </div>

       {/* Hero Image */}
       <div className="w-full h-64 bg-slate-200 relative">
          <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-4 left-4 right-4">
            <span className="inline-block px-3 py-1 rounded-full bg-primary text-white text-xs font-bold uppercase tracking-wider mb-2 shadow-sm">
                {event.type}
            </span>
            <h2 className="text-2xl font-bold text-white shadow-sm leading-tight">{event.title}</h2>
          </div>
       </div>

       {/* Content */}
       <div className="p-4 space-y-6">
          {/* Key Details */}
          <div className="flex flex-col gap-4 bg-white dark:bg-card-dark p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined">calendar_month</span>
                  </div>
                  <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{event.date}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{event.time}</p>
                  </div>
              </div>
              
              <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 shrink-0">
                      <span className="material-symbols-outlined">location_on</span>
                  </div>
                  <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{event.location}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">123 Church St, Cityville</p>
                  </div>
              </div>
          </div>

          {/* Description */}
          <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">About</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[15px]">
                  {event.description}
              </p>
          </div>

          {/* Map Placeholder */}
          <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700">
              <div className="flex flex-col items-center gap-2 text-slate-400">
                  <span className="material-symbols-outlined text-3xl">map</span>
                  <span className="text-xs font-medium">Map View</span>
              </div>
          </div>
       </div>

       {/* Floating Action Button */}
       <div className="fixed bottom-0 left-0 w-full p-4 bg-white dark:bg-[#101a22] border-t border-slate-100 dark:border-slate-800 pb-safe z-20">
           <button 
             onClick={handleToggleRSVP}
             disabled={isLoading}
             className={`w-full py-4 font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2
                ${isRSVP 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200 border-2 border-green-500/20' 
                    : 'bg-primary hover:bg-blue-600 text-white'}
             `}
           >
               {isLoading ? (
                   <>
                     <span className="material-symbols-outlined text-[20px] animate-spin">refresh</span>
                     <span>Updating...</span>
                   </>
               ) : isRSVP ? (
                   <>
                     <span className="material-symbols-outlined text-[20px] filled">check_circle</span>
                     <span>RSVP Confirmed</span>
                   </>
               ) : (
                   <>
                     <span>RSVP Now</span>
                     <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                   </>
               )}
           </button>
           {isRSVP && !isLoading && (
               <p className="text-center mt-2 text-xs text-slate-400 animate-fadeIn">Tap again to cancel</p>
           )}
       </div>
    </div>
  );
};

export default EventDetails;