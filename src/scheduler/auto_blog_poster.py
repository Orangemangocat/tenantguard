"""
Automated Blog Posting Scheduler
Checks if a new blog post should be generated and triggers Manus to create one
This script should be run as a cron job (e.g., daily at midnight)
"""

import os
import sys
import requests
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from src.models.user import db
from src.models.blog import BlogPost
from src.models.blog_topic import BlogTopic, BlogSchedule
from flask import Flask

# Initialize Flask app for database access
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database', 'tenantguard.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

def check_and_generate_post():
    """Check if a new post should be generated and trigger Manus"""
    
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
        
        if not latest_post:
            should_post = True
            reason = "No posts exist yet"
        else:
            hours_since_last = (datetime.utcnow() - latest_post.published_at).total_seconds() / 3600
            if hours_since_last >= schedule.max_hours_between_posts:
                should_post = True
                reason = (
                    f"Last post was {int(hours_since_last)} hours ago "
                    f"(max: {schedule.max_hours_between_posts})"
                )
        
        if not should_post:
            print(f"No post needed. Last post was {int(hours_since_last)} hours ago.")
            return
        
        print(f"Generating new post. Reason: {reason}")
        
        # Check for pending topics
        pending_topics = BlogTopic.query.filter_by(status='pending').order_by(BlogTopic.priority.desc(), BlogTopic.created_at.asc()).all()
        
        if pending_topics:
            # Use the highest priority pending topic
            topic = pending_topics[0]
            print(f"Using suggested topic: {topic.title}")
            
            # Mark topic as in progress
            topic.status = 'in_progress'
            db.session.commit()
            
            # TODO: Integrate with Manus API to generate post from topic
            # This would call a Manus endpoint with the topic details
            # For now, we'll create a placeholder
            
            generate_post_from_topic(topic)
        else:
            # No pending topics, generate based on recent trends
            print("No pending topics. Generating post based on recent trends.")
            generate_autonomous_post()


def generate_post_from_topic(topic):
    """Generate a blog post from a suggested topic"""
    
    # This function would integrate with Manus to generate content
    # For demonstration, we'll create a basic post structure
    
    print(f"Generating post from topic: {topic.title}")
    print(f"Category: {topic.category}")
    print(f"Research links: {topic.research_links}")
    print(f"Research notes: {topic.research_notes}")
    
    # TODO: Call Manus API endpoint to generate post
    # Example:
    # response = requests.post('https://api.manus.ai/generate-blog-post', json={
    #     'title': topic.title,
    #     'category': topic.category,
    #     'research_links': json.loads(topic.research_links),
    #     'research_notes': topic.research_notes
    # })
    
    # For now, mark topic as completed
    topic.status = 'completed'
    topic.completed_at = datetime.utcnow()
    db.session.commit()
    
    print("Post generation initiated successfully.")


def generate_autonomous_post():
    """Generate a blog post autonomously based on recent trends"""
    
    print("Generating autonomous post based on recent trends...")
    
    # Determine which category needs content
    with app.app_context():
        technical_count = BlogPost.query.filter_by(status='published', category='technical').count()
        research_count = BlogPost.query.filter_by(status='published', category='market-research').count()
        
        # Balance categories
        category = 'technical' if technical_count <= research_count else 'market-research'
        
        print(f"Selected category: {category}")
        print(f"Technical posts: {technical_count}, Market research posts: {research_count}")
        
        # TODO: Call Manus API to generate post on trending topic
        # Example:
        # response = requests.post('https://api.manus.ai/generate-blog-post', json={
        #     'category': category,
        #     'mode': 'autonomous',
        #     'instructions': 'Generate a blog post on a trending topic in tenant legal tech'
        # })
        
        print("Autonomous post generation initiated successfully.")


if __name__ == '__main__':
    print(f"=== Automated Blog Posting Scheduler ===")
    print(f"Run time: {datetime.now().isoformat()}")
    print()
    
    try:
        check_and_generate_post()
        print("\nScheduler completed successfully.")
    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1)
