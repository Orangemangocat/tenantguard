#!/usr/bin/env python3
"""
Migration Script: SQLite to PostgreSQL
Migrates all data from SQLite database to PostgreSQL
"""
import os
import sys
import sqlite3

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import psycopg2
from src.config.database import get_psycopg2_connection_params

# SQLite database path
SQLITE_DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'src', 'database', 'tenantguard.db')

def connect_sqlite():
    """Connect to SQLite database"""
    return sqlite3.connect(SQLITE_DB_PATH)

def connect_postgres():
    """Connect to PostgreSQL database"""
    params = get_psycopg2_connection_params()
    return psycopg2.connect(**params)

def migrate_table(sqlite_conn, pg_conn, table_name, columns):
    """
    Migrate a single table from SQLite to PostgreSQL
    """
    print(f"\n📦 Migrating table: {table_name}")
    
    sqlite_cur = sqlite_conn.cursor()
    pg_cur = pg_conn.cursor()
    
    # Get data from SQLite
    sqlite_cur.execute(f"SELECT * FROM {table_name}")
    rows = sqlite_cur.fetchall()
    
    if not rows:
        print(f"  ⚠️  No data found in {table_name}")
        return 0
    
    # Prepare INSERT statement
    placeholders = ', '.join(['%s'] * len(columns))
    insert_query = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})"
    
    # Insert data into PostgreSQL
    migrated_count = 0
    for row in rows:
        try:
            pg_cur.execute(insert_query, row)
            migrated_count += 1
        except Exception as e:
            print(f"  ❌ Error inserting row: {e}")
            print(f"     Row data: {row}")
            continue
    
    pg_conn.commit()
    print(f"  ✅ Migrated {migrated_count} rows")
    
    sqlite_cur.close()
    pg_cur.close()
    
    return migrated_count

def create_postgres_schema(pg_conn):
    """
    Create PostgreSQL schema using SQLAlchemy models
    """
    print("\n🔨 Creating PostgreSQL schema...")
    
    # Import Flask app to initialize database
    from src.main import app, db
    
    with app.app_context():
        # Drop all tables (careful!)
        print("  ⚠️  Dropping existing tables...")
        db.drop_all()
        
        # Create all tables
        print("  ✨ Creating new tables...")
        db.create_all()
        
    print("  ✅ Schema created successfully")

def main():
    """
    Main migration function
    """
    print("=" * 60)
    print("🚀 TenantGuard Database Migration: SQLite → PostgreSQL")
    print("=" * 60)
    
    # Check if SQLite database exists
    if not os.path.exists(SQLITE_DB_PATH):
        print(f"❌ SQLite database not found at: {SQLITE_DB_PATH}")
        sys.exit(1)
    
    try:
        # Connect to databases
        print("\n🔌 Connecting to databases...")
        sqlite_conn = connect_sqlite()
        print("  ✅ Connected to SQLite")
        
        pg_conn = connect_postgres()
        print("  ✅ Connected to PostgreSQL")
        
        # Create PostgreSQL schema
        create_postgres_schema(pg_conn)
        
        # Define tables and their columns
        tables_to_migrate = {
            'user': ['id', 'username', 'email'],
            'cases': [
                'id', 'case_number', 'status', 'created_at', 'updated_at',
                'first_name', 'last_name', 'email', 'phone', 'preferred_contact',
                'street_address', 'city', 'zip_code', 'age', 'has_disability',
                'has_children', 'household_income', 'primary_language',
                'rental_address', 'property_type', 'bedrooms', 'monthly_rent',
                'security_deposit', 'move_in_date', 'lease_type', 'has_housing_assistance',
                'landlord_name', 'landlord_email', 'landlord_phone',
                'property_manager_name', 'property_manager_email', 'property_manager_phone',
                'issue_type', 'issue_description', 'issue_start_date', 'urgency_level',
                'previous_legal_action', 'eviction_notice_received', 'eviction_notice_type',
                'eviction_notice_date', 'court_date', 'response_deadline',
                'rent_current', 'amount_owed', 'last_payment_date', 'payment_dispute',
                'financial_hardship', 'documents_uploaded', 'attorney_preference', 'case_summary'
            ],
            'blog_posts': [
                'id', 'title', 'slug', 'content', 'excerpt', 'category', 'author',
                'status', 'featured_image', 'tags', 'created_at', 'updated_at', 'published_at'
            ]
        }
        
        # Migrate each table
        total_migrated = 0
        for table_name, columns in tables_to_migrate.items():
            count = migrate_table(sqlite_conn, pg_conn, table_name, columns)
            total_migrated += count
        
        # Close connections
        sqlite_conn.close()
        pg_conn.close()
        
        print("\n" + "=" * 60)
        print(f"✅ Migration completed successfully!")
        print(f"📊 Total rows migrated: {total_migrated}")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
