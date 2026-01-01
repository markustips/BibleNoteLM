import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Church, Announcement, Event } from '../types';

interface ChurchState {
  churches: Church[];
  currentChurch: Church | null;
  announcements: Announcement[];
  events: Event[];
  
  // Church management
  setCurrentChurch: (church: Church | null) => void;
  createChurch: (church: Omit<Church, 'id' | 'createdAt'>) => Church;
  updateChurch: (id: string, updates: Partial<Church>) => void;
  
  // Announcements
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt'>) => void;
  updateAnnouncement: (id: string, updates: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;
  toggleAnnouncementActive: (id: string) => void;
  
  // Events
  addEvent: (event: Omit<Event, 'id'>) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  
  // Validation
  validateChurchCode: (code: string) => Church | null;
}

const MOCK_CHURCH: Church = {
  id: 'church-1',
  name: 'Grace Community Church',
  code: 'GRACE2024',
  logo: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=200',
  address: '123 Faith Street, Hope City',
  adminIds: ['user-1'],
  pastorIds: ['pastor-1'],
  memberIds: ['user-1', 'user-2', 'user-3'],
  createdAt: new Date().toISOString(),
};

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    churchId: 'church-1',
    title: 'Church Picnic',
    content: 'Join us for our annual church picnic at Central Park. Food, games, and fellowship for the whole family!',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCTKwmERj_lTYjmJ3cUDiA8SAfubaFghrFdxKPxEBGJn3DSoDRWz56l2FOk_S9RwLdlMl8uiGGV25DilweThaldzga77peCjkJgXNKVOtffFB1r-dBYLgesXxy_Vd1vxibk_8SMm0snwEdXF9oZMLSKy-le-ICoDcGKU10D0dq4vxVOyZargc5U6L2DE9Yx-X8sgGZdmpeclMyN5cHCxIO3Z-XAXXv8ck4zP15nd7-gRFe_y1ro9Fw0q-KaUnhaDJCHm55FgRLuSzz1',
    category: 'Community',
    startDate: '2025-01-04',
    endDate: '2025-01-04',
    isActive: true,
    createdBy: 'user-1',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ann-2',
    churchId: 'church-1',
    title: 'New Series: "Hope"',
    content: 'Starting this Sunday, join Pastor James for a powerful new sermon series on finding hope in uncertain times.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMDXbQHPRD32aAhzMX9M6ggDIWKTG-lSWcZ5yOibyVuDw2MCGL1ZnV2q5ik8JeDcHz748_iopXNTaf2nhXmda4NX7Fv5ILAc1IUUuXyZhZemJjuAE1XHZ_kn4SjHva669YS28DchYGtxBj9lYMr9VlVLSjQ2Y9-XvEc30rOJZX3kmWOUr6fwLuW4qxc6s1xeuAGD4Et8VoiOtLNk7EabX2JunqIDsYzwst3E1ZBoHaOg2bzc82576THMIpB84zUifS_7yogi72a8FI',
    category: 'Series',
    startDate: '2025-01-05',
    isActive: true,
    createdBy: 'pastor-1',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ann-3',
    churchId: 'church-1',
    title: 'Volunteer Signup',
    content: 'We need volunteers for children\'s ministry. Training provided!',
    category: 'General',
    startDate: '2025-01-01',
    isActive: true,
    createdBy: 'user-1',
    createdAt: new Date().toISOString(),
  },
];

const MOCK_EVENTS: Event[] = [
  { id: '1', title: 'Sunday Service', date: 'Sun, Dec 29', time: '9:00 AM & 11:00 AM', location: 'Main Sanctuary', type: 'Service' },
  { id: '2', title: 'Youth Group', date: 'Wed, Jan 1', time: '7:00 PM', location: 'Youth Center', type: 'Youth' },
  { id: '3', title: 'Community Outreach', date: 'Sat, Jan 4', time: '10:00 AM', location: 'Downtown', type: 'Outreach' },
];

export const useChurchStore = create<ChurchState>()(
  persist(
    (set, get) => ({
      churches: [MOCK_CHURCH],
      currentChurch: MOCK_CHURCH,
      announcements: MOCK_ANNOUNCEMENTS,
      events: MOCK_EVENTS,
      
      setCurrentChurch: (church) => set({ currentChurch: church }),
      
      createChurch: (churchData) => {
        const newChurch: Church = {
          ...churchData,
          id: `church-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          churches: [...state.churches, newChurch],
          currentChurch: newChurch,
        }));
        return newChurch;
      },
      
      updateChurch: (id, updates) => set((state) => ({
        churches: state.churches.map(c => c.id === id ? { ...c, ...updates } : c),
        currentChurch: state.currentChurch?.id === id 
          ? { ...state.currentChurch, ...updates } 
          : state.currentChurch,
      })),
      
      addAnnouncement: (announcement) => set((state) => ({
        announcements: [{
          ...announcement,
          id: `ann-${Date.now()}`,
          createdAt: new Date().toISOString(),
        }, ...state.announcements],
      })),
      
      updateAnnouncement: (id, updates) => set((state) => ({
        announcements: state.announcements.map(a => 
          a.id === id ? { ...a, ...updates } : a
        ),
      })),
      
      deleteAnnouncement: (id) => set((state) => ({
        announcements: state.announcements.filter(a => a.id !== id),
      })),
      
      toggleAnnouncementActive: (id) => set((state) => ({
        announcements: state.announcements.map(a => 
          a.id === id ? { ...a, isActive: !a.isActive } : a
        ),
      })),
      
      addEvent: (event) => set((state) => ({
        events: [...state.events, { ...event, id: `event-${Date.now()}` }],
      })),
      
      updateEvent: (id, updates) => set((state) => ({
        events: state.events.map(e => e.id === id ? { ...e, ...updates } : e),
      })),
      
      deleteEvent: (id) => set((state) => ({
        events: state.events.filter(e => e.id !== id),
      })),
      
      validateChurchCode: (code) => {
        return get().churches.find(c => c.code.toUpperCase() === code.toUpperCase()) || null;
      },
    }),
    {
      name: 'church-storage',
    }
  )
);
