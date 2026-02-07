"""Simple RQ worker launcher for local development.

Run with:

    REDIS_URL=redis://localhost:6379/0 python -m src.worker

Or run `rq worker default` directly after installing `rq`.
"""
import os
import sys
from redis import Redis
from rq import Connection, Worker


def main():
    repo_root = os.path.dirname(os.path.dirname(__file__))
    if repo_root not in sys.path:
        sys.path.insert(0, repo_root)
    redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    redis_conn = Redis.from_url(redis_url)
    with Connection(redis_conn):
        worker = Worker(['default'])
        worker.work()


if __name__ == '__main__':
    main()
