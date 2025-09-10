import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../../contexts/ToastContext";

const DemoModal = ({ isOpen, onClose, onGetStarted }) => {
  const { showInfo } = useToast();
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">DeployEase Demo</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Video Content */}
              <div className="p-6">
                <div className="aspect-video bg-gradient-to-br from-primary-100 to-accent-100 rounded-xl flex items-center justify-center relative overflow-hidden">
                  {/* Placeholder for demo video */}
                  <div className="text-center">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 mx-auto shadow-lg">
                      <svg className="w-8 h-8 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Demo Video</h3>
                    <p className="text-gray-600 mb-4">Watch how easy it is to deploy with DeployEase</p>
                    <button
                      onClick={() => showInfo('🎬 Demo video coming soon! For now, try our live platform.')}
                      className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                      ▶ Play Demo
                    </button>
                  </div>
                  
                  {/* Animated background elements */}
                  <div className="absolute top-4 left-4 w-16 h-16 bg-white/20 rounded-full blur-xl animate-bounce-gentle"></div>
                  <div className="absolute bottom-4 right-4 w-12 h-12 bg-white/30 rounded-full blur-lg animate-bounce-gentle" style={{animationDelay: '1s'}}></div>
                </div>

                {/* Demo Features */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-primary-600 mb-2">⚡ Lightning Fast</h4>
                    <p className="text-gray-600 text-sm">Deploy in under 30 seconds</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-primary-600 mb-2">🔧 Zero Config</h4>
                    <p className="text-gray-600 text-sm">No complex setup required</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-primary-600 mb-2">📊 Real-time Logs</h4>
                    <p className="text-gray-600 text-sm">Monitor deployment progress</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center p-6 border-t border-gray-200">
                <p className="text-gray-600 text-sm">Ready to try it yourself?</p>
                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      if (onGetStarted) onGetStarted();
                    }}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                  >
                    Get Started Free
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DemoModal;
