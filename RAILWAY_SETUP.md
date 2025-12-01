# Railway Deployment Guide

## 📋 Prerequisites

- Railway account (https://railway.app)
- GitHub repository: https://github.com/schiang418/cyclescope-daily-pulse
- Gemini API key

## 🚀 Step-by-Step Setup

### Step 1: Create New Railway Project

1. Go to https://railway.app/dashboard
2. Click "**New Project**"
3. Select "**Deploy from GitHub repo**"
4. Choose "**schiang418/cyclescope-daily-pulse**"
5. Click "**Deploy Now**"

### Step 2: Add PostgreSQL Database

1. In your project dashboard, click "**+ New**"
2. Select "**Database**"
3. Choose "**PostgreSQL**"
4. Railway will automatically create the database and set `DATABASE_URL` environment variable

### Step 3: Configure Environment Variables

Go to your service → **Variables** tab and add:

| Variable | Value | Notes |
|----------|-------|-------|
| `PORT` | `3001` | Server port |
| `NODE_ENV` | `production` | Environment |
| `GEMINI_API_KEY` | `<your_gemini_api_key>` | Get from Google AI Studio |
| `API_SECRET_KEY` | `<random_secret_key>` | Generate a random string |
| `ALLOWED_ORIGINS` | `https://cyclescope-portal.com` | CORS origins |
| `PUBLIC_URL` | `https://<your-railway-domain>.railway.app` | Will be auto-generated |
| `RAILWAY_VOLUME_MOUNT_PATH` | `/data` | For audio storage |

**Note**: `DATABASE_URL` is automatically set by the PostgreSQL service.

### Step 4: Add Railway Volume (for Audio Storage)

1. In your service settings, go to "**Volumes**"
2. Click "**+ New Volume**"
3. Set mount path: `/data`
4. Click "**Add**"

### Step 5: Configure Build & Start Commands

Railway should auto-detect these from `package.json`, but verify:

- **Build Command**: (leave empty, no build needed)
- **Start Command**: `npm start`

### Step 6: Deploy

1. Railway will automatically deploy after you save environment variables
2. Wait for deployment to complete (2-3 minutes)
3. Check logs for any errors

### Step 7: Get Public URL

1. Go to your service → **Settings** tab
2. Scroll to "**Networking**"
3. Click "**Generate Domain**"
4. Copy the generated URL (e.g., `https://cyclescope-daily-pulse-production.up.railway.app`)
5. Update `PUBLIC_URL` environment variable with this URL
6. Redeploy if needed

### Step 8: Run Database Migration

After first deployment, run migration:

1. Go to your service → **Deployments** tab
2. Click on the latest deployment
3. Open "**View Logs**"
4. Verify server started successfully

**OR** run migration manually via Railway CLI:

```bash
railway login
railway link
railway run npm run migrate
```

### Step 9: Test Deployment

Test the health endpoint:

```bash
curl https://<your-railway-domain>.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-01T10:00:00.000Z",
  "environment": "production"
}
```

## 🔐 Environment Variables Reference

### Required Variables

```env
# Server
PORT=3001
NODE_ENV=production

# Database (auto-set by PostgreSQL service)
DATABASE_URL=postgresql://...

# Gemini API
GEMINI_API_KEY=<your_gemini_api_key>

# API Authentication
API_SECRET_KEY=<random_secret_key>

# CORS
ALLOWED_ORIGINS=https://cyclescope-portal.com

# Storage
PUBLIC_URL=https://<your-railway-domain>.railway.app
RAILWAY_VOLUME_MOUNT_PATH=/data
```

### Optional Variables (for S3 storage)

```env
USE_S3=true
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=<your_aws_key>
AWS_SECRET_ACCESS_KEY=<your_aws_secret>
S3_BUCKET_NAME=cyclescope-daily-pulse
```

## 📊 Monitoring

### View Logs

1. Go to your service
2. Click "**Deployments**" tab
3. Click on active deployment
4. Click "**View Logs**"

### Check Database

1. Go to PostgreSQL service
2. Click "**Data**" tab
3. View tables and data

### Metrics

1. Go to your service
2. Click "**Metrics**" tab
3. View CPU, Memory, Network usage

## 🔧 Troubleshooting

### Server Won't Start

**Check logs for errors**:
- Missing environment variables
- Database connection failed
- Port already in use

**Solution**: Verify all environment variables are set correctly

### Database Connection Error

**Error**: `ECONNREFUSED` or `Connection timeout`

**Solution**:
1. Verify PostgreSQL service is running
2. Check `DATABASE_URL` is set correctly
3. Ensure services are in the same Railway project

### Audio Files Not Accessible

**Error**: 404 when accessing audio URLs

**Solution**:
1. Verify Railway Volume is mounted at `/data`
2. Check `PUBLIC_URL` is set correctly
3. Ensure audio files are being saved to the volume

### CORS Errors

**Error**: `Access-Control-Allow-Origin` error in browser

**Solution**:
1. Add cyclescope-portal domain to `ALLOWED_ORIGINS`
2. Format: `https://cyclescope-portal.com` (no trailing slash)
3. Multiple origins: separate with commas

## 🚀 Continuous Deployment

Railway automatically deploys when you push to `main` branch:

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

Railway will:
1. Detect the push
2. Pull latest code
3. Install dependencies
4. Restart the server

## 📝 Post-Deployment Checklist

- [ ] Server is running (check health endpoint)
- [ ] Database is connected (check logs)
- [ ] Environment variables are set
- [ ] Railway Volume is mounted
- [ ] Public URL is generated
- [ ] CORS is configured
- [ ] API authentication works
- [ ] Database migration completed

## 🔗 Useful Links

- Railway Dashboard: https://railway.app/dashboard
- Railway Docs: https://docs.railway.app
- Project Repository: https://github.com/schiang418/cyclescope-daily-pulse
- Gemini API: https://ai.google.dev

## 💡 Tips

1. **Use Railway CLI** for easier debugging:
   ```bash
   npm install -g @railway/cli
   railway login
   railway link
   railway logs
   ```

2. **Set up GitHub Actions** for automated testing before deployment

3. **Monitor costs** in Railway dashboard (Billing tab)

4. **Use Railway's built-in metrics** to track performance

5. **Enable automatic deployments** for faster iteration

## 🆘 Support

If you encounter issues:
1. Check Railway logs first
2. Review environment variables
3. Test locally with same config
4. Contact Railway support: https://railway.app/help

---

**Last Updated**: December 1, 2025
