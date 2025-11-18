# Deployment Guide - Vercel

## Prerequisites

1. Vercel account (sign up at https://vercel.com)
2. Supabase project with credentials
3. Git repository (GitHub, GitLab, or Bitbucket)

## Environment Variables

Set the following environment variables in Vercel dashboard:

1. Go to your project settings in Vercel
2. Navigate to "Environment Variables"
3. Add the following variables:

### Required Variables

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key (public)
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (secret)

### Optional Variables

- `NODE_ENV` - Set to `production` (default)
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins
- `API_BASE_URL` - Your API base URL (auto-detected if not set)

## Deployment Steps

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. For production deployment:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via GitHub Integration

1. Push your code to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Configure environment variables
5. Deploy

## Project Structure

The application is structured to work with Vercel's serverless functions:

- `server.js` - Main Express server (converted to serverless function)
- `routes/` - API route handlers
- `public/` - Static files (HTML, CSS, JS)
- `vercel.json` - Vercel configuration

## Configuration

### Vercel Configuration (`vercel.json`)

The `vercel.json` file configures:
- Routing for API endpoints (`/api/*`)
- Static file serving from `public/` directory
- SPA fallback routing
- Function timeout settings

### Security

The application includes:
- Security headers (CSP, HSTS, X-Frame-Options, etc.)
- CORS configuration
- Input validation
- Error handling

## Post-Deployment

After deployment:

1. Verify environment variables are set correctly
2. Test authentication flow
3. Check API endpoints are working
4. Verify static files are served correctly

## Troubleshooting

### Common Issues

1. **Environment Variables Not Set**
   - Check Vercel dashboard > Settings > Environment Variables
   - Redeploy after adding variables

2. **CORS Errors**
   - Set `ALLOWED_ORIGINS` environment variable
   - Check CORS configuration in `server.js`

3. **Supabase Connection Issues**
   - Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
   - Check Supabase project is active

4. **Function Timeout**
   - Default timeout is 30 seconds
   - Adjust in `vercel.json` if needed

## Local Development

For local development:

1. Copy `.env.example` to `.env`
2. Fill in your Supabase credentials
3. Run `npm run dev`
4. Access at `http://localhost:3000`

## Production Checklist

- [ ] Environment variables configured
- [ ] Supabase credentials verified
- [ ] CORS origins configured
- [ ] Security headers enabled
- [ ] Error handling tested
- [ ] Authentication flow tested
- [ ] Static files loading correctly
- [ ] API endpoints responding

## Support

For issues or questions:
1. Check Vercel logs in dashboard
2. Review application logs
3. Verify environment variables
4. Test locally first

