const admin = require('firebase-admin');

exports.handler = async function (event, context) {
  try {
    // If GOOGLE_APPLICATION_CREDENTIALS is set, firebase-admin will pick it up.
    if (!admin.apps.length) admin.initializeApp();

    const db = admin.firestore();
    const snap = await db.collection('orders').limit(1).get();
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, hasOrders: !snap.empty }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: String(err) }),
    };
  }
};
