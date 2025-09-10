import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { githubService } from "../services/githubService";
import { apiService } from "../services/apiService";
import ProjectImportModal from "../components/ui/ProjectImportModal";

const Dashboard = () => {
  const { user, token, logout } = useAuth();
  const { showError, showSuccess } = useToast();
  const [repos, setRepos] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [githubConnected, setGithubConnected] = useState(false);
  const [checkingGithub, setCheckingGithub] = useState(true);
  const [importing, setImporting] = useState({});
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(null);

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
    }
  }, [token]);

  // Fetch GitHub repositories
  useEffect(() => {
    const fetchRepos = async () => {
      if (!githubConnected) return;

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
    }
  }, [token, githubConnected]);

  // Fetch user's projects
  useEffect(() => {
    const fetchProjects = async () => {
      if (!token) return;

      try {
        setProjectsLoading(true);
        const response = await apiService.get('/projects');
        setProjects(response.data.data?.projects || []);
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
          setProjects(response.data.data?.projects || []);
        } catch (err) {
          console.error('Error fetching projects:', err);
        } finally {
          setProjectsLoading(false);
        }
      };
      fetchProjects();
    }
  };

  // Deploy project handler
  const handleDeployProject = async (projectId) => {
    try {
      await apiService.post(`/projects/${projectId}/deploy`);
      showSuccess('Deployment started successfully!');
      // Refresh projects to show updated status
      const response = await apiService.get('/projects');
      setProjects(response.data.data?.projects || []);
    } catch (err) {
      console.error('Error deploying project:', err);
      showError('Failed to start deployment');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Dashboard Topbar */}
      <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-primary-600">DeployEase</h1>
        <div className="flex items-center space-x-4">
          <span className="text-gray-700 font-medium">
            {user?.firstName || user?.name || user?.email}
          </span>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden md:block w-64 bg-white shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-6">Menu</h2>
          <ul className="space-y-4">
            <li>
              <button
                onClick={() => scrollToSection('overview')}
                className="text-gray-700 hover:text-primary-600 text-left"
              >
                Overview
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection('repositories')}
                className="text-gray-700 hover:text-primary-600 text-left"
              >
                Repositories
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection('projects')}
                className="text-gray-700 hover:text-primary-600 text-left"
              >
                My Projects
              </button>
            </li>
            <li>
              <button
                onClick={() => scrollToSection('settings')}
                className="text-gray-700 hover:text-primary-600 text-left"
              >
                Settings
              </button>
            </li>
          </ul>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <h2 className="text-2xl font-bold mb-6">
            Welcome, {user?.firstName || user?.name || "👋"}
          </h2>

          {/* Overview Section */}
          <section id="overview" className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold">GitHub Status</h3>
                <p className="text-gray-600">
                  {checkingGithub ? 'Checking...' : githubConnected ? 'Connected' : 'Not Connected'}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold">Repositories</h3>
                <p className="text-gray-600">
                  {loading ? 'Loading...' : `${repos.length} found`}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-semibold">Deployments</h3>
                <p className="text-gray-600">0 active</p>
              </div>
            </div>
          </section>

          {/* Repositories Section */}
          <section id="repositories">
            <h2 className="text-xl font-semibold mb-4">Your Repositories</h2>
            {checkingGithub ? (
              <p className="text-gray-500">Checking GitHub connection...</p>
            ) : !githubConnected ? (
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <h3 className="text-lg font-semibold mb-2">Connect Your GitHub Account</h3>
                <p className="text-gray-600 mb-4">
                  Connect your GitHub account to view and import your repositories.
                </p>
                <button
                  onClick={handleConnectGithub}
                  className="bg-gray-800 text-white py-2 px-4 rounded hover:bg-gray-900"
                >
                  Connect GitHub
                </button>
              </div>
            ) : loading ? (
              // Skeleton Loader
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-gray-200 animate-pulse h-24 rounded-lg"
                  />
                ))}
              </div>
            ) : repos.length === 0 ? (
              <p className="text-gray-500">No repositories found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {repos.map((repo) => (
                  <div
                    key={repo.id}
                    className="bg-white p-4 rounded-lg shadow flex flex-col"
                  >
                    <span className="font-semibold text-lg">{repo.name}</span>
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      {repo.url}
                    </a>
                    <button
                      onClick={() => handleImport(repo)}
                      className="mt-4 bg-primary-600 text-white py-2 px-3 rounded hover:bg-primary-700 self-end"
                    >
                      Import
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Projects Section */}
          <section id="projects" className="mt-8">
            <h2 className="text-xl font-semibold mb-4">My Deployed Projects</h2>
            {projectsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-gray-200 animate-pulse h-32 rounded-lg"
                  />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
                <p className="text-gray-600 mb-4">
                  Import a repository from above to get started with deployments.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((project) => (
                  <div
                    key={project._id}
                    className="bg-white p-6 rounded-lg shadow flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-lg">{project.name}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        project.projectType === 'static'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {project.projectType === 'static' ? 'Static' : 'Node.js'}
                      </span>
                    </div>

                    <a
                      href={project.repositoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm mb-3"
                    >
                      {project.repositoryUrl}
                    </a>

                    {project.lastDeployment && project.lastDeployment.deployedUrl ? (
                      <div className="mt-auto">
                        <p className="text-sm text-gray-600 mb-2">Live URL:</p>
                        <a
                          href={project.lastDeployment.deployedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-700 font-medium hover:underline break-all"
                        >
                          {project.lastDeployment.deployedUrl}
                        </a>
                      </div>
                    ) : (
                      <div className="mt-auto">
                        <p className="text-sm text-gray-600">Not deployed yet</p>
                        <button
                          onClick={() => handleDeployProject(project._id)}
                          className="mt-2 bg-primary-600 text-white py-1 px-3 rounded hover:bg-primary-700 text-sm"
                        >
                          Deploy Now
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Settings Section */}
          <section id="settings" className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Settings</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600">Settings panel coming soon...</p>
            </div>
          </section>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white shadow p-4 text-center text-gray-500">
        © {new Date().getFullYear()} DeployEase. All rights reserved.
      </footer>

      {/* Import Modal */}
      <ProjectImportModal
        isOpen={importModalOpen}
        onClose={handleCloseImportModal}
        repo={selectedRepo}
      />
    </div>
  );
};

export default Dashboard;
