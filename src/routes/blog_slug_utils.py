"""
Enhanced slug generation utilities for blog posts
Provides better uniqueness handling with incremental numbering
"""

import re
from src.models.blog import BlogPost


def create_slug(title):
    """
    Create URL-friendly slug from title
    
    Converts title to lowercase, removes special characters,
    replaces spaces with hyphens, and normalizes multiple hyphens.
    
    Args:
        title (str): Blog post title
        
    Returns:
        str: URL-friendly slug
        
    Examples:
        >>> create_slug("How to Eat Worms")
        'how-to-eat-worms'
        >>> create_slug("What's Your Day?")
        'whats-your-day'
        >>> create_slug("A Great -- and Easy -- Way")
        'a-great-and-easy-way'
    """
    if not title:
        return ''
    
    slug = title.lower()
    # Remove special characters (keep only alphanumeric, spaces, and hyphens)
    slug = re.sub(r'[^\w\s-]', '', slug)
    # Replace multiple spaces or hyphens with single hyphen
    slug = re.sub(r'[-\s]+', '-', slug)
    # Strip leading/trailing hyphens
    slug = slug.strip('-')
    
    # Limit slug length to prevent database issues
    max_length = 200  # Leave room for uniqueness suffix
    if len(slug) > max_length:
        slug = slug[:max_length].rstrip('-')
    
    return slug


def ensure_unique_slug(base_slug, exclude_post_id=None):
    """
    Ensure slug is unique by appending incremental numbers if needed
    
    If the base slug already exists, appends -2, -3, etc. until
    a unique slug is found. Much more user-friendly than timestamps.
    
    Args:
        base_slug (str): Base slug to make unique
        exclude_post_id (int, optional): Post ID to exclude from uniqueness check
                                         (useful when updating existing posts)
        
    Returns:
        str: Unique slug
        
    Examples:
        If 'how-to-eat-worms' exists:
        >>> ensure_unique_slug('how-to-eat-worms')
        'how-to-eat-worms-2'
        
        If 'how-to-eat-worms' and 'how-to-eat-worms-2' exist:
        >>> ensure_unique_slug('how-to-eat-worms')
        'how-to-eat-worms-3'
    """
    if not base_slug:
        base_slug = 'post'
    
    # Check if base slug is available
    query = BlogPost.query.filter_by(slug=base_slug)
    if exclude_post_id:
        query = query.filter(BlogPost.id != exclude_post_id)
    
    if not query.first():
        return base_slug
    
    # Base slug exists, find next available number
    counter = 2
    max_attempts = 1000  # Prevent infinite loops
    
    while counter < max_attempts:
        candidate_slug = f"{base_slug}-{counter}"
        
        query = BlogPost.query.filter_by(slug=candidate_slug)
        if exclude_post_id:
            query = query.filter(BlogPost.id != exclude_post_id)
        
        if not query.first():
            return candidate_slug
        
        counter += 1
    
    # Fallback to timestamp if we somehow hit max attempts
    from datetime import datetime
    timestamp = int(datetime.utcnow().timestamp())
    return f"{base_slug}-{timestamp}"


def generate_unique_slug(title, exclude_post_id=None):
    """
    Generate a unique slug from a title
    
    Convenience function that combines create_slug and ensure_unique_slug.
    
    Args:
        title (str): Blog post title
        exclude_post_id (int, optional): Post ID to exclude from uniqueness check
        
    Returns:
        str: Unique URL-friendly slug
    """
    base_slug = create_slug(title)
    return ensure_unique_slug(base_slug, exclude_post_id)


def validate_slug(slug):
    """
    Validate that a slug meets requirements
    
    Args:
        slug (str): Slug to validate
        
    Returns:
        tuple: (is_valid, error_message)
        
    Examples:
        >>> validate_slug('valid-slug-123')
        (True, None)
        >>> validate_slug('Invalid Slug!')
        (False, 'Slug contains invalid characters')
    """
    if not slug:
        return False, 'Slug cannot be empty'
    
    if len(slug) > 250:
        return False, 'Slug is too long (max 250 characters)'
    
    # Check for valid characters (lowercase alphanumeric and hyphens only)
    if not re.match(r'^[a-z0-9-]+$', slug):
        return False, 'Slug can only contain lowercase letters, numbers, and hyphens'
    
    # Check for leading/trailing hyphens
    if slug.startswith('-') or slug.endswith('-'):
        return False, 'Slug cannot start or end with a hyphen'
    
    # Check for consecutive hyphens
    if '--' in slug:
        return False, 'Slug cannot contain consecutive hyphens'
    
    return True, None
