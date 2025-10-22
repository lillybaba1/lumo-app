# Vercel Deployment Guide

## Environment Variables Setup

Your Lumo app needs the following environment variables to work properly on Vercel.

### Required Environment Variables

#### 1. FIREBASE_COOKIE_NAME (Optional)
- **Description**: Name of the session cookie
- **Default**: `session`
- **Example**: `session`
- **Required**: No (will use default if not set)

#### 2. FIREBASE_SERVICE_ACCOUNT_JSON (Required for Admin features)
- **Description**: Firebase Admin SDK credentials for server-side operations
- **Required**: Yes (if using file uploads or server-side Firebase operations)
- **How to get it**:
  1. Go to [Firebase Console](https://console.firebase.google.com/)
  2. Select your project: `lumo-app-183f5`
  3. Click on ⚙️ (Settings) > Project settings
  4. Go to "Service accounts" tab
  5. Click "Generate new private key"
  6. Download the JSON file
  7. Copy the entire JSON content as a single-line string

**Example format**:
```json
{"type":"service_account","project_id":"lumo-app-183f5","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\nYour_Key_Here\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@lumo-app-183f5.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40lumo-app-183f5.iam.gserviceaccount.com"}
```

## Setting Environment Variables in Vercel

### Option 1: Via Vercel Dashboard

1. Go to https://vercel.com
2. Select your `lumo-app` project
3. Click on **Settings** tab
4. Click on **Environment Variables** in the sidebar
5. Add each variable:
   - **Key**: `FIREBASE_COOKIE_NAME`
   - **Value**: `session`
   - **Environments**: Check all (Production, Preview, Development)
   - Click **Save**

6. Add Firebase Admin credentials:
   - **Key**: `FIREBASE_SERVICE_ACCOUNT_JSON`
   - **Value**: Paste the entire JSON from Firebase (as single line)
   - **Environments**: Check Production and Preview (NOT Development - use local .env for dev)
   - Click **Save**

7. After adding all variables, **redeploy** your application:
   - Go to **Deployments** tab
   - Click the ⋯ menu on the latest deployment
   - Click **Redeploy**

### Option 2: Via Vercel CLI

```bash
# Set environment variables
npx vercel env add FIREBASE_COOKIE_NAME production
# When prompted, enter: session

npx vercel env add FIREBASE_SERVICE_ACCOUNT_JSON production
# When prompted, paste the entire Firebase service account JSON

# Redeploy to apply changes
npx vercel --prod
```

## Firebase Configuration

Your Firebase client configuration is already set in the code:
- **Project ID**: `lumo-app-183f5`
- **Region**: `firebasestorage.app`

The client-side Firebase config is public and doesn't need to be in environment variables.

## Local Development

For local development, create a `.env.local` file:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your Firebase service account JSON:

```env
FIREBASE_COOKIE_NAME=session
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

**Important**: Never commit `.env.local` to git - it's already in `.gitignore`

## Troubleshooting

### Issue: "Firebase Admin SDK not initialized"
- **Solution**: Make sure you've added `FIREBASE_SERVICE_ACCOUNT_JSON` to Vercel environment variables
- Redeploy your application after adding the variable

### Issue: "Session not working"
- **Solution**: Check that `FIREBASE_COOKIE_NAME` matches across all deployments
- Default is `session`, so you likely don't need to change it

### Issue: Environment variables not updating
- **Solution**: After changing environment variables in Vercel, you must redeploy the application
- Go to Deployments > Click ⋯ on latest > Redeploy

## Security Best Practices

✅ **DO**:
- Keep your Firebase service account JSON secret
- Use Vercel's environment variable encryption
- Only add sensitive variables to Production/Preview, not Development
- Rotate your service account keys periodically

❌ **DON'T**:
- Commit `.env.local` or `.env` files to git
- Share your service account JSON publicly
- Use the same service account across multiple projects

## Next Steps

1. ✅ Set up environment variables in Vercel
2. ✅ Deploy your application
3. ✅ Test file upload functionality
4. ✅ Test authentication and sessions
5. ✅ Monitor for any errors in Vercel logs

## Support

If you encounter issues:
- Check Vercel deployment logs: https://vercel.com/your-username/lumo-app/deployments
- Check Firebase Console logs
- Verify all environment variables are set correctly
