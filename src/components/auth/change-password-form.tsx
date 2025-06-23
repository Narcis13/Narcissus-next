"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { changePassword } from "@/lib/auth/profile-actions";
import { validatePassword } from "@/lib/auth/password";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const newPassword = watch("newPassword");

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const validation = validatePassword(e.target.value);
    setPasswordErrors(validation.errors);
  };

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await changePassword(data.currentPassword, data.newPassword);

      if (result.success) {
        setSuccess(true);
        reset();
      } else {
        setError(result.error || "Failed to change password");
      }
    } catch (error) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="text-sm text-green-800">Password changed successfully</div>
        </div>
      )}
      
      <div>
        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
          Current Password
        </label>
        <input
          {...register("currentPassword")}
          type="password"
          autoComplete="current-password"
          className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
          placeholder="Current password"
        />
        {errors.currentPassword && (
          <p className="mt-1 text-xs text-red-600">{errors.currentPassword.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
          New Password
        </label>
        <input
          {...register("newPassword", { onChange: handlePasswordChange })}
          type="password"
          autoComplete="new-password"
          className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
          placeholder="New password"
        />
        {errors.newPassword && (
          <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>
        )}
        {newPassword && passwordErrors.length > 0 && (
          <div className="mt-2 text-xs">
            <p className="font-medium text-gray-700">Password requirements:</p>
            <ul className="mt-1 space-y-1">
              <li className={newPassword.length >= 8 ? "text-green-600" : "text-red-600"}>
                ✓ At least 8 characters
              </li>
              <li className={/[A-Z]/.test(newPassword) ? "text-green-600" : "text-red-600"}>
                ✓ One uppercase letter
              </li>
              <li className={/[a-z]/.test(newPassword) ? "text-green-600" : "text-red-600"}>
                ✓ One lowercase letter
              </li>
              <li className={/\d/.test(newPassword) ? "text-green-600" : "text-red-600"}>
                ✓ One number
              </li>
              <li className={/[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? "text-green-600" : "text-red-600"}>
                ✓ One special character
              </li>
            </ul>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm New Password
        </label>
        <input
          {...register("confirmPassword")}
          type="password"
          autoComplete="new-password"
          className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
          placeholder="Confirm new password"
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Changing..." : "Change Password"}
      </button>
    </form>
  );
}