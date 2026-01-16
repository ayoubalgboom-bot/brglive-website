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

### 2️⃣ Deploy to Website (Automatic)

**Start the Auto-Deploy Monitor:**
Double-click: `START_AUTO_DEPLOY.bat`

Keep this window open! It will:
- 👁️ Watch for changes to channels or matches
- 🚀 Automatically push to GitHub when you save
- ✅ Update your website in 1-2 minutes

---

## Important Files

**DO NOT RUN THESE** (they will conflict with Render):
- ❌ `START_AUTO_MODE.bat` (Old - deletes data!)
- ❌ `auto_restore.ps1`
- ❌ `auto_restore_fixed.ps1`

**Use These Instead:**
- ✅ `START_AUTO_DEPLOY.bat` (Safe - creates backup & pushes updates)
- ✅ `node server.js` (To run admin panel)

**Your Deployment:**
- ✅ Website: `https://brglive.abrdns.com`
- ✅ Proxy: `https://brglive-online.onrender.com` (Render - always the same URL)

---

## That's It! 🎉

Your workflow is now:
1. Run `START_AUTO_DEPLOY.bat` (keep open)
2. Run `node server.js`
3. Edit via admin panel
4. Changes go live **automatically!**

No more data loss, no more changing URLs!
