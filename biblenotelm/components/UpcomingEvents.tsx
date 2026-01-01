import React from 'react';
import { Link } from 'react-router-dom';
import { Event } from '../types';

const MOCK_EVENTS: Event[] = [
  {
    id: '3',
    title: "Sunday Worship Service",
    date: "14",
    time: "10:00 AM - 11:30 AM",
    location: "Main Sanctuary",
    type: "Service"
  },
  {
    id: '2',
    title: "Youth Group Meetup",
    date: "17",
    time: "6:00 PM - 8:00 PM",
    location: "Room 3B",
    type: "Youth"
  }
];

const EventCard: React.FC<{ event: Event }> = ({ event }) => (
  <Link to={`/events/${event.id}`} className="block">
    <div className="flex items-center bg-white dark:bg-slate-800 p-3 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none border border-gray-100 dark:border-gray-700 hover:border-primary/50 transition-colors">
      <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-primary/10 text-primary dark:bg-slate-700 dark:text-blue-400 shrink-0">
        <span className="text-xs font-bold uppercase">{event.type === 'Service' ? 'Sun' : 'Wed'}</span>
        <span className="text-lg font-bold">{event.date}</span>
      </div>
      <div className="ml-4 flex-1">
        <h3 className="text-sm font-bold text-[#111518] dark:text-white">{event.title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">schedule</span> {event.time}
        </p>
      </div>
      <div className="p-2 text-gray-400 hover:text-primary dark:text-gray-500">
        <span className="material-symbols-outlined">chevron_right</span>
      </div>
    </div>
  </Link>
);

const UpcomingEvents: React.FC = () => {
  return (
    <section className="px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[#111518] dark:text-white text-lg font-bold leading-tight">Upcoming Events</h2>
        <Link to="/events" className="text-primary text-sm font-medium hover:underline">See all</Link>
      </div>
      <div className="flex flex-col gap-3">
        {MOCK_EVENTS.map(event => <EventCard key={event.id} event={event} />)}
      </div>
    </section>
  );
};

export default UpcomingEvents;