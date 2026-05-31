from datetime import datetime
from src.models.user import db


class BlogSlugHistory(db.Model):
    __tablename__ = 'blog_slug_history'

    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, nullable=False, index=True)
    old_slug = db.Column(db.String(250), nullable=False, unique=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
