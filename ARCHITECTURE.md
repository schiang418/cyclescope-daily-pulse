# CycleScope Daily Market Pulse - Architecture & Implementation Design

**Version:** 2.0  
**Last Updated:** December 2, 2025  
**Status:** Production

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Core Components](#core-components)
5. [API Specification](#api-specification)
6. [Database Schema](#database-schema)
7. [Data Flow](#data-flow)
8. [Storage Strategy](#storage-strategy)
9. [Cleanup System](#cleanup-system)
10. [Deployment](#deployment)
11. [Security](#security)
12. [Performance](#performance)
13. [Future Enhancements](#future-enhancements)

---

## 📊 Executive Summary

The **CycleScope Daily Market Pulse** is an automated newsletter generation system that produces daily cryptocurrency market analysis with AI-generated content and audio narration. The system leverages Google Gemini 2.5 Flash with Search Grounding to generate factual, up-to-date market insights, and Gemini TTS to create professional audio narration.

### Key Features

- **Automated Daily Generation**: AI-powered newsletter creation based on real-time market data
- **Audio Narration**: Professional text-to-speech with Fenrir voice (deep, authoritative male voice)
- **Source Attribution**: Transparent sourcing via Google Search Grounding metadata
- **Historical Archive**: 365-day newsletter retention, 14-day audio retention
- **Automatic Cleanup**: Scheduled maintenance to optimize storage costs
- **RESTful API**: Clean, well-documented API for frontend integration

### Business Value

- **Cost Efficient**: Stays within Railway's free tier (0.23 GB / 5 GB)
- **Scalable**: Modular architecture supports future enhancements
- **Reliable**: Automated workflows with error handling and logging
- **Professional**: High-quality content generation with source attribution

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions Workflow                   │
│              (cyclescope-automation repository)              │
│                                                              │
│  Daily Trigger (6:00 AM ET)                                 │
│  ├─ POST /api/newsletter/generate                           │
│  ├─ Wait & verify generation                                │
│  └─ Log results                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│           cyclescope-daily-pulse (Backend Service)          │
│                    Railway Deployment                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Express.js Server (Node.js)             │  │
│  │                                                       │  │
│  │  Routes:                                             │  │
│  │  ├─ /api/newsletter/*  (Newsletter operations)      │  │
│  │  ├─ /api/cleanup/*     (Cleanup management)         │  │
│  │  └─ /health            (Health check)               │  │
│  └──────────────────────────────────────────────────────┘  │
│                              │                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Gemini Integration Layer                    │  │
│  │                                                       │  │
│  │  ├─ Newsletter Generator (Gemini 2.5 Flash)         │  │
│  │  │  └─ Google Search Grounding enabled              │  │
│  │  ├─ Audio Generator (Gemini TTS)                    │  │
│  │  │  └─ Voice: Fenrir (deep, authoritative)          │  │
│  │  └─ WAV Converter (PCM → WAV)                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                              │                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Storage Layer                           │  │
│  │                                                       │  │
│  │  ├─ PostgreSQL (Newsletter records)                 │  │
│  │  └─ Railway Volume /data (Audio WAV files)          │  │
│  └──────────────────────────────────────────────────────┘  │
│                              │                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Cleanup Scheduler (node-cron)               │  │
│  │                                                       │  │
│  │  Schedule: Daily at 02:00 UTC                        │  │
│  │  ├─ Delete audio files > 14 days                    │  │
│  │  └─ Delete newsletter records > 365 days            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ REST API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              cyclescope-portal (Frontend)                    │
│                  https://cyclescope-portal.com               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         NEW Page: daily-pulse.html                   │  │
│  │                                                       │  │
│  │  ├─ Display latest newsletter                        │  │
│  │  ├─ Audio player with controls                       │  │
│  │  ├─ Historical archive (365 days)                    │  │
│  │  ├─ Download JSON/WAV                                │  │
│  │  └─ Source links display                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      NEW JavaScript: js/daily-pulse.js               │  │
│  │                                                       │  │
│  │  ├─ Fetch data from API                              │  │
│  │  ├─ Render newsletter content                        │  │
│  │  ├─ Control audio playback                           │  │
│  │  └─ Handle history navigation                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │       NEW Stylesheet: css/daily-pulse.css            │  │
│  │                                                       │  │
│  │  ├─ Dark theme (#1e293b background)                  │  │
│  │  ├─ Blue accent (#3b82f6)                            │  │
│  │  └─ Responsive design (mobile/tablet/desktop)        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
User Request → Frontend (daily-pulse.html)
              ↓
         Fetch API Call
              ↓
    Backend (Express.js) → Newsletter Service
              ↓
         Gemini API (2.5 Flash + Search Grounding)
              ↓
         Generate Newsletter Content
              ↓
         Gemini TTS API (Fenrir voice)
              ↓
         Generate Audio (PCM)
              ↓
         Convert to WAV
              ↓
         Save to Database + Storage
              ↓
         Return API Response
              ↓
    Frontend Renders Content + Audio Player
```

---

## 🛠️ Technology Stack

### Backend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Runtime** | Node.js | 18+ | JavaScript runtime |
| **Framework** | Express.js | 5.1.0 | Web server framework |
| **Database** | PostgreSQL | Latest | Newsletter storage (Railway) |
| **Storage** | Railway Volume | - | Audio file storage (/data) |
| **AI Model** | Google Gemini | 2.5 Flash | Newsletter generation |
| **TTS** | Google Gemini TTS | - | Audio narration (Fenrir voice) |
| **Scheduler** | node-cron | 4.2.1 | Automated cleanup |
| **Database Client** | pg | 8.16.3 | PostgreSQL driver |

### Frontend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **HTML** | HTML5 | Page structure |
| **CSS** | Tailwind CSS | Styling (existing portal) |
| **JavaScript** | Vanilla JS | API integration, audio control |
| **Audio API** | HTML5 Audio | Audio playback |

### Infrastructure

| Component | Provider | Purpose |
|-----------|----------|---------|
| **Backend Hosting** | Railway | Node.js app deployment |
| **Database** | Railway PostgreSQL | Managed PostgreSQL |
| **Storage** | Railway Volume | Persistent audio file storage |
| **Frontend Hosting** | (TBD) | Static site hosting |
| **Automation** | GitHub Actions | Daily newsletter generation |

---

## 🧩 Core Components

### 1. Newsletter Service (`src/services/newsletterService.js`)

**Responsibilities:**
- Orchestrate newsletter generation workflow
- Call Gemini API for content generation
- Call Gemini TTS for audio generation
- Convert PCM to WAV format
- Save to database and storage

**Key Functions:**

```javascript
async function generateDailyNewsletter(date)
```
- Main entry point for newsletter generation
- Steps:
  1. Check if newsletter already exists
  2. Generate content via Gemini
  3. Generate audio via TTS
  4. Save to database
  5. Return complete newsletter

```javascript
async function getAudioStoragePath(fileName)
```
- Determine audio file storage location
- Returns: `/data/audio/{fileName}`

```javascript
async function getAudioPublicUrl(fileName)
```
- Generate public URL for audio file
- Returns: `https://.../audio/{fileName}`

### 2. Gemini Service (`src/services/geminiService.js`)

**Responsibilities:**
- Interface with Google Gemini API
- Extract grounding metadata (sources)
- Handle API errors and retries

**Key Functions:**

```javascript
async function generateNewsletterContent(date)
```
- Call Gemini 2.5 Flash with Search Grounding
- Prompt: Generate market analysis for specific date
- Extract: title, hook, sections, conclusion, **sources**
- Returns: Structured newsletter object

**Configuration:**
```javascript
{
  model: "gemini-2.5-flash",
  config: {
    tools: [{ googleSearch: {} }],  // Enable Search Grounding
    temperature: 0.7,
    maxOutputTokens: 2048
  }
}
```

**Source Extraction:**
```javascript
const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
  ?.map(chunk => ({
    url: chunk.web?.uri,
    title: chunk.web?.title
  }))
  .filter(s => s.url && s.title) || [];
```

### 3. TTS Service (`src/services/ttsService.js`)

**Responsibilities:**
- Generate audio from text using Gemini TTS
- Convert PCM to WAV format
- Calculate audio duration

**Key Functions:**

```javascript
async function generateNewsletterAudio(content, outputPath)
```
- Combine newsletter sections into narration script
- Call Gemini TTS API with Fenrir voice
- Convert PCM response to WAV
- Save to specified path
- Returns: `{ audioPath, durationSeconds }`

**Voice Configuration:**
```javascript
{
  voice: {
    name: "Fenrir",  // Deep, authoritative male voice
    languageCode: "en-US"
  },
  audioConfig: {
    audioEncoding: "LINEAR16",
    sampleRateHertz: 24000
  }
}
```

### 4. Cleanup Service (`src/services/cleanupService.js`)

**Responsibilities:**
- Delete old audio files (> 14 days)
- Delete old newsletter records (> 365 days)
- Log cleanup statistics

**Key Functions:**

```javascript
async function runCleanup()
```
- Main cleanup orchestrator
- Returns: `{ audioFilesDeleted, newslettersDeleted, errors }`

```javascript
async function cleanupAudioFiles()
```
- Scan `/data/audio/` directory
- Delete files older than 14 days
- Returns: `{ deleted, errors, files }`

```javascript
async function cleanupNewsletterRecords()
```
- Query database for old records
- Delete records older than 365 days
- Returns: `{ deleted, errors, records }`

```javascript
async function getCleanupStats()
```
- Preview cleanup without deleting
- Returns: `{ audioFiles, newsletters, cutoffDates }`

### 5. Cron Scheduler (`src/services/cronScheduler.js`)

**Responsibilities:**
- Schedule automatic cleanup
- Manage scheduler lifecycle

**Configuration:**
```javascript
{
  schedule: "0 2 * * *",  // Daily at 02:00 UTC
  timezone: "UTC"
}
```

**Key Functions:**

```javascript
function startCleanupScheduler()
```
- Initialize cron job
- Register cleanup callback
- Returns: cron job instance

```javascript
function stopCleanupScheduler()
```
- Stop cron job gracefully
- Called on server shutdown

```javascript
function getSchedulerStatus()
```
- Returns: `{ running, schedule, nextRun }`

### 6. Newsletter Model (`src/models/newsletter.js`)

**Responsibilities:**
- Database CRUD operations
- PostgreSQL connection pooling

**Key Functions:**

```javascript
async create(data)
```
- UPSERT newsletter (by publish_date)
- Returns: Created/updated record

```javascript
async getByDate(publishDate)
```
- Fetch newsletter by date
- Returns: Newsletter object or null

```javascript
async getLatest()
```
- Fetch most recent newsletter
- Returns: Latest newsletter

```javascript
async getHistory(limit = 30)
```
- Fetch historical newsletters
- Returns: Array of newsletters (descending by date)

```javascript
async getAll()
```
- Fetch all newsletters
- Returns: All records

```javascript
async getOlderThan(date)
```
- Fetch newsletters older than date
- Used by cleanup service
- Returns: Array of old newsletters

```javascript
async deleteOlderThan(date)
```
- Delete newsletters older than date
- Returns: `{ count: rowCount }`

---

## 📡 API Specification

### Base URL

```
Production: https://cyclescope-daily-pulse-production.up.railway.app
```

### Authentication

**Current:** No authentication (public API)  
**Future:** API key authentication for POST endpoints

### Endpoints

#### 1. Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-02T10:00:00.000Z",
  "environment": "production"
}
```

#### 2. Generate Newsletter

```http
POST /api/newsletter/generate
```

**Request Body:**
```json
{
  "date": "2025-12-02"  // Optional, defaults to today
}
```

**Response:**
```json
{
  "success": true,
  "message": "Newsletter generated successfully",
  "newsletter": {
    "id": 123,
    "publishDate": "2025-12-02",
    "title": "Market Holds Steady Amid Mixed Signals",
    "hook": "The S&P 500 closed nearly flat today as investors weighed...",
    "sections": [
      {
        "heading": "Market Summary",
        "content": "The S&P 500 closed at 4,567.89, up 0.12%..."
      }
    ],
    "conclusion": "Looking ahead, traders will focus on...",
    "sources": [
      {
        "url": "https://www.bloomberg.com/...",
        "title": "S&P 500 Holds Steady"
      }
    ],
    "audioUrl": "https://.../audio/daily-pulse-2025-12-02.wav",
    "audioDuration": 180,
    "createdAt": "2025-12-02T10:00:00.000Z"
  }
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid date format
- `409`: Newsletter already exists for date
- `500`: Generation failed

#### 3. Get Latest Newsletter

```http
GET /api/newsletter/latest
```

**Response:**
```json
{
  "id": 123,
  "publishDate": "2025-12-02",
  "title": "...",
  "hook": "...",
  "sections": [...],
  "conclusion": "...",
  "sources": [...],
  "audioUrl": "...",
  "audioDuration": 180,
  "createdAt": "2025-12-02T10:00:00.000Z"
}
```

#### 4. Get Newsletter by Date

```http
GET /api/newsletter/:date
```

**Example:**
```http
GET /api/newsletter/2025-12-01
```

**Response:** Same as "Get Latest Newsletter"

**Status Codes:**
- `200`: Success
- `404`: Newsletter not found for date

#### 5. Get Newsletter History

```http
GET /api/newsletter/history?limit=30
```

**Query Parameters:**
- `limit` (optional): Number of newsletters to return (default: 30, max: 365)

**Response:**
```json
{
  "count": 30,
  "newsletters": [
    {
      "id": 123,
      "publishDate": "2025-12-02",
      "title": "...",
      "audioUrl": "...",
      "createdAt": "..."
    },
    // ... more newsletters
  ]
}
```

#### 6. Get Cleanup Statistics

```http
GET /api/cleanup/stats
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
      "audio": "2025-11-18",
      "newsletter": "2024-12-02"
    }
  }
}
```

#### 7. Run Manual Cleanup

```http
POST /api/cleanup/run
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
    "startTime": "2025-12-02T14:00:00.000Z",
    "endTime": "2025-12-02T14:00:01.234Z",
    "durationMs": 1234
  }
}
```

#### 8. Get Scheduler Status

```http
GET /api/cleanup/scheduler
```

**Response:**
```json
{
  "success": true,
  "scheduler": {
    "running": true,
    "schedule": "0 2 * * * (Daily at 02:00 UTC)",
    "nextRun": "2025-12-03T02:00:00.000Z"
  }
}
```

---

## 🗄️ Database Schema

### Table: `daily_newsletters`

```sql
CREATE TABLE daily_newsletters (
  id SERIAL PRIMARY KEY,
  publish_date DATE NOT NULL UNIQUE,
  
  -- Newsletter Content
  title VARCHAR(500) NOT NULL,
  hook TEXT NOT NULL,
  sections JSONB NOT NULL,  -- Array of {heading: string, content: string}
  conclusion TEXT NOT NULL,
  sources JSONB,            -- Array of {url: string, title: string} from Gemini grounding
  
  -- Audio
  audio_url VARCHAR(1000),              -- Public URL to WAV file
  audio_duration_seconds INTEGER,       -- Duration in seconds
  
  -- Metadata
  generation_status VARCHAR(50) DEFAULT 'pending',  -- pending, generating, complete, failed
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_publish_date ON daily_newsletters(publish_date DESC);
CREATE INDEX idx_generation_status ON daily_newsletters(generation_status);
```

### Sample Data

```json
{
  "id": 123,
  "publish_date": "2025-12-02",
  "title": "Market Holds Steady Amid Mixed Signals",
  "hook": "The S&P 500 closed nearly flat today...",
  "sections": [
    {
      "heading": "Market Summary",
      "content": "The S&P 500 closed at 4,567.89, up 0.12%..."
    },
    {
      "heading": "Key Movers & Data",
      "content": "Nasdaq gained 0.34% to 14,234.56..."
    }
  ],
  "conclusion": "Looking ahead, traders will focus on...",
  "sources": [
    {
      "url": "https://www.bloomberg.com/markets/sp500",
      "title": "S&P 500 Index Performance"
    },
    {
      "url": "https://www.reuters.com/markets/nasdaq",
      "title": "Nasdaq Composite Analysis"
    }
  ],
  "audio_url": "https://cyclescope-daily-pulse-production.up.railway.app/audio/daily-pulse-2025-12-02.wav",
  "audio_duration_seconds": 180,
  "generation_status": "complete",
  "error_message": null,
  "created_at": "2025-12-02T10:00:00.000Z",
  "updated_at": "2025-12-02T10:00:00.000Z"
}
```

---

## 🔄 Data Flow

### Newsletter Generation Flow

```
1. GitHub Actions Trigger (6:00 AM ET)
   ├─ POST /api/newsletter/generate
   └─ date: "2025-12-02"

2. Newsletter Service
   ├─ Check if newsletter exists for date
   │  └─ If exists: return 409 Conflict
   ├─ Create pending record in database
   └─ Start generation process

3. Gemini Content Generation
   ├─ Build prompt with date and market context
   ├─ Call Gemini 2.5 Flash API
   │  └─ Config: { tools: [{ googleSearch: {} }] }
   ├─ Parse response
   │  ├─ Extract: title, hook, sections, conclusion
   │  └─ Extract grounding metadata → sources
   └─ Return structured content

4. Audio Generation
   ├─ Combine sections into narration script
   ├─ Call Gemini TTS API
   │  └─ Voice: Fenrir, encoding: LINEAR16, rate: 24kHz
   ├─ Receive PCM audio data
   ├─ Convert PCM to WAV format
   ├─ Save to /data/audio/daily-pulse-{date}.wav
   └─ Calculate duration

5. Database Update
   ├─ Update newsletter record
   │  ├─ status: "complete"
   │  ├─ content fields
   │  ├─ audio_url
   │  └─ audio_duration_seconds
   └─ Commit transaction

6. API Response
   └─ Return complete newsletter object
```

### Cleanup Flow

```
1. Cron Trigger (Daily at 02:00 UTC)
   └─ Call runCleanup()

2. Audio Cleanup
   ├─ Scan /data/audio/ directory
   ├─ Get file stats (mtime)
   ├─ Calculate cutoff date (today - 14 days)
   ├─ For each file:
   │  ├─ If mtime < cutoff:
   │  │  ├─ Delete file
   │  │  └─ Log deletion
   │  └─ Else: skip
   └─ Return { deleted, errors }

3. Database Cleanup
   ├─ Calculate cutoff date (today - 365 days)
   ├─ Query: SELECT * WHERE publish_date < cutoff
   ├─ Log records to be deleted
   ├─ Execute: DELETE WHERE publish_date < cutoff
   └─ Return { deleted, errors }

4. Logging
   ├─ Log summary statistics
   │  ├─ Audio files deleted
   │  ├─ Newsletter records deleted
   │  ├─ Errors encountered
   │  └─ Duration
   └─ Store in application logs
```

---

## 💾 Storage Strategy

### Storage Breakdown

| Data Type | Storage Location | Retention | Size per Item | Total Size |
|-----------|-----------------|-----------|---------------|------------|
| **Newsletter Text** | PostgreSQL | 365 days | 5 KB | 1.78 MB |
| **Audio Files** | Railway Volume `/data` | 14 days | 17 MB | 238 MB |
| **Total** | - | - | - | **239.78 MB** |

### Railway Volume Usage

```
Free Tier: 5 GB
Used: 0.23 GB (4.7%)
Available: 4.77 GB
Status: ✅ Well within limits
```

### Storage Optimization

1. **Audio Compression**: WAV format (24kHz, 16-bit, mono)
   - Smaller than stereo
   - Sufficient quality for speech
   - ~17 MB per 5-minute audio

2. **Database Efficiency**: JSONB for structured data
   - Efficient storage
   - Fast queries
   - Flexible schema

3. **Automatic Cleanup**: Scheduled deletion
   - Prevents unbounded growth
   - Maintains free tier eligibility
   - No manual intervention needed

### File Naming Convention

```
Audio files: daily-pulse-{YYYY-MM-DD}.wav
Example: daily-pulse-2025-12-02.wav
```

### URL Structure

```
Audio URL: https://cyclescope-daily-pulse-production.up.railway.app/audio/daily-pulse-{date}.wav
API Base: https://cyclescope-daily-pulse-production.up.railway.app/api
```

---

## 🧹 Cleanup System

### Retention Policy

| Data Type | Retention Period | Rationale |
|-----------|-----------------|-----------|
| **Audio Files** | 14 days (2 weeks) | Large files (17 MB), users typically listen to recent content |
| **Newsletter Text** | 365 days (1 year) | Small size (5 KB), valuable for historical analysis and SEO |

### Cleanup Schedule

**Frequency:** Daily at 02:00 UTC  
**Mechanism:** node-cron scheduler  
**Automatic:** Starts with server, stops on shutdown

### Cleanup Logic

#### Audio Files
```javascript
// Cutoff date: today - 14 days
const cutoffDate = new Date();
cutoffDate.setDate(cutoffDate.getDate() - 14);

// Delete files where mtime < cutoffDate
for (const file of audioFiles) {
  const stats = await fs.stat(file);
  if (stats.mtime < cutoffDate) {
    await fs.unlink(file);
  }
}
```

#### Newsletter Records
```sql
-- Cutoff date: today - 365 days
DELETE FROM daily_newsletters
WHERE publish_date < (CURRENT_DATE - INTERVAL '365 days');
```

### Manual Cleanup

**Endpoint:** `POST /api/cleanup/run`  
**Use Cases:**
- Testing cleanup logic
- Immediate cleanup after configuration change
- Emergency storage management

### Monitoring

**Statistics Endpoint:** `GET /api/cleanup/stats`

**Returns:**
- Files/records to be deleted
- Current storage usage
- Cutoff dates
- No actual deletion (preview mode)

**Example Response:**
```json
{
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
    "audio": "2025-11-18",
    "newsletter": "2024-12-02"
  }
}
```

---

## 🚀 Deployment

### Railway Configuration

**Service:** cyclescope-daily-pulse  
**Region:** US West  
**Plan:** Free Tier

**Environment Variables:**
```bash
# Required
GEMINI_API_KEY=<your-api-key>
DATABASE_URL=<railway-postgres-url>
API_SECRET_KEY=<random-secret>

# Optional
PORT=3001
NODE_ENV=production
PUBLIC_URL=https://cyclescope-daily-pulse-production.up.railway.app
RAILWAY_VOLUME_MOUNT_PATH=/data
```

**Build Command:**
```bash
npm install
```

**Start Command:**
```bash
npm start
```

**Health Check:**
```
Path: /health
Interval: 30s
Timeout: 10s
```

### Volume Configuration

**Mount Path:** `/data`  
**Size:** 5 GB (free tier)  
**Purpose:** Audio file storage

**Directory Structure:**
```
/data/
└── audio/
    ├── daily-pulse-2025-12-01.wav
    ├── daily-pulse-2025-12-02.wav
    └── ...
```

### GitHub Actions Workflow

**Repository:** cyclescope-automation  
**File:** `.github/workflows/daily-newsletter.yml`

```yaml
name: Generate Daily Newsletter

on:
  schedule:
    - cron: '0 11 * * *'  # 6:00 AM ET (11:00 UTC)
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - name: Generate Newsletter
        run: |
          curl -X POST \
            https://cyclescope-daily-pulse-production.up.railway.app/api/newsletter/generate \
            -H "Content-Type: application/json" \
            -d '{"date": "'$(date +%Y-%m-%d)'"}'
      
      - name: Verify Generation
        run: |
          sleep 60
          curl https://cyclescope-daily-pulse-production.up.railway.app/api/newsletter/latest
```

### Deployment Process

1. **Code Changes**
   ```bash
   git add .
   git commit -m "Feature: XYZ"
   git push origin main
   ```

2. **Automatic Deployment**
   - Railway detects push
   - Builds Docker image
   - Runs `npm install`
   - Starts server with `npm start`
   - Health check passes
   - Traffic switches to new deployment

3. **Verification**
   ```bash
   curl https://cyclescope-daily-pulse-production.up.railway.app/health
   ```

4. **Rollback (if needed)**
   - Railway dashboard → Deployments
   - Select previous deployment
   - Click "Redeploy"

---

## 🔒 Security

### Current Security Measures

1. **Environment Variables**
   - API keys stored in Railway secrets
   - Not committed to repository
   - Injected at runtime

2. **CORS Configuration**
   ```javascript
   app.use(cors({
     origin: config.allowedOrigins,
     credentials: true
   }));
   ```

3. **Input Validation**
   - Date format validation
   - SQL injection prevention (parameterized queries)
   - Error message sanitization

4. **Database Security**
   - SSL/TLS connections
   - Managed by Railway
   - Automatic backups

### Future Security Enhancements

1. **API Authentication**
   - API key for POST endpoints
   - Rate limiting
   - Request signing

2. **Content Security**
   - Input sanitization
   - Output encoding
   - CSP headers

3. **Monitoring**
   - Error tracking (Sentry)
   - Access logs
   - Anomaly detection

---

## ⚡ Performance

### Current Performance

| Metric | Value | Target |
|--------|-------|--------|
| **Newsletter Generation** | 3-5 minutes | < 5 min |
| **API Response Time** | < 100ms | < 200ms |
| **Audio File Size** | 17 MB | < 20 MB |
| **Database Query Time** | < 50ms | < 100ms |

### Optimization Strategies

1. **Caching**
   - Cache latest newsletter in memory
   - Cache historical list (30 days)
   - Invalidate on new generation

2. **Database Indexing**
   - Index on `publish_date` (DESC)
   - Index on `generation_status`
   - Composite index for common queries

3. **Audio Optimization**
   - 24kHz sample rate (sufficient for speech)
   - Mono channel (not stereo)
   - WAV format (no compression overhead)

4. **API Optimization**
   - Pagination for history endpoint
   - Partial response support
   - Compression (gzip)

### Monitoring

**Metrics to Track:**
- API response times
- Newsletter generation duration
- Audio file sizes
- Database query performance
- Storage usage
- Error rates

**Tools:**
- Railway built-in metrics
- Custom logging
- Health check endpoint

---

## 🔮 Future Enhancements

### Phase 1: Core Improvements

1. **Email Delivery**
   - Subscribe to daily newsletter
   - Email template design
   - Unsubscribe mechanism

2. **Podcast Feed**
   - RSS feed generation
   - Apple Podcasts integration
   - Spotify integration

3. **Multi-language Support**
   - Chinese newsletter
   - Japanese newsletter
   - Auto-translation

### Phase 2: Advanced Features

1. **Personalization**
   - User preferences (topics, length)
   - Custom portfolios
   - Watchlist integration

2. **Interactive Content**
   - Charts and graphs
   - Interactive data visualizations
   - Embedded videos

3. **Social Sharing**
   - Share on Twitter/X
   - LinkedIn integration
   - Custom share images

### Phase 3: Analytics & Insights

1. **User Analytics**
   - Listen time tracking
   - Popular sections
   - Engagement metrics

2. **Content Analytics**
   - Source quality scoring
   - Prediction accuracy tracking
   - Sentiment analysis

3. **A/B Testing**
   - Title variations
   - Voice preferences
   - Content structure

### Phase 4: Enterprise Features

1. **White-label Solution**
   - Custom branding
   - Custom domains
   - API access

2. **Team Collaboration**
   - Editorial review
   - Multi-author support
   - Version control

3. **Advanced Automation**
   - Custom triggers
   - Webhook integrations
   - Zapier integration

---

## 📚 References

### Documentation

- [Google Gemini API](https://ai.google.dev/docs)
- [Google Gemini TTS](https://cloud.google.com/text-to-speech/docs)
- [Railway Documentation](https://docs.railway.app)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Related Repositories

- **Backend:** `cyclescope-daily-pulse` (this repository)
- **Frontend:** `cyclescope-portal`
- **Automation:** `cyclescope-automation`

### Contact

For questions or support, contact the CycleScope team.

---

**Last Updated:** December 2, 2025  
**Version:** 2.0  
**Status:** Production Ready ✅
