from flask import Blueprint, request, jsonify
from src.models.case import Case, db
from datetime import datetime
import json

case_bp = Blueprint('case', __name__)

@case_bp.route('/cases', methods=['POST'])
def create_case():
    """Create a new case from intake form data"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['firstName', 'lastName', 'email', 'phone', 'rentalAddress', 'monthlyRent']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                'error': 'Missing required fields',
                'missing_fields': missing_fields
            }), 400
        
        # Create case from intake data
        case = Case.from_intake_data(data)
        
        # Save to database
        db.session.add(case)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Case created successfully',
            'case': case.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'Failed to create case',
            'details': str(e)
        }), 500

@case_bp.route('/cases', methods=['GET'])
def get_cases():
    """Get all cases with optional filtering"""
    try:
        # Get query parameters
        status = request.args.get('status')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        
        # Build query
        query = Case.query
        
        if status:
            query = query.filter(Case.status == status)
        
        # Paginate results
        cases = query.order_by(Case.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'success': True,
            'cases': [case.to_dict() for case in cases.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': cases.total,
                'pages': cases.pages,
                'has_next': cases.has_next,
                'has_prev': cases.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to retrieve cases',
            'details': str(e)
        }), 500

@case_bp.route('/cases/<case_number>', methods=['GET'])
def get_case(case_number):
    """Get a specific case by case number"""
    try:
        case = Case.query.filter_by(case_number=case_number).first()
        
        if not case:
            return jsonify({'error': 'Case not found'}), 404
        
        return jsonify({
            'success': True,
            'case': case.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to retrieve case',
            'details': str(e)
        }), 500

@case_bp.route('/cases/<case_number>', methods=['PUT'])
def update_case(case_number):
    """Update a case"""
    try:
        case = Case.query.filter_by(case_number=case_number).first()
        
        if not case:
            return jsonify({'error': 'Case not found'}), 404
        
        data = request.get_json()
        
        # Update case fields
        for key, value in data.items():
            if hasattr(case, key):
                setattr(case, key, value)
        
        case.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Case updated successfully',
            'case': case.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'Failed to update case',
            'details': str(e)
        }), 500

@case_bp.route('/cases/<case_number>/status', methods=['PUT'])
def update_case_status(case_number):
    """Update case status"""
    try:
        case = Case.query.filter_by(case_number=case_number).first()
        
        if not case:
            return jsonify({'error': 'Case not found'}), 404
        
        data = request.get_json()
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({'error': 'Status is required'}), 400
        
        valid_statuses = [
            'intake_submitted', 'under_review', 'attorney_assigned', 
            'in_progress', 'resolved', 'closed'
        ]
        
        if new_status not in valid_statuses:
            return jsonify({
                'error': 'Invalid status',
                'valid_statuses': valid_statuses
            }), 400
        
        case.status = new_status
        case.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Case status updated successfully',
            'case': case.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'Failed to update case status',
            'details': str(e)
        }), 500

@case_bp.route('/cases/stats', methods=['GET'])
def get_case_stats():
    """Get case statistics"""
    try:
        total_cases = Case.query.count()
        
        # Count by status
        status_counts = {}
        statuses = ['intake_submitted', 'under_review', 'attorney_assigned', 'in_progress', 'resolved', 'closed']
        
        for status in statuses:
            count = Case.query.filter_by(status=status).count()
            status_counts[status] = count
        
        # Recent cases (last 30 days)
        thirty_days_ago = datetime.utcnow().replace(day=datetime.utcnow().day - 30)
        recent_cases = Case.query.filter(Case.created_at >= thirty_days_ago).count()
        
        return jsonify({
            'success': True,
            'stats': {
                'total_cases': total_cases,
                'status_breakdown': status_counts,
                'recent_cases_30_days': recent_cases
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to retrieve case statistics',
            'details': str(e)
        }), 500

@case_bp.route('/cases/search', methods=['GET'])
def search_cases():
    """Search cases by various criteria"""
    try:
        # Get search parameters
        query_text = request.args.get('q', '')
        email = request.args.get('email')
        phone = request.args.get('phone')
        case_number = request.args.get('case_number')
        
        query = Case.query
        
        if case_number:
            query = query.filter(Case.case_number.ilike(f'%{case_number}%'))
        elif email:
            query = query.filter(Case.email.ilike(f'%{email}%'))
        elif phone:
            query = query.filter(Case.phone.ilike(f'%{phone}%'))
        elif query_text:
            # Search in multiple fields
            query = query.filter(
                db.or_(
                    Case.first_name.ilike(f'%{query_text}%'),
                    Case.last_name.ilike(f'%{query_text}%'),
                    Case.email.ilike(f'%{query_text}%'),
                    Case.case_number.ilike(f'%{query_text}%'),
                    Case.rental_address.ilike(f'%{query_text}%')
                )
            )
        
        cases = query.order_by(Case.created_at.desc()).limit(50).all()
        
        return jsonify({
            'success': True,
            'cases': [case.to_dict() for case in cases],
            'count': len(cases)
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to search cases',
            'details': str(e)
        }), 500
