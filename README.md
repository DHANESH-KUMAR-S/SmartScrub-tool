# SmartScrub - AI-Powered Data Cleaning Platform

A modern, enterprise-grade data cleaning platform with AI-powered suggestions, built with React and FastAPI.

## ✨ Features

### 🎯 Complete 5-Step Workflow
1. **Upload** - Import CSV, Excel, or JSON files
2. **Profile** - Analyze data quality with interactive visualizations
3. **Clean** - Manual data cleaning with column operations
4. **AI Clean** - Intelligent cleaning suggestions powered by AI
5. **Export** - Download cleaned data in multiple formats

### 🚀 Key Capabilities
- **Modern UI** - Enterprise-grade interface with glassmorphism design
- **Data Canvas** - Full-screen interactive data editor (Zoho DataPrep-style)
- **Column Quality Indicators** - Real-time quality metrics and hover charts
- **AI Suggestions** - Intelligent cleaning recommendations with confidence scores
- **Google Cloud Storage** - Persistent storage with GCS integration
- **MySQL Authentication** - Secure user authentication with guest mode
- **Workflow Persistence** - State management with localStorage

## 🛠️ Tech Stack

### Frontend
- React 18
- React Router v6
- Context API for state management
- CSS Modules with glassmorphism effects

### Backend
- FastAPI (Python)
- Pandas for data processing
- MySQL for user authentication
- Google Cloud Storage for file storage
- Pydantic for data validation

## 📋 Prerequisites

- Node.js 16+ and npm
- Python 3.8+
- MySQL 8.0+
- Google Cloud Platform account (for GCS)

## 🚀 Quick Start

### 1. Database Setup

```sql
CREATE DATABASE smartscrub;
USE smartscrub;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Edit .env file with your settings:
# - MySQL credentials
# - GCS project ID and bucket name
# - JWT secret key

# Create test user
python setup_test_user.py

# Start backend server
python main.py
```

Backend runs on `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend runs on `http://localhost:3000`

### 4. Google Cloud Storage Setup

```bash
cd backend

# Test GCS connection
python test_gcs.py

# Create bucket (if needed)
python create_bucket.py
```

## 🔐 Authentication

### Test User Credentials
- Email: `test@example.com`
- Password: `password123`

### Guest Mode
Click "Try without sign-in" to use the app without authentication.

## 📊 Usage

### Upload Data
1. Click "Upload" or navigate to Step 1
2. Drag & drop or select a file (CSV, Excel, JSON)
3. Wait for upload and profiling to complete

### Profile Data
- View dataset statistics and quality metrics
- Explore column-level analysis
- Open Data Canvas for interactive editing
- See quality indicators and hover charts

### Manual Cleaning
- Remove duplicate rows
- Drop unnecessary columns
- Handle missing values (mean, median, mode, forward/backward fill)
- Convert data types

### AI-Powered Cleaning
- Review intelligent suggestions grouped by impact level
- See confidence scores and affected rows
- Select suggestions to apply
- Customize parameters if needed

### Export Results
- Choose format: CSV, Excel, or JSON
- Download cleaned dataset
- Start new workflow or return to dashboard

## 🎨 UI Features

### Modern Design
- Glassmorphism effects with backdrop blur
- Gradient accents and smooth animations
- Responsive grid layouts
- Dark theme optimized

### Interactive Components
- Numbered step navigation with progress tracking
- Expandable suggestion cards
- Real-time quality indicators
- Hover charts for data distribution
- Full-screen data canvas

## 🔧 Configuration

### Backend (.env)
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=12345
DB_NAME=smartscrub

# JWT
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Google Cloud Storage
GCS_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=smartscrub-datasets
GOOGLE_APPLICATION_CREDENTIALS=gcp-credentials.json
```

### GCS Permissions
Service account needs:
- `roles/storage.admin` - Full storage access
- Bucket location: Choose closest region (e.g., ASIA-SOUTH1)

## 📁 Project Structure

```
SmartScrub/
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── core/         # Core services (auth, storage, database)
│   │   ├── models/       # Data models
│   │   └── services/     # Business logic (profiler, cleaner, AI agent)
│   ├── main.py           # FastAPI application
│   ├── .env              # Environment configuration
│   └── requirements.txt  # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── contexts/     # React contexts (Auth, Workflow)
│   │   ├── pages/        # Page components
│   │   └── styles/       # Global styles
│   └── package.json      # Node dependencies
└── README.md
```

## 🐛 Troubleshooting

### Backend Issues

**NaN JSON Error**
- Fixed: All NaN values are converted to null before JSON serialization

**GCS Connection Failed**
- Check service account permissions
- Verify credentials file path
- Ensure bucket exists

**MySQL Connection Error**
- Verify MySQL is running
- Check credentials in .env
- Ensure database exists

### Frontend Issues

**Canvas Not Loading**
- Check backend is running on port 8000
- Verify dataset ID is valid
- Check browser console for errors

**Navigation Not Working**
- Clear localStorage: `localStorage.clear()`
- Refresh the page
- Check workflow context state

## 🚀 Production Deployment

### Backend
1. Set strong SECRET_KEY
2. Configure production database
3. Set up GCS with proper IAM roles
4. Use environment variables for secrets
5. Enable HTTPS
6. Set up proper CORS origins

### Frontend
1. Build production bundle: `npm run build`
2. Serve static files with nginx/Apache
3. Configure API endpoint
4. Enable HTTPS
5. Set up CDN for assets

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Upload
- `POST /api/upload` - Upload dataset

### Profile
- `GET /api/profile/{dataset_id}` - Get dataset profile
- `GET /api/profile/{dataset_id}/preview` - Get data preview

### Clean
- `POST /api/clean/manual/{dataset_id}` - Apply manual cleaning
- `POST /api/clean/auto/{dataset_id}` - Generate AI suggestions
- `POST /api/clean/apply/{dataset_id}` - Apply AI suggestions

### Export
- `GET /api/export/{dataset_id}` - Export cleaned data

## 🤝 Contributing

This is a complete, production-ready application. Feel free to fork and customize for your needs.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🎉 Credits

Built with modern web technologies and best practices for enterprise-grade data cleaning.
