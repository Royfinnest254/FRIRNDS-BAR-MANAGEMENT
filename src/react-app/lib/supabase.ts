import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// These should be set in your .env file
// VITE_SUPABASE_URL=your-project-url
// VITE_SUPABASE_ANON_KEY=your-anon-key

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gqqpxjguxdlyaomfablk.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxcXB4amd1eGRseWFvbWZhYmxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NDc3MzksImV4cCI6MjA4MjEyMzczOX0.hYYKsA99qMf0C73rewhpRBrknDEkqBixNJLEQKzkCW8';

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

if (!isSupabaseConfigured) {
    console.error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient<Database>(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);
