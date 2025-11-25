# 🚀 Quick Deploy to Vercel

## Fastest Way: One-Click Deploy

Click this button to deploy instantly:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Flillybaba1%2Flumo-app)

**After clicking:**
1. Sign in to Vercel (or create free account)
2. Click "Create" to import the repository
3. Add environment variables (see below)
4. Click "Deploy"

---

## Required Environment Variables

Add these in Vercel during setup:

### 1. Firebase Client (Public - Already Filled)
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBb2rTZAGNbKDcF6lBxxCubKlxmks1n0ng
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=lumo-app-183f5.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=lumo-app-183f5
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=lumo-app-183f5.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=599053873389
NEXT_PUBLIC_FIREBASE_APP_ID=1:599053873389:web:7ae9fc52e26be1e3d89ce4
```

### 2. Google AI API Key (REQUIRED)
```
GOOGLE_API_KEY=<GET_FROM_https://aistudio.google.com/app/apikey>
```

**How to get:**
1. Visit https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key
4. Paste in Vercel

### 3. Firebase Admin (REQUIRED)
```
FIREBASE_SERVICE_ACCOUNT_JSON=<GET_FROM_FIREBASE_CONSOLE>
FIREBASE_STORAGE_BUCKET=lumo-app-183f5.firebasestorage.app
FIREBASE_COOKIE_NAME=session
```

**How to get Firebase Admin JSON:**
1. Go to https://console.firebase.google.com/
2. Select: **lumo-app-183f5**
3. ⚙️ → Project Settings → Service Accounts
4. Click **"Generate new private key"**
5. Download the JSON file
6. Open it and **copy entire contents**
7. Paste as single line in Vercel

---

## Alternative: Deploy from Command Line

If you prefer CLI:

```bash
# 1. Install Vercel CLI (if not already)
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
cd /home/user/lumo-app
vercel --prod
```

When prompted for environment variables, paste them from above.

---

## After Deployment

### 1. Visit Your Site
Vercel will give you a URL like: `https://lumo-app-xxxxx.vercel.app`

### 2. Create Admin Account
- Go to: `https://your-url.vercel.app/admin/setup-first-admin`
- Create your admin credentials
- Login at `/admin/login`

### 3. Test Features
- ✅ Homepage loads
- ✅ Products display
- ✅ AI Assistant works
- ✅ Login/signup works
- ✅ Admin panel accessible

---

## Troubleshooting

### Build Failed?
- Check environment variables are all set
- Verify Firebase credentials are valid
- Check build logs in Vercel dashboard

### AI Assistant Not Working?
- Verify `GOOGLE_API_KEY` is set
- Check API key is valid at https://aistudio.google.com/

### Admin Features Not Working?
- Verify `FIREBASE_SERVICE_ACCOUNT_JSON` is set correctly
- Ensure it's valid JSON (copy entire file contents)

---

## Support

- 📖 **Full Guide:** See `DEPLOYMENT_GUIDE.md`
- 🐛 **Issues:** https://github.com/lillybaba1/lumo-app/issues
- 📚 **Vercel Docs:** https://vercel.com/docs

---

**Estimated Deploy Time:** 2-3 minutes
**Cost:** Free (Vercel Hobby plan)
