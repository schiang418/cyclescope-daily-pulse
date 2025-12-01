# CycleScope Daily Market Pulse - Backend Service

Daily market newsletter generation service powered by Google Gemini AI.

## 🎯 Features

- 📰 Daily market newsletter generation with Gemini 2.5 Flash
- 🔊 Text-to-speech audio generation with Gemini TTS
- 📊 PostgreSQL database for newsletter storage
- ☁️ Railway Volume / S3 for audio file storage
- 🤖 Automated generation via GitHub Actions

## 🏗️ Architecture

```
GitHub Actions → cyclescope-daily-pulse (Backend) → cyclescope-portal (Frontend)
     ↓                      ↓                              ↓
  Schedule            PostgreSQL + S3              daily-pulse.html
                      Gemini API                   + Audio Player
```

## 📦 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL (Railway)
- **Storage**: Railway Volume / AWS S3
- **AI**: Google Gemini SDK (@google/generative-ai)

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- PostgreSQL database
- Gemini API key

### Installation

```bash
# Clone repository
git clone https://github.com/schiang418/cyclescope-daily-pulse.git
cd cyclescope-daily-pulse

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Environment Variables

See `.env.example` for all required variables:

- `DATABASE_URL`: PostgreSQL connection string
- `GEMINI_API_KEY`: Google Gemini API key
- `API_SECRET_KEY`: Secret key for API authentication
- `ALLOWED_ORIGINS`: CORS allowed origins
- `RAILWAY_VOLUME_MOUNT_PATH`: Path for audio storage (Railway)
- `PUBLIC_URL`: Public URL of the service

### Database Migration

```bash
npm run migrate
```

### Running Locally

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:3001`

## 📡 API Endpoints

### Health Check

```
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-01T10:00:00.000Z",
  "environment": "production"
}
```

### Generate Newsletter (Authenticated)

```
POST /api/newsletter/generate
Headers: X-API-Key: <API_SECRET_KEY>
```

Response:
```json
{
  "id": 123,
  "publishDate": "2025-12-01",
  "status": "generating",
  "message": "Newsletter generation started"
}
```

### Get Latest Newsletter

```
GET /api/newsletter/latest
```

Response:
```json
{
  "id": 123,
  "publishDate": "2025-12-01",
  "title": "Market Holds Steady Amid Mixed Signals",
  "hook": "The S&P 500 closed nearly flat today...",
  "sections": [...],
  "conclusion": "Looking ahead...",
  "sources": [...],
  "audioUrl": "https://...",
  "audioDuration": 180,
  "createdAt": "2025-12-01T11:00:00Z"
}
```

### Get Historical Newsletters

```
GET /api/newsletter/history?limit=30
```

Response:
```json
{
  "count": 30,
  "newsletters": [...]
}
```

### Get Newsletter by Date

```
GET /api/newsletter/2025-12-01
```

Response: Same as "Get Latest Newsletter"

## 🗄️ Database Schema

### daily_newsletters

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| publish_date | DATE | Newsletter date (unique) |
| title | VARCHAR(500) | Newsletter title |
| hook | TEXT | Opening paragraph |
| sections | JSONB | Array of sections |
| conclusion | TEXT | Closing paragraph |
| sources | JSONB | Array of source URLs |
| audio_url | VARCHAR(1000) | Audio file URL |
| audio_duration_seconds | INTEGER | Audio duration |
| generation_status | VARCHAR(50) | Status (pending/generating/complete/failed) |
| error_message | TEXT | Error message if failed |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Update timestamp |

## 📂 Project Structure

```
cyclescope-daily-pulse/
├── src/
│   ├── index.js                    # Express server
│   ├── config.js                   # Configuration
│   ├── services/
│   │   ├── gemini-newsletter.js    # Newsletter generation
│   │   ├── gemini-tts.js           # Audio generation
│   │   ├── wav-converter.js        # PCM to WAV
│   │   ├── database.js             # PostgreSQL operations
│   │   └── storage.js              # S3/Volume upload
│   ├── routes/
│   │   └── newsletter.js           # API routes
│   └── utils/
│       ├── logger.js               # Logging
│       └── error-handler.js        # Error handling
├── scripts/
│   └── migrate.mjs                 # Database migration
├── tests/
│   ├── gemini.test.js
│   ├── wav-converter.test.js
│   └── api.test.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 🧪 Testing

```bash
npm test
```

## 🚢 Deployment

### Railway

1. Create new Railway project
2. Add PostgreSQL service
3. Set environment variables
4. Connect GitHub repository
5. Deploy

Railway will automatically:
- Install dependencies
- Run migrations
- Start the server

### Environment Variables (Railway)

Set these in Railway dashboard:
- `DATABASE_URL` (auto-set by PostgreSQL service)
- `GEMINI_API_KEY`
- `API_SECRET_KEY`
- `ALLOWED_ORIGINS`
- `PUBLIC_URL`
- `RAILWAY_VOLUME_MOUNT_PATH` (if using Railway Volume)

## 📊 Monitoring

- **Health Check**: `GET /health`
- **Logs**: Railway dashboard or `railway logs`
- **Database**: Railway PostgreSQL dashboard

## 🔐 Security

- API authentication via `X-API-Key` header
- CORS configured for specific origins
- Environment variables for sensitive data
- Input validation on all endpoints

## 📝 License

MIT

## 👥 Authors

CycleScope Team

## 🔗 Related Projects

- [cyclescope-portal](https://github.com/schiang418/cyclescope-portal) - Frontend website
- [cyclescope-domain-api](https://github.com/schiang418/cyclescope-domain-api) - Domain analysis API

## 📮 Support

For issues and questions, please open an issue on GitHub.
