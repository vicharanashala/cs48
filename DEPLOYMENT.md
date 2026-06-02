# Vercel Deployment Guide

This guide explains how to deploy your WiseFlow FAQ Platform on Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **MongoDB Atlas Account**: Set up at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
4. **Environment Variables**: Prepare all required `.env` variables

## Step 1: Prepare Your Repository

1. Ensure your code is committed and pushed to GitHub
2. Update environment variable templates:
   - Root: `.env.example`
   - Server: `server/.env.example`
   - Client: `client/.env.example`

## Step 2: Set Up MongoDB Atlas

1. Create a free MongoDB Atlas cluster at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create a database user with a strong password
3. Get your connection string (will look like: `mongodb+srv://user:password@cluster.mongodb.net/database`)
4. Whitelist Vercel's IP addresses (or allow all IPs for development)

## Step 3: Deploy on Vercel

### Option A: Using Vercel Dashboard (Recommended)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Select your GitHub repository
4. Configure project settings:
   - **Framework Preset**: Other
   - **Root Directory**: Leave as default
   - **Build Command**: `npm run install:all && npm run build && cd server && npm run build`
   - **Output Directory**: `client/dist`
   - **Install Command**: `npm install`

5. Add Environment Variables (click "Environment Variables"):
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Generate a secure random string
   - `JWT_REFRESH_SECRET`: Generate a secure random string
   - `CLIENT_URL`: Your Vercel domain (e.g., `https://your-project.vercel.app`)
   - `NODE_ENV`: `production`

6. Click "Deploy"

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to your project root
cd path/to/your/project

# Deploy
vercel

# Follow the prompts:
# - Link to your Vercel project
# - Set environment variables when prompted
```

## Step 4: Configure Environment Variables in Vercel

After initial deployment, configure environment variables:

1. Go to your project settings in Vercel
2. Navigate to "Settings" → "Environment Variables"
3. Add the following:

### Production Environment
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/wiseflow
JWT_SECRET=your_secure_jwt_secret_key
JWT_REFRESH_SECRET=your_secure_refresh_secret_key
CLIENT_URL=https://your-project.vercel.app
NODE_ENV=production
```

### Preview & Development
```
Same as production or use test database
```

## Step 5: First Deployment Checks

After deployment:

1. **Check Vercel Logs**: 
   - Go to "Deployments" tab
   - Click latest deployment
   - Check build logs for errors

2. **Test the Application**:
   - Visit your Vercel domain
   - Try signing up
   - Test API calls to ensure backend connection works

3. **Common Issues**:
   - **CORS errors**: Ensure `CLIENT_URL` in environment matches your Vercel domain
   - **MongoDB connection failed**: Check connection string and IP whitelist
   - **Build failures**: Check server/dist directory exists and TypeScript compiles

## Step 6: Configure Database Seeding (Optional)

To seed your database after deployment:

1. In your local environment, run:
```bash
MONGODB_URI=your_production_mongodb_uri npm run seed:all
```

Or run it in Vercel's built-in shell through the dashboard.

## Continuous Deployment

Your project is now set up for continuous deployment:

1. Every push to your main/default branch will automatically trigger a new deployment
2. Pull requests will generate preview deployments
3. You can see all deployments in the "Deployments" tab

## Performance Optimization Tips

1. **Enable Caching**: Vercel automatically caches static files
2. **API Response Caching**: Consider adding caching headers in your API
3. **Image Optimization**: Optimize images in your client app
4. **Monitor Performance**: Use Vercel's Analytics dashboard

## Troubleshooting

### Build Fails
- Check `npm run build` works locally: `npm run install:all && npm run build && cd server && npm run build`
- Ensure all dependencies are listed in package.json files

### API Not Working
- Verify `MONGODB_URI` is correct
- Check `CLIENT_URL` matches your Vercel domain
- Review server logs in Vercel dashboard

### CORS Issues
- Ensure `CLIENT_URL` environment variable is set to your Vercel domain
- API should allow requests from the CLIENT_URL

### Database Connection Timeout
- Add Vercel IPs to MongoDB Atlas IP Whitelist or allow all (0.0.0.0/0)
- Check MongoDB Atlas cluster status

## Local Testing Before Deployment

Test your build locally:

```bash
# Install dependencies
npm run install:all

# Build client and server
npm run build
cd server
npm run build

# Test server locally
npm start
```

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Setup](https://docs.atlas.mongodb.com/getting-started/)
- [Express Deployment Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)

## Support

For issues:
1. Check Vercel documentation
2. Review deployment logs in Vercel dashboard
3. Test locally to isolate issues
4. Check MongoDB Atlas connection status
