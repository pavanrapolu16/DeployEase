import { useState, useEffect } from 'react';
import { FaTimes, FaClock, FaInfo, FaExclamationTriangle, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { apiService } from '../../services/apiService';

const DeploymentLogsModal = ({ isOpen, onClose, deploymentId, projectName }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Deployment Logs
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {projectName && `Project: ${projectName}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaTimes className="text-gray-500" size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600">Loading logs...</span>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <FaTimesCircle className="mx-auto text-red-500 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Logs</h3>
              <p className="text-gray-600">{error}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <FaInfo className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Logs Available</h3>
              <p className="text-gray-600">Deployment logs will appear here once the build process starts.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getLogColor(log.level)}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getLogIcon(log.level)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xs font-medium uppercase tracking-wide">
                          {log.level}
                        </span>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <FaClock size={10} />
                          <span>{formatTimestamp(log.timestamp)}</span>
                        </div>
                      </div>
                      <div className="text-sm whitespace-pre-wrap break-words">
                        {log.message}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {logs.length} log{logs.length !== 1 ? 's' : ''} total
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {loading ? 'Refreshing...' : 'Refresh Logs'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeploymentLogsModal;