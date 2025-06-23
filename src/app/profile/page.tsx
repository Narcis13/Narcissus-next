import { getUserProfile } from "@/lib/auth/profile-actions";
import ProfileForm from "@/components/auth/profile-form";
import ChangePasswordForm from "@/components/auth/change-password-form";

export default async function ProfilePage() {
  const user = await getUserProfile();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-gray-600">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
          <div className="px-6 py-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Account Information
            </h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email Verified</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user.emailVerified ? (
                    <span className="text-green-600">Verified</span>
                  ) : (
                    <span className="text-red-600">Not verified</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString()}
                </dd>
              </div>
              {user.lastLoginAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Login</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(user.lastLoginAt).toLocaleString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="px-6 py-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Update Profile
            </h2>
            <ProfileForm currentName={user.name || ""} />
          </div>

          <div className="px-6 py-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Change Password
            </h2>
            <ChangePasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}