import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gimwjkepnfcyxlnqgrep.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbXdqa2VwbmZjeXhsbnFncmVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxOTU5MTYsImV4cCI6MjA4OTc3MTkxNn0.orXiXKKm1VKzsPoC5enx8SOlls9hD96WzgDvAk-DMlc'

export const supabase = createClient(supabaseUrl, supabaseKey)
