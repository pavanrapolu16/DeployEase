import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { githubService } from "../services/githubService";
import { apiService } from "../services/apiService";
import ProjectImportModal from "../components/ui/ProjectImportModal";
import EditProfileModal from "../components/ui/EditProfileModal";
import BuildSettingsModal from "../components/ui/BuildSettingsModal";
import { FaGithub, FaCode, FaRocket, FaUser, FaBars, FaTimes, FaGlobe, FaServer, FaCog, FaTrash, FaEdit, FaCogs } from 'react-icons/fa';

const Dashboard = () => {
  const { user, token, logout } = useAuth();
  const { showError, showSuccess } = useToast();
  const [repos, setRepos] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [githubConnected, setGithubConnected] = useState(false);
  const [checkingGithub, setCheckingGithub] = useState(true);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importingUrl, setImportingUrl] = useState(false);
  const [deploymentPolling, setDeploymentPolling] = useState({});
  const [pollingIntervals, setPollingIntervals] = useState({});
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [buildSettingsModalOpen, setBuildSettingsModalOpen] = useState(false);
  const [selectedProjectForSettings, setSelectedProjectForSettings] = useState(null);
  const [deploymentStats, setDeploymentStats] = useState({
    total: 0,
    active: 0,
    successful: 0,
    successRate: 0
  });

  // Check GitHub connection
  useEffect(() => {
    const checkGithubConnection = async () => {
      try {
        setCheckingGithub(true);
        await githubService.getUserInfo();
        setGithubConnected(true);
      } catch (err) {
        console.error("GitHub not connected:", err);
        setGithubConnected(false);
      } finally {
        setCheckingGithub(false);
      }
    };

    if (token) {
      checkGithubConnection();
    } else {
      setCheckingGithub(false);
      setGithubConnected(false);
    }
  }, [token]);

  // Handle GitHub connection errors gracefully
  useEffect(() => {
    if (!githubConnected && !checkingGithub) {
      // GitHub not connected - this is normal for new users
      console.log("GitHub not connected - user needs to connect account");
    }
  }, [githubConnected, checkingGithub]);

  // Fetch GitHub repositories
  useEffect(() => {
    const fetchRepos = async () => {
      if (!githubConnected) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const repositories = await githubService.getUserRepos();
        setRepos(repositories || []);
      } catch (err) {
        console.error(err);
        showError(err.message || "Failed to load repositories.");
      } finally {
        setLoading(false);
      }
    };

    if (token && githubConnected) {
      fetchRepos();
    } else if (token && !checkingGithub) {
      // If we have token but GitHub is not connected, still set loading to false
      setLoading(false);
    }
  }, [token, githubConnected, checkingGithub]);

  // Fetch user's projects
  useEffect(() => {
    const fetchProjects = async () => {
      if (!token) return;

      try {
        setProjectsLoading(true);
        const response = await apiService.get('/projects');
        const projectsData = response.data?.projects || [];
        setProjects(projectsData);

        // Check for projects with ongoing deployments and start polling
        if (Array.isArray(projectsData)) {
          projectsData.forEach(project => {
            if (project.lastDeployment &&
                (project.lastDeployment.status === 'pending' || project.lastDeployment.status === 'building')) {
              setDeploymentPolling(prev => ({ ...prev, [project._id]: true }));
              pollDeploymentStatus(project._id);
            }
          });
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
        showError('Failed to load projects');
      } finally {
        setProjectsLoading(false);
      }
    };

    if (token) {
      fetchProjects();
    }
  }, [token]);


  // Fetch deployment statistics
  useEffect(() => {
    const fetchDeploymentStats = async () => {
      if (!token) return;

      try {
        const response = await apiService.get('/deployments/stats');
        setDeploymentStats(response.data || {
          total: 0,
          active: 0,
          successful: 0,
          successRate: 0
        });
      } catch (err) {
        console.error('Error fetching deployment stats:', err);
      }
    };

    if (token) {
      fetchDeploymentStats();
    }
  }, [token, showError]);

  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(pollingIntervals).forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, [pollingIntervals]);

  // Connect GitHub handler
  const handleConnectGithub = () => {
    window.location.href = "/api/oauth/github";
  };

  // Scroll to section handler
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Import repository handler
  const handleImport = (repo) => {
    setSelectedRepo(repo);
    setImportModalOpen(true);
  };

  // Close import modal
  const handleCloseImportModal = () => {
    setImportModalOpen(false);
    setSelectedRepo(null);
    // Refresh projects list when modal closes
    if (token) {
      const fetchProjects = async () => {
        try {
          setProjectsLoading(true);
          const response = await apiService.get('/projects');
          const projectsData = response.data?.projects || [];
          setProjects(projectsData);

          // Check for projects with ongoing deployments and start polling
          if (Array.isArray(projectsData)) {
            projectsData.forEach(project => {
              if (project.lastDeployment &&
                  (project.lastDeployment.status === 'pending' || project.lastDeployment.status === 'building')) {
                setDeploymentPolling(prev => ({ ...prev, [project._id]: true }));
                pollDeploymentStatus(project._id);
              }
            });
          }
        } catch (err) {
          console.error('Error fetching projects:', err);
        } finally {
          setProjectsLoading(false);
        }
      };
      fetchProjects();
    }
  };

  // Poll deployment status
  const pollDeploymentStatus = async (projectId) => {
    // Clear any existing interval for this project
    if (pollingIntervals[projectId]) {
      clearInterval(pollingIntervals[projectId]);
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await apiService.get('/projects');
        const projectsData = response.data?.projects || [];
        setProjects(projectsData);

        // Find the project and check deployment status
        const project = Array.isArray(projectsData) ? projectsData.find(p => p._id === projectId) : null;
        if (project && project.lastDeployment) {
          const deployment = project.lastDeployment;
          if (deployment.status === 'success' || deployment.status === 'failed') {
            // Deployment completed
            clearInterval(pollInterval);
            setPollingIntervals(prev => {
              const newIntervals = { ...prev };
              delete newIntervals[projectId];
              return newIntervals;
            });
            setDeploymentPolling(prev => ({ ...prev, [projectId]: false }));

            if (deployment.status === 'success') {
              showSuccess('Deployment completed successfully!');
            } else {
              showError('Deployment failed. Please check the logs.');
            }
          }
        }
      } catch (error) {
        console.error('Error polling deployment status:', error);
        clearInterval(pollInterval);
        setPollingIntervals(prev => {
          const newIntervals = { ...prev };
          delete newIntervals[projectId];
          return newIntervals;
        });
        setDeploymentPolling(prev => ({ ...prev, [projectId]: false }));
      }
    }, 3000); // Poll every 3 seconds

    // Store the interval ID
    setPollingIntervals(prev => ({ ...prev, [projectId]: pollInterval }));

    // Stop polling after 5 minutes to prevent infinite polling
    setTimeout(() => {
      clearInterval(pollInterval);
      setPollingIntervals(prev => {
        const newIntervals = { ...prev };
        delete newIntervals[projectId];
        return newIntervals;
      });
      setDeploymentPolling(prev => ({ ...prev, [projectId]: false }));
    }, 300000); // 5 minutes
  };

  // Deploy project handler
  const handleDeployProject = async (projectId) => {
    try {
      const response = await apiService.post(`/projects/${projectId}/deploy`);
      const deployment = response.data?.deployment;

      showSuccess('Deployment started successfully!');

      if (deployment) {
        // Start polling for deployment status
        setDeploymentPolling(prev => ({ ...prev, [projectId]: true }));
        pollDeploymentStatus(projectId);
      } else {
        // Fallback: refresh immediately if no deployment returned
        const projectsResponse = await apiService.get('/projects');
        setProjects(projectsResponse.data?.projects || []);
      }
    } catch (err) {
      console.error('Error deploying project:', err);
      showError('Failed to start deployment');
    }
  };

  // Delete project handler
  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.delete(`/projects/${projectId}`);
      showSuccess('Project deleted successfully!');

      // Refresh projects list
      const response = await apiService.get('/projects');
      setProjects(response.data?.projects || []);
    } catch (err) {
      console.error('Error deleting project:', err);
      showError('Failed to delete project');
    }
  };

  // Open edit profile modal
  const handleEditProfile = () => {
    setEditProfileModalOpen(true);
  };

  // Handle profile update
  const handleProfileUpdate = () => {
    // Update user in auth context if needed
    // For now, just show success message
    showSuccess('Profile updated successfully!');
  };

  // Open build settings modal
  const handleBuildSettings = (project) => {
    setSelectedProjectForSettings(project);
    setBuildSettingsModalOpen(true);
  };

  // Handle build settings update
  const handleSettingsUpdate = (updatedProject) => {
    // Update project in projects list
    setProjects(prevProjects =>
      prevProjects.map(project =>
        project._id === updatedProject._id ? updatedProject : project
      )
    );
    showSuccess('Build settings updated successfully!');
  };


  // Import by URL handler
  const handleImportByUrl = async (e) => {
    e.preventDefault();
    if (!importUrl.trim()) return;

    // Parse GitHub URL
    const urlPattern = /^https?:\/\/(www\.)?github\.com\/([^/]+)\/([^/]+)(?:\/.*)?$/i;
    const match = importUrl.trim().match(urlPattern);

    if (!match) {
      showError('Invalid GitHub URL. Please use format: https://github.com/owner/repo');
      return;
    }

    const [, , owner, repo] = match;

    try {
      setImportingUrl(true);

      // Get repo details from GitHub API
      const repoDetails = await githubService.getRepoDetails(owner, repo);

      // Create repo object for import modal
      const repoObject = {
        id: repoDetails.id,
        name: repoDetails.name,
        fullName: repoDetails.fullName,
        description: repoDetails.description,
        url: repoDetails.url,
        language: repoDetails.language,
        stars: repoDetails.stars,
        isPrivate: repoDetails.isPrivate
      };

      // Open import modal with this repo
      setSelectedRepo(repoObject);
      setImportModalOpen(true);
      setImportUrl(''); // Clear the URL input

    } catch (err) {
      console.error('Error fetching repo details:', err);
      showError('Failed to fetch repository details. Please check the URL and try again.');
    } finally {
      setImportingUrl(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      {/* Dashboard Topbar */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/20 px-4 py-4 md:px-6 flex justify-between items-center z-40">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-primary-600"
          >
            {showSidebar ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
          <h1 className="text-xl font-bold text-primary-600 flex items-center space-x-2">
            <FaRocket className="text-primary-500" />
            <span>DeployEase</span>
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-gray-700 font-medium hidden sm:block">
            Welcome, {user?.firstName || user?.name || "User"}
          </span>
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-1"
          >
            <FaUser />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <aside className={`${
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-40 w-64 bg-white/90 backdrop-blur-md shadow-xl border-r border-white/20 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:shadow-lg p-6`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-primary-600">Menu</h2>
            <button
              onClick={() => setShowSidebar(false)}
              className="md:hidden p-1 rounded-lg hover:bg-gray-100"
            >
              <FaTimes size={18} className="text-gray-500" />
            </button>
          </div>
          <ul className="space-y-4">
            <li>
              <button
                onClick={() => { scrollToSection('overview'); setShowSidebar(false); }}
                className="w-full text-left flex items-center space-x-3 py-2 px-3 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors"
              >
                <FaUser size={18} />
                <span>Overview</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => { scrollToSection('repositories'); setShowSidebar(false); }}
                className="w-full text-left flex items-center space-x-3 py-2 px-3 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors"
              >
                <FaGithub size={18} />
                <span>Repositories</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => { scrollToSection('projects'); setShowSidebar(false); }}
                className="w-full text-left flex items-center space-x-3 py-2 px-3 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors"
              >
                <FaCode size={18} />
                <span>My Projects</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => { scrollToSection('settings'); setShowSidebar(false); }}
                className="w-full text-left flex items-center space-x-3 py-2 px-3 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors"
              >
                <FaCog size={18} />
                <span>Settings</span>
              </button>
            </li>
          </ul>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 p-4 md:p-6 transition-all ${showSidebar ? 'md:ml-0' : ''}`}>
          <div className="mb-8">
            <div className="card-modern p-6 bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome back, {user?.firstName || user?.name || "User"}! 👋
                  </h2>
                  <p className="text-gray-600 mb-4 md:mb-0">
                    Ready to deploy your next project? You have {Array.isArray(projects) ? projects.length : 0} project{Array.isArray(projects) && projects.length !== 1 ? 's' : ''} and {deploymentStats.successful} successful deployment{deploymentStats.successful !== 1 ? 's' : ''}.
                  </p>
                </div>
              </div>
            </div>
          </div>


          {/* Repositories Section */}
          <section id="repositories" className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 flex items-center space-x-2">
              <FaGithub className="text-primary-600" />
              <span>Your Repositories</span>
            </h3>

            {/* Import by URL */}
            <div className="mb-6">
              <form onSubmit={handleImportByUrl} className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="url"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    placeholder="https://github.com/owner/repository"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    disabled={importingUrl}
                  />
                </div>
                <button
                  type="submit"
                  disabled={importingUrl || !importUrl.trim()}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {importingUrl ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <FaGithub size={16} />
                  )}
                  <span>{importingUrl ? 'Loading...' : 'Import'}</span>
                </button>
              </form>
              <p className="mt-2 text-xs text-gray-500">
                Paste any public GitHub repository URL to import and deploy
              </p>
            </div>
            {checkingGithub ? (
              <div className="flex justify-center items-center h-32">
                <div className="text-gray-500 animate-pulse">Checking GitHub connection...</div>
              </div>
            ) : !githubConnected ? (
              <div className="bg-white p-8 rounded-xl shadow-medium text-center border border-gray-200">
                <FaGithub size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Connect Your GitHub</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Connect your GitHub account to import repositories and start deploying your projects seamlessly.
                </p>
                <button
                  onClick={handleConnectGithub}
                  className="bg-primary-600 hover:bg-primary-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors shadow-medium hover:shadow-large flex items-center space-x-2 mx-auto"
                >
                  <FaGithub />
                  <span>Connect GitHub</span>
                </button>
              </div>
            ) : loading ? (
              // Enhanced Skeleton Loader
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-medium p-6 animate-pulse border border-gray-100">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-24"></div>
                  </div>
                ))}
              </div>
            ) : repos.length === 0 ? (
              <div className="bg-white p-8 rounded-xl shadow-medium text-center border border-gray-200">
                <FaCode size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold mb-2 text-gray-900">No Repositories Found</h3>
                <p className="text-gray-600 mb-6">Your GitHub repositories will appear here once connected.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {repos.map((repo) => (
                  <div
                    key={repo.id}
                    className="bg-white rounded-lg p-4 border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all group"
                  >
                      <div className="flex items-center space-x-3 mb-3">
                        <FaGithub className="text-primary-600" size={20} />
                        <span className="font-semibold text-lg text-gray-900 truncate">{repo.name}</span>
                      </div>
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium block mb-4 truncate hover:underline"
                      >
                        {repo.url}
                      </a>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Public</span>
                        <button
                          onClick={() => handleImport(repo)}
                          className="bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg font-medium transition-colors group-hover:scale-105"
                        >
                          Import
                        </button>
                      </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Projects Section */}
          <section id="projects" className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 flex items-center space-x-2">
              <FaServer className="text-primary-600" />
              <span>My Projects</span>
            </h3>
            {projectsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-medium p-6 animate-pulse border border-gray-100">
                    <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="flex justify-between">
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                      <div className="h-8 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !Array.isArray(projects) || projects.length === 0 ? (
              <div className="bg-white p-8 rounded-xl shadow-medium text-center border border-gray-200">
                <FaRocket size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold mb-2 text-gray-900">No Projects Yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Import a repository from GitHub to create your first deployment project.
                </p>
                <div className="text-sm text-gray-500">
                  Start by connecting your GitHub account above.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <div
                    key={project._id}
                    className="bg-white rounded-lg p-4 border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all group"
                  >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-lg text-gray-900 truncate">{project.name}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          project.projectType === 'static'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {project.projectType === 'static' ? (
                            <><FaGlobe className="inline mr-1" size={10} />Static</>
                          ) : (
                            <><FaServer className="inline mr-1" size={10} />Node.js</>
                          )}
                        </span>
                      </div>

                      <a
                        href={project.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium block mb-4 truncate hover:underline flex items-center space-x-1"
                      >
                        <FaGithub className="text-xs" />
                        <span>View Repo</span>
                      </a>

                      {project.lastDeployment && project.lastDeployment.deployedUrl ? (
                        <div className="mt-auto">
                          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Live URL</p>
                          <a
                            href={project.lastDeployment.deployedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-success-600 hover:text-success-700 font-semibold text-sm break-all hover:underline flex items-center space-x-1"
                          >
                            <FaGlobe />
                            <span>{project.lastDeployment.deployedUrl}</span>
                          </a>
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Live</span>
                          </div>
                        </div>
                      ) : project.customDomain ? (
                        <div className="mt-auto">
                          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Pending URL</p>
                          <a
                            href={`https://${project.customDomain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-yellow-600 hover:text-yellow-700 font-semibold text-sm break-all hover:underline flex items-center space-x-1"
                          >
                            <FaGlobe />
                            <span>{project.customDomain}</span>
                          </a>
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">Pending</span>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleDeployProject(project._id)}
                              disabled={deploymentPolling[project._id]}
                              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 shadow-medium hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deploymentPolling[project._id] ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  <span>Deploying...</span>
                                </>
                              ) : (
                                <>
                                  <FaRocket />
                                  <span>Deploy Now</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteProject(project._id)}
                              className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center shadow-medium hover:shadow-glow"
                            >
                              <FaTrash size={16} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-auto">
                          <p className="text-sm text-gray-600 mb-3">Ready to deploy</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDeployProject(project._id)}
                              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors group-hover:scale-105 flex items-center justify-center space-x-2 shadow-medium hover:shadow-glow"
                            >
                              <FaRocket />
                              <span>Deploy Now</span>
                            </button>
                            <button
                              onClick={() => handleDeleteProject(project._id)}
                              className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center shadow-medium hover:shadow-glow"
                            >
                              <FaTrash size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </section>


          {/* Settings Section */}
          <section id="settings" className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 flex items-center space-x-2">
              <FaCog className="text-primary-600" />
              <span>Settings</span>
            </h3>
            <div className="card-modern p-6">
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Account Settings</h4>
                  <p className="text-gray-600 mb-4">Manage your profile and preferences.</p>
                  <button
                    onClick={handleEditProfile}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center space-x-1 transition-colors"
                  >
                    <FaEdit size={14} />
                    <span>Edit Profile</span>
                  </button>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Deployment Preferences</h4>
                  <p className="text-gray-600 mb-4">Configure default build settings and notifications.</p>
                  <div className="space-y-2">
                    {Array.isArray(projects) && projects.length > 0 ? (
                      projects.map((project) => (
                        <button
                          key={project._id}
                          onClick={() => handleBuildSettings(project)}
                          className="w-full text-left text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center space-x-2 p-2 rounded-lg hover:bg-primary-50 transition-colors"
                        >
                          <FaCogs size={12} />
                          <span>{project.name} Settings</span>
                        </button>
                      ))
                    ) : (
                      <button className="text-gray-400 text-sm font-medium flex items-center space-x-1 cursor-not-allowed">
                        <FaServer size={14} />
                        <span>No projects available</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">More settings coming soon...</p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-white/20 p-4 text-center text-gray-600">
        <p className="text-sm">© {new Date().getFullYear()} DeployEase. All rights reserved.</p>
      </footer>

      {/* Import Modal */}
      <ProjectImportModal
        isOpen={importModalOpen}
        onClose={handleCloseImportModal}
        repo={selectedRepo}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={editProfileModalOpen}
        onClose={() => setEditProfileModalOpen(false)}
        user={user}
        onProfileUpdate={handleProfileUpdate}
      />

      {/* Build Settings Modal */}
      <BuildSettingsModal
        isOpen={buildSettingsModalOpen}
        onClose={() => setBuildSettingsModalOpen(false)}
        project={selectedProjectForSettings}
        onSettingsUpdate={handleSettingsUpdate}
      />
    </div>
  );
};

export default Dashboard;
