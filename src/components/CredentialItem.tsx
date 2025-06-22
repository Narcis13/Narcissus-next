"use client";

import { useState } from "react";

interface Credential {
  id: string;
  serviceName: string | null;
  decryptedSecret: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface CredentialItemProps {
  credential: Credential;
  onDelete: (id: string) => void;
  onEdit: (credential: Credential) => void;
}

export default function CredentialItem({ credential, onDelete, onEdit }: CredentialItemProps) {
  const [showSecret, setShowSecret] = useState(false);

  const handleDeleteClick = () => {
    if (confirm(`Are you sure you want to delete the credential for "${credential.serviceName}"?`)) {
      onDelete(credential.id);
    }
  };

  const maskSecret = (secret: string) => {
    if (secret.length <= 8) {
      return "•".repeat(secret.length);
    }
    return secret.slice(0, 4) + "•".repeat(secret.length - 8) + secret.slice(-4);
  };

  return (
    <div className="p-6 border rounded-lg shadow-sm bg-gray-50 dark:bg-gray-800">
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
              <div className="mt-1 flex items-center gap-2">
                <div className="flex-1 p-2 bg-gray-100 dark:bg-gray-700 rounded border font-mono text-sm break-all">
                  {showSecret ? credential.decryptedSecret : maskSecret(credential.decryptedSecret)}
                </div>
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded transition-colors"
                >
                  {showSecret ? "Hide" : "Show"}
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(credential.decryptedSecret)}
                  className="px-3 py-1 text-sm bg-blue-200 dark:bg-blue-600 hover:bg-blue-300 dark:hover:bg-blue-500 rounded transition-colors"
                >
                  Copy
                </button>
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
        
        {/* Action buttons */}
        <div className="ml-4 flex gap-2">
          <button
            onClick={() => onEdit(credential)}
            className="bg-yellow-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={handleDeleteClick}
            className="bg-red-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
