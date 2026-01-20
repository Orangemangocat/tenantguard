from flask import Blueprint, request, jsonify, current_app
from src.models.case import Case, db
from datetime import datetime, timedelta
import json
import os
from uuid import uuid4
from werkzeug.utils import secure_filename

from src.services import ai_processor
from src.models.case_analysis import CaseAnalysis
from src.routes.auth import admin_required

case_bp = Blueprint('case', __name__)

def _is_allowed_case_document(filename):
    if not filename or '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in {
        'pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx', 'txt', 'rtf', 'heic'
    }

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
        
        try:
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
        except Exception as db_error:
            # If tables don't exist yet, return empty cases
            print(f"[get_cases] Database query error: {db_error}")
            return jsonify({
                'success': True,
                'cases': [],
                'pagination': {
                    'page': 1,
                    'per_page': per_page,
                    'total': 0,
                    'pages': 0,
                    'has_next': False,
                    'has_prev': False
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
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
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


@case_bp.route('/cases/<case_number>/documents', methods=['POST'])
def upload_case_documents(case_number):
    """Upload and attach case documents to an intake record."""
    try:
        case = Case.query.filter_by(case_number=case_number).first()
        if not case:
            return jsonify({'error': 'Case not found'}), 404

        if 'documents' not in request.files:
            return jsonify({'error': 'No documents provided'}), 400

        files = request.files.getlist('documents')
        if not files:
            return jsonify({'error': 'No documents provided'}), 400

        upload_dir = os.path.join(current_app.static_folder, 'uploads', 'cases', case.case_number)
        os.makedirs(upload_dir, exist_ok=True)

        existing_docs = json.loads(case.documents_uploaded) if case.documents_uploaded else []
        saved_docs = []

        for file in files:
            if not file or not _is_allowed_case_document(file.filename):
                continue
            safe_name = secure_filename(file.filename)
            unique_name = f"{uuid4().hex}_{safe_name}"
            file_path = os.path.join(upload_dir, unique_name)
            file.save(file_path)
            public_url = f"/uploads/cases/{case.case_number}/{unique_name}"
            doc_entry = {
                'filename': safe_name,
                'stored_name': unique_name,
                'url': public_url,
                'uploaded_at': datetime.utcnow().isoformat()
            }
            existing_docs.append(doc_entry)
            saved_docs.append(doc_entry)

        case.documents_uploaded = json.dumps(existing_docs)
        case.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'success': True,
            'saved': saved_docs,
            'documents': existing_docs,
            'count': len(existing_docs)
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to upload documents', 'details': str(e)}), 500


@case_bp.route('/cases/<case_number>/status', methods=['GET'])
def get_case_status(case_number):
    """Return a lightweight status summary for a case intake."""
    try:
        case = Case.query.filter_by(case_number=case_number).first()
        if not case:
            return jsonify({'error': 'Case not found'}), 404

        from src.models.case_analysis import CaseAnalysis
        latest_analysis = CaseAnalysis.query.filter_by(case_id=case.id).order_by(CaseAnalysis.created_at.desc()).first()
        documents = json.loads(case.documents_uploaded) if case.documents_uploaded else []

        return jsonify({
            'case_number': case.case_number,
            'case_status': case.status,
            'documents_count': len(documents),
            'analysis_status': 'complete' if latest_analysis else 'pending',
            'last_analysis_at': latest_analysis.created_at.isoformat() if latest_analysis else None
        }), 200
    except Exception as e:
        return jsonify({'error': 'Failed to fetch case status', 'details': str(e)}), 500

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


@case_bp.route('/cases/<case_number>/analyses', methods=['GET'])
@admin_required
def get_case_analyses(current_user, case_number):
    """Return analyses saved for a case (admin only)."""
    try:
        case = Case.query.filter_by(case_number=case_number).first()
        if not case:
            return jsonify({'error': 'Case not found'}), 404

        from src.models.case_analysis import CaseAnalysis

        analyses = CaseAnalysis.query.filter_by(case_id=case.id).order_by(CaseAnalysis.created_at.desc()).all()

        return jsonify({
            'success': True,
            'analyses': [a.to_dict() for a in analyses]
        }), 200
    except Exception as e:
        return jsonify({'error': 'Failed to fetch analyses', 'details': str(e)}), 500


@case_bp.route('/cases/<case_number>/intake-conversations', methods=['POST'])
def enqueue_intake_conversation(case_number):
    """Queue intake conversation persistence to GCS."""
    try:
        case = Case.query.filter_by(case_number=case_number).first()
        if not case:
            return jsonify({'error': 'Case not found'}), 404

        payload = request.get_json()
        if not payload:
            return jsonify({'error': 'No intake conversation payload provided'}), 400

        from redis import Redis
        from rq import Queue
        from src.tasks.llm_tasks import persist_intake_conversation

        redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
        redis_conn = Redis.from_url(redis_url)
        q = Queue('default', connection=redis_conn)
        job = q.enqueue(persist_intake_conversation, case.id, payload)

        return jsonify({
            'success': True,
            'queued': True,
            'job_id': job.get_id()
        }), 202
    except Exception as e:
        return jsonify({'error': 'Failed to queue intake conversation', 'details': str(e)}), 500


@case_bp.route('/cases/<case_number>/process', methods=['POST'])
def process_case(case_number):
    """Analyze a case with the AI processor and return suggestions.

    This endpoint runs a lightweight analysis using local heuristics and
    the ai_processor service. By default, analysis runs synchronously
    and persists results; set AI_ANALYSIS_ASYNC=true to enqueue a background
    job instead.
    """
    try:
        case = Case.query.filter_by(case_number=case_number).first()

        if not case:
            return jsonify({'error': 'Case not found'}), 404

        async_mode = os.environ.get('AI_ANALYSIS_ASYNC', '').lower() in ('1', 'true', 'yes')
        if async_mode:
            # Dedupe: check for existing queued/started job for this case
            from src.lib.queue_utils import find_existing_case_job, acquire_case_lock
            from redis import Redis
            from rq import Queue
            from src.tasks.llm_tasks import perform_case_analysis

            existing = find_existing_case_job(case.id)
            if existing:
                return jsonify({'success': False, 'message': 'Analysis already queued or running', 'job_id': existing}), 409

            # Rate-limit enqueue attempts per-case for short window
            locked = acquire_case_lock(case.id, ttl=60)
            if not locked:
                return jsonify({'error': 'Too many enqueue attempts for this case, try again later'}), 429

            redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
            redis_conn = Redis.from_url(redis_url)
            q = Queue('default', connection=redis_conn)

            job = q.enqueue(perform_case_analysis, case.id)

            return jsonify({
                'success': True,
                'queued': True,
                'job_id': job.get_id()
            }), 202

        analysis = ai_processor.analyze_case(case.to_dict())
        analysis_record = CaseAnalysis(
            case_id=case.id,
            analysis=json.dumps(analysis),
            provider=analysis.get('notes', {}).get('provider'),
            confidence=analysis.get('confidence')
        )
        db.session.add(analysis_record)
        db.session.commit()

        return jsonify({
            'success': True,
            'analysis_id': analysis_record.id,
            'analysis': analysis
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'Failed to process case',
            'details': str(e)
        }), 500
