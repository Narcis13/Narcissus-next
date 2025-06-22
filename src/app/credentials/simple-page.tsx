import { createCredential, getCredentials, deleteCredential } from "../../actions/credentials";

"use client";

import { deleteCredential } from "../../actions/credentials";

// Simple client component for delete confirmation
function DeleteButton({ credentialId, serviceName }: { credentialId: string; serviceName: string | null }) {
  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete the credential for "${serviceName}"?`)) {
      const formData = new FormData();
      formData.append("id", credentialId);
      await deleteCredential(formData);
      // Refresh the page to show updated data
      window.location.reload();
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="bg-red-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-red-700 transition-colors"
    >
      Delete
    </button>
  );
}

export default async function SimpleCredentialsPage() {
  // READ: Fetch credentials directly in this Server Component
  const credentials = await getCredentials();

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Credentials Manager (Simple)</h1>

      {/* CREATE: Form to add a new credential */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Add New Credential</h2>
        <form action={createCredential} className="flex flex-col gap-4 max-w-md">
          <input
            type="text"
            name="serviceName"
            placeholder="Service Name (e.g., GitHub, AWS, etc.)"
            required
            className="p-3 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            name="secret"
            placeholder="Secret/Token/Password"
            required
            className="p-3 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Add Credential
          </button>
        </form>
      </section>

      {/* READ: Display the list of credentials */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Stored Credentials</h2>
        <div className="space-y-6">
          {credentials.length > 0 ? (
            credentials.map((credential) => (
              <div key={credential.id} className="p-6 border rounded-lg shadow-sm bg-gray-50 dark:bg-gray-800">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {credential.serviceName}
                    </h3>
                    <div className="mt-3 space-y-2">
                      <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          Secret:
                        </label>
                        <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded border font-mono text-sm break-all">
                          {credential.decryptedSecret}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-4 text-sm text-gray-500">
                      <span>
                        Created: {credential.createdAt ? new Date(credential.createdAt).toLocaleString() : 'N/A'}
                      </span>
                      {credential.updatedAt && credential.updatedAt !== credential.createdAt && (
                        <span>
                          Updated: {new Date(credential.updatedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* DELETE: Client component with confirmation */}
                  <div className="ml-4">
                    <DeleteButton 
                      credentialId={credential.id} 
                      serviceName={credential.serviceName}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">🔐</div>
              <p className="text-gray-500">No credentials stored yet.</p>
              <p className="text-gray-400 text-sm">Add your first credential above to get started.</p>
            </div>
          )}
        </div>
      </section>

      {/* Security Notice */}
      <section className="mt-12 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
          🔒 Security Information
        </h3>
        <p className="text-blue-700 dark:text-blue-300 text-sm">
          All secrets are encrypted using AES-256-GCM before being stored in the database. 
          The master encryption key is stored securely in environment variables.
        </p>
      </section>
    </main>
  );
}
