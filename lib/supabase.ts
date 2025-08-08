import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Check if we have valid Supabase configuration
export const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // More thorough validation
  if (!url || !key) return false
  
  // Check for placeholder values
  if (url.includes('your_') || url.includes('placeholder') || 
      key.includes('your_') || key.includes('placeholder')) return false
  
  // Basic URL validation
  try {
    new URL(url)
  } catch {
    return false
  }
  
  // Check if it's a proper Supabase URL
  if (!url.includes('.supabase.co')) return false
  
  // Check if key looks like a JWT token
  if (key.length < 100 || !key.startsWith('eyJ')) return false
  
  return true
}

// Lazy initialization of Supabase client
let supabaseClient: SupabaseClient | null = null

export const getSupabase = () => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not properly configured')
  }
  
  if (!supabaseClient) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
    } catch (error) {
      console.error('Failed to create Supabase client:', error)
      throw new Error('Failed to initialize Supabase client')
    }
  }
  
  return supabaseClient
}

// Mock response structure
const createMockResponse = (errorMessage: string) => ({
  data: null,
  error: { 
    message: errorMessage, 
    code: 'SUPABASE_NOT_CONFIGURED',
    details: 'Please configure Supabase environment variables'
  }
})

// Mock query builder
const createMockQueryBuilder = (errorMessage: string) => ({
  select: (columns?: string) => ({
    eq: (column: string, value: any) => ({
      single: () => Promise.resolve(createMockResponse(errorMessage)),
      order: (column: string) => Promise.resolve(createMockResponse(errorMessage))
    }),
    order: (column: string) => Promise.resolve(createMockResponse(errorMessage))
  }),
  insert: (data: any) => ({
    select: (columns?: string) => ({
      single: () => Promise.resolve(createMockResponse(errorMessage))
    })
  }),
  update: (data: any) => ({
    eq: (column: string, value: any) => Promise.resolve(createMockResponse(errorMessage))
  }),
  delete: () => ({
    eq: (column: string, value: any) => Promise.resolve(createMockResponse(errorMessage))
  })
})

// Safe supabase wrapper
export const supabase = {
  from: (table: string) => {
    if (!isSupabaseConfigured()) {
      return createMockQueryBuilder('Supabase is not configured. Please set up your environment variables.')
    }
    
    try {
      return getSupabase().from(table)
    } catch (error) {
      console.error('Supabase client error:', error)
      return createMockQueryBuilder(`Supabase client error: ${error.message}`)
    }
  },
  
  channel: (name: string) => {
    if (!isSupabaseConfigured()) {
      return {
        on: () => ({
          subscribe: () => ({
            unsubscribe: () => {}
          })
        })
      }
    }
    
    try {
      return getSupabase().channel(name)
    } catch (error) {
      console.error('Supabase channel error:', error)
      return {
        on: () => ({
          subscribe: () => ({
            unsubscribe: () => {}
          })
        })
      }
    }
  }
}
