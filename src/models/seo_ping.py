from datetime import datetime

from src.models.user import db


class SeoPingLog(db.Model):
    __tablename__ = 'seo_ping_logs'

    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, nullable=True)
    post_slug = db.Column(db.String(255))
    post_title = db.Column(db.String(500))
    sitemap_url = db.Column(db.String(1000))
    ping_url = db.Column(db.String(1000))
    status_code = db.Column(db.Integer)
    ok = db.Column(db.Boolean, default=False)
    error = db.Column(db.Text)
    source = db.Column(db.String(100))
    search_console_status = db.Column(db.String(50))
    search_console_summary = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'post_id': self.post_id,
            'post_slug': self.post_slug,
            'post_title': self.post_title,
            'sitemap_url': self.sitemap_url,
            'ping_url': self.ping_url,
            'status_code': self.status_code,
            'ok': self.ok,
            'error': self.error,
            'source': self.source,
            'search_console_status': self.search_console_status,
            'search_console_summary': self.search_console_summary,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
