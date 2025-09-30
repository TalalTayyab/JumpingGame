# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login with your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - Name: "Jumping Game Leaderboard"
   - Database Password: (choose a strong password)
   - Region: (choose closest to your users)
6. Click "Create new project"

## 2. Create Database Table

Once your project is ready, go to the SQL Editor and run this query:

```sql
-- Create the scores table
CREATE TABLE scores (
  id SERIAL PRIMARY KEY,
  player_name VARCHAR(50) NOT NULL,
  score INTEGER NOT NULL,
  game_time INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast leaderboard queries
CREATE INDEX idx_scores_leaderboard ON scores(score DESC, created_at DESC);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read scores
CREATE POLICY "Allow public read access" ON scores
  FOR SELECT USING (true);

-- Create policy to allow anyone to insert scores
CREATE POLICY "Allow public insert access" ON scores
  FOR INSERT WITH CHECK (true);
```

## 3. Get API Keys

1. Go to Settings → API
2. Copy the following values:
   - Project URL
   - Anon (public) key

## 4. Update Environment Variables

Create a `.env.local` file in your project root:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 5. Update Supabase Configuration

Update `src/lib/supabase.ts`:

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
```

## 6. Test the Setup

1. Run your development server: `npm run dev`
2. Play the game and try to submit a score
3. Check the Supabase dashboard to see if the score was saved
4. Open the leaderboard to see if scores are displayed

## 7. Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add the environment variables in Vercel dashboard:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
4. Deploy!

## Security Notes

- The current setup allows anyone to read and write scores
- For production, consider adding:
  - Rate limiting
  - Input validation
  - Score verification
  - User authentication

## Troubleshooting

- Make sure environment variables are prefixed with `VITE_`
- Check browser console for any CORS errors
- Verify your Supabase project is active
- Ensure the table was created successfully
