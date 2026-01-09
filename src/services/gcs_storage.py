import hashlib
import json
from typing import Any, Dict, Optional

try:
    from google.cloud import storage
except Exception:
    storage = None


def _get_client():
    if storage is None:
        raise RuntimeError('google-cloud-storage is not installed')
    return storage.Client()


def upload_json(bucket_name: str, object_name: str, payload: Dict[str, Any],
                metadata: Optional[Dict[str, str]] = None) -> Dict[str, str]:
    """Upload a JSON payload to GCS and return metadata."""
    data = json.dumps(payload, sort_keys=True)
    sha256 = hashlib.sha256(data.encode('utf-8')).hexdigest()
    object_metadata = metadata.copy() if metadata else {}
    object_metadata.setdefault('sha256', sha256)

    client = _get_client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(object_name)
    blob.metadata = object_metadata
    blob.upload_from_string(data, content_type='application/json')

    return {
        'gcs_uri': f'gs://{bucket_name}/{object_name}',
        'sha256': sha256
    }
