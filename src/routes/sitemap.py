"""
Sitemap generation for SEO
Generates dynamic XML sitemap including all blog posts
"""

from flask import Blueprint, Response, current_app
from datetime import datetime
import os
from src.models.blog import BlogPost
import xml.etree.ElementTree as ET
from urllib.parse import urlparse

sitemap_bp = Blueprint('sitemap', __name__)

def _get_public_site_url() -> str:
    site_url = os.environ.get('PUBLIC_SITE_URL')
    if site_url:
        return site_url.rstrip('/')
    sitemap_url = os.environ.get('PUBLIC_SITEMAP_URL')
    if sitemap_url:
        parsed = urlparse(sitemap_url)
        if parsed.scheme and parsed.netloc:
            return f"{parsed.scheme}://{parsed.netloc}"
    return 'https://www.tenantguard.net'

@sitemap_bp.route('/sitemap.xml')
def sitemap():
    """Generate XML sitemap for search engines"""
    
    # Create root element
    urlset = ET.Element('urlset')
    urlset.set('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9')
    urlset.set('xmlns:news', 'http://www.google.com/schemas/sitemap-news/0.9')
    urlset.set('xmlns:xhtml', 'http://www.w3.org/1999/xhtml')
    urlset.set('xmlns:image', 'http://www.google.com/schemas/sitemap-image/1.1')
    
    base_url = _get_public_site_url()
    
    # Add static pages
    static_pages = [
        {'loc': '/', 'priority': '1.0', 'changefreq': 'daily'},
        {'loc': '/features', 'priority': '0.8', 'changefreq': 'weekly'},
        {'loc': '/how-it-works', 'priority': '0.8', 'changefreq': 'weekly'},
        {'loc': '/contact', 'priority': '0.6', 'changefreq': 'monthly'},
        {'loc': '/blog', 'priority': '0.9', 'changefreq': 'daily'},
    ]
    
    for page in static_pages:
        url = ET.SubElement(urlset, 'url')
        ET.SubElement(url, 'loc').text = f"{base_url}{page['loc']}"
        ET.SubElement(url, 'changefreq').text = page['changefreq']
        ET.SubElement(url, 'priority').text = page['priority']
        ET.SubElement(url, 'lastmod').text = datetime.now().strftime('%Y-%m-%d')
    
    # Add blog posts
    try:
        posts = BlogPost.query.filter_by(status='published').order_by(BlogPost.published_at.desc()).all()
        
        for post in posts:
            url = ET.SubElement(urlset, 'url')
            ET.SubElement(url, 'loc').text = f"{base_url}/blog/{post.slug}"
            ET.SubElement(url, 'lastmod').text = post.updated_at.strftime('%Y-%m-%d')
            ET.SubElement(url, 'changefreq').text = 'monthly'
            ET.SubElement(url, 'priority').text = '0.7'
            
            # Add image if featured_image exists
            if post.featured_image:
                image = ET.SubElement(url, 'image:image')
                ET.SubElement(image, 'image:loc').text = post.featured_image
                ET.SubElement(image, 'image:title').text = post.title
    
    except Exception as e:
        current_app.logger.error(f"Error generating sitemap: {e}")
    
    # Convert to string
    xml_str = ET.tostring(urlset, encoding='unicode', method='xml')
    xml_declaration = '<?xml version="1.0" encoding="UTF-8"?>\n'
    
    return Response(xml_declaration + xml_str, mimetype='application/xml')


@sitemap_bp.route('/robots.txt')
def robots():
    """Generate robots.txt file"""
    base_url = _get_public_site_url()
    sitemap_url = os.environ.get('PUBLIC_SITEMAP_URL') or f"{base_url}/sitemap.xml"
    robots_txt = f"""User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: {sitemap_url}
"""
    return Response(robots_txt, mimetype='text/plain')
