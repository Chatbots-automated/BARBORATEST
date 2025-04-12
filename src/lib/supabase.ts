import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://erwncswwpsmxzbocihgc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyd25jc3d3cHNteHpib2NpaGdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyNjQ1MzUsImV4cCI6MjA1OTg0MDUzNX0.Px4DCxQLhAYSIfbXkWp17vN9f1H250Dxy0VDQy5ME4A';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);