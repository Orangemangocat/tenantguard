"""
Database Configuration Module
Handles database connection configuration for both SQLite and PostgreSQL
"""
import os

# Database type: 'sqlite' or 'postgresql'
DB_TYPE = os.getenv('DB_TYPE', 'postgresql')

# PostgreSQL Configuration
POSTGRES_CONFIG = {
    'host': os.getenv('POSTGRES_HOST', '34.173.34.153'),
    'port': os.getenv('POSTGRES_PORT', '5432'),
    'database': os.getenv('POSTGRES_DB', 'tenantguard'),
    'user': os.getenv('POSTGRES_USER', 'tenantguard'),
    'password': os.getenv('POSTGRES_PASSWORD', 'R00t12288$'),
}

# SSL Certificate paths (relative to project root)
SSL_CERTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'ssl_certs')
SSL_CONFIG = {
    'sslmode': 'verify-ca',
    'sslrootcert': os.path.join(SSL_CERTS_DIR, 'server-ca.pem'),
    'sslcert': os.path.join(SSL_CERTS_DIR, 'client-cert.pem'),
    'sslkey': os.path.join(SSL_CERTS_DIR, 'client-key.pem'),
}

def get_database_uri():
    """
    Generate the appropriate database URI based on DB_TYPE
    """
    if DB_TYPE == 'postgresql':
        # Build PostgreSQL connection string with SSL
        ssl_params = '&'.join([f'{k}={v}' for k, v in SSL_CONFIG.items()])
        uri = (
            f"postgresql://{POSTGRES_CONFIG['user']}:{POSTGRES_CONFIG['password']}"
            f"@{POSTGRES_CONFIG['host']}:{POSTGRES_CONFIG['port']}"
            f"/{POSTGRES_CONFIG['database']}?{ssl_params}"
        )
        return uri
    else:
        # SQLite fallback
        db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database', 'tenantguard.db')
        return f"sqlite:///{db_path}"

def get_psycopg2_connection_params():
    """
    Get connection parameters for direct psycopg2 usage
    """
    params = POSTGRES_CONFIG.copy()
    params.update(SSL_CONFIG)
    return params
