import os
import json
from redis import Redis
from rq import get_current_job
from src.models.case import Case
from src.models.case_analysis import CaseAnalysis
from src.models.user import db
from src.services import ai_processor


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
