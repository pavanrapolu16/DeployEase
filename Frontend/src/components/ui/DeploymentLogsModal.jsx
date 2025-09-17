import { useState, useEffect } from 'react';
import { FaTimes, FaClock, FaInfo, FaExclamationTriangle, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

const DeploymentLogsModal = ({ isOpen, onClose, deploymentId, projectName }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && deploymentId) {
      fetchLogs();
    }
  }, [isOpen, deploymentId]);

  const fetchLogs = async () => {
    if (!deploymentId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await apiService.get(`/deployments/${deploymentId}`);
      const deployment = response.data?.deployment;

      if (deployment && deployment.buildLogs) {
        // Sort logs by timestamp
        const sortedLogs = deployment.buildLogs.sort((a, b) =>
          new Date(a.timestamp) - new Date(b.timestamp)
        );
        setLogs(sortedLogs);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error('Error fetching deployment logs:', err);
      setError('Failed to load deployment logs');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getLogIcon = (level) => {
    switch (level) {
      case 'error':
        return <FaTimesCircle className="text-red-500" size={14} />;
      case 'warn':
        return <FaExclamationTriangle className="text-yellow-500" size={14} />;
      case 'info':
        return <FaInfo className="text-blue-500" size={14} />;
      default:
        return <FaInfo className="text-gray-500" size={14} />;
    }
  };

  const getLogColor = (level) => {
    switch (level) {
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'warn':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'info':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getTerminalColor = (level) => {
    switch (level) {
      case 'error':
        return 'text-red-400';
      case 'warn':
        return 'text-yellow-400';
      case 'success':
        return 'text-green-400';
      case 'info':
        return 'text-blue-400';
      default:
        return 'text-gray-300';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-2xl max-w-6xl w-full max-h-[85vh] overflow-hidden border border-gray-700">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <span className="text-gray-300 text-sm font-mono ml-4">
              {user?.username || user?.email?.split('@')[0] || 'user'}@deployease:~/{projectName || 'project'}/logs
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Terminal Content */}
        <div className="p-4 bg-black min-h-[400px] max-h-[65vh] overflow-y-auto font-mono text-sm">
          {loading ? (
            <div className="text-green-400">
              <div className="flex items-center space-x-2">
                <span>$</span>
                <span className="animate-pulse">Loading deployment logs...</span>
                <span className="animate-pulse">_</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-red-400">
              <div className="mb-2">Error: {error}</div>
              <div className="text-gray-500">$ _</div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-gray-500">
              <div className="mb-2">No deployment logs available yet.</div>
              <div className="mb-2">Waiting for deployment to start...</div>
              <div className="animate-pulse">$ _</div>
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log, index) => (
                <div key={index} className="text-gray-300">
                  <span className="text-green-400">$</span>
                  <span className="text-blue-400 ml-2">
                    [{formatTimestamp(log.timestamp)}]
                  </span>
                  <span className={`ml-2 ${getTerminalColor(log.level)}`}>
                    {log.message}
                  </span>
                </div>
              ))}
              <div className="text-gray-500 animate-pulse">
                <span className="text-green-400">$</span>
                <span className="ml-2">_</span>
              </div>
            </div>
          )}
        </div>

        {/* Terminal Footer */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-t border-gray-700">
          <div className="text-gray-400 text-xs font-mono">
            {logs.length} lines | Status: {loading ? 'Loading...' : error ? 'Error' : 'Active'}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors disabled:opacity-50 text-xs font-mono"
            >
              {loading ? '⟳' : '↻'} Refresh
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors text-xs font-mono"
            >
              ✕ Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentLogsModal;