import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { apiService } from "../../services/apiService";
import { FaServer, FaGlobe, FaGithub, FaRocket, FaTrash, FaFileAlt } from 'react-icons/fa';
import BuildSettingsModal from "../../components/ui/BuildSettingsModal";
import DeploymentLogsModal from "../../components/ui/DeploymentLogsModal";

export default function Projects() {
  const { token } = useAuth();
  const { showError, showSuccess } = useToast();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deploymentPolling, setDeploymentPolling] = useState({});
  const [pollingIntervals, setPollingIntervals] = useState({});
  const [buildSettingsModalOpen, setBuildSettingsModalOpen] = useState(false);
  const [selectedProjectForSettings, setSelectedProjectForSettings] = useState(null);
  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [selectedDeploymentForLogs, setSelectedDeploymentForLogs] = useState(null);
  const [selectedProjectForLogs, setSelectedProjectForLogs] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const response = await apiService.get('/projects');
        const projectsData = response.data?.projects || [];
        setProjects(projectsData);
        projectsData.forEach(project => {
          if (project.lastDeployment && (project.lastDeployment.status === 'pending' || project.lastDeployment.status === 'building')) {
            setDeploymentPolling(prev => ({ ...prev, [project._id]: true }));
            pollDeploymentStatus(project._id);
          }
        });
      } catch (err) {
        showError('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [token]);

  useEffect(() => () => { Object.values(pollingIntervals).forEach(clearInterval); }, [pollingIntervals]);

  const pollDeploymentStatus = (projectId) => {
    if (pollingIntervals[projectId]) clearInterval(pollingIntervals[projectId]);
    const pollInterval = setInterval(async () => {
      try {
        const response = await apiService.get('/projects');
        const list = response.data?.projects || [];
        setProjects(list);
        const project = Array.isArray(list) ? list.find(p => p._id === projectId) : null;
        if (project && project.lastDeployment) {
          const d = project.lastDeployment;
          if (d.status === 'success' || d.status === 'failed') {
            clearInterval(pollInterval);
            setPollingIntervals(prev => { const x = { ...prev }; delete x[projectId]; return x; });
            setDeploymentPolling(prev => ({ ...prev, [projectId]: false }));
            if (d.status === 'success') showSuccess('Deployment completed successfully!');
            else showError('Deployment failed. Please check the logs.');
          }
        }
      } catch (_) {
        clearInterval(pollInterval);
        setPollingIntervals(prev => { const x = { ...prev }; delete x[projectId]; return x; });
        setDeploymentPolling(prev => ({ ...prev, [projectId]: false }));
      }
    }, 3000);
    setPollingIntervals(prev => ({ ...prev, [projectId]: pollInterval }));
    setTimeout(() => { clearInterval(pollInterval); setPollingIntervals(prev => { const x = { ...prev }; delete x[projectId]; return x; }); setDeploymentPolling(prev => ({ ...prev, [projectId]: false })); }, 300000);
  };

  const handleDeployProject = async (projectId) => {
    try {
      const response = await apiService.post(`/projects/${projectId}/deploy`);
      const deployment = response.data?.deployment;
      showSuccess('Deployment started successfully!');
      if (deployment) { setDeploymentPolling(prev => ({ ...prev, [projectId]: true })); pollDeploymentStatus(projectId); }
      else {
        const res = await apiService.get('/projects');
        setProjects(res.data?.projects || []);
      }
    } catch (err) { showError('Failed to start deployment'); }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Delete this project? This cannot be undone.')) return;
    try {
      await apiService.delete(`/projects/${projectId}`);
      showSuccess('Project deleted successfully!');
      const res = await apiService.get('/projects');
      setProjects(res.data?.projects || []);
    } catch (err) { showError('Failed to delete project'); }
  };

  const handleViewLogs = (project, deployment) => {
    setSelectedDeploymentForLogs(deployment._id);
    setSelectedProjectForLogs(project.name);
    setLogsModalOpen(true);
  };

  const handleCloseLogsModal = () => { setLogsModalOpen(false); setSelectedDeploymentForLogs(null); setSelectedProjectForLogs(null); };

  const openBuildSettings = (project) => { setSelectedProjectForSettings(project); setBuildSettingsModalOpen(true); };

  const handleSettingsUpdate = (updatedProject) => {
    setProjects(prev => prev.map(p => p._id === updatedProject._id ? updatedProject : p));
    showSuccess('Build settings updated successfully!');
  };

  if (loading) {
    return (
      <section>
        <h3 className="text-xl font-semibold mb-4 text-gray-900 flex items-center space-x-2">
          <FaServer className="text-primary-600" />
          <span>My Projects</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-medium p-6 animate-pulse border border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="flex justify-between"><div className="h-3 bg-gray-200 rounded w-20"></div><div className="h-8 bg-gray-200 rounded w-24"></div></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <h3 className="text-xl font-semibold mb-4 text-gray-900 flex items-center space-x-2">
        <FaServer className="text-primary-600" />
        <span>My Projects</span>
      </h3>
      {(!Array.isArray(projects) || projects.length === 0) ? (
        <div className="bg-white p-8 rounded-xl shadow-medium text-center border border-gray-200">
          <FaRocket size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold mb-2 text-gray-900">No Projects Yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">Import a repository from GitHub to create your first deployment project.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project._id} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-lg text-gray-900 truncate">{project.name}</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  project.projectType === 'static' ? 'bg-green-100 text-green-800' :
                  project.projectType === 'react' ? 'bg-cyan-100 text-cyan-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {project.projectType === 'static' ? 'Static' : project.projectType === 'react' ? 'React' : 'Node.js'}
                </span>
              </div>

              <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 text-sm font-medium block mb-4 truncate hover:underline flex items-center space-x-1">
                <FaGithub className="text-xs" />
                <span>View Repo</span>
              </a>

              {project.lastDeployment && project.lastDeployment.deployedUrl ? (
                <div className="mt-auto">
                  <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Live URL</p>
                  <a href={project.lastDeployment.deployedUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 font-semibold text-sm break-all hover:underline flex items-center space-x-1">
                    <FaGlobe />
                    <span>{project.lastDeployment.deployedUrl}</span>
                  </a>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Live</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleViewLogs(project, project.lastDeployment)} className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center">
                      <FaFileAlt size={16} />
                    </button>
                    <button onClick={() => handleDeleteProject(project._id)} className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors">
                      <FaTrash size={16} />
                    </button>
                  </div>
                </div>
              ) : project.customDomain ? (
                <div className="mt-auto">
                  <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Pending URL</p>
                  <a href={`https://${project.customDomain}`} target="_blank" rel="noopener noreferrer" className="text-yellow-600 hover:text-yellow-700 font-semibold text-sm break-all hover:underline flex items-center space-x-1">
                    <FaGlobe />
                    <span>{project.customDomain}</span>
                  </a>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">Pending</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => openBuildSettings(project)} className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 rounded-lg font-semibold transition-colors">Settings</button>
                    <button onClick={() => handleDeployProject(project._id)} disabled={deploymentPolling[project._id]} className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {deploymentPolling[project._id] ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Deploying...</span></>) : (<><FaRocket /><span>Deploy Now</span></>)}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <button onClick={() => openBuildSettings(project)} className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 rounded-lg font-semibold transition-colors">Settings</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <BuildSettingsModal isOpen={buildSettingsModalOpen} onClose={() => setBuildSettingsModalOpen(false)} project={selectedProjectForSettings} onUpdate={handleSettingsUpdate} />
      <DeploymentLogsModal isOpen={logsModalOpen} onClose={handleCloseLogsModal} deploymentId={selectedDeploymentForLogs} projectName={selectedProjectForLogs} />
    </section>
  );
}
