from datetime import datetime
import json
from src.models.user import db


class CaseAnalysis(db.Model):
    __tablename__ = 'case_analyses'

    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.Integer, db.ForeignKey('cases.id'), nullable=False)
    analysis = db.Column(db.Text, nullable=False)  # JSON string
    provider = db.Column(db.String(50), nullable=True)
    confidence = db.Column(db.String(20), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    case = db.relationship('Case', backref=db.backref('analyses', lazy=True))

    def to_dict(self):
        try:
            analysis_obj = json.loads(self.analysis)
        except Exception:
            analysis_obj = {'raw': self.analysis}

        return {
            'id': self.id,
            'case_id': self.case_id,
            'analysis': analysis_obj,
            'provider': self.provider,
            'confidence': self.confidence,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
