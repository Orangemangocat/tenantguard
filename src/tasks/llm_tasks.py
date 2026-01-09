import os
import json
from datetime import datetime
from redis import Redis
from rq import get_current_job
from src.models.case import Case
from src.models.case_analysis import CaseAnalysis
from src.models.user import db
from src.services import ai_processor
from src.services.gcs_storage import upload_json


def _get_redis_conn():
    redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    return Redis.from_url(redis_url)


def perform_case_analysis(case_id):
    """Background job: analyze a case and persist the analysis."""
    job = get_current_job()
    redis_conn = _get_redis_conn()

    # Load case
    case = Case.query.filter_by(id=case_id).first()
    if not case:
        return {'error': 'Case not found', 'case_id': case_id}

    # Run analysis (synchronous heuristic or LLM call inside ai_processor)
    result = ai_processor.analyze_case(case.to_dict())

    # Persist analysis
    try:
        analysis_record = CaseAnalysis(
            case_id=case.id,
            analysis=json.dumps(result),
            provider=result.get('notes', {}).get('provider'),
            confidence=result.get('confidence')
        )
        db.session.add(analysis_record)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return {'error': 'Failed to persist analysis', 'details': str(e)}

    return {'success': True, 'analysis_id': analysis_record.id}


def persist_intake_conversation(case_id, conversation_payload):
    """Background job: persist intake conversation JSON to GCS."""
    case = Case.query.filter_by(id=case_id).first()
    if not case:
        return {'error': 'Case not found', 'case_id': case_id}

    bucket_name = os.environ.get('GCS_BUCKET')
    if not bucket_name:
        return {'error': 'GCS_BUCKET is not configured'}

    prefix = os.environ.get('GCS_INTAKE_PREFIX', 'intake')
    conversation_id = None
    try:
        conversation_id = conversation_payload.get('conversation_id')
    except Exception:
        conversation_id = None

    timestamp = datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
    object_name = (
        f"{prefix}/cases/{case.case_number}/intake_conversations/"
        f"{conversation_id or 'conversation'}-{timestamp}.json"
    )

    metadata = {
        'case_number': case.case_number,
        'conversation_id': str(conversation_id) if conversation_id else 'unknown'
    }

    try:
        upload_result = upload_json(bucket_name, object_name, conversation_payload, metadata=metadata)
    except Exception as e:
        return {'error': 'Failed to upload intake conversation', 'details': str(e)}

    return {
        'success': True,
        'gcs_uri': upload_result.get('gcs_uri'),
        'sha256': upload_result.get('sha256')
    }
