export const footerContent = {
  features: {
    title: "Features",
    content: (
      <div>
        <h3 className="text-xl font-semibold mb-4">DeployEase Features</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-primary-600">🚀 One-Click Deployment</h4>
            <p className="text-gray-700">Deploy your applications with a single click. No complex configurations needed.</p>
          </div>
          <div>
            <h4 className="font-semibold text-primary-600">🔄 Auto-Scaling</h4>
            <p className="text-gray-700">Automatically scale your applications based on traffic and demand.</p>
          </div>
          <div>
            <h4 className="font-semibold text-primary-600">📊 Real-time Monitoring</h4>
            <p className="text-gray-700">Monitor your applications with real-time analytics and performance metrics.</p>
          </div>
          <div>
            <h4 className="font-semibold text-primary-600">🔒 Enterprise Security</h4>
            <p className="text-gray-700">Bank-level security with SSL certificates and DDoS protection included.</p>
          </div>
        </div>
      </div>
    )
  },
  documentation: {
    title: "Documentation",
    content: (
      <div>
        <h3 className="text-xl font-semibold mb-4">Getting Started with DeployEase</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-primary-600">Quick Start Guide</h4>
            <ol className="list-decimal list-inside space-y-2 mt-2 text-gray-700">
              <li>Sign up for your free DeployEase account</li>
              <li>Connect your GitHub repository</li>
              <li>Configure your deployment settings</li>
              <li>Click deploy and watch the magic happen!</li>
            </ol>
          </div>
          <div>
            <h4 className="font-semibold text-primary-600">Supported Frameworks</h4>
            <ul className="list-disc list-inside space-y-1 mt-2 text-gray-700">
              <li>React, Vue, Angular</li>
              <li>Node.js, Express</li>
              <li>Next.js, Nuxt.js</li>
              <li>Static sites (HTML/CSS/JS)</li>
            </ul>
          </div>
        </div>
      </div>
    )
  },
  api: {
    title: "API Reference",
    content: (
      <div>
        <h3 className="text-xl font-semibold mb-4">DeployEase API</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-primary-600">Authentication</h4>
            <p className="text-gray-700">Use API keys to authenticate your requests. Get your API key from the dashboard.</p>
            <pre className="bg-gray-100 p-3 rounded mt-2 text-sm">
              <code className="text-gray-800">Authorization: Bearer YOUR_API_KEY</code>
            </pre>
          </div>
          <div>
            <h4 className="font-semibold text-primary-600">Deploy Endpoint</h4>
            <p className="text-gray-700">POST /api/v1/deploy</p>
            <pre className="bg-gray-100 p-3 rounded mt-2 text-sm">
              <code className="text-gray-800">{`{
  "repository": "https://github.com/user/repo",
  "branch": "main",
  "environment": "production"
}`}</code>
            </pre>
          </div>
        </div>
      </div>
    )
  },
  "getting-started": {
    title: "Getting Started",
    content: (
      <div>
        <h3 className="text-xl font-semibold mb-4">Welcome to DeployEase!</h3>
        <div className="space-y-4">
          <p className="text-gray-700">DeployEase makes deployment simple and fast. Here's how to get started:</p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Step 1: Create Account</h4>
            <p className="text-blue-700">Sign up for free - no credit card required!</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">Step 2: Connect Repository</h4>
            <p className="text-green-700">Link your GitHub, GitLab, or Bitbucket repository.</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-2">Step 3: Deploy</h4>
            <p className="text-purple-700">Click deploy and your app goes live in seconds!</p>
          </div>
        </div>
      </div>
    )
  },
  about: {
    title: "About DeployEase",
    content: (
      <div>
        <h3 className="text-xl font-semibold mb-4">About Us</h3>
        <div className="space-y-4">
          <p className="text-gray-700">DeployEase was founded in 2024 with a simple mission: make deployment accessible to every developer, regardless of their DevOps experience.</p>
          <p className="text-gray-700">Our team of experienced engineers and designers work tirelessly to provide the best deployment experience possible.</p>
          <div className="bg-gradient-to-r from-primary-50 to-accent-50 p-4 rounded-lg">
            <h4 className="font-semibold text-primary-800 mb-2">Our Mission</h4>
            <p className="text-primary-700">To democratize deployment and make it as easy as writing code.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">10,000+</div>
              <div className="text-sm text-gray-600">Happy Developers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">50,000+</div>
              <div className="text-sm text-gray-600">Deployments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">99.9%</div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  blog: {
    title: "Blog",
    content: (
      <div>
        <h3 className="text-xl font-semibold mb-4">DeployEase Blog</h3>
        <div className="space-y-6">
          <article className="border-b border-gray-200 pb-4">
            <h4 className="font-semibold text-primary-600 mb-2">The Future of Deployment is Here</h4>
            <p className="text-gray-600 text-sm mb-2">December 15, 2024</p>
            <p className="text-gray-700">Discover how DeployEase is revolutionizing the way developers deploy applications...</p>
          </article>
          <article className="border-b border-gray-200 pb-4">
            <h4 className="font-semibold text-primary-600 mb-2">Best Practices for Modern Deployment</h4>
            <p className="text-gray-600 text-sm mb-2">December 10, 2024</p>
            <p className="text-gray-700">Learn the essential practices that every developer should know about deployment...</p>
          </article>
          <article>
            <h4 className="font-semibold text-primary-600 mb-2">Introducing Auto-Scaling Features</h4>
            <p className="text-gray-600 text-sm mb-2">December 5, 2024</p>
            <p className="text-gray-700">Our new auto-scaling features help your applications handle traffic spikes effortlessly...</p>
          </article>
        </div>
      </div>
    )
  },
  careers: {
    title: "Careers",
    content: (
      <div>
        <h3 className="text-xl font-semibold mb-4">Join Our Team</h3>
        <div className="space-y-4">
          <p className="text-gray-700">We're always looking for talented individuals to join our mission of making deployment easier for everyone.</p>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-primary-600">Senior Frontend Developer</h4>
              <p className="text-gray-600 text-sm">Remote • Full-time</p>
              <p className="mt-2 text-gray-700">Help us build the next generation of deployment tools with React and modern web technologies.</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-primary-600">DevOps Engineer</h4>
              <p className="text-gray-600 text-sm">Remote • Full-time</p>
              <p className="mt-2 text-gray-700">Scale our infrastructure and help millions of developers deploy with confidence.</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-primary-600">Product Designer</h4>
              <p className="text-gray-600 text-sm">Remote • Full-time</p>
              <p className="mt-2 text-gray-700">Design beautiful and intuitive experiences for developers worldwide.</p>
            </div>
          </div>
          <p className="text-center text-gray-600">
            Interested? Send your resume to <span className="text-primary-600 font-medium">careers@deployease.com</span>
          </p>
        </div>
      </div>
    )
  },
  contact: {
    title: "Contact Us",
    content: (
      <div>
        <h3 className="text-xl font-semibold mb-4">Get in Touch</h3>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-primary-600 mb-2">General Inquiries</h4>
              <p className="text-gray-600">hello@deployease.com</p>
            </div>
            <div>
              <h4 className="font-semibold text-primary-600 mb-2">Support</h4>
              <p className="text-gray-600">support@deployease.com</p>
            </div>
            <div>
              <h4 className="font-semibold text-primary-600 mb-2">Sales</h4>
              <p className="text-gray-600">sales@deployease.com</p>
            </div>
            <div>
              <h4 className="font-semibold text-primary-600 mb-2">Press</h4>
              <p className="text-gray-600">press@deployease.com</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-primary-50 to-accent-50 p-6 rounded-lg">
            <h4 className="font-semibold text-primary-800 mb-2">Office Hours</h4>
            <p className="text-primary-700">Monday - Friday: 9:00 AM - 6:00 PM PST</p>
            <p className="text-primary-700">We typically respond within 24 hours</p>
          </div>
        </div>
      </div>
    )
  },
  help: {
    title: "Help Center",
    content: (
      <div>
        <h3 className="text-xl font-semibold mb-4">How Can We Help?</h3>
        <div className="space-y-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-primary-600">🚀 Getting Started</h4>
              <p className="text-gray-700">New to DeployEase? Check out our quick start guide to deploy your first app in minutes.</p>
            </div>
            <div>
              <h4 className="font-semibold text-primary-600">🔧 Troubleshooting</h4>
              <p className="text-gray-700">Having issues? Our troubleshooting guide covers the most common problems and solutions.</p>
            </div>
            <div>
              <h4 className="font-semibold text-primary-600">💬 Community Support</h4>
              <p className="text-gray-700">Join our Discord community where developers help each other and share deployment tips.</p>
            </div>
            <div>
              <h4 className="font-semibold text-primary-600">📧 Contact Support</h4>
              <p className="text-gray-700">Can't find what you're looking for? Reach out to our support team at support@deployease.com</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  tutorials: {
    title: "Tutorials",
    content: (
      <div>
        <h3 className="text-xl font-semibold mb-4">Learn DeployEase</h3>
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-primary-600 mb-2">📹 Video Tutorials</h4>
            <ul className="space-y-2 text-gray-700">
              <li>• Deploying Your First React App (5 min)</li>
              <li>• Setting Up Custom Domains (3 min)</li>
              <li>• Environment Variables Guide (4 min)</li>
              <li>• Database Integration Tutorial (8 min)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-primary-600 mb-2">📚 Written Guides</h4>
            <ul className="space-y-2 text-gray-700">
              <li>• Complete Deployment Checklist</li>
              <li>• Performance Optimization Tips</li>
              <li>• Security Best Practices</li>
              <li>• Monitoring and Analytics Setup</li>
            </ul>
          </div>
        </div>
      </div>
    )
  },
  community: {
    title: "Community",
    content: (
      <div>
        <h3 className="text-xl font-semibold mb-4">Join Our Community</h3>
        <div className="space-y-4">
          <p className="text-gray-700">Connect with thousands of developers using DeployEase worldwide!</p>
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-800">💬 Discord Server</h4>
              <p className="text-purple-700">Join our active Discord community for real-time help and discussions.</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800">🐦 Twitter</h4>
              <p className="text-blue-700">Follow us for updates, tips, and deployment inspiration.</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800">📖 GitHub</h4>
              <p className="text-gray-700">Contribute to our open-source tools and examples.</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  status: {
    title: "System Status",
    content: (
      <div>
        <h3 className="text-xl font-semibold mb-4">DeployEase Status</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="font-semibold text-gray-900">All Systems Operational</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-gray-700">API Services</span>
              <span className="text-green-600 font-medium">Operational</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-gray-700">Deployment Pipeline</span>
              <span className="text-green-600 font-medium">Operational</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-gray-700">Monitoring Systems</span>
              <span className="text-green-600 font-medium">Operational</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-gray-700">CDN Network</span>
              <span className="text-green-600 font-medium">Operational</span>
            </div>
          </div>
          <p className="text-sm text-gray-600">Last updated: {new Date().toLocaleString()}</p>
        </div>
      </div>
    )
  },
  privacy: {
    title: "Privacy Policy",
    content: (
      <div>
        <h3 className="text-xl font-semibold mb-4">Privacy Policy</h3>
        <div className="space-y-4">
          <p className="text-gray-700"><strong>Last updated:</strong> December 2024</p>
          <div>
            <h4 className="font-semibold text-primary-600">Information We Collect</h4>
            <p className="text-gray-700">We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.</p>
          </div>
          <div>
            <h4 className="font-semibold text-primary-600">How We Use Your Information</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>To provide and maintain our services</li>
              <li>To process transactions and send related information</li>
              <li>To send technical notices and support messages</li>
              <li>To improve our services and develop new features</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-primary-600">Data Security</h4>
            <p className="text-gray-700">We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
          </div>
        </div>
      </div>
    )
  },
  terms: {
    title: "Terms of Service",
    content: (
      <div>
        <h3 className="text-xl font-semibold mb-4">Terms of Service</h3>
        <div className="space-y-4">
          <p className="text-gray-700"><strong>Last updated:</strong> December 2024</p>
          <div>
            <h4 className="font-semibold text-primary-600">Acceptance of Terms</h4>
            <p className="text-gray-700">By accessing and using DeployEase, you accept and agree to be bound by the terms and provision of this agreement.</p>
          </div>
          <div>
            <h4 className="font-semibold text-primary-600">Use License</h4>
            <p className="text-gray-700">Permission is granted to temporarily use DeployEase for personal and commercial deployment purposes. This is the grant of a license, not a transfer of title.</p>
          </div>
          <div>
            <h4 className="font-semibold text-primary-600">Service Availability</h4>
            <p className="text-gray-700">We strive to maintain 99.9% uptime but cannot guarantee uninterrupted service. Scheduled maintenance will be announced in advance.</p>
          </div>
          <div>
            <h4 className="font-semibold text-primary-600">Fair Use Policy</h4>
            <p className="text-gray-700">Our free tier is designed for personal projects and small applications. Enterprise usage requires a paid plan.</p>
          </div>
        </div>
      </div>
    )
  },
  cookies: {
    title: "Cookie Policy",
    content: (
      <div>
        <h3 className="text-xl font-semibold mb-4">Cookie Policy</h3>
        <div className="space-y-4">
          <p className="text-gray-700"><strong>Last updated:</strong> December 2024</p>
          <div>
            <h4 className="font-semibold text-primary-600">What Are Cookies</h4>
            <p className="text-gray-700">Cookies are small text files that are stored on your computer or mobile device when you visit our website.</p>
          </div>
          <div>
            <h4 className="font-semibold text-primary-600">How We Use Cookies</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              <li>Essential cookies for website functionality</li>
              <li>Analytics cookies to understand how you use our site</li>
              <li>Preference cookies to remember your settings</li>
              <li>Marketing cookies to show relevant advertisements</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-primary-600">Managing Cookies</h4>
            <p className="text-gray-700">You can control and/or delete cookies as you wish. You can delete all cookies that are already on your computer and you can set most browsers to prevent them from being placed.</p>
          </div>
        </div>
      </div>
    )
  },
  security: {
    title: "Security",
    content: (
      <div>
        <h3 className="text-xl font-semibold mb-4">Security at DeployEase</h3>
        <div className="space-y-4">
          <p className="text-gray-700">Security is at the core of everything we do. We implement industry-leading security practices to protect your applications and data.</p>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-primary-600">🔒 Data Encryption</h4>
              <p className="text-gray-700">All data is encrypted in transit and at rest using AES-256 encryption.</p>
            </div>
            <div>
              <h4 className="font-semibold text-primary-600">🛡️ DDoS Protection</h4>
              <p className="text-gray-700">Built-in DDoS protection keeps your applications online during attacks.</p>
            </div>
            <div>
              <h4 className="font-semibold text-primary-600">🔐 SSL Certificates</h4>
              <p className="text-gray-700">Automatic SSL certificate provisioning and renewal for all deployments.</p>
            </div>
            <div>
              <h4 className="font-semibold text-primary-600">👥 Access Control</h4>
              <p className="text-gray-700">Role-based access control and two-factor authentication for team accounts.</p>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800">Security Certifications</h4>
            <p className="text-green-700">SOC 2 Type II, ISO 27001, and GDPR compliant</p>
          </div>
        </div>
      </div>
    )
  }
};
