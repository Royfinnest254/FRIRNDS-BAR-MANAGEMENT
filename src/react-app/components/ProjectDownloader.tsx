import { useState } from "react";
import JSZip from "jszip";
import { Download } from "lucide-react";

export default function ProjectDownloader() {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const getAllLocalStorage = () => {
    const storage: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        storage[key] = localStorage.getItem(key);
      }
    }
    return storage;
  };

  const getAllSessionStorage = () => {
    const storage: Record<string, any> = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        storage[key] = sessionStorage.getItem(key);
      }
    }
    return storage;
  };

  const getAllCookies = () => {
    const cookies: Record<string, string> = {};
    document.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name) {
        cookies[name] = value || '';
      }
    });
    return cookies;
  };

  const getBrowserInfo = () => {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  };

  const downloadProjectExport = async () => {
    try {
      setDownloading(true);
      setProgress(5);

      const zip = new JSZip();

      // ============================================================================
      // Frontend folder
      // ============================================================================
      const frontend = zip.folder("frontend");
      if (!frontend) throw new Error("Failed to create frontend folder");

      setProgress(10);

      // HTML
      const htmlFolder = frontend.folder("html");
      if (htmlFolder) {
        const htmlDoc = document.documentElement.outerHTML;
        htmlFolder.file("index.html", htmlDoc);
      }

      setProgress(20);

      // CSS - Get all stylesheets
      const cssFolder = frontend.folder("css");
      if (cssFolder) {
        let combinedCss = "/* All inline and imported styles from the application */\n\n";

        // Get inline styles
        const styles = document.querySelectorAll("style");
        styles.forEach((style, index) => {
          if (style.textContent) {
            combinedCss += `/* Inline Style ${index + 1} */\n${style.textContent}\n\n`;
          }
        });

        cssFolder.file("styles.css", combinedCss);
      }

      setProgress(30);

      // JS - Information about scripts
      const jsFolder = frontend.folder("js");
      if (jsFolder) {
        const scriptInfo = Array.from(document.querySelectorAll("script"))
          .map((script, index) => ({
            index: index + 1,
            src: script.src || "inline",
            type: script.type || "text/javascript",
            async: script.async,
            defer: script.defer,
          }));

        jsFolder.file("scripts-info.json", JSON.stringify(scriptInfo, null, 2));
      }

      setProgress(40);

      // Assets - Get all images and media
      const assetsFolder = frontend.folder("assets");
      if (assetsFolder) {
        const imageInfo = Array.from(document.querySelectorAll("img"))
          .map((img, index) => ({
            index: index + 1,
            src: img.src,
            alt: img.alt,
            width: img.width,
            height: img.height,
          }));

        assetsFolder.file("images-info.json", JSON.stringify(imageInfo, null, 2));
      }

      // Fonts
      const fontsFolder = frontend.folder("fonts");
      if (fontsFolder) {
        fontsFolder.file("fonts-info.txt", "Google Fonts and system fonts used in the application");
      }

      setProgress(50);

      // ============================================================================
      // State folder
      // ============================================================================
      const state = zip.folder("state");
      if (!state) throw new Error("Failed to create state folder");

      state.file("localStorage.json", JSON.stringify(getAllLocalStorage(), null, 2));
      state.file("sessionStorage.json", JSON.stringify(getAllSessionStorage(), null, 2));
      state.file("cookies.json", JSON.stringify(getAllCookies(), null, 2));

      const indexedDBFolder = state.folder("indexedDB");
      if (indexedDBFolder) {
        indexedDBFolder.file("README.txt", "IndexedDB data export not available in browser context");
      }

      setProgress(60);

      // ============================================================================
      // User Content folder
      // ============================================================================
      const userContent = zip.folder("user-content");
      if (!userContent) throw new Error("Failed to create user-content folder");

      const uploadsFolder = userContent.folder("uploads");
      if (uploadsFolder) {
        uploadsFolder.file("README.txt", "User uploaded files would be stored here");
      }

      const generatedFolder = userContent.folder("generated");
      if (generatedFolder) {
        generatedFolder.file("README.txt", "Generated content would be stored here");
      }

      const mediaFolder = userContent.folder("media");
      if (mediaFolder) {
        mediaFolder.file("README.txt", "Media files would be stored here");
      }

      setProgress(70);

      // ============================================================================
      // Config folder
      // ============================================================================
      const config = zip.folder("config");
      if (!config) throw new Error("Failed to create config folder");

      const appConfig = {
        appName: "Friends Bar Management System",
        version: "1.0.0",
        environment: window.location.hostname.includes("localhost") ? "development" : "production",
        apiUrl: window.location.origin,
        features: {
          authentication: true,
          dailyStockRecording: true,
          inventoryManagement: true,
          salesTracking: true,
          reporting: true,
          adminPanel: true,
        },
        theme: {
          primaryColor: "amber",
          secondaryColor: "orange",
          mode: "light",
        },
      };

      config.file("app-config.json", JSON.stringify(appConfig, null, 2));

      const runtimeConfig = {
        exportedAt: new Date().toISOString(),
        url: window.location.href,
        origin: window.location.origin,
        pathname: window.location.pathname,
        online: navigator.onLine,
      };

      config.file("runtime.json", JSON.stringify(runtimeConfig, null, 2));

      setProgress(80);

      // ============================================================================
      // Metadata folder
      // ============================================================================
      const metadata = zip.folder("metadata");
      if (!metadata) throw new Error("Failed to create metadata folder");

      const timestamp = new Date().toISOString();
      metadata.file("export-timestamp.txt", timestamp);

      metadata.file("browser-info.json", JSON.stringify(getBrowserInfo(), null, 2));

      metadata.file("app-version.txt", "Friends Bar Management System v1.0.0");

      setProgress(90);

      // ============================================================================
      // Root README
      // ============================================================================
      const readme = `# Friends Bar Management System - Complete Export

This export was generated on ${new Date().toLocaleString()}

## Export Structure

### frontend/
Contains all frontend application files:
- **html/** - Application HTML structure
- **css/** - Stylesheets and design files
- **js/** - JavaScript information
- **assets/** - Images and media references
- **fonts/** - Font information

### state/
Application state and storage:
- **localStorage.json** - Local storage data
- **sessionStorage.json** - Session storage data
- **cookies.json** - Browser cookies
- **indexedDB/** - IndexedDB information

### user-content/
User-generated and uploaded content:
- **uploads/** - User uploaded files
- **generated/** - System generated content
- **media/** - Media files

### config/
Application configuration:
- **app-config.json** - Application settings and features
- **runtime.json** - Runtime environment information

### metadata/
Export metadata:
- **export-timestamp.txt** - When this export was created
- **browser-info.json** - Browser and system information
- **app-version.txt** - Application version

## About This Application

**Friends Bar Management System** is a comprehensive inventory and sales management application built for bar and restaurant operations.

### Features
- ✅ Google OAuth authentication
- ✅ Daily stock recording with automatic calculations
- ✅ Real-time inventory management
- ✅ Sales tracking (Cash/M-Pesa)
- ✅ Comprehensive reporting and analytics
- ✅ Admin dashboard for user management
- ✅ CSV export functionality

### Technology Stack
- Frontend: React 19, TypeScript, Tailwind CSS
- Backend: Hono (Cloudflare Workers)
- Database: Cloudflare D1 (SQLite)
- Authentication: Mocha Users Service
- Build Tool: Vite

### Database Tables
- **items** - Inventory items with stock levels
- **sales** - Sales transactions
- **stock_history** - Inventory change tracking
- **user_metadata** - User profiles and permissions
- **daily_stock_records** - Daily stock entries

## Notes

This export captures the current state of the application at the time of export. Some dynamic content and server-side data may not be fully represented in this static export.

For complete source code access, please contact Mocha platform support or use the platform's built-in export feature.

---
Generated by Friends Bar Management System
Export ID: ${timestamp}
`;

      zip.file("README.md", readme);

      setProgress(95);

      // ============================================================================
      // Generate and download
      // ============================================================================
      const blob = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `project-export-${new Date().toISOString().split("T")[0]}.zip`;
      a.click();
      window.URL.revokeObjectURL(url);

      setProgress(100);
      setTimeout(() => {
        setDownloading(false);
        setProgress(0);
      }, 1000);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to generate export. Please try again.");
      setDownloading(false);
      setProgress(0);
    }
  };

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">
            Export Project
          </h3>
          <p className="text-sm text-text_secondary">
            Download complete project export with state and configuration
          </p>
        </div>
        <button
          onClick={downloadProjectExport}
          disabled={downloading}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          <Download className="w-5 h-5" />
          <span>{downloading ? "Exporting..." : "Download Export"}</span>
        </button>
      </div>

      {downloading && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text_secondary">Generating export...</span>
            <span className="text-sm font-semibold text-blue-400">
              {progress}%
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-400 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-4">
        <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
          <h4 className="text-sm font-semibold text-blue-400 mb-2">
            Export includes:
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1 text-sm text-blue-300">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                <span>Frontend files (HTML, CSS, JS)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                <span>Application state & storage</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                <span>User content directories</span>
              </div>
            </div>
            <div className="space-y-1 text-sm text-blue-300">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                <span>Configuration files</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                <span>Export metadata</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                <span>Comprehensive README</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
          <h4 className="text-sm font-semibold text-green-400 mb-2">
            Export Structure:
          </h4>
          <pre className="text-xs text-green-300 font-mono overflow-x-auto">
            {`project-export.zip
├── frontend/
│   ├── html/
│   ├── css/
│   ├── js/
│   ├── assets/
│   └── fonts/
├── state/
│   ├── localStorage.json
│   ├── sessionStorage.json
│   ├── indexedDB/
│   └── cookies.json
├── user-content/
│   ├── uploads/
│   ├── generated/
│   └── media/
├── config/
│   ├── app-config.json
│   └── runtime.json
├── metadata/
│   ├── export-timestamp.txt
│   ├── browser-info.json
│   └── app-version.txt
└── README.md`}
          </pre>
        </div>
      </div>
    </div>
  );
}
