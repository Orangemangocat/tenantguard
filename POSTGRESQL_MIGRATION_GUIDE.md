# PostgreSQL Migration Guide

This guide explains how to migrate TenantGuard from SQLite to Google Cloud SQL PostgreSQL.

## Overview

The application has been updated to support both SQLite and PostgreSQL databases. The database type is controlled via environment variables, making it easy to switch between them.

## What Changed

### 1. New Files Added

- **`src/config/database.py`**: Database configuration module that handles connection strings for both SQLite and PostgreSQL
- **`scripts/migrate_sqlite_to_postgres.py`**: Migration script to transfer existing data from SQLite to PostgreSQL
- **`ssl_certs/`**: Directory containing SSL certificates for secure PostgreSQL connections
  - `server-ca.pem`: Server CA certificate
  - `client-cert.pem`: Client certificate
  - `client-key.pem`: Client private key
- **`.env.example`**: Example environment configuration file

### 2. Modified Files

- **`src/main.py`**: Updated to use the new database configuration module
- **`requirements.txt`**: Added `psycopg2-binary` (PostgreSQL driver) and `PyJWT` (for authentication)

### 3. Database Configuration

The application now uses environment variables to configure the database:

```bash
# Set database type
DB_TYPE=postgresql  # or 'sqlite' for SQLite

# PostgreSQL connection details
POSTGRES_HOST=34.173.34.153
POSTGRES_PORT=5432
POSTGRES_DB=tenantguard
POSTGRES_USER=postgres
POSTGRES_PASSWORD=R00t12288$
```

## Prerequisites

### 1. Google Cloud SQL Setup

Your PostgreSQL instance must have:
- **Instance Connection Name**: `tenantguard-480405:us-central1:tenantguard-db`
- **Public IP**: `34.173.34.153`
- **SSL/TLS enabled** with certificate authentication
- **Authorized Networks**: Add the webserver IP (`35.237.102.136`) to authorized networks

### 2. Add Webserver IP to Cloud SQL

**IMPORTANT**: Before running the migration, you must whitelist the webserver IP in Google Cloud SQL:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: **SQL** → **tenantguard-db** → **Connections** → **Networking**
3. Under "Authorized networks", click **Add Network**
4. Add: `35.237.102.136/32` (webserver IP)
5. Click **Save**

## Migration Steps

### Step 1: Deploy Updated Code to Webserver

```bash
# SSH into the webserver
ssh manus@35.237.102.136

# Navigate to the repository
cd ~/repos/tenantguard

# Pull the latest changes
git pull origin main

# Install new dependencies
source venv/bin/activate
pip install -r requirements.txt
```

### Step 2: Copy SSL Certificates to Webserver

The SSL certificates need to be placed in the `ssl_certs/` directory on the webserver:

```bash
# From your local machine or sandbox
scp ssl_certs/*.pem manus@35.237.102.136:~/repos/tenantguard/ssl_certs/

# On the webserver, ensure proper permissions
ssh manus@35.237.102.136
cd ~/repos/tenantguard
chmod 600 ssl_certs/client-key.pem
chmod 644 ssl_certs/client-cert.pem ssl_certs/server-ca.pem
```

### Step 3: Configure Environment Variables

Create a `.env` file on the webserver (or set environment variables):

```bash
# On the webserver
cd ~/repos/tenantguard
cat > .env << 'EOF'
DB_TYPE=postgresql
POSTGRES_HOST=34.173.34.153
POSTGRES_PORT=5432
POSTGRES_DB=tenantguard
POSTGRES_USER=postgres
POSTGRES_PASSWORD=R00t12288$
JWT_SECRET_KEY=asdf#FGSgvasgf$5$WGT
EOF
```

### Step 4: Run the Migration Script

```bash
# On the webserver
cd ~/repos/tenantguard
source venv/bin/activate

# Run the migration
python3 scripts/migrate_sqlite_to_postgres.py
```

The script will:
1. Connect to both SQLite and PostgreSQL databases
2. Create the PostgreSQL schema (tables, indexes, constraints)
3. Migrate all data from SQLite to PostgreSQL
4. Report the number of rows migrated

### Step 5: Restart the Application

```bash
# Restart the Flask application
sudo systemctl restart tenantguard
# or
sudo supervisorctl restart tenantguard
```

### Step 6: Verify the Migration

Test the application to ensure everything works:

```bash
# Check if the app is running
curl http://localhost:5000/api/cases

# Check PostgreSQL connection
python3 -c "
from src.config.database import get_psycopg2_connection_params
import psycopg2
conn = psycopg2.connect(**get_psycopg2_connection_params())
print('✅ PostgreSQL connection successful!')
conn.close()
"
```

## Rollback to SQLite (if needed)

If you need to rollback to SQLite:

1. Set `DB_TYPE=sqlite` in `.env`
2. Restart the application
3. The app will automatically use the SQLite database

## Database Schema

The PostgreSQL database will have the same schema as SQLite:

### Tables

1. **`user`**: Basic user information
   - `id`, `username`, `email`

2. **`cases`**: Tenant case management
   - Contact information, tenant details, property info, landlord info, legal issues, eviction notices, financial info

3. **`blog_posts`**: Blog content management
   - `id`, `title`, `slug`, `content`, `excerpt`, `category`, `author`, `status`, `tags`, timestamps

4. **`auth_users`**: Enhanced authentication (if using OAuth)
5. **`oauth_states`**: OAuth state management (if using OAuth)
6. **`attorneys`**: Attorney information (if implemented)
7. **`groups`**: User groups (if implemented)

## Connection Details

### PostgreSQL Connection String

```
postgresql://postgres:R00t12288$@34.173.34.153:5432/tenantguard?sslmode=verify-ca&sslrootcert=ssl_certs/server-ca.pem&sslcert=ssl_certs/client-cert.pem&sslkey=ssl_certs/client-key.pem
```

### Direct psql Connection

```bash
psql "sslmode=verify-ca sslrootcert=ssl_certs/server-ca.pem sslcert=ssl_certs/client-cert.pem sslkey=ssl_certs/client-key.pem hostaddr=34.173.34.153 port=5432 user=postgres dbname=tenantguard"
```

## Troubleshooting

### Connection Timeout or Refused

**Problem**: Cannot connect to PostgreSQL database

**Solution**:
1. Verify the webserver IP is in Cloud SQL authorized networks
2. Check that SSL certificates are in the correct location
3. Verify certificate file permissions (client-key.pem should be 600)

### SSL Certificate Errors

**Problem**: SSL verification failed

**Solution**:
1. Ensure all three certificate files are present
2. Check file paths in `src/config/database.py`
3. Verify certificates haven't expired

### Migration Script Fails

**Problem**: Migration script encounters errors

**Solution**:
1. Check PostgreSQL connection manually first
2. Ensure the SQLite database exists and has data
3. Review error messages for specific table/column issues
4. Check that all required Python packages are installed

### Application Won't Start

**Problem**: Flask application fails to start after migration

**Solution**:
1. Check application logs for specific errors
2. Verify environment variables are set correctly
3. Test database connection independently
4. Ensure all dependencies are installed

## Security Notes

1. **SSL Certificates**: Keep the `ssl_certs/` directory secure and never commit it to version control
2. **Environment Variables**: Store sensitive credentials in `.env` file (not in code)
3. **Authorized Networks**: Only whitelist necessary IP addresses in Cloud SQL
4. **Password Security**: Consider using Cloud SQL IAM authentication for production

## Performance Considerations

- **Connection Pooling**: Configured with `pool_pre_ping` and `pool_recycle` for reliable connections
- **SSL Overhead**: SSL encryption adds minimal latency but ensures data security
- **Indexes**: Ensure proper indexes are created for frequently queried columns

## Next Steps

After successful migration:

1. Monitor application performance
2. Set up automated backups for PostgreSQL
3. Consider implementing read replicas for high availability
4. Update deployment documentation
5. Train team on PostgreSQL-specific features

## Support

For issues or questions:
- Check Google Cloud SQL documentation
- Review Flask-SQLAlchemy documentation
- Consult PostgreSQL documentation for database-specific features
