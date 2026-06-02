# Vercel Deployment Checklist

## Pre-Deployment ✓

- [ ] All code is committed to GitHub
- [ ] No sensitive data in version control (.gitignore is updated)
- [ ] Local build works: `npm run build`
- [ ] No TypeScript errors: `npm run build`
- [ ] Tests pass (if applicable)

## MongoDB Setup ✓

- [ ] Created MongoDB Atlas account
- [ ] Created a production cluster
- [ ] Created database user with strong password
- [ ] Copied connection string: `mongodb+srv://...`
- [ ] Added Vercel IP to IP whitelist (or allowed 0.0.0.0/0 for development)
- [ ] Tested connection locally

## Vercel Project Setup ✓

- [ ] Created/logged into Vercel account
- [ ] Authorized GitHub access to Vercel
- [ ] Connected your repository to Vercel

## Environment Variables ✓

Set these in Vercel Dashboard → Settings → Environment Variables:

- [ ] `MONGODB_URI` = your connection string
- [ ] `JWT_SECRET` = generated secure random string
- [ ] `JWT_REFRESH_SECRET` = generated secure random string
- [ ] `CLIENT_URL` = https://your-project.vercel.app
- [ ] `NODE_ENV` = production
- [ ] `JWT_EXPIRES_IN` = 15m
- [ ] `JWT_REFRESH_EXPIRES_IN` = 7d

## Files Created in Your Project ✓

- [x] `vercel.json` - Deployment configuration
- [x] `.vercelignore` - Files to ignore during deployment
- [x] `api/index.ts` - Serverless API handler
- [x] `api/tsconfig.json` - TypeScript config for API
- [x] `api/package.json` - API metadata
- [x] `.env.example` - Root environment template
- [x] `server/.env.example` - Server environment template
- [x] `client/.env.example` - Client environment template
- [x] `DEPLOYMENT.md` - Full deployment guide
- [x] `VERCEL_ENV_REFERENCE.md` - Quick environment reference

## Deploy Steps ✓

1. [ ] Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. [ ] Click "Add New..." → "Project"
3. [ ] Select your GitHub repository
4. [ ] Leave Framework Preset as "Other"
5. [ ] Add environment variables (listed above)
6. [ ] Click "Deploy"
7. [ ] Wait for build to complete (5-10 minutes typically)

## Post-Deployment ✓

- [ ] Visit your deployed URL: https://your-project.vercel.app
- [ ] Check Deployments tab for build status
- [ ] Review logs if build failed
- [ ] Test login/authentication
- [ ] Test API endpoints (open browser console to verify no CORS errors)
- [ ] Verify database connection (create a test question/answer)

## Troubleshooting ✓

If deployment fails:

1. Check build logs in Vercel Deployments tab
2. Common issues:
   - `MONGODB_URI=undefined` → Add environment variable in Vercel
   - `Module not found` → Check all dependencies in package.json files
   - `Cannot find module 'express'` → Run `npm run install:all` locally and commit node_modules
   - `CORS error in browser` → Ensure CLIENT_URL matches your Vercel domain

## Local Testing Before Deployment ✓

```bash
# Test build locally
npm run install:all
npm run build

# Test with production environment variables
export MONGODB_URI=mongodb+srv://...
export JWT_SECRET=your_secret
npm start
```

## Environment Variable Generation ✓

Generate secure JWT secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run this twice to get both `JWT_SECRET` and `JWT_REFRESH_SECRET`

## Continuous Deployment ✓

After initial deployment:
- Push to main branch → Automatic deployment
- Create PR → Preview deployment
- Merge PR → Production deployment

## Team Access (Optional) ✓

- [ ] Invite team members to Vercel project
- [ ] Share environment variables securely
- [ ] Set deployment permissions

## Monitoring ✓

- [ ] Enable Vercel Analytics (optional)
- [ ] Monitor build times
- [ ] Check error logs regularly
- [ ] Set up alerts (optional)

## Rollback (if needed) ✓

In Vercel Deployments tab:
1. Find previous stable deployment
2. Click "..." menu
3. Select "Promote to Production"

---

**Need Help?**
- 📖 Full Guide: See `DEPLOYMENT.md`
- 🔑 Environment Reference: See `VERCEL_ENV_REFERENCE.md`
- 🌐 Vercel Docs: https://vercel.com/docs
- 💾 MongoDB Docs: https://docs.mongodb.com
