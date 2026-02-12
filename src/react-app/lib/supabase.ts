import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// These should be set in your .env file
// VITE_SUPABASE_URL=your-project-url
// VITE_SUPABASE_ANON_KEY=your-anon-key

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bgpqaxzdjocjegwimiyd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJncHFheHpkam9jamVnd2ltaXlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4OTAyNDIsImV4cCI6MjA4NjQ2NjI0Mn0.6K6saZvZrxyHPtfWFvtw-UNtpw6LGvX_fENYddqiAMY';

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

if (!isSupabaseConfigured) {
    console.error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient<Database>(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);
