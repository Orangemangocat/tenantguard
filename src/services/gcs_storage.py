import hashlib
import json
from typing import Any, Dict, IO, Optional, Tuple

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


def upload_file(bucket_name: str, object_name: str, file_obj: IO[bytes],
                content_type: Optional[str] = None,
                metadata: Optional[Dict[str, str]] = None) -> Dict[str, Optional[str]]:
    """Upload a file-like object to GCS and return metadata."""
    client = _get_client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(object_name)
    if metadata:
        blob.metadata = metadata
    blob.upload_from_file(file_obj, content_type=content_type)

    return {
        'gcs_uri': f'gs://{bucket_name}/{object_name}',
        'content_type': content_type
    }


def parse_gcs_uri(gcs_uri: str) -> Tuple[str, str]:
    if not gcs_uri or not gcs_uri.startswith('gs://'):
        raise ValueError('Invalid GCS URI')
    path = gcs_uri[5:]
    if '/' not in path:
        raise ValueError('Invalid GCS URI')
    bucket_name, object_name = path.split('/', 1)
    return bucket_name, object_name


def download_bytes(bucket_name: str, object_name: str) -> Dict[str, Optional[str]]:
    client = _get_client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(object_name)
    data = blob.download_as_bytes()
    return {
        'bytes': data,
        'content_type': blob.content_type
    }


def download_json(bucket_name: str, object_name: str) -> Dict[str, Any]:
    payload = download_bytes(bucket_name, object_name)
    data = payload.get('bytes') or b'{}'
    return json.loads(data.decode('utf-8'))


def download_bytes_from_uri(gcs_uri: str) -> Dict[str, Optional[str]]:
    bucket_name, object_name = parse_gcs_uri(gcs_uri)
    return download_bytes(bucket_name, object_name)


def download_json_from_uri(gcs_uri: str) -> Dict[str, Any]:
    bucket_name, object_name = parse_gcs_uri(gcs_uri)
    return download_json(bucket_name, object_name)
