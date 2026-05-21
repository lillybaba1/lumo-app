# Lumo App Setup Guide

Complete guide for setting up users and categories in your Firestore database.

## Prerequisites

Before running any setup scripts, you need a Firebase Admin service account key:

1. Go to: https://console.firebase.google.com/project/lumo-app-183f5/settings/serviceaccounts/adminsdk
2. Click **"Generate new private key"**
3. Download and save the JSON file securely (e.g., `firebase-service-account.json`)
4. **IMPORTANT**: Never commit this file to git! Keep it secure.

5. Set the environment variable:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/firebase-service-account.json"
   ```

## Setup Steps

### Step 1: Create Categories

Categories are used to organize your products. Run the seed script to create default categories:

```bash
npm run seed:categories
```

This creates 8 default categories:
- Electronics
- Clothing
- Home & Garden
- Sports & Outdoors
- Beauty & Health
- Books & Media
- Toys & Games
- Automotive

**Customizing Categories:**
Edit `scripts/seed-categories.js` to add/remove/modify categories before running the script.

### Step 2: Create Admin User

You need at least one admin user to manage your store. Run the interactive script:

```bash
npm run create:admin
```

You'll be prompted for:
- **Email**: Admin's email address (used for login)
- **Password**: Must be at least 6 characters
- **Display Name**: Admin's full name
- **Phone Number**: Optional, but required for 2FA login (format: +1234567890)

**Important**: If you don't provide a phone number during admin creation, you won't be able to log in until you either:
1. Re-create the admin with a phone number, OR
2. Manually add a phone number to the user in Firebase Console

### Step 3: Create Customer Users (via Signup)

Regular customer users are created when they sign up through your website:

1. **Enable Phone Authentication** (if not done yet):
   - Go to: https://console.firebase.google.com/project/lumo-app-183f5/authentication/providers
   - Enable **Phone** provider
   - Add authorized domains: `lumo-app.org`, `lumo-app-183f5.web.app`

2. **Customer Signup Flow**:
   - Users visit: https://lumo-app.org/signup
   - Fill in: email, password, name, phone number
   - Receive SMS verification code
   - Enter code to complete signup
   - User is created in both Firebase Auth and Firestore

3. **Customer Login Flow** (2FA Required):
   - Users visit: https://lumo-app.org/login
   - Enter email and password
   - Receive SMS verification code
   - Enter code to complete login

## Collection Structure

### Users Collection (`users`)

**Created automatically** when users sign up or when you run `create:admin`.

Document structure:
```json
{
  "uid": "firebase-user-id",
  "email": "user@example.com",
  "name": "User Name",
  "phoneNumber": "+1234567890",
  "phoneVerified": true,
  "role": "admin" | "customer",
  "createdAt": "2025-11-09T10:00:00.000Z"
}
```

**Roles**:
- `admin`: Can access /admin routes, manage products, orders, etc.
- `customer`: Regular shoppers, can place orders and write reviews

### Categories Collection (`categories`)

**Created by running** `npm run seed:categories`.

Document structure:
```json
{
  "id": "electronics",
  "name": "Electronics",
  "description": "Electronic devices, gadgets, and accessories",
  "slug": "electronics",
  "imageUrl": "",
  "featured": true,
  "order": 1,
  "createdAt": "2025-11-09T10:00:00.000Z"
}
```

**Fields**:
- `id`: Unique identifier (used in URLs)
- `name`: Display name
- `description`: Category description
- `slug`: URL-friendly name
- `imageUrl`: Category image (can be uploaded via admin panel)
- `featured`: Show on homepage
- `order`: Display order (1 = first)

## NPM Scripts Reference

```bash
# Setup & Seeding
npm run seed:categories     # Create default categories
npm run create:admin        # Create admin user (interactive)

# Backup & Recovery
npm run backup              # Backup all collections to JSON
npm run restore <file>      # Restore from backup file
npm run sync:users          # Sync Firebase Auth users to Firestore

# Development
npm run dev                 # Start development server
npm run build               # Build for production
npm run start               # Start production server
```

## Common Tasks

### Make a User Admin

If you need to promote a customer to admin:

**Option 1: Via Firebase Console**
1. Go to: https://console.firebase.google.com/project/lumo-app-183f5/firestore
2. Navigate to `users` collection
3. Find the user document (by email or UID)
4. Edit the document
5. Change `role` from `"customer"` to `"admin"`
6. Save

**Option 2: Via Script**
Create a new script or modify `create-admin-user.js` to update existing users.

### Add More Categories

Edit `scripts/seed-categories.js`:

```javascript
const categories = [
  // ... existing categories ...
  {
    id: 'new-category-id',
    name: 'New Category',
    description: 'Category description',
    slug: 'new-category-id',
    imageUrl: '',
    featured: false,
    order: 9,
    createdAt: new Date().toISOString(),
  },
];
```

Then run: `npm run seed:categories`

### Backup Your Data Regularly

Set up a cron job to run backups automatically:

```bash
crontab -e
```

Add this line (runs at 2 AM daily):
```
0 2 * * * cd /path/to/lumo-app && /usr/bin/node scripts/backup-firestore.js
```

## Troubleshooting

### "GOOGLE_APPLICATION_CREDENTIALS not set"

Solution: Set the environment variable before running scripts:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/firebase-service-account.json"
```

### "Email already exists" when creating admin

The email is already registered. To make them admin:
1. Go to Firebase Console → Firestore → users collection
2. Find their document
3. Change `role` to `"admin"`

### "Phone authentication is not enabled"

Enable it in Firebase Console:
1. Go to: https://console.firebase.google.com/project/lumo-app-183f5/authentication/providers
2. Click Phone provider
3. Enable it
4. Add your domains

### Can't login after creating admin without phone number

You need to add a phone number to the user:
1. Go to Firebase Console → Authentication → Users
2. Click on the user
3. Add phone number
4. OR re-create the user with `npm run create:admin` and include phone number

## Security Notes

1. **Never commit service account keys to git**
   - Add to `.gitignore`: `*-service-account.json`

2. **Protect your admin accounts**
   - Use strong passwords
   - Enable 2FA (phone verification)
   - Limit number of admin users

3. **Review Firestore security rules**
   - Rules are in `firestore.rules`
   - Deploy with: `firebase deploy --only firestore:rules`

4. **Regular backups**
   - Run `npm run backup` regularly
   - Store backups securely off-site

## Next Steps

After setup:
1. ✓ Create categories
2. ✓ Create admin user
3. Log in to admin panel: https://lumo-app.org/admin/login
4. Add products through admin interface
5. Set up payment processing
6. Configure shipping options
7. Customize theme and branding

## Support

For issues or questions:
- Check Firebase Console logs
- Review Firestore security rules
- See `scripts/README.md` for backup/recovery details
