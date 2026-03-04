"""
Database Configuration Module
Handles database connection configuration for both SQLite and PostgreSQL
"""
import os
from urllib.parse import quote_plus

# Database type: 'sqlite' or 'postgresql'
DB_TYPE = os.getenv('DB_TYPE', 'postgresql')

# Allow overriding SSL mode (local docker should set POSTGRES_SSLMODE=disable)
POSTGRES_SSLMODE = os.getenv("POSTGRES_SSLMODE", "verify-ca")

# PostgreSQL Configuration
POSTGRES_CONFIG = {
    'host': os.getenv('POSTGRES_HOST', 'localhost'),
    'port': os.getenv('POSTGRES_PORT', '5432'),
    'database': os.getenv('POSTGRES_DB', 'tenantguard'),
    'user': os.getenv('POSTGRES_USER', 'tenantguard'),
    'password': os.getenv('POSTGRES_PASSWORD'),
}

# SSL Certificate paths (relative to project root)
SSL_CERTS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    'ssl_certs'
)

SSL_CONFIG = {
    'sslmode': POSTGRES_SSLMODE,
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
            db_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                'database',
                'tenantguard.db'
            )
            return f"sqlite:///{db_path}"

        required_keys = ('host', 'port', 'database', 'user', 'password')
        missing_keys = [key for key in required_keys if not POSTGRES_CONFIG.get(key)]
        if missing_keys:
            print(f"[DB_CONFIG] Missing Postgres env vars: {', '.join(missing_keys)}; falling back to SQLite")
            db_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                'database',
                'tenantguard.db'
            )
            return f"sqlite:///{db_path}"

        safe_password = quote_plus(POSTGRES_CONFIG['password'])
        uri = (
            f"postgresql://{POSTGRES_CONFIG['user']}:{safe_password}"
            f"@{POSTGRES_CONFIG['host']}:{POSTGRES_CONFIG['port']}"
            f"/{POSTGRES_CONFIG['database']}"
        )
        return uri

    # SQLite fallback
    db_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        'database',
        'tenantguard.db'
    )
    return f"sqlite:///{db_path}"


def get_sqlalchemy_engine_options():
    """
    Get SQLAlchemy engine options including SSL configuration for PostgreSQL
    """
    if DB_TYPE == 'postgresql':
        try:
            import psycopg2  # noqa: F401

            sslmode = os.getenv("POSTGRES_SSLMODE", "verify-ca")

            # Local docker: no SSL, no cert files
            if sslmode == "disable":
                return {
                    'pool_pre_ping': True,
                    'pool_recycle': 3600,
                }

            # Production SSL
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