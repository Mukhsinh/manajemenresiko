# Aplikasi Manajemen Risiko

Aplikasi web untuk manajemen risiko terpadu dengan Supabase backend.

## Features

- Authentication & Authorization
- Risk Management Dashboard
- Master Data Management
- Reporting & Analytics
- Real-time Chat
- Responsive Design

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ManajemenResikoProject
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment file:
   ```bash
   cp env.example .env
   ```

4. Configure environment variables in `.env`:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   PORT=3000
   NODE_ENV=development
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

6. Open browser at `http://localhost:3000`

## Project Structure

```
├── public/              # Static files (HTML, CSS, JS)
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript files
│   │   ├── services/   # Service layer (auth, API)
│   │   └── ...
│   └── index.html      # Main HTML file
├── routes/             # API route handlers
├── middleware/         # Express middleware
├── config/             # Configuration files
├── utils/              # Utility functions
├── server.js           # Express server
└── vercel.json         # Vercel configuration
```

## Environment Variables

See `env.example` for all available environment variables.

### Required

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

### Optional

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `ALLOWED_ORIGINS` - CORS allowed origins
- `API_BASE_URL` - API base URL

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Set environment variables in Vercel dashboard

4. Deploy to production:
   ```bash
   vercel --prod
   ```

## Security

- All Supabase credentials are stored in environment variables
- Security headers enabled (CSP, HSTS, X-Frame-Options)
- Input validation on all endpoints
- Authentication middleware for protected routes
- CORS configuration

## Development

### Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

### Code Structure

- **Services**: Business logic layer (`public/js/services/`)
- **Routes**: API endpoints (`routes/`)
- **Middleware**: Request processing (`middleware/`)
- **Utils**: Shared utilities (`utils/`)

## License

ISC

## Support

For issues or questions, please check the documentation or create an issue.
