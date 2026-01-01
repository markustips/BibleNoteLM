import React, { useState, useEffect } from 'react';
import { 
  Church, 
  Users, 
  Bell, 
  Calendar, 
  Settings, 
  BarChart3, 
  LogOut,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  Search,
  Filter,
  Download,
  Upload,
  Menu,
  X,
  Home,
  BookOpen,
  MessageSquare,
  Heart,
  Mic,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  UserPlus,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreVertical
} from 'lucide-react';
import { useUserStore } from '../stores/useUserStore';
import { useChurchStore } from '../stores/useChurchStore';
import { useAuth } from '../hooks/useAuth';
import { Announcement, ChurchEvent } from '../types';

type DashboardSection = 'overview' | 'announcements' | 'events' | 'members' | 'sermons' | 'analytics' | 'settings';

const WebDashboard: React.FC = () => {
  const { user, role, churchName, can } = useUserStore();
  const { signOut } = useAuth();
  const { 
    churches, 
    announcements, 
    events, 
    addAnnouncement, 
    updateAnnouncement, 
    deleteAnnouncement,
    addEvent,
    updateEvent,
    deleteEvent
  } = useChurchStore();

  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [editingEvent, setEditingEvent] = useState<ChurchEvent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Form states
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent'
  });

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: ''
  });

  const currentChurch = churches[0]; // Get first church for demo

  // Check permissions
  useEffect(() => {
    if (!can('manage_announcements') && !can('manage_church')) {
      // Redirect or show access denied
    }
  }, [can]);

  const handleCopyCode = () => {
    if (currentChurch) {
      navigator.clipboard.writeText(currentChurch.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleSaveAnnouncement = () => {
    if (!announcementForm.title || !announcementForm.content) return;

    if (editingAnnouncement) {
      updateAnnouncement(editingAnnouncement.id, {
        title: announcementForm.title,
        content: announcementForm.content,
        priority: announcementForm.priority
      });
    } else {
      addAnnouncement({
        title: announcementForm.title,
        content: announcementForm.content,
        priority: announcementForm.priority,
        churchId: currentChurch?.id || '1',
        authorId: user?.id || '1'
      });
    }

    setShowAnnouncementModal(false);
    setEditingAnnouncement(null);
    setAnnouncementForm({ title: '', content: '', priority: 'normal' });
  };

  const handleSaveEvent = () => {
    if (!eventForm.title || !eventForm.date) return;

    const eventData = {
      title: eventForm.title,
      description: eventForm.description,
      date: eventForm.date,
      time: eventForm.time,
      location: eventForm.location,
      churchId: currentChurch?.id || '1'
    };

    if (editingEvent) {
      updateEvent(editingEvent.id, eventData);
    } else {
      addEvent(eventData);
    }

    setShowEventModal(false);
    setEditingEvent(null);
    setEventForm({ title: '', description: '', date: '', time: '', location: '' });
  };

  const openEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setAnnouncementForm({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority
    });
    setShowAnnouncementModal(true);
  };

  const openEditEvent = (event: ChurchEvent) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time || '',
      location: event.location || ''
    });
    setShowEventModal(true);
  };

  // Mock data for analytics
  const stats = {
    totalMembers: 156,
    activeMembers: 142,
    newThisMonth: 12,
    totalSermons: 48,
    totalPrayers: 234,
    avgAttendance: 89
  };

  const recentActivity = [
    { type: 'member', action: 'John D. joined the church', time: '2 hours ago' },
    { type: 'prayer', action: 'New prayer request submitted', time: '4 hours ago' },
    { type: 'sermon', action: 'Sunday Sermon uploaded', time: '1 day ago' },
    { type: 'event', action: 'Christmas Service event created', time: '2 days ago' }
  ];

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'announcements', label: 'Announcements', icon: Bell },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'sermons', label: 'Sermons', icon: Mic },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={`bg-white shadow-xl transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-72'} flex flex-col border-r border-gray-200`}>
        {/* Logo */}
        <div className="p-6 border-b flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Church className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg text-gray-800">BibleNoteLM</span>
                <p className="text-xs text-gray-500">Church Dashboard</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Church Info */}
        {!sidebarCollapsed && currentChurch && (
          <div className="p-4 mx-4 mt-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
            <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Managing</p>
            <p className="font-semibold text-gray-800 text-sm">{currentChurch.name}</p>
            <div className="flex items-center gap-2 mt-3">
              <code className="text-xs bg-white px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-700 font-mono">
                {currentChurch.code}
              </code>
              <button onClick={handleCopyCode} className="p-1.5 hover:bg-white/80 rounded-lg transition-colors">
                {copiedCode ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 mt-2">
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as DashboardSection)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all duration-200 ${
                  activeSection === item.id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t bg-gray-50">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold ring-2 ring-indigo-200">
              {user?.name?.charAt(0) || 'A'}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-800">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-500 capitalize">{role}</p>
              </div>
            )}
            <button
              onClick={signOut}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors group"
              title="Sign out"
            >
              <LogOut className="w-5 h-5 text-gray-600 group-hover:text-red-600" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm px-8 py-5 flex items-center justify-between border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 capitalize">{activeSection}</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {activeSection === 'overview' && 'Welcome to your church dashboard'}
              {activeSection === 'announcements' && 'Manage church announcements'}
              {activeSection === 'events' && 'Schedule and manage events'}
              {activeSection === 'members' && 'View and manage church members'}
              {activeSection === 'sermons' && 'Manage sermon recordings'}
              {activeSection === 'analytics' && 'View church statistics'}
              {activeSection === 'settings' && 'Configure dashboard settings'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-full w-80 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 transition-all"
              />
            </div>
            <button className="p-2.5 hover:bg-gray-100 rounded-full relative transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6">
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 shadow-lg shadow-indigo-500/30 text-white transform hover:-translate-y-1 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-indigo-100 text-sm font-medium mb-2">TOTAL MEMBERS</p>
                      <p className="text-4xl font-bold">{stats.totalMembers}</p>
                    </div>
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Users className="w-7 h-7" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm bg-white/20 px-3 py-2 rounded-lg w-fit">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="font-semibold">+{stats.newThisMonth}</span>
                    <span className="ml-1 opacity-90">this month</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm font-medium mb-2">ACTIVE MEMBERS</p>
                      <p className="text-4xl font-bold text-gray-800">{stats.activeMembers}</p>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                      <CheckCircle className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg font-semibold">
                      {Math.round(stats.activeMembers / stats.totalMembers * 100)}% engagement
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-6 shadow-lg shadow-pink-500/30 text-white transform hover:-translate-y-1 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-pink-100 text-sm font-medium mb-2">TOTAL SERMONS</p>
                      <p className="text-4xl font-bold">{stats.totalSermons}</p>
                    </div>
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Mic className="w-7 h-7" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm bg-white/20 px-3 py-2 rounded-lg w-fit">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="font-semibold">+4</span>
                    <span className="ml-1 opacity-90">this week</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 shadow-lg shadow-blue-500/30 text-white transform hover:-translate-y-1 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium mb-2">PRAYER REQUESTS</p>
                      <p className="text-4xl font-bold">{stats.totalPrayers}</p>
                    </div>
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Heart className="w-7 h-7" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm bg-white/20 px-3 py-2 rounded-lg w-fit">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span className="font-semibold">23</span>
                    <span className="ml-1 opacity-90">answered</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200">
                  <h3 className="font-semibold text-lg mb-5 text-gray-800">Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => { setActiveSection('announcements'); setShowAnnouncementModal(true); }}
                      className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-xl hover:from-indigo-100 hover:to-purple-100 transition-all duration-200 border border-indigo-200 hover:shadow-md"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Bell className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold">New Announcement</span>
                    </button>
                    <button
                      onClick={() => { setActiveSection('events'); setShowEventModal(true); }}
                      className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-all duration-200 border border-green-200 hover:shadow-md"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold">Schedule Event</span>
                    </button>
                    <button className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 rounded-xl hover:from-pink-100 hover:to-rose-100 transition-all duration-200 border border-pink-200 hover:shadow-md">
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center">
                        <Upload className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold">Upload Sermon</span>
                    </button>
                    <button className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 rounded-xl hover:from-blue-100 hover:to-cyan-100 transition-all duration-200 border border-blue-200 hover:shadow-md">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold">Send Message</span>
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl p-6 shadow-sm lg:col-span-2">
                  <h3 className="font-semibold text-lg mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activity.type === 'member' ? 'bg-blue-100' :
                          activity.type === 'prayer' ? 'bg-red-100' :
                          activity.type === 'sermon' ? 'bg-purple-100' : 'bg-green-100'
                        }`}>
                          {activity.type === 'member' && <UserPlus className="w-5 h-5 text-blue-500" />}
                          {activity.type === 'prayer' && <Heart className="w-5 h-5 text-red-500" />}
                          {activity.type === 'sermon' && <Mic className="w-5 h-5 text-purple-500" />}
                          {activity.type === 'event' && <Calendar className="w-5 h-5 text-green-500" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-800">{activity.action}</p>
                          <p className="text-sm text-gray-400">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Upcoming Events */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Upcoming Events</h3>
                  <button 
                    onClick={() => setActiveSection('events')}
                    className="text-blue-500 text-sm hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {events.slice(0, 3).map(event => (
                    <div key={event.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{event.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">{event.description}</p>
                        </div>
                        <Calendar className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {event.date} {event.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Announcements Section */}
          {activeSection === 'announcements' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                    <Filter className="w-4 h-4" />
                    Filter
                  </button>
                </div>
                <button
                  onClick={() => {
                    setEditingAnnouncement(null);
                    setAnnouncementForm({ title: '', content: '', priority: 'normal' });
                    setShowAnnouncementModal(true);
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/30 transition-all duration-200"
                >
                  <Plus className="w-5 h-5" />
                  New Announcement
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Title</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Priority</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Date</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {announcements.map(announcement => (
                      <tr key={announcement.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium">{announcement.title}</p>
                            <p className="text-sm text-gray-500 truncate max-w-xs">{announcement.content}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            announcement.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                            announcement.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                            announcement.priority === 'normal' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {announcement.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => updateAnnouncement(announcement.id, { isActive: !announcement.isActive })}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              announcement.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {announcement.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            {announcement.isActive ? 'Active' : 'Hidden'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(announcement.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => openEditAnnouncement(announcement)}
                              className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                              <Edit className="w-4 h-4 text-gray-500" />
                            </button>
                            <button 
                              onClick={() => deleteAnnouncement(announcement.id)}
                              className="p-2 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Events Section */}
          {activeSection === 'events' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                    <Filter className="w-4 h-4" />
                    Filter
                  </button>
                </div>
                <button
                  onClick={() => {
                    setEditingEvent(null);
                    setEventForm({ title: '', description: '', date: '', time: '', location: '' });
                    setShowEventModal(true);
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/30 transition-all duration-200"
                >
                  <Plus className="w-5 h-5" />
                  New Event
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map(event => (
                  <div key={event.id} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-blue-500" />
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => openEditEvent(event)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <Edit className="w-4 h-4 text-gray-500" />
                        </button>
                        <button 
                          onClick={() => deleteEvent(event.id)}
                          className="p-2 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mt-4">{event.title}</h3>
                    <p className="text-gray-500 text-sm mt-1">{event.description}</p>
                    <div className="mt-4 space-y-2 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{event.date} {event.time && `at ${event.time}`}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <Church className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members Section */}
          {activeSection === 'members' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                    <Filter className="w-4 h-4" />
                    Filter
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
                <button className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/30 transition-all duration-200">
                  <UserPlus className="w-5 h-5" />
                  Invite Member
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Member</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Role</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Subscription</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Joined</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Status</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {/* Mock members data */}
                    {[
                      { id: 1, name: 'John Doe', email: 'john@email.com', role: 'member', subscription: 'premium', joined: '2024-01-15', active: true },
                      { id: 2, name: 'Jane Smith', email: 'jane@email.com', role: 'subscriber', subscription: 'basic', joined: '2024-02-20', active: true },
                      { id: 3, name: 'Mike Johnson', email: 'mike@email.com', role: 'member', subscription: 'free', joined: '2024-03-10', active: false },
                      { id: 4, name: 'Sarah Williams', email: 'sarah@email.com', role: 'pastor', subscription: 'premium', joined: '2023-12-01', active: true },
                      { id: 5, name: 'David Brown', email: 'david@email.com', role: 'member', subscription: 'basic', joined: '2024-04-05', active: true },
                    ].map(member => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-sm text-gray-500">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                            member.role === 'pastor' ? 'bg-purple-100 text-purple-700' :
                            member.role === 'subscriber' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                            member.subscription === 'premium' ? 'bg-yellow-100 text-yellow-700' :
                            member.subscription === 'basic' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {member.subscription}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{member.joined}</td>
                        <td className="px-6 py-4">
                          <span className={`flex items-center gap-1 ${member.active ? 'text-green-500' : 'text-gray-400'}`}>
                            <span className={`w-2 h-2 rounded-full ${member.active ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                            {member.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-2 hover:bg-gray-100 rounded-lg">
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sermons Section */}
          {activeSection === 'sermons' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                    <Filter className="w-4 h-4" />
                    Filter
                  </button>
                </div>
                <button className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/30 transition-all duration-200">
                  <Upload className="w-5 h-5" />
                  Upload Sermon
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { id: 1, title: 'The Power of Faith', speaker: 'Pastor John', date: '2024-12-22', duration: '45:30', views: 156 },
                  { id: 2, title: 'Walking in Love', speaker: 'Pastor Sarah', date: '2024-12-15', duration: '38:15', views: 203 },
                  { id: 3, title: 'Christmas Message', speaker: 'Pastor John', date: '2024-12-25', duration: '52:00', views: 312 },
                ].map(sermon => (
                  <div key={sermon.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="h-40 bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <Mic className="w-12 h-12 text-white opacity-50" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold">{sermon.title}</h3>
                      <p className="text-sm text-gray-500">{sermon.speaker}</p>
                      <div className="mt-3 flex items-center justify-between text-sm text-gray-400">
                        <span>{sermon.date}</span>
                        <span>{sermon.duration}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-sm text-gray-400">
                        <Eye className="w-4 h-4" />
                        <span>{sermon.views} views</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Section */}
          {activeSection === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold text-lg mb-4">Member Growth</h3>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center text-gray-400">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                      <p>Chart visualization would go here</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold text-lg mb-4">Engagement Metrics</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-500">Sermon Views</span>
                        <span className="text-sm font-medium">78%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div className="h-2 bg-blue-500 rounded-full" style={{ width: '78%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-500">Prayer Participation</span>
                        <span className="text-sm font-medium">65%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div className="h-2 bg-green-500 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-500">Event Attendance</span>
                        <span className="text-sm font-medium">89%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div className="h-2 bg-purple-500 rounded-full" style={{ width: '89%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Section */}
          {activeSection === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-lg mb-4">Church Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Church Name</label>
                    <input 
                      type="text" 
                      defaultValue={currentChurch?.name}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Church Code</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        defaultValue={currentChurch?.code}
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        readOnly
                      />
                      <button 
                        onClick={handleCopyCode}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                      >
                        {copiedCode ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea 
                      rows={3}
                      defaultValue={currentChurch?.description}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/30 transition-all duration-200 font-semibold">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
              </h2>
              <button 
                onClick={() => setShowAnnouncementModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter announcement title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  rows={4}
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter announcement content"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={announcementForm.priority}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, priority: e.target.value as any })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAnnouncementModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAnnouncement}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/30 transition-all duration-200 font-semibold"
                >
                  {editingAnnouncement ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingEvent ? 'Edit Event' : 'New Event'}
              </h2>
              <button 
                onClick={() => setShowEventModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter event title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter event description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={eventForm.time}
                    onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter event location"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowEventModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEvent}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/30 transition-all duration-200 font-semibold"
                >
                  {editingEvent ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebDashboard;
