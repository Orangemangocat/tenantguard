from datetime import datetime
import json
from src.models.user import db

class Case(db.Model):
    __tablename__ = 'cases'
    
    id = db.Column(db.Integer, primary_key=True)
    case_number = db.Column(db.String(20), unique=True, nullable=False)
    status = db.Column(db.String(20), default='intake_submitted')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Contact Information
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    preferred_contact = db.Column(db.String(20), nullable=False)
    street_address = db.Column(db.String(255), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    zip_code = db.Column(db.String(10), nullable=False)
    
    # Tenant Information
    age = db.Column(db.Integer)
    has_disability = db.Column(db.Boolean, default=False)
    has_children = db.Column(db.Boolean, default=False)
    household_income = db.Column(db.String(50))
    primary_language = db.Column(db.String(50), default='English')
    
    # Property Information
    rental_address = db.Column(db.String(255), nullable=False)
    property_type = db.Column(db.String(50))
    bedrooms = db.Column(db.Integer)
    monthly_rent = db.Column(db.Float, nullable=False)
    security_deposit = db.Column(db.Float)
    move_in_date = db.Column(db.Date)
    lease_type = db.Column(db.String(50))
    has_housing_assistance = db.Column(db.Boolean, default=False)
    
    # Landlord Information
    landlord_name = db.Column(db.String(255))
    landlord_email = db.Column(db.String(255))
    landlord_phone = db.Column(db.String(20))
    property_manager_name = db.Column(db.String(255))
    property_manager_email = db.Column(db.String(255))
    property_manager_phone = db.Column(db.String(20))
    
    # Legal Issue Information
    issue_type = db.Column(db.String(100))
    issue_description = db.Column(db.Text)
    issue_start_date = db.Column(db.Date)
    urgency_level = db.Column(db.String(20))
    previous_legal_action = db.Column(db.Boolean, default=False)
    
    # Eviction Notice Information
    eviction_notice_received = db.Column(db.Boolean, default=False)
    eviction_notice_type = db.Column(db.String(100))
    eviction_notice_date = db.Column(db.Date)
    court_date = db.Column(db.Date)
    response_deadline = db.Column(db.Date)
    
    # Financial Information
    rent_current = db.Column(db.Boolean, default=True)
    amount_owed = db.Column(db.Float)
    last_payment_date = db.Column(db.Date)
    payment_dispute = db.Column(db.Boolean, default=False)
    financial_hardship = db.Column(db.Boolean, default=False)
    
    # Documents and Preferences
    documents_uploaded = db.Column(db.Text)  # JSON string of document info
    attorney_preference = db.Column(db.String(50))
    case_summary = db.Column(db.Text)
    
    def __init__(self, **kwargs):
        super(Case, self).__init__(**kwargs)
        if not self.case_number:
            self.case_number = self.generate_case_number()
    
    def generate_case_number(self):
        """Generate a unique case number"""
        import random
        import string
        prefix = "TD"
        year = datetime.now().year
        random_suffix = ''.join(random.choices(string.digits, k=6))
        return f"{prefix}{year}{random_suffix}"
    
    def to_dict(self):
        """Convert case to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'case_number': self.case_number,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'contact_info': {
                'first_name': self.first_name,
                'last_name': self.last_name,
                'email': self.email,
                'phone': self.phone,
                'preferred_contact': self.preferred_contact,
                'address': {
                    'street': self.street_address,
                    'city': self.city,
                    'zip_code': self.zip_code
                }
            },
            'tenant_info': {
                'age': self.age,
                'has_disability': self.has_disability,
                'has_children': self.has_children,
                'household_income': self.household_income,
                'primary_language': self.primary_language
            },
            'property_info': {
                'rental_address': self.rental_address,
                'property_type': self.property_type,
                'bedrooms': self.bedrooms,
                'monthly_rent': self.monthly_rent,
                'security_deposit': self.security_deposit,
                'move_in_date': self.move_in_date.isoformat() if self.move_in_date else None,
                'lease_type': self.lease_type,
                'has_housing_assistance': self.has_housing_assistance
            },
            'landlord_info': {
                'name': self.landlord_name,
                'email': self.landlord_email,
                'phone': self.landlord_phone,
                'property_manager': {
                    'name': self.property_manager_name,
                    'email': self.property_manager_email,
                    'phone': self.property_manager_phone
                }
            },
            'legal_issue': {
                'type': self.issue_type,
                'description': self.issue_description,
                'start_date': self.issue_start_date.isoformat() if self.issue_start_date else None,
                'urgency_level': self.urgency_level,
                'previous_legal_action': self.previous_legal_action
            },
            'eviction_info': {
                'notice_received': self.eviction_notice_received,
                'notice_type': self.eviction_notice_type,
                'notice_date': self.eviction_notice_date.isoformat() if self.eviction_notice_date else None,
                'court_date': self.court_date.isoformat() if self.court_date else None,
                'response_deadline': self.response_deadline.isoformat() if self.response_deadline else None
            },
            'financial_info': {
                'rent_current': self.rent_current,
                'amount_owed': self.amount_owed,
                'last_payment_date': self.last_payment_date.isoformat() if self.last_payment_date else None,
                'payment_dispute': self.payment_dispute,
                'financial_hardship': self.financial_hardship
            },
            'documents_uploaded': json.loads(self.documents_uploaded) if self.documents_uploaded else [],
            'attorney_preference': self.attorney_preference,
            'case_summary': self.case_summary
        }
    
    @classmethod
    def from_intake_data(cls, data):
        """Create a Case instance from intake form data"""
        from datetime import datetime
        
        # Parse dates
        def parse_date(date_str):
            if date_str:
                try:
                    return datetime.strptime(date_str, '%Y-%m-%d').date()
                except:
                    return None
            return None
        
        case = cls(
            # Contact Information
            first_name=data.get('firstName', ''),
            last_name=data.get('lastName', ''),
            email=data.get('email', ''),
            phone=data.get('phone', ''),
            preferred_contact=data.get('preferredContact', 'email'),
            street_address=data.get('streetAddress', ''),
            city=data.get('city', ''),
            zip_code=data.get('zipCode', ''),
            
            # Tenant Information
            age=int(data.get('age', 0)) if data.get('age') else None,
            has_disability=data.get('hasDisability', False),
            has_children=data.get('hasChildren', False),
            household_income=data.get('householdIncome', ''),
            primary_language=data.get('primaryLanguage', 'English'),
            
            # Property Information
            rental_address=data.get('rentalAddress', ''),
            property_type=data.get('propertyType', ''),
            bedrooms=int(data.get('bedrooms', 0)) if data.get('bedrooms') else None,
            monthly_rent=float(data.get('monthlyRent', 0)) if data.get('monthlyRent') else 0,
            security_deposit=float(data.get('securityDeposit', 0)) if data.get('securityDeposit') else None,
            move_in_date=parse_date(data.get('moveInDate')),
            lease_type=data.get('leaseType', ''),
            has_housing_assistance=data.get('hasHousingAssistance', False),
            
            # Landlord Information
            landlord_name=data.get('landlordName', ''),
            landlord_email=data.get('landlordEmail', ''),
            landlord_phone=data.get('landlordPhone', ''),
            property_manager_name=data.get('propertyManagerName', ''),
            property_manager_email=data.get('propertyManagerEmail', ''),
            property_manager_phone=data.get('propertyManagerPhone', ''),
            
            # Legal Issue Information
            issue_type=data.get('issueType', ''),
            issue_description=data.get('issueDescription', ''),
            issue_start_date=parse_date(data.get('issueStartDate')),
            urgency_level=data.get('urgencyLevel', ''),
            previous_legal_action=data.get('previousLegalAction', False),
            
            # Eviction Notice Information
            eviction_notice_received=data.get('evictionNoticeReceived', False),
            eviction_notice_type=data.get('evictionNoticeType', ''),
            eviction_notice_date=parse_date(data.get('evictionNoticeDate')),
            court_date=parse_date(data.get('courtDate')),
            response_deadline=parse_date(data.get('responseDeadline')),
            
            # Financial Information
            rent_current=data.get('rentCurrent', True),
            amount_owed=float(data.get('amountOwed', 0)) if data.get('amountOwed') else None,
            last_payment_date=parse_date(data.get('lastPaymentDate')),
            payment_dispute=data.get('paymentDispute', False),
            financial_hardship=data.get('financialHardship', False),
            
            # Documents and Preferences
            documents_uploaded=json.dumps(data.get('documentsUploaded', [])),
            attorney_preference=data.get('attorneyPreference', ''),
            case_summary=data.get('caseSummary', '')
        )
        
        return case
