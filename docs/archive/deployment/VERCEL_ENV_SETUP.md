# Vercel Environment Variables Setup

To deploy your Lumo app on Vercel, you need to configure Firebase Admin SDK credentials.

## Required Environment Variables

Go to your Vercel project settings → Environment Variables and add:

### Option 1: Using Service Account JSON (Recommended)

1. Open your service account key file: `service-account-key.json`
2. Copy the entire JSON content
3. In Vercel, add environment variable:
   - **Name**: `FIREBASE_SERVICE_ACCOUNT_JSON`
   - **Value**: Paste the entire JSON content (as a single line string)
   - **Environments**: Production, Preview, Development

### Option 2: Using Base64 Encoded JSON (Alternative)

If Option 1 doesn't work, you can base64 encode the JSON:

```bash
# In your terminal:
cat service-account-key.json | base64 -w 0
```

Then in Vercel:
- **Name**: `FIREBASE_SERVICE_ACCOUNT_BASE64`
- **Value**: The base64 encoded string
- **Environments**: Production, Preview, Development

### Additional Variables

Also add:
- **Name**: `FIREBASE_COOKIE_NAME`
- **Value**: `session`
- **Environments**: Production, Preview, Development

- **Name**: `NODE_ENV`
- **Value**: `production`
- **Environments**: Production only

## Steps to Configure in Vercel

1. Go to: https://vercel.com/lillybaba1/lumo-app/settings/environment-variables
2. Click "Add New"
3. Enter the variable name and value
4. Select which environments (Production, Preview, Development)
5. Click "Save"
6. Redeploy your application

## After Configuration

Once you've added the environment variables, trigger a new deployment:

```bash
git commit --allow-empty -m "Trigger Vercel redeploy"
git push origin master
```

Or manually redeploy from the Vercel dashboard.

## Verification

After deployment, check:
- The sidebar categories should load without errors
- Admin functions should work properly
- Session management should function correctly

## Troubleshooting

If you still see errors:

1. **Check Vercel Logs**: https://vercel.com/lillybaba1/lumo-app/logs
2. **Verify JSON Format**: Make sure the JSON is valid (no line breaks if using Option 1)
3. **Redeploy**: Sometimes changes need a fresh deployment
4. **Check Runtime**: Ensure your pages are using Node.js runtime, not Edge (Edge doesn't support Firebase Admin)

## Firebase Project Info

Your current Firebase project: `lumo-d0hqd`

Make sure the service account key you're using matches this project ID.
