# 🚀 DeployEase

A full-stack application to simplify deploying projects.  
This repository contains a **React + Vite** frontend and a **Node.js + Express + MongoDB** backend with authentication and OAuth support.

---

## 💡 My Journey & Learnings

I started **DeployEase** with a simple goal: deploy **static apps** easily.  
From there, I gradually added **automatic deployments** — so that every push from GitHub would rebuild and redeploy the app without manual intervention.  

Next, I integrated a **React frontend** and a **Node.js backend with Docker**, which helped me understand **containerization, dynamic port mapping, and reverse proxy routing**.  
As I experimented more, I realized that the system could handle **any type of app** — whether **Python, Java, or other runtimes** — thanks to containerization and flexible deployment workflows.  

At that point, I felt the core learning was complete, and I stopped expanding the project.

### Key Takeaways

- Learned how **subdomains map dynamically to container ports** and how reverse proxies route traffic seamlessly.
- Understood **automatic deployment workflows** with GitHub webhooks.
- Explored **full-stack deployment** with frontend, backend, and Docker orchestration.
- Gained insight into how **any runtime or app type** can be deployed using containers.
- Reinforced my mentality: breaking complex systems into synchronized components and understanding **how things work behind the scenes**.

---

## 📂 Repository Structure

```text
DeployEase/                     📦 Root
├─ Frontend/                   🧩 React + Vite app (UI)
│  ├─ src/                     📁 App source (components, pages, routes)
│  ├─ index.html               🧾 Vite entry HTML
│  └─ package.json             📦 Frontend scripts/deps
├─ Backend/                    🔧 Node.js + Express API
│  ├─ routes/                  🚏 API route handlers
│  ├─ models/                  🗃️ Mongoose models
│  ├─ services/                🧠 Business logic/services
│  ├─ middleware/              🛡️ Auth/CORS/etc.
│  ├─ utils/                   🔗 Helpers
│  ├─ public/                  🌐 Public assets (if any)
│  ├─ .env.example             🔐 Env template
│  ├─ server.js                🚀 API entry point
│  └─ package.json             📦 Backend scripts/deps
└─ README.md                   📘 You are here
```

Quick map:

- **`Frontend/`**: React (Vite) app with TailwindCSS and React Router.
- **`Backend/`**: Express API with JWT auth, sessions, Passport OAuth, and MongoDB (Mongoose).

## 🧠 Tech Stack

- **Frontend**: React, Vite, TailwindCSS, React Router, React Bootstrap, Framer Motion
- **Backend**: Node.js, Express, Mongoose, JWT, Passport (Google/GitHub), Nodemailer, dotenv, CORS
- **Database**: MongoDB

## ⚙️ Quick Start

### Prerequisites

- Node.js and npm installed
- MongoDB connection string (e.g., Atlas URI)

### 1) Backend

```bash
# from repository root
npm install --prefix Backend

# copy environment variables and fill values
cp Backend/.env.example Backend/.env
# Windows PowerShell alternative:
# Copy-Item Backend/.env.example Backend/.env

# run in development (nodemon)
npm run dev --prefix Backend
```

Default entry: `Backend/server.js`. Key scripts in `Backend/package.json`:

- **start**: `node server.js`
- **dev**: `nodemon server.js`

Environment variables are described in `Backend/.env.example`. Ensure values like `MONGODB_URI`, `JWT_SECRET`, OAuth client IDs/secrets, and email credentials are set.

### 2) Frontend

```bash
# from repository root
npm install --prefix Frontend

# start dev server
npm run dev --prefix Frontend

# build for production
npm run build --prefix Frontend

# preview production build
npm run preview --prefix Frontend
```

Key scripts in `Frontend/package.json`:

- **dev**: `vite`
- **build**: `vite build`
- **preview**: `vite preview`
- **lint**: `eslint .`

## 🧩 How to Use

1. **Install dependencies** (from repo root):
   ```bash
   npm install --prefix Backend
   npm install --prefix Frontend
   ```
2. **Configure environment**:
   - Copy `Backend/.env.example` to `Backend/.env` and fill values like `MONGODB_URI`, `JWT_SECRET`, OAuth client IDs/secrets, and email credentials.
3. **Run the backend** (API):
   ```bash
   npm run dev --prefix Backend
   ```
   - The API port is defined in `Backend/.env` or `Backend/server.js`.
4. **Run the frontend** (Vite):
   ```bash
   npm run dev --prefix Frontend
   ```
   - Open the printed Vite URL (e.g., http://localhost:5173).
5. **Use the app**:
   - Sign up/sign in as configured. If OAuth is enabled (Google/GitHub), ensure client IDs/secrets are set in `.env` and provider callbacks match your local/base URL.
   - The frontend calls the backend API; adjust API base URL or Vite proxy if needed.
6. **Build for production**:
   ```bash
   npm run build --prefix Frontend
   ```
   - Serve `Frontend/dist` with your preferred static host and deploy the backend to your server/cloud. Ensure environment variables are set in production.

## 🧩 Core Concept — How DeployEase Works Behind the Scenes

Working on DeployEase clarified how platforms like Render or Vercel route requests internally:

- **Build & Containerize**: Each app is built and run in a Docker container with an exposed internal port.
- **Dynamic Port Mapping**: The platform assigns a host port (e.g., 3205) mapped to the container port.
- **Reverse Proxy + Host Rules**: A reverse proxy maps `app1.mydomain.com` → the correct host:port based on the Host header.
- **Seamless Routing**: HTTP requests reach the right container instance transparently via the proxy.

## 🔄 Automatic Deployments

With GitHub webhooks:

- Pull latest commits on push.
- Rebuild Docker image and restart container.
- Update routing automatically so the new version is live with no manual steps.

## 💭 Key Learnings

Deployment is a system-level orchestration: Git, Docker, networking, domains, proxies, and configuration all working in sync. This project solidified my understanding of:

- **Subdomain → container proxying** on platforms like Render.
- **Wildcard DNS and reverse proxies** for host-based routing.
- **Container lifecycle and environment/secret management** across dev and prod.
- **OAuth flows** and how sessions/JWT integrate with frontend state.
- **CORS and Vite dev proxying** for smooth local development.

## Development Notes

- Frontend will typically run on Vite's port (e.g., 5173). Backend default port is defined in `Backend/server.js`/`.env`.
- Configure CORS and API base URLs as needed (e.g., proxy in Vite or full API URLs in your services layer).

## Common Commands

```bash
# install both parts (from root)
npm install --prefix Backend && npm install --prefix Frontend

# run both concurrently (two terminals)
npm run dev --prefix Backend
npm run dev --prefix Frontend
```

## 🪪 License

This project is provided as-is for educational/demo purposes. Update with your preferred license if required.
