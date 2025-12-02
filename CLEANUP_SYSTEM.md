# Automatic Cleanup System

## Overview

The Daily Market Pulse newsletter system includes an automatic cleanup mechanism to manage storage efficiently and maintain optimal performance.

## Retention Policy

| Data Type | Retention Period | Storage Location | Size Impact |
|-----------|-----------------|------------------|-------------|
| **Audio Files** | 14 days (2 weeks) | `/data/audio/` | 238 MB |
| **Newsletter Text** | 365 days (1 year) | PostgreSQL Database | 1.78 MB |
| **Total Storage** | - | - | **239.78 MB (0.23 GB)** |

## Features

### 1. Automatic Cleanup (Cron Job)
- **Schedule**: Daily at 02:00 UTC
- **Tasks**:
  - Delete audio files older than 14 days
  - Delete newsletter records older than 365 days
- **Status**: Automatically starts with server

### 2. Manual Cleanup API
- **Endpoint**: `POST /api/cleanup/run`
- **Purpose**: Trigger cleanup manually for testing or immediate cleanup
- **Response**: Detailed cleanup results

### 3. Cleanup Statistics
- **Endpoint**: `GET /api/cleanup/stats`
- **Purpose**: View cleanup statistics without deleting anything
- **Returns**:
  - Total audio files and size
  - Files to be deleted
  - Total newsletter records
  - Records to be deleted

### 4. Scheduler Status
- **Endpoint**: `GET /api/cleanup/scheduler`
- **Purpose**: Check if scheduler is running and when next cleanup will occur
- **Returns**:
  - Running status
  - Schedule configuration
  - Next run time

## API Examples

### Get Cleanup Statistics
```bash
curl https://cyclescope-daily-pulse-production.up.railway.app/api/cleanup/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "audioFiles": {
      "total": 14,
      "toDelete": 2,
      "totalSizeMB": 238,
      "toDeleteSizeMB": 34
    },
    "newsletters": {
      "total": 90,
      "toDelete": 5
    },
    "cutoffDates": {
      "audio": "2025-11-17",
      "newsletter": "2024-12-01"
    }
  }
}
```

### Run Manual Cleanup
```bash
curl -X POST https://cyclescope-daily-pulse-production.up.railway.app/api/cleanup/run
```

**Response:**
```json
{
  "success": true,
  "message": "Cleanup completed successfully",
  "results": {
    "audioFilesDeleted": 2,
    "audioErrors": 0,
    "newslettersDeleted": 5,
    "databaseErrors": 0,
    "startTime": "2025-12-01T14:00:00.000Z",
    "endTime": "2025-12-01T14:00:01.234Z",
    "durationMs": 1234
  }
}
```

### Check Scheduler Status
```bash
curl https://cyclescope-daily-pulse-production.up.railway.app/api/cleanup/scheduler
```

**Response:**
```json
{
  "success": true,
  "scheduler": {
    "running": true,
    "schedule": "0 2 * * * (Daily at 02:00 UTC)",
    "nextRun": "2025-12-02T02:00:00.000Z"
  }
}
```

## Storage Calculation

### Audio Files (14 days retention)
- File size: 17 MB per file
- Files stored: 14 files
- Total: **238 MB**

### Newsletter Text (365 days retention)
- Record size: 5 KB per record
- Records stored: 365 records
- Total: **1.78 MB**

### Railway Volume Usage
- Free tier: 5 GB
- Usage: 0.23 GB (4.7% of free tier)
- Status: ✅ Well within free tier

## Benefits

### 1. Cost Efficiency
- Stays within Railway's free tier (5 GB)
- No additional storage costs
- Automatic management (no manual intervention)

### 2. User Experience
- Recent 2 weeks have audio playback
- Full year of text content for historical analysis
- Fast API responses (small database)

### 3. Business Value
- Year-over-year market analysis
- Historical trend tracking
- SEO benefits (365 days of content)
- Professional data management

## Technical Implementation

### Files Created
1. `src/services/cleanupService.js` - Core cleanup logic
2. `src/services/cronScheduler.js` - Cron job scheduler
3. `src/routes/cleanup.js` - API endpoints
4. `src/models/newsletter.js` - Added cleanup helper methods

### Dependencies Added
- `node-cron` - Cron job scheduling

### Server Integration
- Cleanup scheduler starts automatically on server startup
- Graceful shutdown stops scheduler cleanly
- Integrated into main server (`src/index.js`)

## Monitoring

### Logs
The cleanup process logs detailed information:
- Files/records to be deleted
- Deletion success/failure
- Summary statistics
- Error messages

### Example Log Output
```
🧹 Starting cleanup process...
============================================================

📁 Step 1: Cleaning audio files...
📂 Found 16 audio files in /data/audio
🗓️  Cutoff date: 2025-11-17 (14 days ago)
  ✓ Deleted: daily-pulse-2025-11-15.wav (17.00 MB)
  ✓ Deleted: daily-pulse-2025-11-16.wav (17.00 MB)

🗄️  Step 2: Cleaning database records...
🗓️  Cutoff date: 2024-12-01 (365 days ago)
📋 Found 3 old newsletter records
  ✓ Deleted 3 newsletter records

============================================================
✅ Cleanup completed successfully
============================================================
📊 Summary:
  Audio files deleted:     2
  Audio errors:            0
  Newsletters deleted:     3
  Database errors:         0
  Duration:                1234ms
============================================================
```

## Safety Features

1. **Date-based deletion**: Only deletes files/records older than retention period
2. **Error handling**: Continues cleanup even if individual deletions fail
3. **Logging**: Detailed logs for audit trail
4. **Statistics API**: Preview what will be deleted before running cleanup
5. **Manual trigger**: Test cleanup before relying on automatic schedule

## Deployment

The cleanup system is automatically deployed with the main application:
1. Push code to GitHub
2. Railway auto-deploys
3. Scheduler starts automatically
4. First cleanup runs at next 02:00 UTC

No additional configuration required!
