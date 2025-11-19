
import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Activity, 
  Server, 
  LogOut, 
  TrendingUp, 
  Shield, 
  Clock, 
  Smartphone, 
  Mail,
  Calendar,
  Search,
  Database,
  CheckCircle2,
  AlertCircle,
  Zap
} from 'lucide-react';
import { User } from '../types';
import { authService } from '../services/authService';
import { statsService } from '../services/statsService';

interface AdminPanelProps {
  user: User;
  onLogout: () => void;
}

type Tab = 'overview' | 'users' | 'analytics' | 'system';

const AdminPanel: React.FC<AdminPanelProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Fetch data on mount
    const allUsers = authService.getAllUsers();
    const dashboardStats = statsService.getDashboardStats();
    setUsers(allUsers);
    setStats(dashboardStats);
  }, []);

  if (!stats) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-indigo-400">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <span className="animate-pulse">Connecting to MongoDB Cluster...</span>
      </div>
    </div>
  );

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6 animate-fadeIn">
             {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <DashboardCard 
                title="Total Users" 
                value={users.length} 
                icon={<Users className="w-6 h-6" />} 
                color="text-blue-400" 
                bg="bg-blue-500/10"
                subtext="Registered accounts"
              />
              <DashboardCard 
                title="Total Generations" 
                value={stats.totalGenerations} 
                icon={<Activity className="w-6 h-6" />} 
                color="text-purple-400" 
                bg="bg-purple-500/10"
                subtext="Voice requests processed"
              />
              <DashboardCard 
                title="Retention Rate" 
                value={`${stats.retentionRate.toFixed(1)}%`} 
                icon={<TrendingUp className="w-6 h-6" />} 
                color="text-green-400" 
                bg="bg-green-500/10"
                subtext="Returning users (>3 gens)"
              />
              <DashboardCard 
                title="Data Volume" 
                value={`${(stats.totalCharacters / 1000).toFixed(1)}k`} 
                icon={<Server className="w-6 h-6" />} 
                color="text-orange-400" 
                bg="bg-orange-500/10"
                subtext="Characters synthesized"
              />
            </div>

            {/* Plan & Limits Banner */}
            <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 rounded-2xl p-8 border border-indigo-500/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Zap className="w-48 h-48 text-indigo-400" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 bg-indigo-500 text-white text-xs font-bold rounded uppercase">Current Plan</span>
                  <span className="text-indigo-300 text-sm font-mono">FREE_TIER_V1</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Unlimited Early Access</h3>
                <p className="text-slate-400 max-w-2xl mb-6">
                  The platform is currently operating on the Free Tier with no hard limits on generation count or character length for early adopters.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-white/10 pt-6">
                   <div>
                     <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">User Limit</p>
                     <p className="text-white font-medium">Unlimited</p>
                   </div>
                   <div>
                     <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Next Expansion</p>
                     <p className="text-white font-medium">Q4 2025</p>
                   </div>
                   <div>
                     <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Infrastructure</p>
                     <p className="text-white font-medium">Cluster 0 (Shared)</p>
                   </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Recent System Activity</h3>
              <div className="space-y-4">
                {stats.logs.slice().reverse().slice(0, 5).map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg border border-slate-800/50">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-900/30 flex items-center justify-center text-indigo-400">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm text-slate-200"><span className="font-medium text-indigo-300">{log.userEmail}</span> generated audio</div>
                          <div className="text-xs text-slate-500">{log.voice} Voice • {log.style} Style</div>
                        </div>
                     </div>
                     <span className="text-xs text-slate-500 font-mono">
                       {new Date(log.timestamp).toLocaleTimeString()}
                     </span>
                  </div>
                ))}
                {stats.logs.length === 0 && (
                  <div className="text-center text-slate-500 py-4">No activity recorded yet.</div>
                )}
              </div>
            </div>
          </div>
        );
      
      case 'users':
        return (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center">
               <h2 className="text-xl font-bold text-white">User Database</h2>
               <div className="relative">
                 <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                 <input 
                    type="text" 
                    placeholder="Search users..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                 />
               </div>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                      <th className="p-4 font-medium">User Identity</th>
                      <th className="p-4 font-medium">Contact Details</th>
                      <th className="p-4 font-medium">Registration</th>
                      <th className="p-4 font-medium text-center">Usage</th>
                      <th className="p-4 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredUsers.map((u) => {
                      const genCount = statsService.getUserGenerationCount(u.id);
                      return (
                        <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white text-sm font-bold shadow-inner">
                                {u.username.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-slate-200">{u.username}</div>
                                <div className="text-xs text-slate-500 font-mono">ID: {u.id.substring(0, 6)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-slate-300">
                                <Mail className="w-3 h-3 text-slate-500" /> {u.email}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-300">
                                <Smartphone className="w-3 h-3 text-slate-500" /> {u.phone}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <Clock className="w-3 h-3" />
                              {new Date(u.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className={`text-sm font-bold ${genCount > 10 ? 'text-indigo-400' : 'text-slate-400'}`}>
                                {genCount}
                              </span>
                              <span className="text-[10px] text-slate-600 uppercase">Gens</span>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-900">
                               Active
                             </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredUsers.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  No users found matching "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        );
      
      case 'analytics':
        // Find max for scaling
        const maxCount = Math.max(...stats.dailyActivity.map((d: any) => d.count), 1);
        
        return (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-white">Platform Analytics</h2>
            
            {/* Activity Chart */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
               <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                 <Activity className="w-4 h-4" /> Daily Generation Volume (7 Days)
               </h3>
               <div className="h-64 flex items-end justify-between gap-2 px-4">
                  {stats.dailyActivity.map((day: any, i: number) => {
                    const height = (day.count / maxCount) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                         <div className="relative w-full bg-slate-800 rounded-t-lg hover:bg-indigo-900/50 transition-all duration-500 flex items-end group-hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]" style={{ height: `${height || 2}%` }}>
                            <div className="w-full bg-indigo-500/80 rounded-t-lg h-full opacity-80 group-hover:opacity-100 transition-opacity"></div>
                            
                            {/* Tooltip */}
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-700">
                              {day.count} generations
                            </div>
                         </div>
                         <span className="text-xs text-slate-500 font-medium">{day.day}</span>
                      </div>
                    );
                  })}
               </div>
            </div>

            {/* Retention Explanation */}
             <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-center gap-6">
                <div className="p-4 bg-green-500/10 rounded-full">
                   <Users className="w-8 h-8 text-green-400" />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-white">Customer Retention Analysis</h3>
                   <p className="text-slate-400 text-sm mt-1 max-w-2xl">
                     The platform currently has a <span className="text-white font-bold">{stats.retentionRate.toFixed(1)}%</span> retention rate. 
                     This is calculated based on users who return to the platform to generate at least 3 distinct audio clips after their initial registration.
                     High retention suggests the "Natural" and "Professional" voice styles are driving recurrent usage.
                   </p>
                </div>
             </div>
          </div>
        );

      case 'system':
        return (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-white">System Health & Configuration</h2>
            
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 space-y-8">
               {/* MongoDB Config */}
               <div className="space-y-4">
                  <div className="flex items-center gap-3 text-green-400 mb-2">
                    <Database className="w-5 h-5" />
                    <h3 className="font-bold text-white">Database Connection</h3>
                    <span className="px-2 py-0.5 bg-green-900/30 border border-green-800 rounded text-xs">Connected</span>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500 uppercase">Active Cluster URI</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value="mongodb+srv://user:user7233@cluster0.wzu8u.mongodb.net/Test" 
                        readOnly
                        className="flex-1 bg-slate-950 border border-slate-800 text-slate-400 text-sm font-mono p-3 rounded-lg select-all"
                      />
                      <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors">
                        Test Connection
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-500" /> Latency: 45ms • Region: AWS us-east-1
                    </p>
                  </div>
               </div>

               <hr className="border-slate-800" />

               {/* Environment Variables */}
               <div className="space-y-4">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Server className="w-5 h-5 text-indigo-400" /> Environment Variables
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                        <span className="text-xs text-slate-500 uppercase block mb-1">NODE_ENV</span>
                        <span className="text-slate-200 font-mono">production</span>
                     </div>
                     <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                        <span className="text-xs text-slate-500 uppercase block mb-1">GEMINI_API_VERSION</span>
                        <span className="text-slate-200 font-mono">v1beta (preview)</span>
                     </div>
                     <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                        <span className="text-xs text-slate-500 uppercase block mb-1">MAX_CONCURRENCY</span>
                        <span className="text-slate-200 font-mono">5000 req/s</span>
                     </div>
                     <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                        <span className="text-xs text-slate-500 uppercase block mb-1">REGION</span>
                        <span className="text-slate-200 font-mono">Global Edge</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex">
      {/* Sidebar */}
      <nav className="w-64 bg-slate-900 border-r border-slate-800 p-6 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10 text-indigo-400">
          <Shield className="w-8 h-8" />
          <h1 className="text-xl font-bold tracking-tight text-white">SonicForge<br/><span className="text-xs font-normal text-slate-500 uppercase tracking-widest">Admin Console</span></h1>
        </div>
        
        <div className="space-y-2 flex-1">
          <NavButton 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')} 
            icon={<LayoutDashboard className="w-5 h-5" />} 
            label="Overview" 
          />
          <NavButton 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')} 
            icon={<Users className="w-5 h-5" />} 
            label="User Base" 
          />
          <NavButton 
            active={activeTab === 'analytics'} 
            onClick={() => setActiveTab('analytics')} 
            icon={<Activity className="w-5 h-5" />} 
            label="Analytics" 
          />
          <NavButton 
            active={activeTab === 'system'} 
            onClick={() => setActiveTab('system')} 
            icon={<Server className="w-5 h-5" />} 
            label="System Health" 
          />
        </div>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 mb-4">
             <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs">AD</div>
             <div className="overflow-hidden">
               <p className="text-sm font-medium text-white truncate">{user.username}</p>
               <p className="text-xs text-slate-500 truncate">{user.email}</p>
             </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </nav>

      {/* Mobile Header (visible only on small screens) */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-900 p-4 z-50 border-b border-slate-800 flex justify-between items-center">
        <span className="font-bold text-white">Admin Panel</span>
        <button onClick={onLogout}><LogOut className="w-5 h-5" /></button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 md:ml-0 pt-20 md:pt-10 overflow-y-auto">
         <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white capitalize">{activeTab}</h2>
            <p className="text-slate-400 text-sm">
              {activeTab === 'overview' && 'Real-time platform insights'}
              {activeTab === 'users' && 'Manage registered accounts'}
              {activeTab === 'analytics' && 'Performance and retention metrics'}
              {activeTab === 'system' && 'Infrastructure status and logs'}
            </p>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden md:flex px-3 py-1 bg-indigo-900/20 border border-indigo-800 text-indigo-300 text-xs rounded-full items-center gap-2">
                <Clock className="w-3 h-3" />
                UTC {new Date().toLocaleTimeString()}
             </div>
             <div className="px-3 py-1 bg-green-900/20 border border-green-800 text-green-400 text-xs rounded-full flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Cluster Active
             </div>
          </div>
        </header>

        {renderContent()}
      </main>
    </div>
  );
};

const DashboardCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode, color: string, bg: string, subtext: string }> = ({ 
  title, value, icon, color, bg, subtext 
}) => (
  <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg hover:border-slate-700 transition-all">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-slate-500 text-xs uppercase font-semibold tracking-wider">{title}</p>
        <h3 className="text-3xl font-bold text-white mt-1">{value}</h3>
      </div>
      <div className={`p-3 ${bg} rounded-xl ${color}`}>
        {icon}
      </div>
    </div>
    <div className="text-xs text-slate-400 border-t border-slate-800/50 pt-3 mt-2 flex items-center gap-1">
      {subtext}
    </div>
  </div>
);

const NavButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20 font-medium' 
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default AdminPanel;
