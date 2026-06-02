# Vercel Deployment Quick Reference

## Required Environment Variables

Set these in Vercel dashboard → Settings → Environment Variables:

### MongoDB
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/wiseflow
```

### JWT Secrets (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
```
JWT_SECRET=<64-character-hex-string>
JWT_REFRESH_SECRET=<64-character-hex-string>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### Application URLs
```
CLIENT_URL=https://your-project.vercel.app
NODE_ENV=production
```

### Optional: File Storage
```
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

## Quick Deploy Steps

1. Push your code to GitHub
2. Connect repository to Vercel
3. Add environment variables above
4. Click Deploy
5. Monitor build in Deployments tab

## Build Process

Vercel automatically runs:
- Client build: `npm run build` (outputs to `client/dist`)
- API handler: TypeScript compilation of `api/index.ts`

## Important Notes

- API routes are at `/api/v1/*`
- Client requests should use `VITE_API_URL=https://your-project.vercel.app/api/v1`
- MongoDB IP whitelist must include Vercel IPs (or allow 0.0.0.0/0)
- Build logs available in Deployments tab
