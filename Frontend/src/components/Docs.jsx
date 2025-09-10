import { motion } from "framer-motion";
import { useToast } from "../contexts/ToastContext";

const Docs = () => {
  const { showInfo } = useToast();

  const handleDocClick = (docType) => {
    const messages = {
      'Quick Start': '🚀 Quick Start guide coming soon! For now, just click "Get Started" to begin.',
      'API Reference': '📚 Full API documentation is being prepared. Check back soon!',
      'Tutorials': '🎓 Video tutorials are in production. Subscribe to get notified when they\'re ready!',
      'Examples': '💡 Code examples and templates will be available in our GitHub repository soon!'
    };
    showInfo(messages[docType] || 'Documentation coming soon!');
  };
  const docSections = [
    {
      title: "Quick Start",
      icon: "🚀",
      description: "Get up and running in minutes",
      items: ["Create account", "Connect repository", "Deploy instantly"]
    },
    {
      title: "API Reference",
      icon: "📚",
      description: "Complete API documentation",
      items: ["Authentication", "Deployment endpoints", "Webhook integration"]
    },
    {
      title: "Tutorials",
      icon: "🎓",
      description: "Step-by-step guides",
      items: ["React deployment", "Node.js apps", "Static sites"]
    },
    {
      title: "Examples",
      icon: "💡",
      description: "Real-world examples",
      items: ["Sample projects", "Best practices", "Common patterns"]
    }
  ];

  return (
    <section id="docs" className="py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-500 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Documentation &
            <span className="text-gradient-primary block mt-2">Resources</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to master DeployEase and deploy like a pro.
          </p>
        </motion.div>

        {/* Documentation Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          {docSections.map((section, index) => (
            <motion.div
              key={section.title}
              className="group cursor-pointer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
              onClick={() => handleDocClick(section.title)}
            >
              <div className="card-modern p-6 h-full hover:shadow-xl transition-all duration-300">
                <div className="text-4xl mb-4">{section.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{section.title}</h3>
                <p className="text-gray-600 mb-4">{section.description}</p>
                <ul className="space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center space-x-2 text-sm text-gray-500">
                      <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-primary-600 font-medium text-sm group-hover:underline">
                    Learn more →
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="bg-gradient-to-r from-primary-50 to-accent-50 p-8 rounded-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Need Help Getting Started?</h3>
            <p className="text-gray-600 mb-6">Our team is here to help you succeed with DeployEase.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => showInfo('📧 Contact our support team at deployease@gmail.com')}
                className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Contact Support
              </button>
              <button
                onClick={() => showInfo('💬 Join our Discord community for real-time help and discussions!')}
                className="bg-white text-primary-600 border-2 border-primary-200 px-6 py-3 rounded-lg font-medium hover:bg-primary-50 transition-colors"
              >
                Join Community
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Docs;
