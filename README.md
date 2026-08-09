# React + TypeScript + Vite

## Running the project

To run the full app (Flask backend + Vite frontend + Electron):

```
npm run electron:full
```

The backend must be running on http://localhost:5055 for login to work, otherwise you'll get a "Bad Gateway" / ECONNREFUSED error.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Google Forms Integration Setup

To enable automatic Google Form generation using your personal Google account, you need to set up OAuth 2.0 in the Google Cloud Console.

### 1. Create OAuth Credentials
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. In the sidebar, navigate to **APIs & Services** > **Credentials**.
4. Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
5. If prompted, configure your "OAuth consent screen" first (select "External" for user type).
6. For Application type, select **Desktop app** (or Web application if preferred).
7. Copy the generated **Client ID** and **Client Secret**.
8. Paste them into the "إعدادات النظام" (Settings) page in this app.

### 2. Add Test Users
Because your app is in the "Testing" phase by default, you must explicitly add the Google accounts that are allowed to log in:
1. In the Google Cloud Console sidebar, click on **Audience** (or **OAuth consent screen**).
2. Scroll down to the **Test users** section.
3. Click **+ Add users**.
4. Enter the Gmail address(es) you want to use to generate forms.
5. Click **Save**.

Now, when you click "تسجيل الدخول إلى Google (لإنشاء النماذج)" in the app, it will successfully authenticate your account!
