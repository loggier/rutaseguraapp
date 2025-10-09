-- Add avatar_url column to the estudiantes table if it doesn't exist.
ALTER TABLE IF EXISTS rutasegura.estudiantes
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add a comment to the new column for clarity.
COMMENT ON COLUMN rutasegura.estudiantes.avatar_url IS 'URL to the student''s profile picture or avatar.';
