import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome back!</h2>
          <p className="text-gray-600">
            You're logged in as <span className="font-medium">{session?.user?.email}</span>
          </p>
          
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-blue-900">Workflows</h3>
              <p className="mt-2 text-sm text-blue-700">Create and manage your automation workflows</p>
              <p className="mt-4 text-2xl font-bold text-blue-900">Coming Soon</p>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-green-900">Executions</h3>
              <p className="mt-2 text-sm text-green-700">Monitor your workflow executions</p>
              <p className="mt-4 text-2xl font-bold text-green-900">Coming Soon</p>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-purple-900">API Keys</h3>
              <p className="mt-2 text-sm text-purple-700">Manage your API access</p>
              <p className="mt-4 text-2xl font-bold text-purple-900">Coming Soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}