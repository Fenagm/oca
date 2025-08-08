import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Check if we have valid Supabase configuration
export const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  return url && 
         key && 
         url !== 'your_https://pgcwpixpokikajpoqpzm.supabase.co' &&
         key !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnY3dwaXhwb2tpa2FqcG9xcHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NTU2ODUsImV4cCI6MjA3MDIzMTY4NX0.RG20ih9Bz5d4US9h0Da691E3lpkON5iSC0BrINJRURI' &&
         url.includes('supabase.co')
}

// Lazy initialization of Supabase client
let supabaseClient: SupabaseClient | null = null

export const getSupabase = () => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured')
  }
  
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  
  return supabaseClient
}

// Export a safe supabase object that won't crash on initialization
export const supabase = {
  from: (table: string) => {
    if (!isSupabaseConfigured()) {
      return {
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) }) }),
        insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) }) }),
        update: () => ({ eq: () => Promise.resolve({ error: new Error('Supabase not configured') }) }),
        delete: () => ({ eq: () => Promise.resolve({ error: new Error('Supabase not configured') }) })
      }
    }
    return getSupabase().from(table)
  },
  channel: (name: string) => {
    if (!isSupabaseConfigured()) {
      return {
        on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) })
      }
    }
    return getSupabase().channel(name)
  }
}
