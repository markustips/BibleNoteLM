import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../App';
import { useUserStore } from '../stores/useUserStore';

interface ChurchStats {
  id: string;
  name: string;
  code: string;
  memberCount: number;
  subscriptionTier: string;
  createdAt: any;
  isActive: boolean;
}

interface SubscriberStats {
  total: number;
  free: number;
  basic: number;
  premium: number;
}

interface SystemStats {
  totalChurches: number;
  activeChurches: number;
  totalUsers: number;
  totalSubscribers: number;
  monthlyRevenue: number;
}

const SuperAdminDashboard: React.FC = () => {
  const { name, email } = useUserStore();
  const [churches, setChurches] = useState<ChurchStats[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [subscriberStats, setSubscriberStats] = useState<SubscriberStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load system stats using Cloud Function
      const functions = getFunctions();
      const getSystemStatsFunc = httpsCallable(functions, 'getSystemStats');
      const statsResult = await getSystemStatsFunc();
      setSystemStats(statsResult.data as SystemStats);

      // Load all churches
      const churchesSnapshot = await getDocs(
        query(collection(db, 'churches'), orderBy('createdAt', 'desc'))
      );

      const churchesData = await Promise.all(
        churchesSnapshot.docs.map(async (doc) => {
          const data = doc.data();

          // Count members for this church
          const membersSnapshot = await getDocs(
            query(collection(db, 'users'), where('churchId', '==', doc.id))
          );

          return {
            id: doc.id,
            name: data.name,
            code: data.code,
            memberCount: membersSnapshot.size,
            subscriptionTier: data.subscriptionTier || 'free',
            createdAt: data.createdAt,
            isActive: data.isActive !== false,
          };
        })
      );

      setChurches(churchesData);

      // Calculate subscriber stats
      const subsSnapshot = await getDocs(collection(db, 'subscriptions'));
      const stats = { total: 0, free: 0, basic: 0, premium: 0 };

      subsSnapshot.docs.forEach((doc) => {
        const tier = doc.data().tier || 'free';
        stats.total++;
        if (tier === 'free') stats.free++;
        else if (tier === 'basic') stats.basic++;
        else if (tier === 'premium') stats.premium++;
      });

      setSubscriberStats(stats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Super Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Platform-wide management and analytics
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{name}</p>
                <p className="text-xs text-gray-600">{email}</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Churches"
            value={systemStats?.totalChurches || 0}
            subtitle={`${systemStats?.activeChurches || 0} active`}
            icon="🏛️"
            color="blue"
          />
          <StatCard
            title="Total Users"
            value={systemStats?.totalUsers || 0}
            subtitle="All registered users"
            icon="👥"
            color="green"
          />
          <StatCard
            title="Paid Subscribers"
            value={systemStats?.totalSubscribers || 0}
            subtitle={`${subscriberStats?.premium || 0} premium, ${subscriberStats?.basic || 0} basic`}
            icon="⭐"
            color="purple"
          />
          <StatCard
            title="Monthly Revenue"
            value={`$${(systemStats?.monthlyRevenue || 0).toFixed(2)}`}
            subtitle="Recurring revenue"
            icon="💰"
            color="yellow"
          />
        </div>

        {/* Churches Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Churches</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage and monitor all churches on the platform
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Church
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Members
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {churches.map((church) => (
                  <tr key={church.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{church.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                        {church.code}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-900">{church.memberCount}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          church.subscriptionTier === 'premium'
                            ? 'bg-purple-100 text-purple-800'
                            : church.subscriptionTier === 'basic'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {church.subscriptionTier}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          church.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {church.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {church.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'yellow';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    yellow: 'from-yellow-500 to-yellow-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-lg flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
};

export default SuperAdminDashboard;
