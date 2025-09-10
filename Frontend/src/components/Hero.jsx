
import { useState } from "react";
import { motion } from "framer-motion";
import DemoModal from "./ui/DemoModal";

const Hero = ({ data, onGetStarted }) => {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-purple-600 to-accent-600 bg-gradient-hero"></div>

      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20"></div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-bounce-gentle"></div>
      <div className="absolute top-40 right-20 w-32 h-32 bg-accent-400/20 rounded-full blur-2xl animate-bounce-gentle" style={{animationDelay: '1s'}}></div>
      <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-primary-400/30 rounded-full blur-lg animate-bounce-gentle" style={{animationDelay: '2s'}}></div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.h1
            className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="block">{data.title.split(' ')[0]}</span>
            <span className="text-gradient bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              {data.title.split(' ').slice(1).join(' ')}
            </span>
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto font-light leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {data.subtitle}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <motion.button
              onClick={onGetStarted}
              className="btn-primary-modern text-lg px-8 py-4 bg-white text-primary-600 hover:bg-gray-50 shadow-glow hover:shadow-glow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {data.ctaText} →
            </motion.button>
            <motion.button
              onClick={() => setIsDemoModalOpen(true)}
              className="btn-secondary-modern text-lg px-8 py-4 bg-transparent text-white border-white/30 hover:bg-white/10"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Watch Demo
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Hero Image/Dashboard Preview */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          <div className="relative mx-auto max-w-4xl">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-accent-600 rounded-2xl blur-2xl opacity-30 scale-105"></div>
            <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-2 shadow-large">
              <img
                src={data.image}
                alt="DeployEase Dashboard Preview"
                className="w-full h-auto rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>

      {/* Demo Modal */}
      <DemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onGetStarted={onGetStarted}
      />
    </section>
  );
};

export default Hero;
