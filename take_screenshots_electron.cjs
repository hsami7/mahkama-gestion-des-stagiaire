const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshots() {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    show: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  async function login(email, password) {
    await win.webContents.executeJavaScript(`
      (async () => {
        try {
          const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: '${email}', password: '${password}' })
          });
          const data = await res.json();
          if (data.access_token) {
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/';
          }
        } catch (e) {
          console.error('Fetch error:', e);
        }
      })()
    `);
    await sleep(3500);
  }

  async function logout() {
    await win.webContents.executeJavaScript(`
      (() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      })()
    `);
    await sleep(2000);
  }

  win.loadURL('http://localhost:5174');
  await sleep(3000); // Wait for app to initial load

  // --- 1. ADMIN SCREENS ---
  console.log('Logging in as Admin...');
  await login('admin@mahkama.ma', 'admin123');

  // 1. admin_dashboard
  console.log('Taking admin_dashboard.png');
  let img = await win.webContents.capturePage();
  fs.writeFileSync('docs/images/admin_dashboard.png', img.toPNG());

  // 2. admin_interns
  console.log('Taking admin_interns.png');
  await win.webContents.executeJavaScript(`
    (() => {
      const items = document.querySelectorAll('.nav-item');
      for (const i of items) {
        if (i.innerText.includes('المتدربين')) { i.click(); return; }
      }
    })()
  `);
  await sleep(2500);
  img = await win.webContents.capturePage();
  fs.writeFileSync('docs/images/admin_interns.png', img.toPNG());

  // 3. admin_intern_profile (click on the first .dossier card)
  console.log('Taking admin_intern_profile.png');
  await win.webContents.executeJavaScript(`
    (() => {
      const dossier = document.querySelector('.dossier');
      if (dossier) dossier.click();
    })()
  `);
  await sleep(2500);
  img = await win.webContents.capturePage();
  fs.writeFileSync('docs/images/admin_intern_profile.png', img.toPNG());

  // 4. admin_form_builder
  console.log('Taking admin_form_builder.png');
  await win.webContents.executeJavaScript(`
    (() => {
      const items = document.querySelectorAll('.nav-item');
      for (const i of items) {
        if (i.innerText.includes('منشئ النماذج')) { i.click(); return; }
      }
    })()
  `);
  await sleep(2500);
  img = await win.webContents.capturePage();
  fs.writeFileSync('docs/images/admin_form_builder.png', img.toPNG());

  // 5. admin_document_vault
  console.log('Taking admin_document_vault.png');
  await win.webContents.executeJavaScript(`
    (() => {
      const items = document.querySelectorAll('.nav-item');
      for (const i of items) {
        if (i.innerText.includes('خزنة المستندات')) { i.click(); return; }
      }
    })()
  `);
  await sleep(2500);
  img = await win.webContents.capturePage();
  fs.writeFileSync('docs/images/admin_document_vault.png', img.toPNG());

  // 6. admin_attendance
  console.log('Taking admin_attendance.png');
  await win.webContents.executeJavaScript(`
    (() => {
      const items = document.querySelectorAll('.nav-item');
      for (const i of items) {
        if (i.innerText.includes('سجل الحضور')) { i.click(); return; }
      }
    })()
  `);
  await sleep(2500);
  img = await win.webContents.capturePage();
  fs.writeFileSync('docs/images/admin_attendance.png', img.toPNG());

  // 7. admin_timeline
  console.log('Taking admin_timeline.png');
  await win.webContents.executeJavaScript(`
    (() => {
      const items = document.querySelectorAll('.nav-item');
      for (const i of items) {
        if (i.innerText.includes('مخطط التغطية')) { i.click(); return; }
      }
    })()
  `);
  await sleep(2500);
  img = await win.webContents.capturePage();
  fs.writeFileSync('docs/images/admin_timeline.png', img.toPNG());

  // 8. admin_users
  console.log('Taking admin_users.png');
  await win.webContents.executeJavaScript(`
    (() => {
      const items = document.querySelectorAll('.nav-item');
      for (const i of items) {
        if (i.innerText.includes('المستخدمين والصلاحيات')) { i.click(); return; }
      }
    })()
  `);
  await sleep(2500);
  img = await win.webContents.capturePage();
  fs.writeFileSync('docs/images/admin_users.png', img.toPNG());

  // 9. admin_settings
  console.log('Taking admin_settings.png');
  await win.webContents.executeJavaScript(`
    (() => {
      const items = document.querySelectorAll('.nav-item');
      for (const i of items) {
        if (i.innerText.includes('الإعدادات')) { i.click(); return; }
      }
    })()
  `);
  await sleep(2500);
  img = await win.webContents.capturePage();
  fs.writeFileSync('docs/images/admin_settings.png', img.toPNG());

  // Logout Admin
  console.log('Logging out Admin...');
  await logout();

  // --- 2. INTERN DASHBOARD ---
  console.log('Logging in as Intern...');
  await login('youssef.elidrissi@uemf.ac.ma', 'password123');
  console.log('Taking intern_dashboard.png');
  img = await win.webContents.capturePage();
  fs.writeFileSync('docs/images/intern_dashboard.png', img.toPNG());

  // Logout Intern
  console.log('Logging out Intern...');
  await logout();

  // --- 3. MANAGER DASHBOARD ---
  console.log('Logging in as Manager...');
  await login('m.elamrani@mahkama.ma', 'manager123');
  console.log('Taking manager_dashboard.png');
  img = await win.webContents.capturePage();
  fs.writeFileSync('docs/images/manager_dashboard.png', img.toPNG());

  console.log('All screenshots completed successfully!');
  app.quit();
}

app.whenReady().then(takeScreenshots);
