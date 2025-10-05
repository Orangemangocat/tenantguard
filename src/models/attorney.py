from datetime import datetime
import sqlite3
import json
import uuid

class Attorney:
    def __init__(self, db_path='tenantdefend.db'):
        self.db_path = db_path
        self.init_db()
    
    def init_db(self):
        """Initialize the attorney database table"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS attorneys (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                application_id TEXT UNIQUE NOT NULL,
                
                -- Professional Information
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                phone TEXT NOT NULL,
                firm_name TEXT NOT NULL,
                firm_address TEXT NOT NULL,
                firm_city TEXT DEFAULT 'Nashville',
                firm_zip TEXT NOT NULL,
                firm_website TEXT,
                
                -- Legal Credentials
                bar_number TEXT NOT NULL,
                bar_state TEXT NOT NULL,
                bar_admission_date TEXT NOT NULL,
                law_school TEXT NOT NULL,
                graduation_year TEXT NOT NULL,
                years_experience TEXT NOT NULL,
                
                -- Practice Areas & Expertise
                practice_areas TEXT, -- JSON array
                landlord_tenant_experience TEXT NOT NULL,
                eviction_experience TEXT NOT NULL,
                court_experience TEXT, -- JSON array
                specializations TEXT, -- JSON array
                
                -- Case Preferences
                case_types TEXT, -- JSON array
                client_types TEXT, -- JSON array
                minimum_case_value TEXT,
                maximum_caseload TEXT,
                response_time TEXT NOT NULL,
                availability_hours TEXT, -- JSON array
                
                -- Budget & Pricing
                hourly_rate TEXT NOT NULL,
                flat_fee_services TEXT, -- JSON array
                payment_terms TEXT,
                retainer_amount TEXT,
                payment_methods TEXT, -- JSON array
                fee_structure_preference TEXT NOT NULL,
                
                -- Lead Generation Preferences
                lead_budget TEXT NOT NULL,
                lead_volume TEXT NOT NULL,
                lead_quality TEXT NOT NULL,
                marketing_preferences TEXT, -- JSON array
                referral_sources TEXT, -- JSON array
                
                -- Geographic Coverage
                service_areas TEXT, -- JSON array
                travel_radius TEXT,
                remote_consultation BOOLEAN DEFAULT 0,
                
                -- Technology & Tools
                case_management_software TEXT,
                communication_tools TEXT, -- JSON array
                document_signing TEXT, -- JSON array
                
                -- Professional References
                professional_references TEXT, -- JSON array of objects
                
                -- Compliance & Insurance
                malpractice_insurance BOOLEAN DEFAULT 0,
                insurance_carrier TEXT,
                coverage_amount TEXT,
                disciplinary_history BOOLEAN DEFAULT 0,
                disciplinary_details TEXT,
                
                -- Platform Preferences
                profile_visibility TEXT,
                client_communication TEXT, -- JSON array
                case_updates TEXT,
                marketing_consent BOOLEAN DEFAULT 0,
                data_sharing BOOLEAN DEFAULT 0,
                
                -- Additional Information
                motivation TEXT NOT NULL,
                additional_services TEXT,
                special_requirements TEXT,
                
                -- Terms & Agreements
                terms_accepted BOOLEAN DEFAULT 0,
                privacy_consent BOOLEAN DEFAULT 0,
                
                -- Application Status
                status TEXT DEFAULT 'pending_review',
                application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                review_date TIMESTAMP,
                approval_date TIMESTAMP,
                reviewer_notes TEXT,
                
                -- Profile Settings
                profile_active BOOLEAN DEFAULT 0,
                accepting_cases BOOLEAN DEFAULT 0,
                last_login TIMESTAMP,
                
                -- Metadata
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create indexes for better performance
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_attorney_email ON attorneys(email)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_attorney_application_id ON attorneys(application_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_attorney_status ON attorneys(status)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_attorney_service_areas ON attorneys(service_areas)')
        
        conn.commit()
        conn.close()
    
    def create_attorney(self, attorney_data):
        """Create a new attorney application"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Generate unique application ID
            application_id = f"ATT{datetime.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:8].upper()}"
            
            # Convert arrays to JSON strings
            practice_areas = json.dumps(attorney_data.get('practiceAreas', []))
            court_experience = json.dumps(attorney_data.get('courtExperience', []))
            specializations = json.dumps(attorney_data.get('specializations', []))
            case_types = json.dumps(attorney_data.get('caseTypes', []))
            client_types = json.dumps(attorney_data.get('clientTypes', []))
            availability_hours = json.dumps(attorney_data.get('availabilityHours', []))
            flat_fee_services = json.dumps(attorney_data.get('flatFeeServices', []))
            payment_methods = json.dumps(attorney_data.get('paymentMethods', []))
            marketing_preferences = json.dumps(attorney_data.get('marketingPreferences', []))
            referral_sources = json.dumps(attorney_data.get('referralSources', []))
            service_areas = json.dumps(attorney_data.get('serviceAreas', []))
            communication_tools = json.dumps(attorney_data.get('communicationTools', []))
            document_signing = json.dumps(attorney_data.get('documentSigning', []))
            professional_references = json.dumps(attorney_data.get('references', []))
            client_communication = json.dumps(attorney_data.get('clientCommunication', []))
            
            cursor.execute('''
                INSERT INTO attorneys (
                    application_id, first_name, last_name, email, phone, firm_name,
                    firm_address, firm_city, firm_zip, firm_website, bar_number, bar_state,
                    bar_admission_date, law_school, graduation_year, years_experience,
                    practice_areas, landlord_tenant_experience, eviction_experience,
                    court_experience, specializations, case_types, client_types,
                    minimum_case_value, maximum_caseload, response_time, availability_hours,
                    hourly_rate, flat_fee_services, payment_terms, retainer_amount,
                    payment_methods, fee_structure_preference, lead_budget, lead_volume,
                    lead_quality, marketing_preferences, referral_sources, service_areas,
                    travel_radius, remote_consultation, case_management_software,
                    communication_tools, document_signing, professional_references, malpractice_insurance,
                    insurance_carrier, coverage_amount, disciplinary_history,
                    disciplinary_details, profile_visibility, client_communication,
                    case_updates, marketing_consent, data_sharing, motivation,
                    additional_services, special_requirements, terms_accepted,
                    privacy_consent
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                application_id,
                attorney_data.get('firstName', ''),
                attorney_data.get('lastName', ''),
                attorney_data.get('email', ''),
                attorney_data.get('phone', ''),
                attorney_data.get('firmName', ''),
                attorney_data.get('firmAddress', ''),
                attorney_data.get('firmCity', 'Nashville'),
                attorney_data.get('firmZip', ''),
                attorney_data.get('firmWebsite', ''),
                attorney_data.get('barNumber', ''),
                attorney_data.get('barState', ''),
                attorney_data.get('barAdmissionDate', ''),
                attorney_data.get('lawSchool', ''),
                attorney_data.get('graduationYear', ''),
                attorney_data.get('yearsExperience', ''),
                practice_areas,
                attorney_data.get('landlordTenantExperience', ''),
                attorney_data.get('evictionExperience', ''),
                court_experience,
                specializations,
                case_types,
                client_types,
                attorney_data.get('minimumCaseValue', ''),
                attorney_data.get('maximumCaseload', ''),
                attorney_data.get('responseTime', ''),
                availability_hours,
                attorney_data.get('hourlyRate', ''),
                flat_fee_services,
                attorney_data.get('paymentTerms', ''),
                attorney_data.get('retainerAmount', ''),
                payment_methods,
                attorney_data.get('feeStructurePreference', ''),
                attorney_data.get('leadBudget', ''),
                attorney_data.get('leadVolume', ''),
                attorney_data.get('leadQuality', ''),
                marketing_preferences,
                referral_sources,
                service_areas,
                attorney_data.get('travelRadius', ''),
                attorney_data.get('remoteConsultation', False),
                attorney_data.get('caseManagementSoftware', ''),
                communication_tools,
                document_signing,
                professional_references,
                attorney_data.get('malpracticeInsurance', False),
                attorney_data.get('insuranceCarrier', ''),
                attorney_data.get('coverageAmount', ''),
                attorney_data.get('disciplinaryHistory', False),
                attorney_data.get('disciplinaryDetails', ''),
                attorney_data.get('profileVisibility', ''),
                client_communication,
                attorney_data.get('caseUpdates', ''),
                attorney_data.get('marketingConsent', False),
                attorney_data.get('dataSharing', False),
                attorney_data.get('motivation', ''),
                attorney_data.get('additionalServices', ''),
                attorney_data.get('specialRequirements', ''),
                attorney_data.get('termsAccepted', False),
                attorney_data.get('privacyConsent', False)
            ))
            
            attorney_id = cursor.lastrowid
            conn.commit()
            
            # Return the created attorney data
            return {
                'success': True,
                'attorney': {
                    'id': attorney_id,
                    'application_id': application_id,
                    'email': attorney_data.get('email', ''),
                    'firm_name': attorney_data.get('firmName', ''),
                    'status': 'pending_review'
                }
            }
            
        except sqlite3.IntegrityError as e:
            if 'email' in str(e):
                return {'success': False, 'error': 'An attorney with this email address already exists'}
            else:
                return {'success': False, 'error': 'Attorney application could not be created'}
        except Exception as e:
            return {'success': False, 'error': f'Database error: {str(e)}'}
        finally:
            conn.close()
    
    def get_attorney_by_id(self, attorney_id):
        """Get attorney by ID"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM attorneys WHERE id = ?', (attorney_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return self._row_to_dict(cursor, row)
        return None
    
    def get_attorney_by_application_id(self, application_id):
        """Get attorney by application ID"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM attorneys WHERE application_id = ?', (application_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return self._row_to_dict(cursor, row)
        return None
    
    def get_attorney_by_email(self, email):
        """Get attorney by email"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM attorneys WHERE email = ?', (email,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return self._row_to_dict(cursor, row)
        return None
    
    def get_all_attorneys(self, status=None, limit=50, offset=0):
        """Get all attorneys with optional filtering"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        query = 'SELECT * FROM attorneys'
        params = []
        
        if status:
            query += ' WHERE status = ?'
            params.append(status)
        
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        return [self._row_to_dict(cursor, row) for row in rows]
    
    def update_attorney_status(self, application_id, status, reviewer_notes=None):
        """Update attorney application status"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        update_fields = ['status = ?', 'updated_at = CURRENT_TIMESTAMP']
        params = [status]
        
        if status in ['approved', 'rejected']:
            update_fields.append('review_date = CURRENT_TIMESTAMP')
            if status == 'approved':
                update_fields.append('approval_date = CURRENT_TIMESTAMP')
                update_fields.append('profile_active = 1')
        
        if reviewer_notes:
            update_fields.append('reviewer_notes = ?')
            params.append(reviewer_notes)
        
        params.append(application_id)
        
        query = f'UPDATE attorneys SET {", ".join(update_fields)} WHERE application_id = ?'
        cursor.execute(query, params)
        
        rows_affected = cursor.rowcount
        conn.commit()
        conn.close()
        
        return rows_affected > 0
    
    def search_attorneys(self, criteria):
        """Search attorneys based on various criteria"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        query = 'SELECT * FROM attorneys WHERE status = "approved" AND profile_active = 1'
        params = []
        
        if criteria.get('service_areas'):
            query += ' AND service_areas LIKE ?'
            params.append(f'%{criteria["service_areas"]}%')
        
        if criteria.get('practice_areas'):
            query += ' AND practice_areas LIKE ?'
            params.append(f'%{criteria["practice_areas"]}%')
        
        if criteria.get('case_types'):
            query += ' AND case_types LIKE ?'
            params.append(f'%{criteria["case_types"]}%')
        
        if criteria.get('max_hourly_rate'):
            query += ' AND CAST(REPLACE(hourly_rate, "$", "") AS INTEGER) <= ?'
            params.append(criteria['max_hourly_rate'])
        
        query += ' ORDER BY created_at DESC'
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        return [self._row_to_dict(cursor, row) for row in rows]
    
    def get_attorney_stats(self):
        """Get attorney statistics"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        stats = {}
        
        # Total attorneys by status
        cursor.execute('SELECT status, COUNT(*) FROM attorneys GROUP BY status')
        stats['by_status'] = dict(cursor.fetchall())
        
        # Total attorneys
        cursor.execute('SELECT COUNT(*) FROM attorneys')
        stats['total'] = cursor.fetchone()[0]
        
        # Active attorneys
        cursor.execute('SELECT COUNT(*) FROM attorneys WHERE profile_active = 1')
        stats['active'] = cursor.fetchone()[0]
        
        # Recent applications (last 30 days)
        cursor.execute('''
            SELECT COUNT(*) FROM attorneys 
            WHERE created_at >= datetime('now', '-30 days')
        ''')
        stats['recent_applications'] = cursor.fetchone()[0]
        
        conn.close()
        return stats
    
    def _row_to_dict(self, cursor, row):
        """Convert database row to dictionary"""
        columns = [description[0] for description in cursor.description]
        attorney_dict = dict(zip(columns, row))
        
        # Parse JSON fields
        json_fields = [
            'practice_areas', 'court_experience', 'specializations', 'case_types',
            'client_types', 'availability_hours', 'flat_fee_services', 'payment_methods',
            'marketing_preferences', 'referral_sources', 'service_areas',
            'communication_tools', 'document_signing', 'professional_references', 'client_communication'
        ]
        
        for field in json_fields:
            if attorney_dict.get(field):
                try:
                    attorney_dict[field] = json.loads(attorney_dict[field])
                except json.JSONDecodeError:
                    attorney_dict[field] = []
        
        return attorney_dict
