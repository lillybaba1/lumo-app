export const runtime = 'nodejs';

import 'server-only';

import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebaseAdmin';

/**
 * Protected endpoint to promote a user to admin.
 * Expects header `x-admin-key` === process.env.ADMIN_API_KEY
 * Runs a Firestore transaction to atomically update the user's role and write an audit record.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const adminKey = req.headers.get('x-admin-key') || '';
  if (!process.env.ADMIN_API_KEY) {
    return NextResponse.json({ success: false, message: 'Server missing ADMIN_API_KEY' }, { status: 500 });
  }

  if (adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const uid = params.id;
  if (!uid) return NextResponse.json({ success: false, message: 'Missing user id' }, { status: 400 });

  try {
    const db = dbAdmin();
    const userRef = db.collection('users').doc(uid);
    const auditRef = db.collection('adminActions').doc();

    await db.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) {
        throw new Error('User not found');
      }

      // Set role to 'admin'
      tx.update(userRef, { role: 'admin', updatedAt: new Date().toISOString() });

      // Write audit entry
      tx.set(auditRef, {
        action: 'promote-to-admin',
        targetUid: uid,
        performedBy: 'admin-key',
        performedAt: new Date().toISOString(),
      });
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to promote user:', err);
    return NextResponse.json({ success: false, message: err.message || 'Failed to promote user' }, { status: 500 });
  }
}
