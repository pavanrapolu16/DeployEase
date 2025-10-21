import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../../contexts/ToastContext";
import { apiService } from "../../services/apiService";

const ProjectImportModal = ({ isOpen, onClose, repo }) => {
  const { showSuccess, showError } = useToast();
  const [projectType, setProjectType] = useState('node');
  const [customDomain, setCustomDomain] = useState('');
  const [rootDirectory, setRootDirectory] = useState('.');
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setProjectType('node');
      setCustomDomain('');
      setRootDirectory('.');
      setLoading(false);
    }
  }, [isOpen]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleImport = async () => {
    if (!repo) return;

    // Validate custom domain is provided
    if (!customDomain.trim()) {
      showError('Custom domain is required for deployment.');
      return;
    }

    // Validate and slugify custom domain
    let fullCustomDomain = null;
    let subdomain = customDomain.trim();
    // Simple slugify: lowercase, replace non-alphanumeric with '-', trim hyphens
    subdomain = subdomain.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (!subdomain) {
      showError('Subdomain cannot be empty after processing.');
      return;
    }
    if (!/^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/.test(subdomain)) {
      showError('Subdomain must start and end with alphanumeric, 1-63 characters, letters/numbers/hyphens only.');
      return;
    }
    fullCustomDomain = `${subdomain}.sthara.fun`;

    setLoading(true);
    try {
      // Parse repo URL to extract owner and name
      const repoUrlParts = repo.url.split('/');
      const repositoryOwner = repoUrlParts[repoUrlParts.length - 2];
      const repositoryName = repoUrlParts[repoUrlParts.length - 1];

      console.log('Parsed data:', {
        name: repo.name,
        repositoryUrl: repo.url,
        repositoryName,
        repositoryOwner,
        projectType,
        customDomain: fullCustomDomain
      });

      const requestData = {
        name: repo.name,
        repositoryUrl: repo.url,
        repositoryName,
        repositoryOwner,
        projectType,
        rootDirectory,
        ...(fullCustomDomain && { customDomain: fullCustomDomain })
      };

      console.log('Sending request data:', requestData);

      const response = await apiService.post('/projects', requestData);

      console.log('Full API Response:', response);
      console.log('Response data:', response.data);

      showSuccess(`Imported ${repo.name} successfully!${fullCustomDomain ? ` Your site will be at ${fullCustomDomain}` : ''}`);
      onClose();
    } catch (err) {
      console.error('Import error:', err);
      showError(`Failed to import ${repo.name}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!repo) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="bg-white rounded-xl shadow-xl max-w-md w-full"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Import Repository</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">{repo.name}</h3>
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    {repo.url}
                  </a>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Project Type
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        id="node"
                        name="projectType"
                        type="radio"
                        value="node"
                        checked={projectType === 'node'}
                        onChange={(e) => setProjectType(e.target.value)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <label htmlFor="node" className="ml-3 block text-sm">
                        <span className="font-medium text-gray-900">Node.js Application</span>
                        <span className="block text-gray-500">Requires package.json, runs build command</span>
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="react"
                        name="projectType"
                        type="radio"
                        value="react"
                        checked={projectType === 'react'}
                        onChange={(e) => setProjectType(e.target.value)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <label htmlFor="react" className="ml-3 block text-sm">
                        <span className="font-medium text-gray-900">React Application</span>
                        <span className="block text-gray-500">React app with build process (Vite, CRA, Next.js)</span>
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="static"
                        name="projectType"
                        type="radio"
                        value="static"
                        checked={projectType === 'static'}
                        onChange={(e) => setProjectType(e.target.value)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <label htmlFor="static" className="ml-3 block text-sm">
                        <span className="font-medium text-gray-900">Static Website</span>
                        <span className="block text-gray-500">HTML, CSS, JS files - no build required</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Root Directory
                  </label>
                  <input
                    type="text"
                    value={rootDirectory}
                    onChange={(e) => setRootDirectory(e.target.value)}
                    placeholder="."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    disabled={loading}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Path to the directory containing package.json (leave as '.' for root)
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Custom Domain <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      placeholder="myproject"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      disabled={loading}
                      required
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                      .sthara.fun
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Choose a unique subdomain for your project (e.g., myproject.sthara.fun). This is required for deployment.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={loading}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Importing...' : 'Import Project'}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProjectImportModal;