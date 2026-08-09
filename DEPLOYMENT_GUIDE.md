# Mahkama Intern Manager - Complete Deployment Guide

This guide explains step-by-step how to deploy the application on the Court's Windows Server, how to allow employees to access it from their computers, and how to configure all integrations (Google & Microsoft Outlook).

---

## Phase 1: Preparing the Windows Server

Since the Windows Server will act as the "Host" for the application, it needs two basic software packages installed.

1. **Install Python**:
   - Download Python (latest 3.x version) from [python.org](https://www.python.org/downloads/windows/).
   - **CRITICAL:** During installation, make sure to check the box that says **"Add Python to PATH"** before clicking Install.
2. **Install Node.js**:
   - Download Node.js (LTS version) from [nodejs.org](https://nodejs.org/).
   - Install it with all the default settings.

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
