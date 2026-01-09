# TenantGuard AI Blog Management System - Installation Guide

## Package Contents

This archive contains all the files for the AI-powered blog management system:

### Documentation
- `AI_BLOG_MANAGEMENT_README.md` - Complete system documentation
- `tenet_defend_competitor_research.md` - Research notes
- `tenet_defend_competitor_summary.md` - Research summary

### Blog Post Content
- `competitive_landscape_blog_post.md` - Blog post in markdown format
- `blog_post_competitive_landscape.json` - Blog post data for database import
- `add_competitive_landscape_blog.py` - Python script to add the blog post to database

### Frontend Components
- `frontend/src/components/BlogAIManagement.jsx` - Main React component

### Backend API
- `src/routes/blog_ai.py` - Flask API routes for AI blog generation

### Assets
- `frontend/public/assets/blog/competitive-landscape.jpg` - Featured image
- `frontend/public/assets/blog/cybersecurity-law-and-justice.jpg` - Additional image

## Installation Steps

### 1. Extract the Archive

```bash
cd /path/to/your/tenantguard/repo
tar -xzf tenantguard_ai_blog_system.tar.gz
```

This will extract all files to their correct locations within your repository.

### 2. Backend Setup

#### A. Register the New Blueprint

Edit `src/__init__.py` (or your main app file) and add:

```python
from src.routes.blog_ai import blog_ai_bp

# Register the blueprint
app.register_blueprint(blog_ai_bp)
```

#### B. Configure Environment Variables

Add to your `.env` file:

```
OPENAI_API_KEY=your_openai_api_key_here
```

#### C. Install Dependencies (if needed)

```bash
pip3 install requests
```

### 3. Frontend Setup

#### A. Add Route to App.jsx

Edit `frontend/src/App.jsx` and add:

```javascript
import BlogAIManagement from './components/BlogAIManagement.jsx'

// Add state for showing the component
const [showBlogAIManagement, setShowBlogAIManagement] = useState(false)

// Add to your routing/navigation logic
{showBlogAIManagement && <BlogAIManagement />}
```

#### B. Add Navigation Link

Add a link to access the AI blog management:

```javascript
<button onClick={() => setShowBlogAIManagement(true)}>
  AI Blog Management
</button>
```

### 4. Add the Competitive Landscape Blog Post

#### Option A: Using the Python Script

```bash
cd /path/to/your/tenantguard/repo
python3 add_competitive_landscape_blog.py
```

This will add the blog post to your database with status "pending_approval".

#### Option B: Using the API

```bash
curl -X POST http://localhost:5000/api/blog/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d @blog_post_competitive_landscape.json
```

#### Option C: Manual Import

Import the JSON data from `blog_post_competitive_landscape.json` through your admin panel.

### 5. Test the System

1. Start your backend server:
   ```bash
   flask run
   ```

2. Start your frontend:
   ```bash
   cd frontend
   npm start
   ```

3. Navigate to the AI Blog Management section
4. Try creating a new blog post
5. Test the revision workflow
6. Approve and publish the competitive landscape post

## Configuration

### Adding More LLM Providers

Edit `src/routes/blog_ai.py` and add your provider in the `call_llm_api()` function:

```python
elif provider == 'your_provider':
    # Your implementation here
    pass
```

Also update the frontend in `frontend/src/components/BlogAIManagement.jsx`:

```javascript
const LLM_PROVIDERS = [
  // ... existing providers
  { id: 'your_provider', name: 'Your Provider', description: 'Description' }
];
```

### Customizing Categories

Edit the `CATEGORIES` array in `BlogAIManagement.jsx`:

```javascript
const CATEGORIES = [
  { id: 'technical', name: 'Technical Update' },
  { id: 'market-research', name: 'Market Research' },
  // Add your categories here
];
```

## Troubleshooting

### "Module not found" errors
```bash
pip3 install -r requirements.txt
```

### API returns 401 Unauthorized
- Ensure you're logged in as an admin
- Check that the JWT token is valid
- Verify the `@admin_required` decorator is working

### AI generation fails
- Verify `OPENAI_API_KEY` is set in `.env`
- Check API rate limits
- Review console logs for detailed errors

### Database errors
- Run migrations: `flask db upgrade`
- Check database connection in `.env`
- Verify the `BlogPost` model has all required fields

## Git Commit

After installation, commit the changes:

```bash
git add -A
git commit -m "Add AI-powered blog management system with competitive landscape blog post"
git push origin main
```

## Support

For detailed documentation, see `AI_BLOG_MANAGEMENT_README.md`.

For issues, check the console logs and error messages, or contact the development team.

## Quick Reference

### File Locations
- Frontend Component: `frontend/src/components/BlogAIManagement.jsx`
- Backend API: `src/routes/blog_ai.py`
- Blog Post Data: `blog_post_competitive_landscape.json`
- Documentation: `AI_BLOG_MANAGEMENT_README.md`

### Key Features
✅ Multi-LLM support (Manus, ChatGPT, Claude, Gemini)
✅ Rich input options (links, text, images)
✅ Draft management
✅ Revision requests
✅ Approval workflow
✅ Status tracking

### Workflow
1. Create → 2. Draft → 3. Revise (optional) → 4. Submit for Approval → 5. Approve → 6. Publish
