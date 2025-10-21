import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../../contexts/ToastContext";
import { apiService } from "../../services/apiService";

const BuildSettingsModal = ({ isOpen, onClose, project, onSettingsUpdate }) => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    buildCommand: '',
    outputDir: '',
    branch: '',
    projectType: 'node',
    rootDirectory: '.'
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && project) {
      setFormData({
        buildCommand: project.buildCommand || 'npm run build',
        outputDir: project.outputDir || 'dist',
        branch: project.branch || 'main',
        projectType: project.projectType || 'node',
        rootDirectory: project.rootDirectory || '.'
      });
    }
  }, [isOpen, project]);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.buildCommand.trim() || !formData.outputDir.trim() || !formData.branch.trim() || !formData.rootDirectory.trim()) {
      showError('All fields are required');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.put(`/projects/${project._id}`, formData);

      showSuccess('Build settings updated successfully!');
      onSettingsUpdate(response.data.data.project);
      onClose();
    } catch (err) {
      console.error('Build settings update error:', err);
      showError(err.response?.data?.message || 'Failed to update build settings');
    } finally {
      setLoading(false);
    }
  };

  if (!project) return null;

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
          <div className="fixed inset-0 z-50 flex justify-center items-start md:items-center p-4">
            <motion.div
              className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto mt-6 md:mt-0"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Build Settings</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  {/* Project Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Project Type <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          id="node"
                          name="projectType"
                          type="radio"
                          value="node"
                          checked={formData.projectType === 'node'}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          disabled={loading}
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
                          checked={formData.projectType === 'react'}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          disabled={loading}
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
                          checked={formData.projectType === 'static'}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          disabled={loading}
                        />
                        <label htmlFor="static" className="ml-3 block text-sm">
                          <span className="font-medium text-gray-900">Static Website</span>
                          <span className="block text-gray-500">HTML, CSS, JS files - no build required</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Branch */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Branch <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="branch"
                      value={formData.branch}
                      onChange={handleInputChange}
                      placeholder="main"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      disabled={loading}
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">The branch to deploy from</p>
                  </div>

                  {/* Build Command */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Build Command <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="buildCommand"
                      value={formData.buildCommand}
                      onChange={handleInputChange}
                      placeholder="npm run build"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      disabled={loading}
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">Command to build your project</p>
                  </div>

                  {/* Root Directory */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Root Directory <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="rootDirectory"
                      value={formData.rootDirectory}
                      onChange={handleInputChange}
                      placeholder="."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      disabled={loading}
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">Path to directory containing package.json</p>
                  </div>

                  {/* Output Directory */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Output Directory <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="outputDir"
                      value={formData.outputDir}
                      onChange={handleInputChange}
                      placeholder="dist"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      disabled={loading}
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">Directory containing built files</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Update Settings</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BuildSettingsModal;