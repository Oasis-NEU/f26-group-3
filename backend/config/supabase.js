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

// Create the admin client for your backend
export const supabase = createClient(supabaseUrl, supabaseKey);

// Example: Fetch data from a table
export async function getUsers() {
  const { data, error } = await supabase.from('users').select('*');

  if (error) {
    throw new Error(`Error fetching users: ${error.message}`);
  }

  return data;
}
