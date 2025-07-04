# Recipe Hub - Restoration Instructions

## Quick Start from Checkpoint

### 1. Environment Setup
```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 2. Configure Environment Variables
Edit `.env` file with your credentials:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

### 3. Supabase Setup
1. Create a new Supabase project at https://supabase.com
2. Go to Settings > API to get your URL and anon key
3. Run all migrations in `supabase/migrations/` in chronological order
4. Enable Row Level Security (RLS) on all tables
5. Set up Storage bucket named `recipe-images` with public access

### 4. OpenAI Setup (Optional)
1. Get API key from https://platform.openai.com
2. Add to environment variables
3. AI features will auto-enable when key is present

### 5. Start Development
```bash
npm run dev
```

### 6. Verify Installation
- ✅ App loads at http://localhost:5173
- ✅ Sign up/sign in works
- ✅ Can create recipes
- ✅ AI descriptions generate (if OpenAI configured)
- ✅ Search and filtering work
- ✅ Voice commands work in cooking mode

## Backup Information
- **Primary Backup**: `backups/checkpoint-[TIMESTAMP]/`
- **Secondary Backup**: `backups/checkpoint-[TIMESTAMP]-backup2/`
- **Created**: $(date)

## Troubleshooting

### Common Issues
1. **Supabase Connection**: Check URL and keys in .env
2. **AI Not Working**: Verify OpenAI API key and credits
3. **Voice Commands**: Ensure HTTPS or localhost for Web Speech API
4. **Images Not Loading**: Check Supabase Storage bucket setup

### Database Issues
- Run migrations in order from `supabase/migrations/`
- Check RLS policies are enabled
- Verify sample data was created

### Performance
- Images are optimized with fallbacks to Pexels
- Search history improves recommendations over time
- Voice features require modern browser support

## Support
Check the README.md for detailed documentation and feature descriptions.