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
    status = db.Column(db.String(20), default='draft')  # 'draft' or 'published'
    featured_image = db.Column(db.String(500))
    tags = db.Column(db.String(200))  # Comma-separated tags
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at = db.Column(db.DateTime)
    
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
    
    def to_dict(self):
        return {
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
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'published_at': self.published_at.isoformat() if self.published_at else None
        }
