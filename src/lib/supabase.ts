import { createClient } from '@supabase/supabase-js'

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface LeaderboardEntry {
  id: number
  player_name: string
  score: number
  game_time: number
  created_at: string
}

export const saveScore = async (playerName: string, score: number, gameTime: number) => {
  try {
    const { data, error } = await supabase
      .from('scores')
      .insert([
        {
          player_name: playerName,
          score: score,
          game_time: gameTime,
          created_at: new Date().toISOString()
        }
      ])
      .select()

    if (error) {
      console.error('Error saving score:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Failed to save score:', error)
    throw error
  }
}

export const getLeaderboard = async (limit: number = 10) => {
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .order('score', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching leaderboard:', error)
      throw error
    }

    return data as LeaderboardEntry[]
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error)
    throw error
  }
}
