"""
Blog Topic Suggestion Model
Allows admins to suggest topics for Manus to research and write about
"""

from datetime import datetime
from src.models.user import db

class BlogTopic(db.Model):
    __tablename__ = 'blog_topics'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)  # Additional context or angle
    category = db.Column(db.String(50), nullable=False)  # 'technical' or 'market-research'
    research_links = db.Column(db.Text)  # JSON array of URLs
    research_notes = db.Column(db.Text)  # Key quotes, data points, specific instructions
    priority = db.Column(db.String(20), default='normal')  # 'low', 'normal', 'high', 'urgent'
    status = db.Column(db.String(20), default='pending')  # 'pending', 'in_progress', 'completed', 'cancelled'
    assigned_to = db.Column(db.String(50), default='manus')  # Which AI agent will handle this
    created_by = db.Column(db.String(100))  # Admin who created the suggestion
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    blog_post_id = db.Column(db.Integer, db.ForeignKey('blog_posts.id'))  # Link to generated post
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'research_links': self.research_links,
            'research_notes': self.research_notes,
            'priority': self.priority,
            'status': self.status,
            'assigned_to': self.assigned_to,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'blog_post_id': self.blog_post_id
        }


class BlogSchedule(db.Model):
    __tablename__ = 'blog_schedule'
    
    id = db.Column(db.Integer, primary_key=True)
    last_post_date = db.Column(db.DateTime)
    next_auto_post_date = db.Column(db.DateTime)
    auto_posting_enabled = db.Column(db.Boolean, default=True)
    max_days_between_posts = db.Column(db.Integer, default=5)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'last_post_date': self.last_post_date.isoformat() if self.last_post_date else None,
            'next_auto_post_date': self.next_auto_post_date.isoformat() if self.next_auto_post_date else None,
            'auto_posting_enabled': self.auto_posting_enabled,
            'max_days_between_posts': self.max_days_between_posts,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
