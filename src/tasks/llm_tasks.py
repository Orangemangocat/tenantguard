import os
import json
from datetime import datetime
from redis import Redis
from rq import get_current_job
from src.models.case import Case
from src.models.case_analysis import CaseAnalysis
from src.models.user import db
from src.services import ai_processor
from src.services.document_extractor import extract_text
from src.services.gcs_storage import (
    download_json,
    download_bytes_from_uri,
    upload_json
)


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


def _get_intake_bucket():
    return os.environ.get('GCS_INTAKE_BUCKET') or os.environ.get('GCS_BUCKET')


def _get_intake_prefix():
    return os.environ.get('GCS_INTAKE_PREFIX', 'intake')


def _build_case_notebook(case, documents):
    evidence_entries = []
    for doc in documents:
        evidence_entries.append({
            'evidence_id': doc.get('evidence_id'),
            'type': 'document',
            'source': 'tenant',
            'received_date': doc.get('uploaded_at'),
            'file_hash': doc.get('sha256'),
            'filename': doc.get('filename'),
            'stored_name': doc.get('stored_name'),
            'url': doc.get('url'),
            'gcs_uri': doc.get('gcs_uri'),
            'notes': 'Uploaded intake document'
        })

    return {
        'case_id': case.case_number,
        'facts': [],
        'timeline': [],
        'key_terms': [],
        'disputed_points': [],
        'evidence_map': evidence_entries,
        'assumptions': [],
        'last_updated': datetime.utcnow().isoformat()
    }


def process_case_documents(case_id):
    """Background job: analyze uploaded case documents and update notebook."""
    case = Case.query.filter_by(id=case_id).first()
    if not case:
        return {'error': 'Case not found', 'case_id': case_id}

    bucket_name = _get_intake_bucket()
    if not bucket_name:
        return {'error': 'GCS intake bucket is not configured'}

    documents = json.loads(case.documents_uploaded) if case.documents_uploaded else []
    if not documents:
        return {'error': 'No documents to process', 'case_id': case_id}

    analyses = []
    for doc in documents:
        gcs_uri = doc.get('gcs_uri') or doc.get('url')
        if not gcs_uri or not gcs_uri.startswith('gs://'):
            analyses.append({
                'evidence_id': doc.get('evidence_id'),
                'filename': doc.get('filename'),
                'status': 'missing_gcs_uri'
            })
            continue

        metadata = {
            'filename': doc.get('filename'),
            'stored_name': doc.get('stored_name'),
            'uploaded_at': doc.get('uploaded_at')
        }
        try:
            payload = download_bytes_from_uri(gcs_uri)
            content_bytes = payload.get('bytes') or b''
            content_type = payload.get('content_type')
            size_bytes = len(content_bytes)

            extraction = extract_text(content_bytes, content_type, doc.get('filename'))
            extracted_text = (extraction.get('text') or '')[:20000]
            analysis = ai_processor.analyze_document_text(extracted_text, metadata)

            analyses.append({
                'evidence_id': doc.get('evidence_id'),
                'filename': doc.get('filename'),
                'content_type': content_type,
                'size_bytes': size_bytes,
                'extraction': {
                    'status': extraction.get('status'),
                    'requires_ocr': extraction.get('requires_ocr'),
                    'error': extraction.get('error'),
                    'text_sample': extracted_text[:500]
                },
                'analysis': analysis
            })
        except Exception as e:
            analyses.append({
                'evidence_id': doc.get('evidence_id'),
                'filename': doc.get('filename'),
                'status': 'error',
                'error': str(e)
            })

    prefix = _get_intake_prefix()
    notebook_object = f"{prefix}/cases/{case.case_number}/case_notebook.json"
    notebook = None
    try:
        notebook = download_json(bucket_name, notebook_object)
    except Exception:
        notebook = None

    if not notebook:
        notebook = _build_case_notebook(case, documents)

    notebook['document_analysis'] = analyses
    notebook['last_updated'] = datetime.utcnow().isoformat()

    evidence_by_id = {doc.get('evidence_id'): doc for doc in notebook.get('evidence_map', [])}
    for analysis in analyses:
        evidence_id = analysis.get('evidence_id')
        if evidence_id in evidence_by_id:
            evidence_by_id[evidence_id]['analysis'] = analysis

    notebook['evidence_map'] = list(evidence_by_id.values())
    upload_json(bucket_name, notebook_object, notebook, metadata={'case_number': case.case_number})

    timestamp = datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')
    analysis_object = f"{prefix}/cases/{case.case_number}/analysis/document-analysis-{timestamp}.json"
    upload_json(bucket_name, analysis_object, {
        'case_number': case.case_number,
        'generated_at': datetime.utcnow().isoformat(),
        'analyses': analyses
    }, metadata={'case_number': case.case_number})

    return {
        'success': True,
        'case_number': case.case_number,
        'analysis_count': len(analyses),
        'notebook_gcs_uri': f'gs://{bucket_name}/{notebook_object}',
        'analysis_gcs_uri': f'gs://{bucket_name}/{analysis_object}'
    }
