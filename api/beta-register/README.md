# Beta Registration API Endpoint

This serverless function handles private beta user registration.

## Endpoint

`POST /api/beta-register`

## Request Body

```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe",
  "company": "Architecture Firm",
  "role": "architect",
  "additional_metadata": {
    "source": "invitation",
    "notes": "Beta tester"
  }
}
```

### Required Fields
- `email` - User's email address
- `password` - User's password (min 6 characters)

### Optional Fields
- `name` - User's full name
- `company` - Company name
- `role` - User's role
- `additional_metadata` - JSON object for extra data

## Response

### Success (201)
```json
{
  "ok": true,
  "user_id": "uuid-here",
  "message": "Beta registration successful"
}
```

### Error (400/500)
```json
{
  "error": "error message",
  "details": {}
}
```

## What It Does

1. Creates a new user account in Supabase Auth
2. Automatically confirms the email
3. Inserts a record into `beta_registrations` table
4. Links the user account to the beta registration

## Environment Variables Required

Set these in **Vercel Dashboard** → **Settings** → **Environment Variables**:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (has admin privileges)

⚠️ **Important**: The service role key has full access to your Supabase project. Keep it secure!

## Security Notes

- Uses Supabase Admin API to create users
- Automatically confirms email (no email verification needed)
- Validates email format and password length
- Rolls back user creation if beta registration insert fails

