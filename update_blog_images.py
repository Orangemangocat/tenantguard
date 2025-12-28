#!/usr/bin/env python3
"""
Update blog posts with featured image URLs
"""

import sqlite3
from datetime import datetime

# Database path
DB_PATH = '/var/www/tenantguard/src/database/tenantguard.db'

# Image mappings: post_id -> image_filename
image_mappings = {
    1: '/assets/blog/cybersecurity-alert.png',
    2: '/assets/blog/market-analysis.png',
    3: '/assets/blog/eviction-crisis.png',
    4: '/assets/blog/technology-platform.png',
    5: '/assets/blog/admin-panel.png',
    6: '/assets/blog/future-roadmap.png'
}

def update_featured_images():
    """Update featured_image field for all blog posts"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        for post_id, image_url in image_mappings.items():
            cursor.execute("""
                UPDATE blog_posts 
                SET featured_image = ?, updated_at = ?
                WHERE id = ?
            """, (image_url, datetime.utcnow(), post_id))
            
            print(f"✓ Updated post {post_id} with image: {image_url}")
        
        conn.commit()
        conn.close()
        
        print(f"\n✅ Successfully updated {len(image_mappings)} blog posts with featured images!")
        
    except Exception as e:
        print(f"❌ Error updating blog images: {e}")
        raise

if __name__ == '__main__':
    update_featured_images()
