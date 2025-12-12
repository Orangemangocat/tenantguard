from flask import Blueprint, request, jsonify
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import os

contact_bp = Blueprint('contact', __name__)

@contact_bp.route('/api/contact', methods=['POST'])
def send_contact_email():
    """
    Handle contact form submissions and send email to johnb@tenantguard.net
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'subject', 'message']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        name = data.get('name')
        email = data.get('email')
        phone = data.get('phone', 'Not provided')
        subject = data.get('subject')
        message = data.get('message')
        
        # Create email content
        email_body = f"""
New Contact Form Submission from TenantGuard Website

From: {name}
Email: {email}
Phone: {phone}
Subject: {subject}

Message:
{message}

---
Submitted: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""
        
        # For now, we'll log the contact form submission
        # In production, you would configure SMTP settings to actually send emails
        print("=" * 50)
        print("CONTACT FORM SUBMISSION")
        print("=" * 50)
        print(email_body)
        print("=" * 50)
        
        # TODO: Configure SMTP settings for production
        # Uncomment and configure the following code when ready to send actual emails:
        """
        smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        smtp_port = int(os.getenv('SMTP_PORT', 587))
        smtp_user = os.getenv('SMTP_USER')
        smtp_password = os.getenv('SMTP_PASSWORD')
        
        if smtp_user and smtp_password:
            msg = MIMEMultipart()
            msg['From'] = smtp_user
            msg['To'] = 'johnb@tenantguard.net'
            msg['Subject'] = f'TenantGuard Contact: {subject}'
            msg['Reply-To'] = email
            
            msg.attach(MIMEText(email_body, 'plain'))
            
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
        """
        
        return jsonify({
            'success': True,
            'message': 'Contact form submitted successfully'
        }), 200
        
    except Exception as e:
        print(f"Error processing contact form: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'An error occurred processing your request'
        }), 500

@contact_bp.route('/api/contact/test', methods=['GET'])
def test_contact():
    """Test endpoint to verify contact API is working"""
    return jsonify({
        'success': True,
        'message': 'Contact API is working',
        'endpoint': '/api/contact'
    }), 200
