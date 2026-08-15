# Mahkama Intern Manager - Complete Deployment Guide

This guide explains step-by-step how to deploy the application on the Court's Windows Server, how to allow employees to access it from their computers, and how to configure all integrations (Google & Microsoft Outlook).

---

## ⚡ Recommended One-Click Deployment (Docker)

The absolute easiest way to install and run the app is using Docker. It handles **everything** for you behind the scenes. 
*Note: You do NOT need to install Node.js, npm, Python, or SQLite on the server yourself. Docker creates isolated "containers" that already have these tools built-in, keeping your server completely clean.*

1. **Download the Code & Data**:
   - On the Court Server, go to GitHub, download the project ZIP file, and extract all files into `C:\Mahkama_App`.
   - **Migrate Your Data *(Optional - Only if keeping existing data)***: 
     - If you want to keep the data you've already created, you must copy the **`backend\instance\`** (database) and **`backenduploads\`** (CVs/photos) folders from your personal computer into `C:\Mahkama_App\backend\` on the Court Server via USB.
     - **If this is a completely fresh install and you want an empty database**, simply *skip this step*. The app will automatically create a fresh, blank database when it runs!
2. **Run the App**:
   - Right-click the **`start_app.bat`** file inside `C:\Mahkama_App` and select **"Run as Administrator"**.
   - The script will check if Docker is installed. If it's missing, it will automatically download and install Docker Desktop for you (a computer restart may be required).
   - Once Docker is running, the script will automatically install all requirements, set up the environment, and display a summary screen.
   - The app will then be accessible on Port `5055`! (Skip to Phase 4 below).

---

## Phase 2: Downloading & Setting Up the Application

1. **Download the Code**:
   - Go to your GitHub Repository: `https://github.com/hsami7/mahkama-gestion-des-stagiaire`
   - Click the green **Code** button and select **Download ZIP**.
   - Extract the ZIP file into a permanent folder on the Server (e.g., `C:\Mahkama_App`).

2. **Migrate Your Existing Data (CRITICAL)**:
   Since GitHub does not store your databases or uploaded files (for security), you must copy them from your local development computer to the Server:
   - Copy the folder: `backenduploads/` (contains CVs and documents).
   - Copy the folder: `instance/` (contains `interns.db` - your entire database).
   - Paste both folders directly inside the `C:\Mahkama_App` folder on the Server.

3. **Set the Secret Security Key**:
   - Inside `C:\Mahkama_App\backend`, right-click and create a new text file named **`.env`** (make sure it doesn't end in .txt).
   - Open it in Notepad and paste the following line:
     ```text
     JWT_SECRET_KEY=mhk_492f8a7e!9b2c_41d3_a891_74f2e9d8b1c4_COURT2026
     ```
   - Save the file. (This secures the login sessions).

---

## Phase 3: Building and Running the Server

1. **Build the Frontend**:
   - Open the `C:\Mahkama_App` folder.
   - Double-click the `build_frontend.bat` file.
   - Wait for it to finish downloading packages and compiling the React code. (You only need to do this **once**).

2. **Start the Server**:
   - Double-click the `start_server.bat` file.
   - It will install the Python dependencies and launch the Waitress Production Server.
   - **Important:** Do not close the black command prompt window! As long as this window is open, the server is running. (You can minimize it).

3. **Configure the Windows Firewall**:
   - For other computers to reach the server, Windows Firewall must allow traffic on Port 5055.
   - Open **Windows Defender Firewall** -> **Advanced Settings**.
   - Click **Inbound Rules** -> **New Rule**.
   - Select **Port** -> **TCP** -> Specific local ports: `5055`.
   - Allow the connection and name it "Mahkama App Port 5055".

---

## Phase 4: Accessing the App from Employee PCs

The application is now live on the local network! Employees do **not** need to install anything on their PCs.

1. **Find the Server's IP Address**:
   - On the Windows Server, open Command Prompt (`cmd`) and type `ipconfig`.
   - Look for the **IPv4 Address** (e.g., `192.168.1.100`).
2. **Employee Access**:
   - Any employee connected to the Court's network (LAN or WiFi) can open Google Chrome or Microsoft Edge.
   - They simply type: `http://192.168.1.100:5055` (Replace with your actual Server IP).
   - They will see the Mahkama Intern Manager login page!
   - Default Admin Login: Username: `admin` | Password: `admin123`.

---

## Phase 4B: Running the Desktop Application (Electron)

If you prefer to run the application as a standalone Desktop App (instead of accessing it through a web browser), you can easily do so. The desktop app will connect to the same Docker database and server.

1. **Install Node.js Dependencies**:
   - Open a Command Prompt or Terminal in the `C:\Mahkama_App` folder.
   - Run the command: `npm install` (You only need to do this once).
2. **Launch the Desktop App**:
   - In the same terminal, run: `npm run electron:dev`
   - The application will automatically launch as a standalone desktop window, complete with system integration.

---

## Phase 5: Configuring Integrations (Google & Microsoft)

To make automated emails and Google Forms/Drive sync work, you must configure the integrations from the **Admin Dashboard** -> **Integrations Settings** page inside the app.

### 1. Microsoft Outlook (Automated Emails)
To allow the app to send emails on your behalf:
1. Log into your Microsoft Account.
2. Go to **Security Info** -> **Add sign-in method** -> **App password**.
3. Generate a 16-letter App Password.
4. In the Mahkama App Integrations page:
   - **Email Provider**: Select `Outlook`.
   - **Email Address**: Your outlook email (e.g., `manager@mahkama.ma`).
   - **App Password**: Paste the 16-letter password here.

### 2. Google Service Account (Forms & Drive)
To allow the app to securely read Google Forms and download CVs from Google Drive:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a Project and enable the **Google Forms API**, **Google Drive API**, and **Google Sheets API**.
3. Go to **IAM & Admin** -> **Service Accounts** -> Create a Service Account.
4. Once created, click on it -> **Keys** -> **Add Key** -> **Create New Key** -> **JSON**.
5. This downloads a `.json` file containing your `client_email` and `private_key`.
6. **Important**: You must open your actual Google Form and Google Sheet, click "Share", and add the `client_email` from that JSON file as an Editor.
7. In the Mahkama App Integrations page, upload or copy-paste the contents of that JSON file into the Credentials field.

---
*Created automatically for the Mahkama Court IT Department.*
