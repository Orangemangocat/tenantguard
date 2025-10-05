from flask import Blueprint, request, jsonify
from src.models.attorney import Attorney
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

attorney_bp = Blueprint('attorney', __name__)
attorney_model = Attorney()

@attorney_bp.route('/api/attorneys', methods=['POST'])
def create_attorney():
    """Create a new attorney application"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = [
            'firstName', 'lastName', 'email', 'phone', 'firmName', 'firmAddress',
            'firmZip', 'barNumber', 'barState', 'barAdmissionDate', 'lawSchool',
            'graduationYear', 'yearsExperience', 'landlordTenantExperience',
            'evictionExperience', 'responseTime', 'hourlyRate', 'feeStructurePreference',
            'leadBudget', 'leadVolume', 'leadQuality', 'motivation', 'termsAccepted',
            'privacyConsent'
        ]
        
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return jsonify({
                'success': False, 
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        # Validate email format
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, data.get('email', '')):
            return jsonify({'success': False, 'error': 'Invalid email format'}), 400
        
        # Validate terms acceptance
        if not data.get('termsAccepted') or not data.get('privacyConsent'):
            return jsonify({
                'success': False, 
                'error': 'Terms of service and privacy policy must be accepted'
            }), 400
        
        # Create attorney application
        result = attorney_model.create_attorney(data)
        
        if result['success']:
            logger.info(f"New attorney application created: {result['attorney']['application_id']}")
            return jsonify(result), 201
        else:
            logger.error(f"Failed to create attorney application: {result['error']}")
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error creating attorney application: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@attorney_bp.route('/api/attorneys', methods=['GET'])
def get_attorneys():
    """Get all attorneys with optional filtering"""
    try:
        status = request.args.get('status')
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        
        attorneys = attorney_model.get_all_attorneys(status=status, limit=limit, offset=offset)
        
        return jsonify({
            'success': True,
            'attorneys': attorneys,
            'count': len(attorneys)
        })
        
    except Exception as e:
        logger.error(f"Error fetching attorneys: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@attorney_bp.route('/api/attorneys/<application_id>', methods=['GET'])
def get_attorney(application_id):
    """Get attorney by application ID"""
    try:
        attorney = attorney_model.get_attorney_by_application_id(application_id)
        
        if attorney:
            return jsonify({
                'success': True,
                'attorney': attorney
            })
        else:
            return jsonify({'success': False, 'error': 'Attorney not found'}), 404
            
    except Exception as e:
        logger.error(f"Error fetching attorney {application_id}: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@attorney_bp.route('/api/attorneys/<application_id>/status', methods=['PUT'])
def update_attorney_status(application_id):
    """Update attorney application status"""
    try:
        data = request.get_json()
        
        if not data or 'status' not in data:
            return jsonify({'success': False, 'error': 'Status is required'}), 400
        
        valid_statuses = ['pending_review', 'under_review', 'approved', 'rejected', 'suspended']
        if data['status'] not in valid_statuses:
            return jsonify({
                'success': False, 
                'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
            }), 400
        
        success = attorney_model.update_attorney_status(
            application_id, 
            data['status'], 
            data.get('reviewer_notes')
        )
        
        if success:
            logger.info(f"Attorney {application_id} status updated to {data['status']}")
            return jsonify({'success': True, 'message': 'Status updated successfully'})
        else:
            return jsonify({'success': False, 'error': 'Attorney not found'}), 404
            
    except Exception as e:
        logger.error(f"Error updating attorney status: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@attorney_bp.route('/api/attorneys/search', methods=['GET'])
def search_attorneys():
    """Search attorneys based on criteria"""
    try:
        criteria = {}
        
        if request.args.get('service_areas'):
            criteria['service_areas'] = request.args.get('service_areas')
        
        if request.args.get('practice_areas'):
            criteria['practice_areas'] = request.args.get('practice_areas')
        
        if request.args.get('case_types'):
            criteria['case_types'] = request.args.get('case_types')
        
        if request.args.get('max_hourly_rate'):
            try:
                criteria['max_hourly_rate'] = int(request.args.get('max_hourly_rate'))
            except ValueError:
                return jsonify({'success': False, 'error': 'Invalid hourly rate format'}), 400
        
        attorneys = attorney_model.search_attorneys(criteria)
        
        return jsonify({
            'success': True,
            'attorneys': attorneys,
            'count': len(attorneys),
            'criteria': criteria
        })
        
    except Exception as e:
        logger.error(f"Error searching attorneys: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@attorney_bp.route('/api/attorneys/stats', methods=['GET'])
def get_attorney_stats():
    """Get attorney statistics"""
    try:
        stats = attorney_model.get_attorney_stats()
        
        return jsonify({
            'success': True,
            'stats': stats
        })
        
    except Exception as e:
        logger.error(f"Error fetching attorney stats: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@attorney_bp.route('/api/attorneys/email/<email>', methods=['GET'])
def get_attorney_by_email(email):
    """Get attorney by email address"""
    try:
        attorney = attorney_model.get_attorney_by_email(email)
        
        if attorney:
            # Remove sensitive information for public queries
            public_attorney = {
                'application_id': attorney['application_id'],
                'firm_name': attorney['firm_name'],
                'service_areas': attorney.get('service_areas', []),
                'practice_areas': attorney.get('practice_areas', []),
                'status': attorney['status'],
                'profile_active': attorney['profile_active']
            }
            
            return jsonify({
                'success': True,
                'attorney': public_attorney
            })
        else:
            return jsonify({'success': False, 'error': 'Attorney not found'}), 404
            
    except Exception as e:
        logger.error(f"Error fetching attorney by email: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@attorney_bp.route('/api/attorneys/match', methods=['POST'])
def match_attorneys():
    """Match attorneys to case requirements"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No criteria provided'}), 400
        
        # Extract matching criteria from case data
        criteria = {}
        
        if data.get('rentalPropertyAddress'):
            # Extract location for service area matching
            if 'Nashville' in data['rentalPropertyAddress'] or 'Davidson' in data['rentalPropertyAddress']:
                criteria['service_areas'] = 'Davidson County'
        
        if data.get('issueCategory'):
            # Map issue categories to case types
            issue_mapping = {
                'eviction': 'Eviction Defense',
                'security_deposit': 'Security Deposit Disputes',
                'repairs': 'Habitability Issues',
                'lease_violation': 'Lease Violations',
                'rent_dispute': 'Rent Disputes'
            }
            if data['issueCategory'] in issue_mapping:
                criteria['case_types'] = issue_mapping[data['issueCategory']]
        
        # Find matching attorneys
        attorneys = attorney_model.search_attorneys(criteria)
        
        # Sort by experience and availability
        def attorney_score(attorney):
            score = 0
            if attorney.get('landlord_tenant_experience') == 'expert':
                score += 3
            elif attorney.get('landlord_tenant_experience') == 'experienced':
                score += 2
            elif attorney.get('landlord_tenant_experience') == 'intermediate':
                score += 1
            
            if attorney.get('response_time') == 'same-day':
                score += 2
            elif attorney.get('response_time') == '24-hours':
                score += 1
            
            return score
        
        attorneys.sort(key=attorney_score, reverse=True)
        
        # Limit to top 5 matches
        top_matches = attorneys[:5]
        
        return jsonify({
            'success': True,
            'matches': top_matches,
            'count': len(top_matches),
            'criteria': criteria
        })
        
    except Exception as e:
        logger.error(f"Error matching attorneys: {str(e)}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500
