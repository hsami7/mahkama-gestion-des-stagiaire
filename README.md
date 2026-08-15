# Mahkama Intern Manager (نظام إدارة المتدربين)

This is a comprehensive management system for court interns, featuring automated document lifecycle management, integrated Google Forms, automated email notifications, and a dedicated intern portal.

## 🚀 Quick Start Setup (For the Court)

**For full deployment instructions, advanced configuration, and troubleshooting, please read the complete [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).**

### Step 1: Download & Extract
The Court downloads the project ZIP from GitHub and extracts it to a permanent folder on the server (e.g. `C:\Mahkama_App`).

### Step 2: One-Click Startup (`start_app.bat`)
Simply right-click **`start_app.bat`** and choose **"Run as administrator"**.

`start_app.bat` handles everything automatically behind the scenes:
- Automatically installs Docker if it's missing from your system.
- Sets up the complete environment (Node.js, Python, Flask, SQLite) in an isolated container without cluttering your server.
- Initializes the database and creates all necessary tables (`interns`, `users`, `attendance`, `documents`, etc.).
- Automatically opens your web browser to the application once it's ready!

### Step 3: Desktop App Launcher (Optional)
If you prefer to use the application as a standalone desktop window rather than inside a web browser tab, simply double-click the **`start_desktop.bat`** file. It will automatically ensure the background server is running and launch the native desktop application.

---

## 🛠 For Developers

To run the project manually in a development environment:

### Web Version
1. Ensure Docker Desktop is running.
2. Run `docker-compose up -d` to start the backend.
3. Access the application at `http://localhost:5055`.

### Desktop Version (Electron)
1. Ensure the Docker backend is running as described above.
2. Run `npm install` to install local dependencies.
3. Run `npm run electron:dev` to launch the Electron window connected to the Docker backend.

## Google Forms Integration Setup
To enable automatic Google Form generation using your personal Google account, you need to set up OAuth 2.0 in the Google Cloud Console. See the "Integrations" section inside the application dashboard for more details.
