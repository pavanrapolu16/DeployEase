import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { githubService } from "../../services/githubService";
import { apiService } from "../../services/apiService";
import { FaGithub, FaCode } from 'react-icons/fa';
import ProjectImportModal from "../../components/ui/ProjectImportModal";

export default function Repositories() {
  const { token } = useAuth();
  const { showError } = useToast();

  const [checkingGithub, setCheckingGithub] = useState(true);
  const [githubConnected, setGithubConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [repos, setRepos] = useState([]);
  const [importUrl, setImportUrl] = useState("");
  const [importingUrl, setImportingUrl] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(null);

  useEffect(() => {
    const checkGithub = async () => {
      try {
        setCheckingGithub(true);
        await githubService.getUserInfo();
        setGithubConnected(true);
      } catch (_) {
        setGithubConnected(false);
      } finally {
        setCheckingGithub(false);
      }
    };
    if (token) checkGithub(); else setCheckingGithub(false);
  }, [token]);

  useEffect(() => {
    const fetchRepos = async () => {
      if (!githubConnected) { setLoading(false); return; }
      try {
        setLoading(true);
        const list = await githubService.getUserRepos();
        setRepos(list || []);
      } catch (err) {
        showError(err.message || 'Failed to load repositories.');
      } finally {
        setLoading(false);
      }
    };
    if (token && githubConnected) fetchRepos();
  }, [token, githubConnected, showError]);

  const handleImport = (repo) => {
    setSelectedRepo(repo);
    setImportModalOpen(true);
  };

  const handleCloseImportModal = () => {
    setImportModalOpen(false);
    setSelectedRepo(null);
  };

  const handleImportByUrl = async (e) => {
    e.preventDefault();
    if (!importUrl.trim()) return;
    const urlPattern = /^https?:\/\/(www\.)?github\.com\/([^/]+)\/([^/]+)(?:\/.*)?$/i;
    const match = importUrl.trim().match(urlPattern);
    if (!match) { showError('Invalid GitHub URL. Use https://github.com/owner/repo'); return; }
    const [, , owner, repo] = match;
    try {
      setImportingUrl(true);
      const repoDetails = await githubService.getRepoDetails(owner, repo);
      const repoObject = {
        id: repoDetails.id,
        name: repoDetails.name,
        fullName: repoDetails.fullName,
        description: repoDetails.description,
        url: repoDetails.url,
        language: repoDetails.language,
        stars: repoDetails.stars,
        isPrivate: repoDetails.isPrivate,
      };
      setSelectedRepo(repoObject);
      setImportModalOpen(true);
      setImportUrl('');
    } catch (_) {
      showError('Failed to fetch repository details.');
    } finally {
      setImportingUrl(false);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4 text-gray-900 flex items-center space-x-2">
          <FaGithub className="text-primary-600" />
          <span>Your Repositories</span>
        </h3>

        <div className="mb-6">
          <form onSubmit={handleImportByUrl} className="flex gap-2">
            <div className="flex-1">
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
          <p className="mt-2 text-xs text-gray-500">Paste any public GitHub repository URL to import and deploy</p>
        </div>

        {checkingGithub ? (
          <div className="flex justify-center items-center h-32">
            <div className="text-gray-500 animate-pulse">Checking GitHub connection...</div>
          </div>
        ) : !githubConnected ? (
          <div className="bg-white p-8 rounded-xl shadow-medium text-center border border-gray-200">
            <FaGithub size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Connect Your GitHub</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">Connect your GitHub account to import repositories and start deploying your projects seamlessly.</p>
            <a href="/api/oauth/github" className="bg-primary-600 hover:bg-primary-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors shadow-medium hover:shadow-large inline-flex items-center space-x-2">
              <FaGithub />
              <span>Connect GitHub</span>
            </a>
          </div>
        ) : loading ? (
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
              <div key={repo.id} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center space-x-3 mb-3">
                  <FaGithub className="text-primary-600" size={20} />
                  <span className="font-semibold text-lg text-gray-900 truncate">{repo.name}</span>
                </div>
                <a href={repo.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 text-sm font-medium block mb-4 truncate hover:underline">
                  {repo.url}
                </a>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Public</span>
                  <button onClick={() => handleImport(repo)} className="bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                    Import
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ProjectImportModal isOpen={importModalOpen} onClose={handleCloseImportModal} repo={selectedRepo} />
    </section>
  );
}
