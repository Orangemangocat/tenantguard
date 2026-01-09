# AI-Powered Blog Management System

## Overview

The TenantGuard AI Blog Management System allows administrators to create, manage, and publish blog posts with AI assistance. The system supports multiple LLM providers and includes an approval workflow to ensure quality control.

## Features

### 1. AI-Assisted Content Generation
- **Multiple LLM Providers**: Choose from Manus AI, ChatGPT, Claude, or Gemini
- **Rich Input Options**: Provide links, text snippets, images, and context
- **Automatic Formatting**: AI generates properly structured markdown content
- **SEO Optimization**: Automatically suggests tags and optimizes content

### 2. Content Management
- **Draft System**: All AI-generated posts start as drafts
- **Revision Requests**: Request specific changes from the AI
- **Approval Queue**: Posts must be approved before publishing
- **Status Tracking**: Monitor posts through draft → pending → approved → published workflow

### 3. Approval Workflow
- **Administrator Review**: All posts require admin approval
- **Rejection with Feedback**: Provide reasons for rejection
- **Revision Loop**: Request changes and regenerate content

## Installation

### Backend Setup

1. **Install Dependencies**:
```bash
cd ~/repos/tenantguard
pip3 install -r requirements.txt
```

2. **Configure Environment Variables**:
Create a `.env` file with:
```
OPENAI_API_KEY=your_api_key_here
DATABASE_URL=postgresql://user:pass@host/dbname
```

3. **Register the Blueprint**:
Add to `src/__init__.py`:
```python
from src.routes.blog_ai import blog_ai_bp
app.register_blueprint(blog_ai_bp)
```

4. **Run Database Migrations**:
```bash
flask db upgrade
```

### Frontend Setup

1. **Add the Component**:
The `BlogAIManagement.jsx` component is already created in `frontend/src/components/`

2. **Add Route to App.jsx**:
```javascript
import BlogAIManagement from './components/BlogAIManagement.jsx'

// In your routing logic:
{showBlogAIManagement && <BlogAIManagement />}
```

3. **Install Dependencies** (if needed):
```bash
cd frontend
npm install
```

## Usage

### Creating a New Blog Post

1. Navigate to the **AI Blog Management** section
2. Click on the **"Create New Post"** tab
3. Fill in the form:
   - **Select AI Provider**: Choose your preferred LLM
   - **Topic**: Enter the blog post topic
   - **Category**: Select the appropriate category
   - **Reference Links**: Add URLs for research (one per line)
   - **Text Snippets**: Paste any relevant text or quotes
   - **Images**: Upload reference images
   - **Additional Context**: Provide specific instructions or style preferences
4. Click **"Generate Blog Post"**
5. The AI will create a draft post and save it to the database

### Managing Posts

1. Switch to the **"Manage Posts"** tab
2. View all posts with their current status
3. For draft posts:
   - Click **"Request Revisions"** to ask for changes
   - Enter your revision request and click **"Revise"**
   - Click **"Submit for Approval"** when ready
4. For pending approval posts:
   - Click **"Approve & Publish"** to publish the post
   - Click **"Reject"** to send it back with feedback

### Status Workflow

```
Draft → Pending Approval → Approved → Published
  ↓           ↓
Revise     Reject
```

## API Endpoints

### POST `/api/blog/ai-generate`
Generate a new blog post with AI

**Request Body**:
```json
{
  "llm_provider": "manus",
  "topic": "How TenantGuard Protects Your Data",
  "category": "technical",
  "author": "Manus AI",
  "links": ["https://example.com/article"],
  "text_snippets": "Key points...",
  "additional_context": "Focus on security features"
}
```

**Response**:
```json
{
  "success": true,
  "post": { ... },
  "message": "Blog post generated successfully"
}
```

### POST `/api/blog/ai-revise/:post_id`
Revise an existing blog post

**Request Body**:
```json
{
  "revision_request": "Make the introduction more engaging"
}
```

### POST `/api/blog/approve/:post_id`
Approve a post for publication

### POST `/api/blog/reject/:post_id`
Reject a post with feedback

**Request Body**:
```json
{
  "reason": "Content needs more technical detail"
}
```

## Database Schema

The `BlogPost` model includes the following fields for AI management:

```python
generated_by = db.Column(db.String(50))  # 'manus', 'chatgpt', etc.
generation_source = db.Column(db.String(50))  # 'ai_assisted', 'autonomous', 'manual'
status = db.Column(db.String(20))  # 'draft', 'pending_approval', 'approved', 'published', 'rejected'
submitted_for_approval_at = db.Column(db.DateTime)
approved_by_user_id = db.Column(db.Integer)
approved_at = db.Column(db.DateTime)
rejected_by_user_id = db.Column(db.Integer)
rejected_at = db.Column(db.DateTime)
rejection_reason = db.Column(db.Text)
```

## Configuration

### LLM Provider Configuration

Edit `src/routes/blog_ai.py` to add or modify LLM providers:

```python
def call_llm_api(provider, prompt, context=None):
    if provider == 'your_provider':
        # Add your implementation here
        pass
```

### Frontend LLM Options

Edit `frontend/src/components/BlogAIManagement.jsx`:

```javascript
const LLM_PROVIDERS = [
  { id: 'manus', name: 'Manus AI', description: '...' },
  // Add more providers here
];
```

## Security Considerations

1. **Authentication**: All endpoints require admin authentication
2. **API Keys**: Store LLM API keys in environment variables
3. **Input Validation**: All user inputs are validated before processing
4. **Approval Workflow**: Prevents unauthorized publishing

## Troubleshooting

### "Module not found" errors
```bash
pip3 install -r requirements.txt
```

### Database connection errors
Check your `.env` file and ensure the `DATABASE_URL` is correct

### AI generation fails
- Verify your `OPENAI_API_KEY` is set correctly
- Check API rate limits
- Review error logs in the console

## Future Enhancements

- [ ] Image generation integration
- [ ] Automatic SEO scoring
- [ ] Scheduled publishing
- [ ] Multi-language support
- [ ] Content analytics
- [ ] A/B testing for titles

## Support

For issues or questions, contact the development team or file an issue in the repository.
