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
        # Try to import psycopg2; if unavailable, fall back to SQLite for local dev
        try:
            import psycopg2  # noqa: F401
        except Exception:
            # Fallback to sqlite if psycopg2 is not installed
            db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database', 'tenantguard.db')
            return f"sqlite:///{db_path}"

        # Build PostgreSQL connection string WITHOUT SSL params in URI
        # SSL params will be passed via connect_args in SQLAlchemy
        uri = (
            f"postgresql://{POSTGRES_CONFIG['user']}:{POSTGRES_CONFIG['password']}"
            f"@{POSTGRES_CONFIG['host']}:{POSTGRES_CONFIG['port']}"
            f"/{POSTGRES_CONFIG['database']}"
        )
        return uri
    else:
        # SQLite fallback
        db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database', 'tenantguard.db')
        return f"sqlite:///{db_path}"

def get_sqlalchemy_engine_options():
    """
    Get SQLAlchemy engine options including SSL configuration for PostgreSQL
    """
    if DB_TYPE == 'postgresql':
        # If psycopg2 is not available, SQLAlchemy will use SQLite, so only
        # return SSL connect_args when psycopg2 exists.
        try:
            import psycopg2  # noqa: F401
            return {
                'pool_pre_ping': True,
                'pool_recycle': 3600,
                'connect_args': SSL_CONFIG
            }
        except Exception:
            return {
                'pool_pre_ping': True,
                'pool_recycle': 3600,
            }
    else:
        return {
            'pool_pre_ping': True,
            'pool_recycle': 3600,
        }

def get_psycopg2_connection_params():
    """
    Get connection parameters for direct psycopg2 usage
    """
    params = POSTGRES_CONFIG.copy()
    params.update(SSL_CONFIG)
    return params
