"""
Enhanced BlogPost Model with Approval Queue
Adds pending_approval status and approval workflow fields
"""

from datetime import datetime
from src.models.user import db

class BlogPost(db.Model):
    __tablename__ = 'blog_posts'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(250), unique=True, nullable=False)
    content = db.Column(db.Text, nullable=False)
    excerpt = db.Column(db.String(500))
    category = db.Column(db.String(50), nullable=False)  # 'technical' or 'market-research'
    author = db.Column(db.String(100), nullable=False)
    
    # Enhanced status field with approval queue
    # Possible values: 'draft', 'pending_approval', 'approved', 'published', 'rejected'
    status = db.Column(db.String(20), default='draft')
    
    featured_image = db.Column(db.String(500))
    tags = db.Column(db.String(200))  # Comma-separated tags
    
    # Approval workflow fields
    submitted_for_approval_at = db.Column(db.DateTime)
    submitted_by_user_id = db.Column(db.Integer)
    approved_by_user_id = db.Column(db.Integer)
    approved_at = db.Column(db.DateTime)
    rejected_by_user_id = db.Column(db.Integer)
    rejected_at = db.Column(db.DateTime)
    rejection_reason = db.Column(db.Text)
    approval_notes = db.Column(db.Text)  # Admin notes on the post
    
    # Generation metadata
    generated_by = db.Column(db.String(50))  # 'manus', 'human', 'api'
    generation_source = db.Column(db.String(50))  # 'topic_suggestion', 'autonomous', 'manual'
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at = db.Column(db.DateTime)
    
    def submit_for_approval(self, user_id=None):
        """Submit post for approval"""
        self.status = 'pending_approval'
        self.submitted_for_approval_at = datetime.utcnow()
        if user_id:
            self.submitted_by_user_id = user_id
        db.session.commit()
    
    def approve(self, admin_user_id, notes=None, publish_immediately=True):
        """Approve post (admin only)"""
        self.status = 'approved'
        self.approved_by_user_id = admin_user_id
        self.approved_at = datetime.utcnow()
        if notes:
            self.approval_notes = notes
        
        if publish_immediately:
            self.publish()
        
        db.session.commit()
    
    def reject(self, admin_user_id, reason):
        """Reject post (admin only)"""
        self.status = 'rejected'
        self.rejected_by_user_id = admin_user_id
        self.rejected_at = datetime.utcnow()
        self.rejection_reason = reason
        db.session.commit()
    
    def publish(self):
        """Publish approved post"""
        if self.status not in ['approved', 'published']:
            raise ValueError("Only approved posts can be published")
        
        self.status = 'published'
        if not self.published_at:
            self.published_at = datetime.utcnow()
        db.session.commit()
    
    def get_schema_markup(self):
        """Generate Schema.org Article markup for SEO"""
        return {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": self.title,
            "description": self.excerpt or self.content[:200],
            "author": {
                "@type": "Person",
                "name": self.author
            },
            "datePublished": self.published_at.isoformat() if self.published_at else None,
            "dateModified": self.updated_at.isoformat(),
            "publisher": {
                "@type": "Organization",
                "name": "TenantGuard",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://www.tenantguard.net/assets/logo.png"
                }
            },
            "image": self.featured_image or "https://www.tenantguard.net/assets/logo.png",
            "articleSection": self.category,
            "keywords": self.tags
        }
    
    def get_meta_title(self):
        """Generate optimized meta title"""
        return f"{self.title} | TenantGuard Blog"
    
    def get_meta_description(self):
        """Generate optimized meta description"""
        if self.excerpt:
            return self.excerpt[:160]
        return self.content[:160] + "..."
    
    def to_dict(self, include_workflow=False):
        """Convert post to dictionary"""
        data = {
            'id': self.id,
            'title': self.title,
            'slug': self.slug,
            'content': self.content,
            'excerpt': self.excerpt,
            'category': self.category,
            'author': self.author,
            'status': self.status,
            'featured_image': self.featured_image,
            'tags': self.tags.split(',') if self.tags else [],
            'generated_by': self.generated_by,
            'generation_source': self.generation_source,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'published_at': self.published_at.isoformat() if self.published_at else None
        }
        
        if include_workflow:
            data.update({
                'submitted_for_approval_at': self.submitted_for_approval_at.isoformat() if self.submitted_for_approval_at else None,
                'submitted_by_user_id': self.submitted_by_user_id,
                'approved_by_user_id': self.approved_by_user_id,
                'approved_at': self.approved_at.isoformat() if self.approved_at else None,
                'rejected_by_user_id': self.rejected_by_user_id,
                'rejected_at': self.rejected_at.isoformat() if self.rejected_at else None,
                'rejection_reason': self.rejection_reason,
                'approval_notes': self.approval_notes
            })
        
        return data
