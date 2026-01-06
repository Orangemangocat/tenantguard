import os
from flask import Blueprint, jsonify
from src.routes.auth import admin_required

try:
    from redis import Redis
    from rq import Queue
    from rq.job import Job
except Exception:
    Redis = None
    Queue = None
    Job = None

admin_queue_bp = Blueprint('admin_queue', __name__)


def _get_redis_conn():
    redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    if Redis is None:
        raise RuntimeError('Redis library not available')
    return Redis.from_url(redis_url)


@admin_queue_bp.route('/admin/queue', methods=['GET'])
@admin_required
def get_queue(current_user):
    """Return basic queue/job info for monitoring.

    This endpoint requires admin privileges.
    """
    try:
        # Rate-limit admin queue polling
        from src.lib.queue_utils import admin_rate_limit
        allowed = admin_rate_limit(current_user.id, limit=20, window=10)
        if not allowed:
            return jsonify({'error': 'Rate limit exceeded'}), 429
        
        try:
            if Queue is None:
                return jsonify({'success': True, 'jobs': []}), 200

            redis_conn = _get_redis_conn()
            q = Queue('default', connection=redis_conn)
            jobs = []
            for job in q.jobs:
                try:
                    j = Job.fetch(job.id, connection=redis_conn)
                    jobs.append({
                        'id': j.id,
                        'status': j.get_status(),
                        'description': j.description,
                        'enqueued_at': j.enqueued_at.isoformat() if j.enqueued_at else None,
                        'started_at': j.started_at.isoformat() if j.started_at else None,
                        'ended_at': j.ended_at.isoformat() if j.ended_at else None,
                    })
                except Exception:
                    # Skip jobs that cannot be fetched
                    continue

            return jsonify({'success': True, 'jobs': jobs}), 200
        except Exception as queue_error:
            # If Redis/queue is not available, return empty jobs
            print(f"[get_queue] Queue error: {queue_error}")
            return jsonify({'success': True, 'jobs': []}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to fetch queue', 'details': str(e)}), 500