import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import ResponsiveNavbar from "./components/Navbar";
import Footer from "./components/Footer";
import Hero from "./components/Hero.jsx";
import Features from "./components/Features";
import About from "./components/About";
import Docs from "./components/Docs";
import Testimonials from "./components/Testimonials";
import CTA from "./components/CTA";
import AuthModal from "./components/auth/AuthModal";
import AuthSuccess from "./pages/AuthSuccess";
import AuthError from "./pages/AuthError";
import EmailVerification from "./pages/EmailVerification";
import { ToastProvider } from "./contexts/ToastContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";


// ✅ Enhanced Data with modern content
const heroData = {
  title: "DeployEase 🚀",
  subtitle:
    "Deploy static & dynamic apps in seconds with our completely free, developer-first platform. Experience hassle-free hosting, automated CI/CD, and custom domains - all at no cost!",
  ctaText: "Get Started Free",
  ctaLink: "#get-started",
  image: "https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
};

const featuresData = [
  {
    id: 1,
    title: "Lightning Fast Deployment",
    description: "Deploy your applications in under 30 seconds with our optimized build pipeline and global CDN.",
    icon: "⚡"
  },
  {
    id: 2,
    title: "Custom Domains & SSL",
    description: "Connect your custom domain with automatic SSL certificates and advanced DNS management.",
    icon: "🌍"
  },
  {
    id: 3,
    title: "Serverless Functions",
    description: "Run backend code at the edge with our serverless platform. Scale automatically, pay per use.",
    icon: "🖥️"
  },
  {
    id: 4,
    title: "Git Integration",
    description: "Seamless integration with GitHub, GitLab, and Bitbucket. Auto-deploy on every push.",
    icon: "🔗"
  },
];

const testimonialsData = [
  {
    id: 1,
    name: "GopiKrishna Chippalapalli",
    role: "Senior Frontend Developer at TechCorp",
    feedback: "DeployEase transformed our deployment workflow. What used to take hours now happens in minutes. The developer experience is phenomenal!",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
  },
  {
    id: 2,
    name: "Rahul Mehta",
    role: "CTO & Co-founder at StartupXYZ",
    feedback: "Simple enough for rapid prototyping, yet powerful enough to scale our production apps. DeployEase is a game-changer for modern development teams.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
  },
];

// Main route component that handles authenticated vs non-authenticated users
const MainRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // If authenticated, redirect to dashboard
  if (isAuthenticated) {
    window.location.href = '/dashboard';
    return null;
  }

  // If not authenticated, show landing page
  return <LandingPage />;
};

// Landing page component
const LandingPage = () => {
  const [authMode, setAuthMode] = useState("login");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleLogin = () => {
    setAuthMode("login");
    setIsAuthModalOpen(true);
  };

  const handleSignup = () => {
    setAuthMode("signup");
    setIsAuthModalOpen(true);
  };

  const handleCloseAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const handleAuthModeChange = (newMode) => {
    setAuthMode(newMode);
  };

  const handleGetStarted = () => {
    setAuthMode("signup");
    setIsAuthModalOpen(true);
  };

  return (
    <>
      <ResponsiveNavbar
        onLoginClick={handleLogin}
        onSignupClick={handleSignup}
      />

      <main>
        <Hero data={heroData} onGetStarted={handleGetStarted} />
        <Features features={featuresData} onGetStarted={handleGetStarted} />
        <About />
        <Docs />
        <Testimonials testimonials={testimonialsData} />
        <CTA onGetStarted={handleGetStarted} />
      </main>

      <Footer />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={handleCloseAuthModal}
        mode={authMode}
        onModeChange={handleAuthModeChange}
      />
    </>
  );
};

export default function App() {

  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
           {/* OAuth callback routes */}
           <Route path="/auth/success" element={<AuthSuccess />} />
           <Route path="/auth/error" element={<AuthError />} />

           {/* Email verification route */}
           <Route path="/verify-email" element={<EmailVerification />} />

           {/* Protected dashboard route */}
           <Route path="/dashboard" element={
             <ProtectedRoute>
               <Dashboard />
             </ProtectedRoute>
           } />

           {/* Main application route */}
           <Route path="/*" element={<MainRoute />} />
         </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
