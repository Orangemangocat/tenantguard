# TenantGuard - Complete Source Code

## Overview

TenantGuard is a comprehensive landlord-tenant legal platform designed for Davidson County, Tennessee. It connects tenants with qualified attorneys through a technology-enabled self-service platform that streamlines dispute resolution.

## Architecture

This is a **full-stack web application** consisting of:

- **Frontend**: React 18 application with modern UI components
- **Backend**: Flask API server with SQLite database
- **Database**: SQLite with comprehensive schemas for cases and attorneys
- **Deployment**: Production-ready with static file serving

## Features

### For Tenants
- **8-Step Case Intake Form**: Comprehensive data collection
- **Document Upload**: Secure file handling
- **Case Tracking**: Real-time status updates
- **Legal Templates**: Tennessee-specific forms
- **Mobile Responsive**: Works on all devices

### For Attorneys
- **7-Step Attorney Application**: Complete professional profile
- **Budget & Pricing Configuration**: Hourly rates, fee structures
- **Lead Generation Preferences**: Monthly budgets ($0-$500 to $5,000+)
- **Case Matching**: Automated attorney-case matching
- **Service Area Management**: Geographic coverage settings

### Platform Benefits
- **60% Cost Reduction**: From $2,500 to $1,000 average legal costs
- **70% Time Savings**: Attorney case setup from 4.5 hours to under 1 hour
- **90% Completeness**: Document organization and case preparation

## Directory Structure

```
tenantdefend-complete-source/
├── src/                          # Flask Backend
│   ├── main.py                   # Main Flask application
│   ├── models/                   # Database models
│   │   ├── case.py              # Case data model
│   │   └── attorney.py          # Attorney data model
│   ├── routes/                   # API endpoints
│   │   ├── case.py              # Case management APIs
│   │   └── attorney.py          # Attorney management APIs
│   └── static/                   # Built frontend files
├── frontend/                     # React Frontend Source
│   ├── src/
│   │   ├── App.jsx              # Main React application
│   │   ├── components/
│   │   │   ├── CaseIntakeForm.jsx    # 8-step tenant form
│   │   │   └── AttorneyIntakeForm.jsx # 7-step attorney form
│   │   └── assets/              # Images and static assets
│   ├── package.json             # Frontend dependencies
│   └── vite.config.js           # Build configuration
├── requirements.txt             # Python dependencies
├── README.md                    # This file
└── DEPLOYMENT.md               # Deployment instructions
```

## Technology Stack

### Frontend
- **React 18**: Modern React with hooks
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/UI**: High-quality UI components
- **Lucide Icons**: Beautiful icon library
- **Vite**: Fast build tool and development server

### Backend
- **Flask**: Lightweight Python web framework
- **SQLite**: Embedded database
- **Flask-CORS**: Cross-origin resource sharing
- **Python 3.11**: Modern Python runtime

### Infrastructure
- **Static File Serving**: Integrated frontend/backend
- **RESTful APIs**: Clean API design
- **Database Migrations**: Automatic schema creation
- **Production Ready**: Optimized for deployment

## API Endpoints

### Case Management
- `POST /api/cases` - Create new case
- `GET /api/cases` - List all cases
- `GET /api/cases/{case_number}` - Get specific case
- `PUT /api/cases/{case_number}` - Update case
- `GET /api/cases/search` - Search cases
- `GET /api/cases/stats` - Case statistics

### Attorney Management
- `POST /api/attorneys` - Create attorney application
- `GET /api/attorneys` - List all attorneys
- `GET /api/attorneys/{application_id}` - Get specific attorney
- `PUT /api/attorneys/{application_id}/status` - Update status
- `GET /api/attorneys/search` - Search attorneys
- `POST /api/attorneys/match` - Match attorneys to cases

## Database Schema

### Cases Table
- Complete tenant information (contact, demographics)
- Property and lease details
- Legal issue documentation
- Financial information
- Case status and timeline tracking

### Attorneys Table
- Professional credentials and experience
- Practice areas and expertise levels
- Case preferences and capacity
- Budget and pricing structure
- Lead generation preferences
- Service coverage areas

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- pnpm or npm

### Backend Setup
```bash
cd tenantdefend-complete-source
pip install -r requirements.txt
python src/main.py
```

### Frontend Development
```bash
cd frontend
pnpm install
pnpm run dev
```

### Production Build
```bash
cd frontend
pnpm run build
# Built files are automatically copied to src/static/
```

## Deployment

See `DEPLOYMENT.md` for detailed deployment instructions including:
- Server requirements
- Nginx configuration
- SSL certificate setup
- Environment variables
- Database initialization

## Key Features Implementation

### Multi-Step Forms
Both tenant and attorney intake forms use a sophisticated multi-step wizard with:
- Progress tracking
- Data validation
- State persistence
- Conditional logic
- Professional UI/UX

### Case-Attorney Matching
Intelligent matching algorithm considers:
- Geographic service areas
- Practice area expertise
- Case type preferences
- Attorney availability
- Experience levels

### Data Management
Comprehensive data handling with:
- Input validation and sanitization
- Error handling and logging
- Search and filtering capabilities
- Statistics and analytics
- Audit trails

## Security Features
- Input validation and sanitization
- CORS configuration
- SQL injection prevention
- Error handling without data exposure
- Secure file upload handling

## Performance Optimizations
- Static file serving
- Database indexing
- Efficient queries
- Frontend code splitting
- Image optimization

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License
Proprietary - TenantGuard Platform

## Support
For technical support or questions about the platform, contact the development team.

---

**TenantGuard** - Transforming tenant legal representation in Tennessee.
