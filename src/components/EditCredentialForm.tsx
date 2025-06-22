"use client";

import { useState } from "react";
import { updateCredential } from "@/actions/credentials";

interface EditCredentialFormProps {
  credential: {
    id: string;
    serviceName: string | null;
    decryptedSecret: string;
  };
  onCancel: () => void;
}

export default function EditCredentialForm({ credential, onCancel }: EditCredentialFormProps) {
  const [serviceName, setServiceName] = useState(credential.serviceName || "");
  const [secret, setSecret] = useState(credential.decryptedSecret);

  const handleSubmit = async (formData: FormData) => {
    await updateCredential(formData);
    onCancel(); // Close the edit form after submission
  };

  return (
    <form action={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-gray-100 dark:bg-gray-700">
      <h4 className="text-lg font-semibold">Edit Credential</h4>
      
      <input type="hidden" name="id" value={credential.id} />
      
      <div>
        <label className="block text-sm font-medium mb-1">Service Name:</label>
        <input
          type="text"
          name="serviceName"
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
          required
          className="w-full p-2 border rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Secret:</label>
        <input
          type="password"
          name="secret"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          required
          className="w-full p-2 border rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="flex gap-2">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Update
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
