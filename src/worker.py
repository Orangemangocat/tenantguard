"""Simple RQ worker launcher for local development.

Run with:

    REDIS_URL=redis://localhost:6379/0 python -m src.worker

Or run `rq worker default` directly after installing `rq`.
"""
import os
from redis import Redis
from rq import Connection, Worker


def main():
    redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    redis_conn = Redis.from_url(redis_url)
    with Connection(redis_conn):
        worker = Worker(['default'])
        worker.work()


if __name__ == '__main__':
    main()
