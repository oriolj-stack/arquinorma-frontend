# Beta Registration API Setup Guide

## Overview

The beta registration API endpoint allows you to create user accounts for private beta testers. It automatically:
- Creates a Supabase Auth user account
- Confirms the email (no verification needed)
- Records the registration in the `beta_registrations` table
- Links the user to their beta registration

## API Endpoint

**URL:** `https://arquinorma.cat/api/beta-register`  
**Method:** `POST`  
**Content-Type:** `application/json`

## Setup Steps

### 1. Run the Database Migration

First, run the migration in Supabase SQL Editor:
- File: `backend/migrations/019_create_beta_registrations.sql`
- This creates the `beta_registrations` table

### 2. Set Environment Variables in Vercel

Go to **Vercel Dashboard** → **arquinorma-frontend** → **Settings** → **Environment Variables**

Add these variables for **Production** (and Preview if needed):

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `SUPABASE_URL` | `https://lccqawffpdceqftpggpv.supabase.co` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `your-service-role-key` | Supabase service role key (admin access) |

⚠️ **Security Warning**: The service role key has full admin access. Never expose it in client-side code!

### 3. Install Dependencies

The API route requires `@vercel/node` for TypeScript types. Install it:

```bash
cd frontend
npm install --save-dev @vercel/node
```

Or it will be installed automatically when you push to GitHub and Vercel builds.

### 4. Deploy

After setting environment variables:
1. Push code to GitHub
2. Vercel will automatically deploy
3. The API endpoint will be available at `/api/beta-register`

## Testing the Endpoint

### Using curl

```bash
curl -X POST https://arquinorma.cat/api/beta-register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "name": "Test User",
    "company": "Test Company",
    "role": "architect"
  }'
```

### Using JavaScript

```javascript
const response = await fetch('https://arquinorma.cat/api/beta-register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'testpassword123',
    name: 'Test User',
    company: 'Test Company',
    role: 'architect'
  })
});

const data = await response.json();
console.log(data);
```

## Response Examples

### Success
```json
{
  "ok": true,
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "message": "Beta registration successful"
}
```

### Error - Missing Fields
```json
{
  "error": "email and password required"
}
```

### Error - Invalid Email
```json
{
  "error": "Invalid email format"
}
```

### Error - Weak Password
```json
{
  "error": "Password must be at least 6 characters"
}
```

## Integration with Frontend

You can create a beta registration form that calls this endpoint. Example:

```javascript
const handleBetaRegister = async (formData) => {
  try {
    const response = await fetch('/api/beta-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Registration successful
      // User can now log in with the credentials
      alert('Registre completat! Ara podeu iniciar sessió.');
    } else {
      // Handle error
      alert(`Error: ${data.error}`);
    }
  } catch (error) {
    console.error('Registration error:', error);
  }
};
```

## Security Considerations

1. **Service Role Key**: Keep it secure, never expose in client code
2. **Password Validation**: Currently minimum 6 characters (consider strengthening)
3. **Email Validation**: Basic format validation (consider additional checks)
4. **Rate Limiting**: Consider adding rate limiting to prevent abuse
5. **CORS**: Currently allows all origins - consider restricting for production

## Troubleshooting

### "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
- Check that environment variables are set in Vercel
- Ensure they're set for the correct environment (Production/Preview)
- Redeploy after adding variables

### "Failed to create user"
- Check Supabase Auth settings
- Verify service role key is correct
- Check Supabase logs for details

### "Failed to register beta access"
- Verify `beta_registrations` table exists
- Check RLS policies (may need to allow service role)
- Verify table schema matches migration

## Next Steps

- Create a beta registration form in the frontend
- Add email notifications when beta access is granted
- Implement beta access checking in protected routes
- Add admin dashboard to manage beta registrations

