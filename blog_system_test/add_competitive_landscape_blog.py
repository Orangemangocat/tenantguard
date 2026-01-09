#!/usr/bin/env python3
"""
Script to add the competitive landscape blog post to the TenantGuard database
"""

import sys
import os
from datetime import datetime

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.models.user import db
from src.models.blog import BlogPost
from src import create_app

def create_slug(title):
    """Create URL-friendly slug from title"""
    import re
    slug = title.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug.strip('-')

def add_blog_post():
    """Add the competitive landscape blog post"""
    
    # Blog post content
    title = "Secure Justice: How TenantGuard is Revolutionizing the Legal Tech Landscape"
    excerpt = "The world of cybersecurity is a high-stakes arms race. But what can the legal industry, specifically the niche world of landlord-tenant disputes, learn from these advanced defense platforms? As Tenet Defend rebrands to TenantGuard, we explore how we're applying enterprise-grade security principles to deliver secure, accessible, and efficient justice."
    
    content = """In the digital age, data is the new currency, and with it comes the ever-present threat of security breaches. We've seen industries from finance to healthcare pour billions into cybersecurity, creating a landscape of sophisticated defense platforms. At TenantGuard, formerly Tenet Defend, we studied this landscape intensely. Our journey began with a deep dive into the world of strategic intelligence and cyber defense, analyzing companies like TENET Intelligence, Cybereason, and ThreatConnect. We learned that the most effective platforms don't just build walls; they provide actionable intelligence, streamline operations, and quantify risk.

This research raised a critical question: Why isn't this level of security and technological sophistication being applied to one of the most fundamental areas of civil justice—housing? The legal tech market is growing, but it remains fragmented, often leaving the most vulnerable, like tenants facing eviction, with inadequate and insecure tools.

## The Gap in the Legal Tech Market

The landlord-tenant legal space is fraught with challenges. In Tennessee alone, a staggering 85% of tenants lack legal representation in eviction cases. The process is confusing, the paperwork is complex, and the cost of hiring an attorney is often prohibitive, averaging $2,500. For attorneys, the administrative burden is immense, with case onboarding taking 3-5 hours of non-billable time. This inefficiency creates a justice gap, where the outcome of a case is too often determined by resources, not merits.

This is the gap TenantGuard was built to fill. We realized that the principles that secure a Fortune 500 company can and should be used to secure a tenant's right to a fair hearing.

## TenantGuard: Bridging Security and Justice

TenantGuard is more than just a legal platform; it's a secure ecosystem designed to bring efficiency, transparency, and accessibility to the landlord-tenant dispute process. Here's how we're applying the lessons from the world of elite cyber defense to revolutionize legal tech:

| Feature | The Problem | The TenantGuard Solution |
|---|---|---|
| **Guided Case Intake** | Tenants struggle to articulate their legal situation and gather necessary documents. | Our platform provides a step-by-step process, ensuring over 90% accuracy and completeness in case preparation. |
| **Secure Document Hub** | Sensitive legal documents are often exchanged over insecure email, exposing tenants and attorneys to risk. | We provide a centralized, encrypted platform for all case documents, applying the same security standards as top cybersecurity firms. |
| **Streamlined Attorney Onboarding** | Attorneys waste hours on administrative tasks, driving up costs for tenants. | By providing pre-qualified, fully-documented cases, we reduce attorney onboarding time by 70%, from 4.5 hours to under 1 hour. |
| **Accessible & Affordable** | The high cost of legal services prevents most tenants from getting help. | By increasing efficiency, we help reduce the average cost of tenant legal representation by 60%, from $2,500 to $1,000. |

Our modern technology stack—built on React, Node.js, and secure AWS infrastructure—is the engine behind this revolution. It allows us to provide a robust, scalable, and, most importantly, secure platform for all parties.

While companies like Cybereason and BlueVoyant focus on protecting large enterprises, TenantGuard is laser-focused on protecting the rights of individuals. We are taking the best practices of the cybersecurity industry and applying them to a sector that has been overlooked for too long. Our rebranding from Tenet Defend to TenantGuard signifies this commitment: to defend the rights of tenants with the most secure and advanced technology available.

Justice shouldn't be a luxury. With TenantGuard, we're making it a secure, accessible reality."""
    
    category = "market-research"
    author = "Manus AI"
    tags = "cybersecurity,legal-tech,tenant-rights,innovation,competitive-analysis"
    featured_image = "/assets/blog/competitive-landscape.jpg"
    
    # Create the app context
    app = create_app()
    
    with app.app_context():
        # Create slug
        slug = create_slug(title)
        
        # Check if post already exists
        existing_post = BlogPost.query.filter_by(slug=slug).first()
        if existing_post:
            print(f"Blog post with slug '{slug}' already exists!")
            print(f"Post ID: {existing_post.id}")
            print(f"Status: {existing_post.status}")
            return
        
        # Create new post with pending_approval status
        post = BlogPost(
            title=title,
            slug=slug,
            content=content,
            excerpt=excerpt,
            category=category,
            author=author,
            status='pending_approval',  # Set to pending approval
            featured_image=featured_image,
            tags=tags,
            generated_by='manus',
            generation_source='autonomous'
        )
        
        # Add to database
        db.session.add(post)
        db.session.commit()
        
        print("✓ Blog post added successfully!")
        print(f"  Title: {title}")
        print(f"  Slug: {slug}")
        print(f"  Status: {post.status}")
        print(f"  ID: {post.id}")
        print(f"\nThe post is now in the approval queue and awaiting administrator review.")

if __name__ == '__main__':
    add_blog_post()
