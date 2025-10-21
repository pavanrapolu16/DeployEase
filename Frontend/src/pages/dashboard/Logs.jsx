import { useEffect, useState, useRef } from "react";
import { apiService } from "../../services/apiService";
import { useToast } from "../../contexts/ToastContext";
import { FaFileAlt, FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

export default function Logs() {
  const { showError } = useToast();
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedProjectName, setSelectedProjectName] = useState("");
  const [deployments, setDeployments] = useState([]);
  const [deploymentsLoading, setDeploymentsLoading] = useState(false);
  const [selectedDeploymentId, setSelectedDeploymentId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [projectQuery, setProjectQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const dropdownRef = useRef(null);

  const fetchProjects = async () => {
    try {
      setProjectsLoading(true);
      const res = await apiService.get('/projects');
      const list = res.data?.projects || [];
      setProjects(Array.isArray(list) ? list : []);
      if (Array.isArray(list) && list.length > 0) {
        const first = list[0];
        setSelectedProjectId(first._id);
        setSelectedProjectName(first.name || 'Project');
      }
    } catch (_) {
      showError('Failed to load projects');
    } finally {
      setProjectsLoading(false);
    }
  };

  const fetchDeploymentsForProject = async (projectId) => {
    if (!projectId) { setDeployments([]); return; }
    try {
      setDeploymentsLoading(true);
      const res = await apiService.get(`/deployments/project/${projectId}`);
      const list = res.data?.data?.deployments || [];
      setDeployments(Array.isArray(list) ? list : []);
      if (Array.isArray(list) && list.length > 0) {
        const d = list[0];
        setSelectedDeploymentId(d._id);
      } else {
        setSelectedDeploymentId(null);
        setLogs([]);
      }
    } catch (_) {
      showError('Failed to load deployments');
    } finally {
      setDeploymentsLoading(false);
    }
  };

  const fetchLogs = async (deploymentId) => {
    if (!deploymentId) { setLogs([]); return; }
    try {
      setLogsLoading(true);
      setLogsError(null);
      const res = await apiService.get(`/deployments/${deploymentId}`);
      const deployment = res.data?.data?.deployment;
      if (deployment && Array.isArray(deployment.buildLogs)) {
        const sorted = [...deployment.buildLogs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        setLogs(sorted);
      } else {
        setLogs([]);
      }
    } catch (err) {
      setLogsError('Failed to load deployment logs');
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);
  useEffect(() => { if (selectedProjectId) fetchDeploymentsForProject(selectedProjectId); }, [selectedProjectId]);
  useEffect(() => { if (selectedDeploymentId) fetchLogs(selectedDeploymentId); }, [selectedDeploymentId]);
  useEffect(() => {
    const onClick = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const formatTimestamp = (ts) => {
    const d = new Date(ts);
    return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getStatusPill = (status) => (
    <span className={`text-xs px-2 py-1 rounded-full ${status==='success'?'bg-green-100 text-green-700':status==='failed'?'bg-red-100 text-red-700':status==='building'?'bg-yellow-100 text-yellow-700':'bg-gray-100 text-gray-700'}`}>{status}</span>
  );

  const getTerminalColor = (level) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'success': return 'text-green-400';
      case 'info': return 'text-blue-400';
      default: return 'text-gray-300';
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <FaFileAlt className="text-primary-600" />
          <span>Deployment Logs</span>
        </h3>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Project</label>
          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center justify-between bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-72 px-3 py-2"
              onClick={() => setDropdownOpen((o) => !o)}
              disabled={projectsLoading || projects.length === 0}
            >
              <span className="truncate mr-2">{projectsLoading ? 'Loading...' : (selectedProjectName || 'Select project')}</span>
              <span className="text-gray-500">▾</span>
            </button>
            {dropdownOpen && (
              <div className="absolute z-20 mt-2 w-[18rem] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                <div className="p-2 border-b border-gray-100">
                  <input
                    autoFocus
                    type="text"
                    value={projectQuery}
                    onChange={(e) => { setProjectQuery(e.target.value); setHighlightIndex(0); }}
                    onKeyDown={(e) => {
                      const list = (projects || []).slice().sort((a,b)=>a.name.localeCompare(b.name)).filter(p => p.name.toLowerCase().includes(projectQuery.toLowerCase()));
                      if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIndex((i) => Math.min(i + 1, Math.max(list.length - 1, 0))); }
                      if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightIndex((i) => Math.max(i - 1, 0)); }
                      if (e.key === 'Enter') {
                        const p = list[highlightIndex];
                        if (p) {
                          setSelectedProjectId(p._id);
                          setSelectedProjectName(p.name || 'Project');
                          setDropdownOpen(false);
                        }
                      }
                      if (e.key === 'Escape') { setDropdownOpen(false); }
                    }}
                    placeholder="Search projects..."
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {projects.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-gray-500">No projects</div>
                  ) : (
                    (projects || [])
                      .slice()
                      .sort((a,b)=>a.name.localeCompare(b.name))
                      .filter(p => p.name.toLowerCase().includes(projectQuery.toLowerCase()))
                      .map((p, idx) => (
                        <button
                          key={p._id}
                          onClick={() => { setSelectedProjectId(p._id); setSelectedProjectName(p.name || 'Project'); setDropdownOpen(false); }}
                          className={`w-full text-left px-3 py-2 text-sm ${idx===highlightIndex ? 'bg-primary-50 text-primary-800' : 'hover:bg-gray-50'} ${p._id===selectedProjectId ? 'font-medium' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">{p.name}</span>
                            {p._id===selectedProjectId && <span className="ml-2 text-primary-600">●</span>}
                          </div>
                        </button>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl overflow-hidden">
            {deploymentsLoading ? (
              <div className="p-6 flex items-center gap-3 text-gray-500"><FaSpinner className="animate-spin" /> Loading deployments...</div>
            ) : deployments.length === 0 ? (
              <div className="p-8 text-center text-gray-600">No deployments for this project.</div>
            ) : (
              <div className="divide-y">
                {deployments.map((d) => (
                  <button
                    key={d._id}
                    onClick={() => setSelectedDeploymentId(d._id)}
                    className={`w-full text-left p-4 hover:bg-gray-50 ${selectedDeploymentId===d._id?'bg-primary-50/50':''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {d.status === 'success' ? (
                            <FaCheckCircle className="text-green-600" />
                          ) : d.status === 'failed' ? (
                            <FaTimesCircle className="text-red-600" />
                          ) : (
                            <FaSpinner className="text-gray-400 animate-spin" />
                          )}
                          <div className="font-medium text-gray-900 truncate">{selectedProjectName || 'Project'}</div>
                          <div className="text-xs text-gray-500">{d.branch ? d.branch : ''}</div>
                        </div>
                        <div className="text-sm text-gray-600 truncate mt-1">{d.commitMessage || 'Manual deployment'}</div>
                        <div className="text-xs text-gray-500 mt-1">{new Date(d.createdAt).toLocaleString()}</div>
                      </div>
                      {getStatusPill(d.status)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
              <div className="text-gray-300 text-sm font-mono">
                {selectedProjectName || 'project'} / {selectedDeploymentId ? selectedDeploymentId.slice(-6) : 'no-deployment'}
              </div>
              <button
                onClick={() => fetchLogs(selectedDeploymentId)}
                disabled={!selectedDeploymentId || logsLoading}
                className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors disabled:opacity-50 text-xs font-mono"
              >
                {logsLoading ? '⟳' : '↻'} Refresh
              </button>
            </div>
            <div className="p-4 bg-black min-h-[420px] max-h-[65vh] overflow-y-auto font-mono text-sm">
              {!selectedDeploymentId ? (
                <div className="text-gray-500">Select a deployment to view logs.</div>
              ) : logsLoading ? (
                <div className="text-green-400 flex items-center gap-2"><span>$</span><span className="animate-pulse">Loading deployment logs...</span><span className="animate-pulse">_</span></div>
              ) : logsError ? (
                <div className="text-red-400">{logsError}</div>
              ) : logs.length === 0 ? (
                <div className="text-gray-500">
                  <div className="mb-2">No deployment logs available yet.</div>
                  <div className="animate-pulse">$ _</div>
                </div>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, idx) => (
                    <div key={idx} className="text-gray-300">
                      <span className="text-green-400">$</span>
                      <span className="text-blue-400 ml-2">[{formatTimestamp(log.timestamp)}]</span>
                      <span className={`ml-2 ${getTerminalColor(log.level)}`}>{log.message}</span>
                    </div>
                  ))}
                  <div className="text-gray-500 animate-pulse"><span className="text-green-400">$</span><span className="ml-2">_</span></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

