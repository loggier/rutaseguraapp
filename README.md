# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Database Setup

### Push Notification Tokens Table

To enable push notifications via Firebase Cloud Messaging, you need to create a table in your Supabase database to store user device tokens. This SQL script is designed to be safe to run multiple times.

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create the table only if it doesn't exist to prevent errors on re-run.
CREATE TABLE IF NOT EXISTS rutasegura.fcm_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES rutasegura.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- This function automatically updates the `updated_at` field on record change.
-- `CREATE OR REPLACE` ensures it can be run again without error.
CREATE OR REPLACE FUNCTION rutasegura.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- We drop the trigger first to ensure we can re-run the script without errors.
DROP TRIGGER IF EXISTS update_fcm_tokens_updated_at ON rutasegura.fcm_tokens;

-- This trigger executes the function when a row in `fcm_tokens` is updated.
CREATE TRIGGER update_fcm_tokens_updated_at
BEFORE UPDATE ON rutasegura.fcm_tokens
FOR EACH ROW
EXECUTE FUNCTION rutasegura.update_updated_at_column();
```
