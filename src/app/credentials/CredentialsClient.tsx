"use client";

import { useState } from "react";
import { createCredential, deleteCredential } from "../../actions/credentials";
import CredentialItem from "../../components/CredentialItem";
import EditCredentialForm from "../../components/EditCredentialForm";

interface Credential {
  id: string;
  serviceName: string | null;
  decryptedSecret: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface CredentialsClientProps {
  initialCredentials: Credential[];
}

export default function CredentialsClient({ initialCredentials }: CredentialsClientProps) {
  const [credentials, setCredentials] = useState(initialCredentials);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);

  const handleDelete = async (id: string) => {
    const formData = new FormData();
    formData.append("id", id);
    await deleteCredential(formData);
    
    // Update local state
    setCredentials(credentials.filter(cred => cred.id !== id));
  };

  const handleEdit = (credential: Credential) => {
    setEditingCredential(credential);
  };

  const handleEditComplete = () => {
    setEditingCredential(null);
    // Refresh the page to get updated data
    window.location.reload();
  };

  const handleCreateSubmit = async (formData: FormData) => {
    await createCredential(formData);
    // Refresh the page to get updated data
    window.location.reload();
  };

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Credentials Manager</h1>

      {/* CREATE: Form to add a new credential */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Add New Credential</h2>
        <form action={handleCreateSubmit} className="flex flex-col gap-4 max-w-md">
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

      {/* EDIT: Edit form (shows when editing) */}
      {editingCredential && (
        <section className="mb-8">
          <EditCredentialForm
            credential={editingCredential}
            onCancel={handleEditComplete}
          />
        </section>
      )}

      {/* READ: Display the list of credentials */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Stored Credentials</h2>
        <div className="space-y-6">
          {credentials.length > 0 ? (
            credentials.map((credential) => (
              <CredentialItem
                key={credential.id}
                credential={credential}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
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
