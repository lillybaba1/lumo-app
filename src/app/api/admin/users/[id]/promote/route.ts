export const runtime = 'nodejs';

import 'server-only';

import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebaseAdmin';
import { requireAdmin, UnauthorizedError } from '@/lib/auth-admin';

/**
 * Protected endpoint to promote a user to admin.
 * Requires authenticated admin session.
 * Runs a Firestore transaction to atomically update the user's role and write an audit record.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    // SECURITY: Require admin authentication
    const adminUser = await requireAdmin({ redirect: false });

    const uid = params.id;
    if (!uid) {
      return NextResponse.json({ success: false, message: 'Missing user id' }, { status: 400 });
    }

    // Prevent self-promotion (though already admin)
    if (uid === adminUser.userId) {
      return NextResponse.json({
        success: false,
        message: 'Cannot modify your own admin status'
      }, { status: 400 });
    }

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
        performedBy: adminUser.userId,
        performedByEmail: adminUser.email,
        performedAt: new Date().toISOString(),
      });
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({
        success: false,
        message: err.message || 'Admin authentication required'
      }, { status: err.statusCode ?? 401 });
    }

    console.error('Failed to promote user:', err);

    const errorMessage = process.env.NODE_ENV === 'development'
      ? err.message || 'Failed to promote user'
      : 'Failed to promote user. Please try again.';

    return NextResponse.json({
      success: false,
      message: errorMessage
    }, { status: 500 });
  }
}
