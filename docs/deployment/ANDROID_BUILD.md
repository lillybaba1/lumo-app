# Lumo Android App

This guide explains how to build the Lumo Android app from the Next.js codebase using Capacitor.

## Prerequisites

1. **Android Studio** - Download from https://developer.android.com/studio
2. **Java 17** - Required for Android builds
3. **Node.js 18+**

## Setup

The project is already configured with Capacitor. The Android project is in the `android/` directory.

## Building the APK

### Option 1: Using Android Studio (Recommended)

1. Open the project in Android Studio:
   ```bash
   npm run android:open
   ```

2. Wait for Gradle to sync

3. Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**

4. The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

### Option 2: Command Line

1. Sync the Android project:
   ```bash
   npm run android:sync
   ```

2. Build the debug APK:
   ```bash
   npm run android:build
   ```

3. Or run directly on a connected device:
   ```bash
   npm run android:run
   ```

## Configuration

The app is configured in `capacitor.config.ts`:

- **App ID**: `com.lumo.app`
- **App Name**: `Lumo`
- **Server URL**: Points to `https://lumo-app.org`

The app loads your live Vercel-hosted website in a native WebView, giving users a native app experience while you maintain a single codebase.

## Customizing the App

### App Icon

Replace the icons in:
- `android/app/src/main/res/mipmap-*/ic_launcher.png`
- `android/app/src/main/res/mipmap-*/ic_launcher_round.png`

Use sizes: 48x48, 72x72, 96x96, 144x144, 192x192 pixels

### Splash Screen

Edit `android/app/src/main/res/drawable/splash.xml`

### Colors

Edit `android/app/src/main/res/values/colors.xml`

## Release Build

For a signed release APK:

1. Generate a keystore:
   ```bash
   keytool -genkey -v -keystore lumo-release-key.keystore -alias lumo -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Add to `android/app/build.gradle`:
   ```groovy
   android {
       signingConfigs {
           release {
               storeFile file('lumo-release-key.keystore')
               storePassword 'your-password'
               keyAlias 'lumo'
               keyPassword 'your-password'
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               minifyEnabled true
               proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
           }
       }
   }
   ```

3. Build release APK:
   ```bash
   cd android && ./gradlew assembleRelease
   ```

## Publishing to Play Store

1. Create a Google Play Developer account ($25 one-time fee)
2. Create your app in the Google Play Console
3. Upload your signed AAB (Android App Bundle):
   ```bash
   cd android && ./gradlew bundleRelease
   ```
4. Complete the store listing with screenshots, descriptions, etc.

## Troubleshooting

### Java Version Issues
Make sure you're using Java 17:
```bash
java -version
```

If needed, install Java 17:
```bash
# Ubuntu/Debian
sudo apt install openjdk-17-jdk

# Set JAVA_HOME
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
```

### Gradle Sync Issues
```bash
cd android
./gradlew clean
./gradlew --refresh-dependencies
```

### Clear Capacitor Cache
```bash
npx cap sync android --force
```
