# 🚀 Deployment Guide - brglive Website

This guide shows you how to deploy your website publicly so everyone can access it, while keeping the admin panel on your local computer.

## 📋 Overview

Your setup will consist of two parts:

1. **Website (GitHub Pages)** - Public, free hosting
   - HTML, CSS, JavaScript files
   - `matches.json` file with match data
   - People visit this to watch matches

2. **Proxy Server (Render)** - Free hosting for stream proxy
   - Handles protected stream URLs
   - Adds required headers to bypass restrictions

## ⚙️ Prerequisites

- [ ] GitHub account
- [ ] Render account (sign up at [render.com](https://render.com) - free)
- [ ] Git installed on your computer

---

# Part 1: Deploy Proxy Server to Render

## Step 1: Prepare Proxy Server Files

1. Create a new folder called `brglive-proxy` on your Desktop
2. Copy ONLY these files from your main project:
   - `server.js`
   - `package.json`
3. Create a new file `README.md` in `brglive-proxy` folder:

```markdown
# brglive Proxy Server

Stream proxy server for brglive website. Handles header-protected HLS streams.
```

## Step 2: Update server.js for Production

Your `server.js` already has the necessary code. Make sure line 88 says:
```javascript
'https://yourusername.github.io', // Replace with your actual GitHub username
```

## Step 3: Create GitHub Repository for Proxy

1. Go to [github.com](https://github.com)
2. Click "New Repository"
3. Name it: `brglive-proxy`
4. Make it **Public**
5. Click "Create repository"

## Step 4: Push Proxy to GitHub

Open PowerShell in the `brglive-proxy` folder and run:

```powershell
git init
git add .
git commit -m "Initial proxy server"
git remote add origin https://github.com/YOUR-USERNAME/brglive-proxy.git
git push -u origin main
```

> Replace `YOUR-USERNAME` with your actual GitHub username

## Step 5: Deploy to Render

1. Go to [render.com](https://render.com) and sign in
2. Click "New +" → "Web Service"
3. Connect your GitHub account if not already connected
4. Select the `brglive-proxy` repository
5. Configure:
   - **Name**: `brglive-proxy` (or any name you want)
   - **Environment**: `Node`
   - **Build Command**: Leave empty
   - **Start Command**: `node server.js`
   - **Plan**: Select **Free**
6. Click "Create Web Service"

## Step 6: Get Your Proxy URL

After deployment completes (takes 2-3 minutes):
1. You'll see a URL like: `https://brglive-proxy.onrender.com`
2. **Copy this URL** - you'll need it in the next section!

---

# Part 2: Deploy Website to GitHub Pages

## Step 1: Update config.js with Your URLs

Open `js/config.js` in your project and update:

```javascript
// Production proxy URL - UPDATE THIS
const PRODUCTION_PROXY_URL = 'https://brglive-proxy.onrender.com'; // Your Render URL

// Production GitHub Pages URL
const PRODUCTION_MATCHES_URL = 'https://YOUR-USERNAME.github.io/brglive-website/matches.json';
```

Replace:
- `brglive-proxy.onrender.com` with your actual Render URL
- `YOUR-USERNAME` with your GitHub username

## Step 2: Prepare Website Files

Your website folder should contain:
- `index.html`
- `news.html`
- `watch.html`
- `admin.html` (will be in the repo but not linked publicly)
- `css/` folder
- `js/` folder
- `assets/` folder
- `matches.json`
- `.gitignore`

## Step 3: Create/Update .gitignore

Make sure your `.gitignore` includes:
```
node_modules/
.env
```

**Note**: We KEEP `admin.html` in the repository (so it works locally), but we won't link to it from the public site.

## Step 4: Create GitHub Repository for Website

1. Go to [github.com](https://github.com)
2. Click "New Repository"
3. Name it: `brglive-website`
4. Make it **Public**
5. Click "Create repository"

## Step 5: Push Website to GitHub

Open PowerShell in your project folder (`New folder (2)`) and run:

```powershell
git init
git add .
git commit -m "Initial website deployment"
git remote add origin https://github.com/ayoubalgboom-bot/brglive-website.git
git push -u origin main
```

> Replace `ayoubalgboom-bot` with your GitHub username

## Step 6: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click "Settings"
3. Scroll to "Pages" in the left sidebar
4. Under "Source", select: **Deploy from a branch**
5. Select branch: `main` and folder: `/ (root)`
6. Click "Save"

## Step 7: Access Your Website

After 2-3 minutes, your website will be live at:
```
https://YOUR-USERNAME.github.io/brglive-website/
```

🎉 **Your website is now PUBLIC!**

---

# Part 3: Using the Admin Panel Locally

## Daily Workflow

### 1. Add/Edit Matches

1. Start your local server:
   ```powershell
   cd "C:\Users\Admin\Desktop\New folder (2)"
   node server.js
   ```

2. Open admin panel:
   ```
   http://localhost:3000/admin.html
   ```

3. Add or edit matches as needed

4. All changes are saved to `matches.json`

### 2. Push Updates to GitHub

After adding/editing matches, push the updated `matches.json`:

```powershell
git add matches.json
git commit -m "Updated matches"
git push
```

### 3. Updates Go Live

GitHub Pages automatically deploys changes in 1-2 minutes. Your website will show the new matches!

---

# 🔍 Testing

## Test Locally First

1. Update `js/config.js` temporarily to test production mode:
   ```javascript
   // Force production mode for testing
   const isLocalhost = false;
   ```

2. Open `index.html` in browser
3. Check if matches load from `matches.json`
4. Check if video player works

5. **Revert config.js** back to normal:
   ```javascript
   const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
   ```

## Test Production

1. Visit your GitHub Pages URL
2. Check if matches display
3. Click a match and test video playback
4. Verify stream works through proxy

---

# 📝 Important Notes

## Admin Panel Security

- `admin.html` is NOT linked from any public page
- Someone would need to guess the exact URL: `https://YOUR-USERNAME.github.io/brglive-website/admin.html`
- For extra security, you can:
  - Keep admin panel ONLY on your local computer (don't push it to GitHub)
  - Add password protection (requires more advanced setup)

## Free Tier Limitations

### Render (Proxy Server):
- ✅ Free tier includes 750 hours/month
- ⚠️ Server "spins down" after 15 minutes of inactivity
- ⚠️ First request after spin-down takes ~30 seconds to wake up
- ✅ Sufficient for personal use

### GitHub Pages:
- ✅ Completely free
- ✅ No limitations for static websites
- ✅ Fast CDN worldwide

## Troubleshooting

### Issue: Matches not showing on live site
- **Solution**: Check browser console for errors. Verify `matches.json` exists in your GitHub repo.

### Issue: Video player shows error
- **Solution**: Verify your proxy server is running on Render. Check the Render dashboard for logs.

### Issue: Stream takes long to start
- **Solution**: First load after inactivity will be slow (Render spin-up). Subsequent loads will be fast.

### Issue: Config URLs not working
- **Solution**: Double-check your URLs in `js/config.js` match your actual Render and GitHub Pages URLs.

---

# 🎯 Quick Reference

## Your URLs (fill these in after setup)

- **Proxy Server**: `https://________________.onrender.com`
- **Website**: `https://________________.github.io/brglive-website/`
- **Admin Panel (local only)**: `http://localhost:3000/admin.html`

## Common Commands

**Start local server:**
```powershell
node server.js
```

**Push match updates:**
```powershell
git add matches.json
git commit -m "Updated matches"
git push
```

**View live site:**
```
https://YOUR-USERNAME.github.io/brglive-website/
```

---

**Need help?** Check GitHub repository issues or Render dashboard logs for errors.
