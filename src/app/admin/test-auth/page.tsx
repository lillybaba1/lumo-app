import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function TestAuthPage() {
  const supabase = await createClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // Get profile
  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Authentication Test Page</h1>

      <div className="space-y-6">
        <div className="border rounded-lg p-4 bg-white shadow">
          <h2 className="text-xl font-semibold mb-3">User Authentication</h2>
          {authError ? (
            <div className="text-red-600">
              <p className="font-semibold">Error:</p>
              <p>{authError.message}</p>
            </div>
          ) : user ? (
            <div className="space-y-2">
              <p className="text-green-600 font-semibold">✓ User is authenticated</p>
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Email Verified:</strong> {user.email_confirmed_at ? '✓ Yes' : '✗ No'}</p>
            </div>
          ) : (
            <p className="text-red-600">✗ No user session found</p>
          )}
        </div>

        <div className="border rounded-lg p-4 bg-white shadow">
          <h2 className="text-xl font-semibold mb-3">User Profile</h2>
          {profile ? (
            <div className="space-y-2">
              <p className="text-green-600 font-semibold">✓ Profile found</p>
              <p><strong>Name:</strong> {profile.name}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Role:</strong> <span className={profile.role === 'admin' ? 'text-green-600 font-bold' : 'text-orange-600'}>{profile.role}</span></p>
              <p><strong>Phone:</strong> {profile.phone || 'N/A'}</p>
              <p><strong>Created:</strong> {new Date(profile.created_at).toLocaleString()}</p>
            </div>
          ) : (
            <p className="text-red-600">✗ No profile found in user_profiles table</p>
          )}
        </div>

        <div className="border rounded-lg p-4 bg-white shadow">
          <h2 className="text-xl font-semibold mb-3">Admin Access</h2>
          {profile?.role === 'admin' ? (
            <div className="text-green-600">
              <p className="font-semibold text-xl">✓ You have admin access!</p>
              <p className="mt-2">Your role is set to 'admin' in the database.</p>
              <p className="mt-4">
                <a href="/admin/dashboard" className="text-blue-600 hover:underline font-semibold">
                  → Go to Admin Dashboard
                </a>
              </p>
            </div>
          ) : (
            <div className="text-red-600">
              <p className="font-semibold text-xl">✗ No admin access</p>
              <p className="mt-2">Your role is: {profile?.role || 'unknown'}</p>
              <p className="mt-2">Expected: admin</p>
            </div>
          )}
        </div>

        <div className="border rounded-lg p-4 bg-gray-50">
          <h2 className="text-xl font-semibold mb-3">Raw Data (for debugging)</h2>
          <pre className="text-xs overflow-auto bg-black text-green-400 p-4 rounded">
{JSON.stringify({
  user: user ? {
    id: user.id,
    email: user.email,
    email_confirmed_at: user.email_confirmed_at,
  } : null,
  profile,
  authError: authError?.message || null,
}, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
