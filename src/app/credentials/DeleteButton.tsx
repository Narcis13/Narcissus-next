"use client";

import { deleteCredential } from "../../actions/credentials";

interface DeleteButtonProps {
  credentialId: string;
  serviceName: string | null;
}

export function DeleteButton({ credentialId, serviceName }: DeleteButtonProps) {
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
