import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create the admin client for your backend
const supabase = createClient(supabaseUrl, supabaseKey);

// Example: Fetch data from a table
async function getUsers() {
  console.log("Connecting to Supabase...");
  const { data, error } = await supabase.from('users').select('*');

  if (error) {
    console.error("Error fetching data:", error.message);
    return;
  }

  console.log("Success! Data received:", data);
  return data;
}

// Call the function immediately to run the test
getUsers();