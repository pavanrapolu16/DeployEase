import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { apiService } from "../../services/apiService";

export default function Overview() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, active: 0, successful: 0, successRate: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiService.get('/deployments/stats');
        setStats(res.data || { total: 0, active: 0, successful: 0, successRate: 0 });
      } catch (_) {}
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, {user?.firstName || user?.name || 'User'}! 👋</h2>
        <p className="text-gray-600">Deploy and manage your projects with ease.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-sm text-gray-500">Total Deployments</div>
          <div className="text-2xl font-semibold">{stats.total}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-sm text-gray-500">Active</div>
          <div className="text-2xl font-semibold">{stats.active}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-sm text-gray-500">Successful</div>
          <div className="text-2xl font-semibold">{stats.successful}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-sm text-gray-500">Success Rate</div>
          <div className="text-2xl font-semibold">{stats.successRate}%</div>
        </div>
      </div>
    </div>
  );
}
