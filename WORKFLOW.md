# 🚀 Simple Workflow for Managing Your Website

## Daily Workflow

### 1️⃣ Edit Channels & Matches (Locally)

**Start the server:**
```powershell
node server.js
```

**Open admin panel:**
```
http://localhost:3000/admin.html
```

**Add/Edit:**
- Scroll to "📺 إدارة القنوات المباشرة" to manage channels
- Use the match forms to manage matches
- All changes save to `channels.json` and `matches.json` automatically

---

### 2️⃣ Deploy to Website

**Simply double-click:**
```
DEPLOY_TO_WEBSITE.bat
```

This script will:
- ✅ Show you what changed (channel count, etc.)
- ✅ Ask for confirmation
- ✅ Push to GitHub
- ✅ Your website updates in 1-2 minutes

---

## Important Files

**DO NOT RUN THESE** (they will conflict with Render):
- ❌ `START_AUTO_MODE.bat`
- ❌ `auto_restore.ps1`
- ❌ `auto_restore_fixed.ps1`
- ❌ `start_cloudflare.bat`

**Your Deployment:**
- ✅ Website: `https://brglive.abrdns.com`
- ✅ Proxy: `https://brglive-online.onrender.com` (Render - always the same URL)

---

## That's It! 🎉

Your workflow is now:
1. Edit via admin panel (local)
2. Click `DEPLOY_TO_WEBSITE.bat`
3. Wait 1-2 minutes
4. Your website is updated!

No more data loss, no more changing URLs!
