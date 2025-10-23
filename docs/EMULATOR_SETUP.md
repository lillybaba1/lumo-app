# Firebase Emulator Setup (local dev)

This project can use the Firebase Emulator Suite to run Firestore/Auth/Storage locally so build-time server fetches work without production credentials.

1) Install Firebase CLI (recommended global install):

   npm install -g firebase-tools

2) Initialize Emulator config (if not already present):

   firebase init emulators

Choose Firestore, Auth, and Storage when prompted. This will create a `firebase.json` with emulator config.

3) Start the emulator from the repo root:

   npm run emulator:start

This runs:

   firebase emulators:start --only firestore,auth,storage

4) (Optional) Export/Import data

- To export data when stopping: use the `--export-on-exit` flag and set a directory to save state.
- To import data on start: use `firebase emulators:start --import=./seed`.

5) Run the Next.js build while emulator is running (in another terminal):

   npm run build

6) Environment variables

For local dev you typically do not need a service account when using the emulator.
If your code checks for `FIREBASE_EMULATOR_HOST`, you can set:

   export FIREBASE_EMULATOR_HOST=localhost:8080

(Adjust ports if your emulator uses different ones.)

Security note: do not commit real service account JSON to the repository. Use `.env.local` (gitignored) or your platform's secret manager for CI.
