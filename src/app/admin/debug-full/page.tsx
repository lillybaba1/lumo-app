import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

export default async function FullDebugPage() {
  const supabase = await createClient();

  // Get current user from session
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // Get all users from user_profiles
  const { data: allProfiles } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  // Try to get requireAdmin result
  let adminCheckResult = null;
  let adminCheckError = null;
  try {
    adminCheckResult = await requireAdmin({ redirect: false });
  } catch (error: any) {
    adminCheckError = error.message;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🔍 Complete Authentication Debug</h1>

      <div className="space-y-6">
        {/* Current Session User */}
        <div className="border rounded-lg p-6 bg-white shadow">
          <h2 className="text-2xl font-semibold mb-4">1. Current Session User</h2>
          {authError ? (
            <div className="text-red-600">
              <p className="font-semibold">❌ Auth Error:</p>
              <p>{authError.message}</p>
            </div>
          ) : user ? (
            <div className="space-y-2">
              <p className="text-green-600 font-semibold text-lg">✅ User is authenticated</p>
              <div className="bg-gray-50 p-4 rounded mt-4">
                <p><strong>User ID:</strong> <code className="bg-gray-200 px-2 py-1 rounded">{user.id}</code></p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Email Verified:</strong> {user.email_confirmed_at ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Created:</strong> {new Date(user.created_at || '').toLocaleString()}</p>
              </div>
            </div>
          ) : (
            <p className="text-red-600 text-lg">❌ No user session found</p>
          )}
        </div>

        {/* Profile Lookup for Current User */}
        {user && (
          <div className="border rounded-lg p-6 bg-white shadow">
            <h2 className="text-2xl font-semibold mb-4">2. Current User&apos;s Profile in user_profiles</h2>
            {(() => {
              const profile = allProfiles?.find(p => p.id === user.id);
              if (profile) {
                return (
                  <div className="space-y-2">
                    <p className="text-green-600 font-semibold text-lg">✅ Profile found</p>
                    <div className="bg-gray-50 p-4 rounded mt-4">
                      <p><strong>Profile ID:</strong> <code className="bg-gray-200 px-2 py-1 rounded">{profile.id}</code></p>
                      <p><strong>Email:</strong> {profile.email}</p>
                      <p><strong>Name:</strong> {profile.name}</p>
                      <p><strong>Role:</strong> <span className={`font-bold text-xl ${profile.role === 'admin' ? 'text-green-600' : 'text-orange-600'}`}>{profile.role}</span></p>
                      <p><strong>Phone:</strong> {profile.phone || 'N/A'}</p>
                      <p><strong>Created:</strong> {new Date(profile.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="text-red-600">
                    <p className="font-semibold text-lg">❌ No profile found for this user ID</p>
                    <p className="mt-2">User ID <code className="bg-red-100 px-2 py-1 rounded">{user.id}</code> does not exist in user_profiles table!</p>
                  </div>
                );
              }
            })()}
          </div>
        )}

        {/* requireAdmin Check */}
        <div className="border rounded-lg p-6 bg-white shadow">
          <h2 className="text-2xl font-semibold mb-4">3. requireAdmin() Function Result</h2>
          {adminCheckError ? (
            <div className="text-red-600">
              <p className="font-semibold text-lg">❌ Admin Check Failed</p>
              <p className="mt-2">Error: {adminCheckError}</p>
            </div>
          ) : adminCheckResult ? (
            <div className="text-green-600">
              <p className="font-semibold text-lg">✅ Admin Access Granted!</p>
              <div className="bg-gray-50 p-4 rounded mt-4">
                <p><strong>User ID:</strong> {adminCheckResult.userId}</p>
                <p><strong>Email:</strong> {adminCheckResult.email}</p>
                <p><strong>Role:</strong> <span className="font-bold text-xl">{adminCheckResult.role}</span></p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">No result</p>
          )}
        </div>

        {/* All Users in Database */}
        <div className="border rounded-lg p-6 bg-white shadow">
          <h2 className="text-2xl font-semibold mb-4">4. All Users in user_profiles Table</h2>
          {allProfiles && allProfiles.length > 0 ? (
            <div>
              <p className="mb-4 text-gray-600">Total users: {allProfiles.length}</p>
              <div className="overflow-x-auto">
                <table className="min-w-full border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-4 py-2 text-left">Email</th>
                      <th className="border px-4 py-2 text-left">Name</th>
                      <th className="border px-4 py-2 text-left">Role</th>
                      <th className="border px-4 py-2 text-left">User ID</th>
                      <th className="border px-4 py-2 text-left">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allProfiles.map((profile) => (
                      <tr
                        key={profile.id}
                        className={profile.id === user?.id ? 'bg-yellow-50 border-2 border-yellow-400' : ''}
                      >
                        <td className="border px-4 py-2">
                          {profile.email}
                          {profile.id === user?.id && <span className="ml-2 text-xs bg-yellow-200 px-2 py-1 rounded">← YOU</span>}
                        </td>
                        <td className="border px-4 py-2">{profile.name}</td>
                        <td className="border px-4 py-2">
                          <span className={`font-semibold ${profile.role === 'admin' ? 'text-green-600' : 'text-gray-600'}`}>
                            {profile.role}
                          </span>
                        </td>
                        <td className="border px-4 py-2">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">{profile.id}</code>
                        </td>
                        <td className="border px-4 py-2 text-sm">{new Date(profile.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-red-600">No users found in user_profiles table</p>
          )}
        </div>

        {/* Diagnosis */}
        <div className="border rounded-lg p-6 bg-blue-50 shadow">
          <h2 className="text-2xl font-semibold mb-4">5. 🔎 Diagnosis</h2>
          {user && allProfiles && (() => {
            const profile = allProfiles.find(p => p.id === user.id);

            if (!profile) {
              return (
                <div className="text-red-600">
                  <p className="font-bold text-lg">❌ PROBLEM FOUND: User ID Mismatch!</p>
                  <p className="mt-2">Your session user ID <code className="bg-red-100 px-2 py-1 rounded">{user.id}</code> does not have a profile in the user_profiles table.</p>
                  <p className="mt-2">This means when you signed up, the profile wasn&apos;t created, or you&apos;re logged in with a different account.</p>
                  <p className="mt-4 font-semibold">Solution:</p>
                  <ul className="list-disc ml-6 mt-2">
                    <li>Log out and log in with the email that has admin role in the table above</li>
                    <li>OR manually create a profile for this user ID in Supabase</li>
                  </ul>
                </div>
              );
            }

            if (profile.role !== 'admin') {
              return (
                <div className="text-orange-600">
                  <p className="font-bold text-lg">❌ PROBLEM FOUND: Role is not &apos;admin&apos;!</p>
                  <p className="mt-2">Your role is set to: <strong>{profile.role}</strong></p>
                  <p className="mt-2">It needs to be exactly: <strong>admin</strong> (lowercase)</p>
                  <p className="mt-4 font-semibold">Solution:</p>
                  <p className="mt-2">Run this SQL in Supabase SQL Editor:</p>
                  <pre className="bg-black text-green-400 p-4 rounded mt-2 overflow-x-auto">
{`UPDATE user_profiles
SET role = 'admin'
WHERE id = '${user.id}';`}
                  </pre>
                </div>
              );
            }

            return (
              <div className="text-green-600">
                <p className="font-bold text-lg">✅ Everything looks correct!</p>
                <p className="mt-2">Your user ID matches, role is &apos;admin&apos;, but requireAdmin() failed.</p>
                <p className="mt-4">This might be a session/cookie issue. Try:</p>
                <ul className="list-disc ml-6 mt-2">
                  <li>Log out completely</li>
                  <li>Clear all browser cookies</li>
                  <li>Log back in</li>
                  <li>Try accessing /admin/dashboard again</li>
                </ul>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
