# TenantDefend Deployment Guide

## Server Requirements

The TenantDefend platform requires a Linux server with the following specifications and software:

**Minimum Server Specifications:**
- 2 CPU cores
- 4GB RAM
- 20GB storage space
- Ubuntu 20.04+ or similar Linux distribution

**Required Software:**
- Python 3.11 or higher
- Nginx web server
- SSL certificate support
- Git for version control

## Pre-Deployment Setup

### Install System Dependencies

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Python and pip
sudo apt install python3.11 python3.11-pip python3.11-venv -y

# Install Nginx
sudo apt install nginx -y

# Install Git
sudo apt install git -y

# Install Node.js (for frontend development)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm
```

### Create Application Directory

```bash
# Create application directory
sudo mkdir -p /var/www/tenantdefend
sudo chown -R $USER:$USER /var/www/tenantdefend
cd /var/www/tenantdefend
```

## Application Deployment

### Deploy Source Code

```bash
# Copy the complete source code to the server
# (Upload the tenantdefend-complete-source directory to /var/www/tenantdefend)

# Set up Python virtual environment
cd /var/www/tenantdefend
python3.11 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### Initialize Database

The application automatically creates the SQLite database on first run. The database will be created at `/var/www/tenantdefend/tenantdefend.db` with the following tables:

- **cases**: Stores all tenant case submissions
- **attorneys**: Stores all attorney applications

### Configure Application

Create a production configuration file:

```bash
# Create environment configuration
cat > /var/www/tenantdefend/.env << EOF
FLASK_ENV=production
FLASK_DEBUG=False
DATABASE_PATH=/var/www/tenantdefend/tenantdefend.db
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=*
EOF
```

## Nginx Configuration

### Create Nginx Server Block

```bash
sudo nano /etc/nginx/sites-available/tenantdefend
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Root directory for static files
    root /var/www/tenantdefend/src/static;
    index index.html;
    
    # Handle static files
    location / {
        try_files $uri $uri/ @backend;
    }
    
    # API routes to Flask backend
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Fallback to Flask for SPA routing
    location @backend {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Optimize static file serving
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Enable the Site

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/tenantdefend /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Application Service Setup

### Create Systemd Service

```bash
sudo nano /etc/systemd/system/tenantdefend.service
```

Add the following configuration:

```ini
[Unit]
Description=TenantDefend Flask Application
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/tenantdefend
Environment=PATH=/var/www/tenantdefend/venv/bin
ExecStart=/var/www/tenantdefend/venv/bin/python src/main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Start the Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable the service
sudo systemctl enable tenantdefend

# Start the service
sudo systemctl start tenantdefend

# Check service status
sudo systemctl status tenantdefend
```

## SSL Certificate Setup

### Using Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

### Using Custom Certificate

If you have your own SSL certificate, place the files in `/etc/ssl/certs/` and update the Nginx configuration accordingly.

## Firewall Configuration

```bash
# Allow HTTP and HTTPS traffic
sudo ufw allow 'Nginx Full'

# Allow SSH (if not already allowed)
sudo ufw allow ssh

# Enable firewall
sudo ufw enable
```

## Monitoring and Logs

### Application Logs

```bash
# View Flask application logs
sudo journalctl -u tenantdefend -f

# View Nginx access logs
sudo tail -f /var/log/nginx/access.log

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Database Backup

```bash
# Create backup script
cat > /var/www/tenantdefend/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/tenantdefend"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp /var/www/tenantdefend/tenantdefend.db $BACKUP_DIR/tenantdefend_$DATE.db

# Keep only last 30 days of backups
find $BACKUP_DIR -name "tenantdefend_*.db" -mtime +30 -delete
EOF

chmod +x /var/www/tenantdefend/backup.sh

# Add to crontab for daily backups
echo "0 2 * * * /var/www/tenantdefend/backup.sh" | sudo crontab -
```

## Performance Optimization

### Enable Gzip Compression

Add to Nginx configuration:

```nginx
# Enable gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_proxied any;
gzip_comp_level 6;
gzip_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/json
    application/javascript
    application/xml+rss
    application/atom+xml
    image/svg+xml;
```

### Database Optimization

The SQLite database includes appropriate indexes for optimal query performance. For high-traffic deployments, consider migrating to PostgreSQL.

## Troubleshooting

### Common Issues

**Service won't start:**
- Check logs: `sudo journalctl -u tenantdefend -n 50`
- Verify Python virtual environment is activated
- Ensure all dependencies are installed

**Database errors:**
- Check file permissions on database file
- Verify database directory exists and is writable
- Review database initialization logs

**Nginx errors:**
- Test configuration: `sudo nginx -t`
- Check error logs: `sudo tail -f /var/log/nginx/error.log`
- Verify proxy_pass URLs are correct

### Health Check

Create a simple health check endpoint:

```bash
# Test application health
curl http://localhost:5000/api/health

# Test full stack
curl https://your-domain.com
```

## Security Considerations

The TenantDefend platform implements several security measures including input validation, CORS configuration, and secure file handling. Regular security updates and monitoring are recommended for production deployments.

## Maintenance

Regular maintenance tasks include database backups, log rotation, security updates, and monitoring application performance. The platform is designed for minimal maintenance requirements with automatic database management and efficient resource utilization.

---

For additional support or questions about deployment, consult the main README.md file or contact the development team.
