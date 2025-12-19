"""
Blog Admin API Routes
Handles topic suggestions, scheduling, and automated posting
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from src.models.user import db
from src.models.blog import BlogPost
from src.models.blog_topic import BlogTopic, BlogSchedule
import json

blog_admin_bp = Blueprint('blog_admin', __name__)

# ============================================================================
# TOPIC SUGGESTION ROUTES
# ============================================================================

@blog_admin_bp.route('/api/blog/topics', methods=['GET'])
def get_topics():
    """Get all blog topic suggestions"""
    try:
        status_filter = request.args.get('status')
        
        query = BlogTopic.query
        if status_filter:
            query = query.filter_by(status=status_filter)
        
        topics = query.order_by(BlogTopic.created_at.desc()).all()
        return jsonify([topic.to_dict() for topic in topics]), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@blog_admin_bp.route('/api/blog/topics', methods=['POST'])
def create_topic():
    """Create a new blog topic suggestion for Manus to write about"""
    try:
        data = request.json
        
        # Validate required fields
        if not data.get('title') or not data.get('category'):
            return jsonify({'error': 'Title and category are required'}), 400
        
        # Create new topic
        topic = BlogTopic(
            title=data['title'],
            description=data.get('description', ''),
            category=data['category'],
            research_links=json.dumps(data.get('research_links', [])),
            research_notes=data.get('research_notes', ''),
            priority=data.get('priority', 'normal'),
            created_by=data.get('created_by', 'admin')
        )
        
        db.session.add(topic)
        db.session.commit()
        
        return jsonify(topic.to_dict()), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@blog_admin_bp.route('/api/blog/topics/<int:topic_id>', methods=['PUT'])
def update_topic(topic_id):
    """Update a blog topic suggestion"""
    try:
        topic = BlogTopic.query.get(topic_id)
        if not topic:
            return jsonify({'error': 'Topic not found'}), 404
        
        data = request.json
        
        # Update fields
        if 'title' in data:
            topic.title = data['title']
        if 'description' in data:
            topic.description = data['description']
        if 'category' in data:
            topic.category = data['category']
        if 'research_links' in data:
            topic.research_links = json.dumps(data['research_links'])
        if 'research_notes' in data:
            topic.research_notes = data['research_notes']
        if 'priority' in data:
            topic.priority = data['priority']
        if 'status' in data:
            topic.status = data['status']
            if data['status'] == 'completed':
                topic.completed_at = datetime.utcnow()
        
        db.session.commit()
        return jsonify(topic.to_dict()), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@blog_admin_bp.route('/api/blog/topics/<int:topic_id>', methods=['DELETE'])
def delete_topic(topic_id):
    """Delete a blog topic suggestion"""
    try:
        topic = BlogTopic.query.get(topic_id)
        if not topic:
            return jsonify({'error': 'Topic not found'}), 404
        
        db.session.delete(topic)
        db.session.commit()
        
        return jsonify({'message': 'Topic deleted successfully'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ============================================================================
# SCHEDULING ROUTES
# ============================================================================

@blog_admin_bp.route('/api/blog/schedule', methods=['GET'])
def get_schedule():
    """Get blog posting schedule configuration"""
    try:
        schedule = BlogSchedule.query.first()
        if not schedule:
            # Create default schedule
            schedule = BlogSchedule(
                auto_posting_enabled=True,
                max_days_between_posts=5
            )
            db.session.add(schedule)
            db.session.commit()
        
        return jsonify(schedule.to_dict()), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@blog_admin_bp.route('/api/blog/schedule', methods=['PUT'])
def update_schedule():
    """Update blog posting schedule configuration"""
    try:
        schedule = BlogSchedule.query.first()
        if not schedule:
            schedule = BlogSchedule()
            db.session.add(schedule)
        
        data = request.json
        
        if 'auto_posting_enabled' in data:
            schedule.auto_posting_enabled = data['auto_posting_enabled']
        if 'max_days_between_posts' in data:
            schedule.max_days_between_posts = data['max_days_between_posts']
        
        db.session.commit()
        return jsonify(schedule.to_dict()), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@blog_admin_bp.route('/api/blog/schedule/check', methods=['GET'])
def check_schedule():
    """Check if a new post should be automatically generated"""
    try:
        schedule = BlogSchedule.query.first()
        if not schedule or not schedule.auto_posting_enabled:
            return jsonify({
                'should_post': False,
                'reason': 'Auto-posting is disabled'
            }), 200
        
        # Get the most recent published post
        latest_post = BlogPost.query.filter_by(status='published').order_by(BlogPost.published_at.desc()).first()
        
        if not latest_post:
            return jsonify({
                'should_post': True,
                'reason': 'No posts exist yet',
                'days_since_last_post': None
            }), 200
        
        # Calculate days since last post
        days_since_last = (datetime.utcnow() - latest_post.published_at).days
        
        should_post = days_since_last >= schedule.max_days_between_posts
        
        return jsonify({
            'should_post': should_post,
            'days_since_last_post': days_since_last,
            'max_days_between_posts': schedule.max_days_between_posts,
            'last_post_date': latest_post.published_at.isoformat(),
            'reason': f'Last post was {days_since_last} days ago' if should_post else 'Recent post exists'
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============================================================================
# ANALYTICS ROUTES
# ============================================================================

@blog_admin_bp.route('/api/blog/analytics', methods=['GET'])
def get_analytics():
    """Get blog analytics and statistics"""
    try:
        total_posts = BlogPost.query.filter_by(status='published').count()
        draft_posts = BlogPost.query.filter_by(status='draft').count()
        
        technical_posts = BlogPost.query.filter_by(status='published', category='technical').count()
        research_posts = BlogPost.query.filter_by(status='published', category='market-research').count()
        
        pending_topics = BlogTopic.query.filter_by(status='pending').count()
        in_progress_topics = BlogTopic.query.filter_by(status='in_progress').count()
        
        # Get posting frequency
        latest_post = BlogPost.query.filter_by(status='published').order_by(BlogPost.published_at.desc()).first()
        days_since_last_post = None
        if latest_post:
            days_since_last_post = (datetime.utcnow() - latest_post.published_at).days
        
        return jsonify({
            'total_published_posts': total_posts,
            'draft_posts': draft_posts,
            'technical_updates': technical_posts,
            'market_research': research_posts,
            'pending_topics': pending_topics,
            'in_progress_topics': in_progress_topics,
            'days_since_last_post': days_since_last_post,
            'last_post_date': latest_post.published_at.isoformat() if latest_post else None
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
