import { useEffect, useState } from "react";
import { apiService } from "../../services/apiService";
import { useToast } from "../../contexts/ToastContext";
import { FaFileAlt, FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import DeploymentLogsModal from "../../components/ui/DeploymentLogsModal";

export default function Logs() {
  const { showError } = useToast();
  const [deployments, setDeployments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedDeploymentId, setSelectedDeploymentId] = useState(null);
  const [selectedProjectName, setSelectedProjectName] = useState(null);

  const fetchDeployments = async (page = 1) => {
    try {
      setLoading(true);
      const res = await apiService.get(`/deployments?page=${page}&limit=${pagination.limit}`);
      const data = res.data?.data || {};
      setDeployments(data.deployments || []);
      setPagination(data.pagination || { page: 1, limit: 10, pages: 1, total: 0 });
    } catch (err) {
      showError('Failed to load deployments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDeployments(1); }, []);

  const openLogs = (deployment) => {
    setSelectedDeploymentId(deployment._id);
    setSelectedProjectName(deployment.project?.name || 'Project');
  };

  const closeLogs = () => { setSelectedDeploymentId(null); setSelectedProjectName(null); };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <FaFileAlt className="text-primary-600" />
          <span>Deployment Logs</span>
        </h3>
        <div className="text-sm text-gray-500">{pagination.total} total</div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="divide-y">
          {loading ? (
            <div className="p-6 flex items-center gap-3 text-gray-500"><FaSpinner className="animate-spin" /> Loading...</div>
          ) : deployments.length === 0 ? (
            <div className="p-8 text-center text-gray-600">No deployments yet.</div>
          ) : (
            deployments.map((d) => (
              <div key={d._id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {d.status === 'success' ? (
                      <FaCheckCircle className="text-green-600" />
                    ) : d.status === 'failed' ? (
                      <FaTimesCircle className="text-red-600" />
                    ) : (
                      <FaSpinner className="text-gray-400 animate-spin" />
                    )}
                    <div className="font-medium text-gray-900 truncate">{d.project?.name || 'Project'}</div>
                    <div className="text-xs text-gray-500">{d.branch ? d.branch : ''}</div>
                  </div>
                  <div className="text-sm text-gray-600 truncate mt-1">{d.commitMessage || 'Manual deployment'}</div>
                  <div className="text-xs text-gray-500 mt-1">{new Date(d.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${d.status==='success'?'bg-green-100 text-green-700':d.status==='failed'?'bg-red-100 text-red-700':'bg-yellow-100 text-yellow-700'}`}>{d.status}</span>
                  <button onClick={() => openLogs(d)} className="px-3 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-black/80">View Logs</button>
                </div>
              </div>
            ))
          )}
        </div>
        {!loading && pagination.pages > 1 && (
          <div className="flex items-center justify-between p-3 border-t bg-gray-50">
            <button disabled={pagination.page <= 1} onClick={() => fetchDeployments(pagination.page - 1)} className="px-3 py-1 text-sm rounded-lg border disabled:opacity-50">Prev</button>
            <div className="text-xs text-gray-600">Page {pagination.page} of {pagination.pages}</div>
            <button disabled={pagination.page >= pagination.pages} onClick={() => fetchDeployments(pagination.page + 1)} className="px-3 py-1 text-sm rounded-lg border disabled:opacity-50">Next</button>
          </div>
        )}
      </div>

      <DeploymentLogsModal isOpen={!!selectedDeploymentId} onClose={closeLogs} deploymentId={selectedDeploymentId} projectName={selectedProjectName} />
    </section>
  );
}
