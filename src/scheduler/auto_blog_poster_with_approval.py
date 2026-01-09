"""
Automated Blog Posting Scheduler with Approval Queue
Creates posts in pending_approval status for admin review
This script should be run as a cron job (e.g., daily at midnight)
"""

import os
import sys
import json
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from src.main import app
from src.models.user import db
from src.models.blog import BlogPost
from src.models.blog_topic import BlogTopic, BlogSchedule

def check_and_generate_post():
    """Check if a new post should be generated and create it for approval"""
    
    with app.app_context():
        # Get schedule configuration
        schedule = BlogSchedule.query.first()
        
        if not schedule or not schedule.auto_posting_enabled:
            print("Auto-posting is disabled. Exiting.")
            return
        
        # Get the most recent published post
        latest_post = BlogPost.query.filter_by(status='published').order_by(BlogPost.published_at.desc()).first()
        
        # Determine if we should post
        should_post = False
        reason = ""
        days_since_last = 0
        
        if not latest_post:
            should_post = True
            reason = "No posts exist yet"
        else:
            days_since_last = (datetime.utcnow() - latest_post.published_at).days
            if days_since_last >= schedule.max_days_between_posts:
                should_post = True
                reason = f"Last post was {days_since_last} days ago (max: {schedule.max_days_between_posts})"

        # Check for pending topics
        pending_topics = BlogTopic.query.filter_by(status='pending').order_by(BlogTopic.created_at.asc()).all()
        prioritized = sort_topics_by_priority(pending_topics)

        urgent_topic = prioritized[0] if prioritized and prioritized[0].priority in {'urgent', 'high'} else None
        if urgent_topic:
            should_post = True
            reason = f"Urgent topic queued: {urgent_topic.title}"

        if not should_post:
            print(f"No post needed. Last post was {days_since_last} days ago.")
            return

        if not prioritized:
            print("No pending topics available. Exiting.")
            return

        topic = urgent_topic or prioritized[0]
        print(f"Generating new post for approval. Reason: {reason}")
        print(f"Using suggested topic: {topic.title}")

        topic.status = 'in_progress'
        db.session.commit()
        enqueue_post_from_topic(topic)


def sort_topics_by_priority(topics):
    priority_rank = {
        'urgent': 0,
        'high': 1,
        'normal': 2,
        'low': 3,
    }
    return sorted(
        topics,
        key=lambda topic: (priority_rank.get(topic.priority, 4), topic.created_at or datetime.utcnow())
    )


def enqueue_post_from_topic(topic):
    """Queue AI generation for a suggested topic."""
    from redis import Redis
    from rq import Queue
    from src.tasks.blog_ai_tasks import generate_blog_post

    links = []
    if topic.research_links:
        try:
            links = json.loads(topic.research_links)
        except Exception:
            links = []

    payload = {
        'topic': topic.title,
        'category': topic.category,
        'author': 'Manus AI',
        'links': links,
        'text_snippets': topic.research_notes or '',
        'additional_context': topic.description or '',
        'llm_provider': 'openai',
        'generation_source': 'topic_suggestion',
    }

    redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    redis_conn = Redis.from_url(redis_url)
    q = Queue('default', connection=redis_conn)
    job = q.enqueue(generate_blog_post, payload, submit_for_approval=True, topic_id=topic.id)

    print(f"Enqueued generation job {job.get_id()} for topic {topic.id}.")


if __name__ == '__main__':
    print(f"=== Automated Blog Posting Scheduler (With Approval Queue) ===")
    print(f"Run time: {datetime.now().isoformat()}")
    print()
    
    try:
        check_and_generate_post()
        print("\nScheduler completed successfully.")
        print("Generated posts are pending admin approval before publication.")
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
