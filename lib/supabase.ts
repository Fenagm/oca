import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Check if we have valid Supabase configuration
export const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  return url && 
         key && 
         url !== 'your_supabase_project_url' &&
         key !== 'your_supabase_anon_key' &&
         url.startsWith('https://') &&
         (url.includes('supabase.co') || url.includes('localhost'))
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
