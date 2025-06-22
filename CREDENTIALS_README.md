# Credentials Manager

A secure credentials management system built with Next.js, Drizzle ORM, and AES-256-GCM encryption.

## Features

- ✅ **Add Credentials**: Store service credentials securely
- ✅ **View Credentials**: Display stored credentials with show/hide functionality
- ✅ **Edit Credentials**: Update existing credentials
- ✅ **Delete Credentials**: Remove credentials with confirmation
- ✅ **Copy to Clipboard**: Quick copy functionality for secrets
- ✅ **AES-256-GCM Encryption**: Military-grade encryption for all secrets
- ✅ **Responsive UI**: Modern, clean interface that works on all devices

## Security

All secrets are encrypted using AES-256-GCM before being stored in the database. The encryption includes:

- **256-bit encryption key** stored in environment variables
- **Initialization Vector (IV)** for each encryption
- **Authentication Tag** to ensure data integrity
- **Unique encryption** for each secret

## Usage

1. Navigate to `/credentials` in your application
2. Add new credentials using the form at the top
3. View, edit, or delete existing credentials using the action buttons
4. Use the show/hide toggle to reveal secrets when needed
5. Copy secrets to clipboard with the copy button

## Database Schema

The credentials are stored using the following schema:

```sql
CREATE TABLE credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  service_name TEXT,
  encrypted_secret TEXT,
  iv TEXT,
  auth_tag TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Environment Variables

Make sure to set the following environment variable:

```bash
MASTER_ENCRYPTION_KEY=your_64_character_hex_string_here
```

The key must be exactly 64 characters (32 bytes in hex format).

## Files Created

- `src/actions/credentials.ts` - Server actions for CRUD operations
- `src/app/credentials/page.tsx` - Main credentials page (simple version)
- `src/components/CredentialItem.tsx` - Individual credential display component
- `src/components/EditCredentialForm.tsx` - Edit form component
- `src/app/credentials/CredentialsClient.tsx` - Client-side logic component
- `src/app/credentials/enhanced-page.tsx` - Enhanced version with edit functionality

## Current Configuration

- **Hardcoded User ID**: `79017909-9811-4af0-976a-88ef0a9a47df` (as requested)
- **Navigation**: Added to main layout for easy access

## Next Steps

- Implement proper authentication system
- Add user-specific credential management
- Add credential categories/tags
- Implement credential sharing between users
- Add audit logging for credential access
