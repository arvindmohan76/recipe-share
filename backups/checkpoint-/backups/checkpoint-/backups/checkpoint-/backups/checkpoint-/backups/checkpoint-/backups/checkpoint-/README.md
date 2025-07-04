# RecipeHub - Advanced Recipe Management Application

A comprehensive recipe management application built with React, Supabase, and PrimeReact, featuring AI-powered recommendations, voice commands, and smart meal planning.

## Features

### Core Features
- **Recipe Management**: Create, edit, and browse recipes with detailed ingredients and step-by-step instructions
- **Advanced Search & Filtering**: Search by keywords, ingredients, cuisine, dietary preferences, cooking time, and difficulty
- **User Authentication**: Secure sign-up and login with Supabase Auth
- **Recipe Ratings & Comments**: Community-driven recipe reviews and discussions
- **Save Recipes**: Personal recipe collection with bookmark functionality

### Advanced Features
- **Voice Commands**: Hands-free cooking mode with speech recognition
- **AI Cooking Tips**: Smart suggestions and tips for each cooking step
- **Meal Planning**: Drag-and-drop weekly meal planner (coming soon)
- **Shopping Lists**: Auto-generated shopping lists from recipes (coming soon)
- **Social Features**: Follow users and discover trending recipes
- **Personalized Recommendations**: AI-driven recipe suggestions based on preferences

### Technical Features
- **Real-time Updates**: Live comments and ratings using Supabase subscriptions
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Modern UI**: PrimeReact components with custom styling
- **Database**: PostgreSQL with Row Level Security (RLS)
- **File Storage**: Supabase Storage for recipe images
- **Voice Recognition**: Web Speech API integration
- **AI-Powered Content**: OpenAI integration for recipe summaries and cooking tips

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Components**: PrimeReact, PrimeIcons
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Routing**: React Router DOM
- **Voice**: Web Speech API
- **Build Tool**: Vite
- **AI**: OpenAI GPT-4 for content generation

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_OPENAI_API_KEY=your_openai_api_key
   ```

4. Set up Supabase:
   - Create a new Supabase project
   - Run the SQL migration in `supabase/migrations/create_initial_schema.sql`
   - Enable Row Level Security and set up the provided policies

5. Start the development server:
   ```bash
   npm run dev
   ```

## Database Schema

The application uses the following main tables:
- `users` - User profiles and authentication
- `recipes` - Recipe data with ingredients and instructions
- `user_preferences` - User dietary preferences and settings
- `recipe_ratings` - User ratings for recipes
- `recipe_comments` - Comments on recipes
- `saved_recipes` - User's bookmarked recipes
- `recipe_collections` - User-created recipe collections
- `shopping_lists` - Generated shopping lists
- `user_follows` - User following relationships

## Voice Commands

When in cooking mode, the following voice commands are available:
- "Next step" - Move to the next cooking step
- "Previous step" - Go back to previous step
- "Read ingredients" - Read out the ingredients list
- "Start cooking" - Enter cooking mode
- "Stop cooking" - Exit cooking mode

## AI Features

The application includes AI-powered features using OpenAI:
- **Recipe Summaries**: Mouth-watering, sensory-rich descriptions that make recipes irresistible
- **Cooking Tips**: Expert advice and techniques for better cooking results
- **Ingredient Substitutions**: Smart alternatives for dietary restrictions and availability

To enable AI features, add your OpenAI API key to the environment variables:
```
VITE_OPENAI_API_KEY=your_openai_api_key
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue on GitHub or contact the development team.