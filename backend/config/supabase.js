import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

// Admin client for the backend. It bypasses row-level security, so every
// query must filter to the logged-in student itself.
export const supabase = createClient(supabaseUrl, supabaseKey);

// A fresh client for each auth call. Never reuse one shared client for
// logging users in: it would hold one student's session and could
// accidentally use it for another student's request.
export function createAuthClient() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}