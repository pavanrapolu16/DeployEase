import React, { useState } from "react";
import { BsDribbble, BsFacebook, BsGithub, BsInstagram, BsTwitter, BsLinkedin } from "react-icons/bs";
import InfoModal from "./ui/InfoModal";
import { footerContent } from "../data/footerContent.jsx";

const Footer = () => {
  const [activeModal, setActiveModal] = useState(null);

  const handleLinkClick = (key) => {
    if (footerContent[key]) {
      setActiveModal(key);
    }
  };
  const footerSections = [
    {
      title: "Product",
      links: [
        { name: "Features", key: "features" },
        { name: "Documentation", key: "documentation" },
        { name: "API Reference", key: "api" },
        { name: "Getting Started", key: "getting-started" },
      ]
    },
    {
      title: "Company",
      links: [
        { name: "About Us", key: "about" },
        { name: "Blog", key: "blog" },
        { name: "Careers", key: "careers" },
        { name: "Contact", key: "contact" },
      ]
    },
    {
      title: "Resources",
      links: [
        { name: "Help Center", key: "help" },
        { name: "Tutorials", key: "tutorials" },
        { name: "Community", key: "community" },
        { name: "Status", key: "status" },
      ]
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy Policy", key: "privacy" },
        { name: "Terms of Service", key: "terms" },
        { name: "Cookie Policy", key: "cookies" },
        { name: "Security", key: "security" },
      ]
    }
  ];

  const socialLinks = [
    { icon: BsTwitter, href: "https://twitter.com/deployease", label: "Twitter" },
    { icon: BsGithub, href: "https://github.com/deployease", label: "GitHub" },
    { icon: BsLinkedin, href: "https://linkedin.com/company/deployease", label: "LinkedIn" },
    { icon: BsInstagram, href: "https://instagram.com/deployease", label: "Instagram" },
    { icon: BsDribbble, href: "https://dribbble.com/deployease", label: "Dribbble" },
  ];

  return (
    <footer className="bg-gray-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">D</span>
                </div>
                <span className="text-2xl font-bold">DeployEase</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
                The completely free deployment platform that makes shipping code effortless.
                Deploy faster, scale smarter, and focus on what matters most - building great products. Forever free!
              </p>

              {/* Newsletter Signup */}
              <div className="space-y-3">
                <h4 className="font-semibold text-white">Stay Updated</h4>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors duration-200 font-medium">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Links */}
            {footerSections.map((section) => (
              <div key={section.title}>
                <h4 className="font-semibold text-white mb-4">{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <button
                        onClick={() => handleLinkClick(link.key)}
                        className="text-gray-400 hover:text-white transition-colors duration-200 text-sm text-left hover:underline"
                      >
                        {link.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-gray-400 text-sm">
                © {new Date().getFullYear()} DeployEase. All rights reserved.
              </div>

              {/* Social Links */}
              <div className="flex space-x-4">
                {socialLinks.map((social) => {
                  const IconComponent = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="w-10 h-10 bg-gray-800 hover:bg-primary-600 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                    >
                      <IconComponent className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Modal */}
      <InfoModal
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        title={activeModal ? footerContent[activeModal]?.title : ""}
        content={activeModal ? footerContent[activeModal]?.content : null}
      />
    </footer>
  );
};

export default Footer;
