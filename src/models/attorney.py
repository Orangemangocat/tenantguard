"""
SQLAlchemy Attorney Model
Migrated from SQLite to PostgreSQL using SQLAlchemy ORM
"""
from datetime import datetime
from src.models.user import db
import json

class AttorneyApplication(db.Model):
    """Attorney application model for PostgreSQL"""
    __tablename__ = 'attorney_applications'
    
    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.String(255), unique=True, nullable=False)
    
    # Professional Information
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    firm_name = db.Column(db.String(255), nullable=False)
    firm_address = db.Column(db.Text, nullable=False)
    firm_city = db.Column(db.String(100), default='Nashville')
    firm_zip = db.Column(db.String(10), nullable=False)
    firm_website = db.Column(db.String(500))
    
    # Legal Credentials
    bar_number = db.Column(db.String(50), nullable=False)
    bar_state = db.Column(db.String(2), nullable=False)
    bar_admission_date = db.Column(db.String(50), nullable=False)
    law_school = db.Column(db.String(255), nullable=False)
    graduation_year = db.Column(db.String(4), nullable=False)
    years_experience = db.Column(db.String(50), nullable=False)
    
    # Practice Areas (stored as JSON)
    practice_areas = db.Column(db.Text)  # JSON array
    landlord_tenant_experience = db.Column(db.Text, nullable=False)
    eviction_experience = db.Column(db.Text, nullable=False)
    court_experience = db.Column(db.Text)  # JSON array
    specializations = db.Column(db.Text)  # JSON array
    
    # Case Preferences
    case_types = db.Column(db.Text)  # JSON array
    client_types = db.Column(db.Text)  # JSON array
    minimum_case_value = db.Column(db.String(50))
    case_volume_interest = db.Column(db.String(50))
    
    # Service Areas
    service_areas = db.Column(db.Text, nullable=False)  # JSON array
    
    # Response & Rates
    response_time = db.Column(db.String(50), nullable=False)
    hourly_rate = db.Column(db.String(50), nullable=False)
    fee_structure_preference = db.Column(db.String(255), nullable=False)
    
    # Business Info
    lead_budget = db.Column(db.String(50), nullable=False)
    lead_volume = db.Column(db.String(50), nullable=False)
    lead_quality = db.Column(db.String(50), nullable=False)
    
    # Platform Preferences
    profile_visibility = db.Column(db.String(50))
    client_communication = db.Column(db.Text)  # JSON array
    case_updates = db.Column(db.Text)
    marketing_consent = db.Column(db.Boolean, default=False)
    data_sharing = db.Column(db.Boolean, default=False)
    
    # Additional Information
    motivation = db.Column(db.Text, nullable=False)
    additional_services = db.Column(db.Text)
    special_requirements = db.Column(db.Text)
    
    # Terms & Agreements
    terms_accepted = db.Column(db.Boolean, default=False, nullable=False)
    privacy_consent = db.Column(db.Boolean, default=False, nullable=False)
    
    # Application Status
    status = db.Column(db.String(50), default='pending_review')
    review_date = db.Column(db.DateTime)
    approval_date = db.Column(db.DateTime)
    reviewer_notes = db.Column(db.Text)
    
    # Profile Settings
    profile_active = db.Column(db.Boolean, default=False)
    accepting_cases = db.Column(db.Boolean, default=False)
    last_login = db.Column(db.DateTime)
    
    # Timestamps
    application_date = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'application_id': self.application_id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'email': self.email,
            'phone': self.phone,
            'firm_name': self.firm_name,
            'firm_address': self.firm_address,
            'firm_city': self.firm_city,
            'firm_zip': self.firm_zip,
            'firm_website': self.firm_website,
            'bar_number': self.bar_number,
            'bar_state': self.bar_state,
            'bar_admission_date': self.bar_admission_date,
            'law_school': self.law_school,
            'graduation_year': self.graduation_year,
            'years_experience': self.years_experience,
            'practice_areas': json.loads(self.practice_areas) if self.practice_areas else [],
            'landlord_tenant_experience': self.landlord_tenant_experience,
            'eviction_experience': self.eviction_experience,
            'court_experience': json.loads(self.court_experience) if self.court_experience else [],
            'specializations': json.loads(self.specializations) if self.specializations else [],
            'case_types': json.loads(self.case_types) if self.case_types else [],
            'client_types': json.loads(self.client_types) if self.client_types else [],
            'minimum_case_value': self.minimum_case_value,
            'case_volume_interest': self.case_volume_interest,
            'service_areas': json.loads(self.service_areas) if self.service_areas else [],
            'response_time': self.response_time,
            'hourly_rate': self.hourly_rate,
            'fee_structure_preference': self.fee_structure_preference,
            'lead_budget': self.lead_budget,
            'lead_volume': self.lead_volume,
            'lead_quality': self.lead_quality,
            'profile_visibility': self.profile_visibility,
            'client_communication': json.loads(self.client_communication) if self.client_communication else [],
            'case_updates': self.case_updates,
            'marketing_consent': self.marketing_consent,
            'data_sharing': self.data_sharing,
            'motivation': self.motivation,
            'additional_services': self.additional_services,
            'special_requirements': self.special_requirements,
            'terms_accepted': self.terms_accepted,
            'privacy_consent': self.privacy_consent,
            'status': self.status,
            'review_date': self.review_date.isoformat() if self.review_date else None,
            'approval_date': self.approval_date.isoformat() if self.approval_date else None,
            'reviewer_notes': self.reviewer_notes,
            'profile_active': self.profile_active,
            'accepting_cases': self.accepting_cases,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'application_date': self.application_date.isoformat() if self.application_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


# Keep backward compatibility - Attorney class can delegate to AttorneyApplication
class Attorney:
    """
    Wrapper class for backward compatibility
    All operations now use SQLAlchemy AttorneyApplication model with PostgreSQL
    """
    def __init__(self, db_path=None):
        """Initialize - db_path is ignored, uses PostgreSQL via SQLAlchemy"""
        pass
    
    def init_db(self):
        """No-op for backward compatibility - tables created via SQLAlchemy"""
        pass
    
    def create_attorney(self, attorney_data):
        """Create a new attorney application"""
        try:
            new_attorney = AttorneyApplication(
                application_id=attorney_data.get('applicationId') or str(datetime.utcnow().timestamp()),
                first_name=attorney_data.get('firstName'),
                last_name=attorney_data.get('lastName'),
                email=attorney_data.get('email'),
                phone=attorney_data.get('phone'),
                firm_name=attorney_data.get('firmName'),
                firm_address=attorney_data.get('firmAddress'),
                firm_city=attorney_data.get('firmCity', 'Nashville'),
                firm_zip=attorney_data.get('firmZip'),
                firm_website=attorney_data.get('firmWebsite'),
                bar_number=attorney_data.get('barNumber'),
                bar_state=attorney_data.get('barState'),
                bar_admission_date=attorney_data.get('barAdmissionDate'),
                law_school=attorney_data.get('lawSchool'),
                graduation_year=attorney_data.get('graduationYear'),
                years_experience=attorney_data.get('yearsExperience'),
                practice_areas=json.dumps(attorney_data.get('practiceAreas', [])),
                landlord_tenant_experience=attorney_data.get('landlordTenantExperience'),
                eviction_experience=attorney_data.get('evictionExperience'),
                court_experience=json.dumps(attorney_data.get('courtExperience', [])),
                specializations=json.dumps(attorney_data.get('specializations', [])),
                case_types=json.dumps(attorney_data.get('caseTypes', [])),
                client_types=json.dumps(attorney_data.get('clientTypes', [])),
                minimum_case_value=attorney_data.get('minimumCaseValue'),
                case_volume_interest=attorney_data.get('caseVolumeInterest'),
                service_areas=json.dumps(attorney_data.get('serviceAreas', [])),
                response_time=attorney_data.get('responseTime'),
                hourly_rate=attorney_data.get('hourlyRate'),
                fee_structure_preference=attorney_data.get('feeStructurePreference'),
                lead_budget=attorney_data.get('leadBudget'),
                lead_volume=attorney_data.get('leadVolume'),
                lead_quality=attorney_data.get('leadQuality'),
                profile_visibility=attorney_data.get('profileVisibility'),
                client_communication=json.dumps(attorney_data.get('clientCommunication', [])),
                case_updates=attorney_data.get('caseUpdates'),
                marketing_consent=attorney_data.get('marketingConsent', False),
                data_sharing=attorney_data.get('dataSharing', False),
                motivation=attorney_data.get('motivation'),
                additional_services=attorney_data.get('additionalServices'),
                special_requirements=attorney_data.get('specialRequirements'),
                terms_accepted=attorney_data.get('termsAccepted', False),
                privacy_consent=attorney_data.get('privacyConsent', False),
                status=attorney_data.get('status', 'pending_review'),
            )
            
            db.session.add(new_attorney)
            db.session.commit()
            
            return {
                'success': True,
                'message': 'Attorney application created successfully',
                'application_id': new_attorney.application_id,
                'data': new_attorney.to_dict()
            }
        except Exception as e:
            db.session.rollback()
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_attorney(self, attorney_id):
        """Get attorney by ID"""
        attorney = AttorneyApplication.query.get(attorney_id)
        return attorney.to_dict() if attorney else None
    
    def get_attorney_by_application_id(self, application_id):
        """Get attorney by application ID"""
        attorney = AttorneyApplication.query.filter_by(application_id=application_id).first()
        return attorney.to_dict() if attorney else None
    
    def get_attorney_by_email(self, email):
        """Get attorney by email"""
        attorney = AttorneyApplication.query.filter_by(email=email).first()
        return attorney.to_dict() if attorney else None
    
    def get_all_attorneys(self, status=None, limit=None):
        """Get all attorneys with optional filtering"""
        query = AttorneyApplication.query
        if status:
            query = query.filter_by(status=status)
        if limit:
            query = query.limit(limit)
        return [attorney.to_dict() for attorney in query.all()]
    
    def update_attorney_status(self, application_id, status, reviewer_notes=None):
        """Update attorney application status"""
        attorney = AttorneyApplication.query.filter_by(application_id=application_id).first()
        if not attorney:
            return {'success': False, 'error': 'Attorney not found'}
        
        attorney.status = status
        attorney.reviewer_notes = reviewer_notes
        attorney.review_date = datetime.utcnow()
        if status == 'approved':
            attorney.approval_date = datetime.utcnow()
            attorney.profile_active = True
        
        db.session.commit()
        return {'success': True, 'data': attorney.to_dict()}
    
    def update_attorney_profile(self, attorney_id, updates):
        """Update attorney profile"""
        attorney = AttorneyApplication.query.get(attorney_id)
        if not attorney:
            return {'success': False, 'error': 'Attorney not found'}
        
        for key, value in updates.items():
            if hasattr(attorney, key):
                setattr(attorney, key, value)
        
        attorney.updated_at = datetime.utcnow()
        db.session.commit()
        return {'success': True, 'data': attorney.to_dict()}

