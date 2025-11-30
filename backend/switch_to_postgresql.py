#!/usr/bin/env python
"""
Script pour basculer Django de SQLite vers PostgreSQL
"""
import os
import django
from django.conf import settings

# Configuration temporaire pour PostgreSQL
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'embassy_backend.settings')
os.environ.setdefault('USE_SQLITE', 'False')
os.environ.setdefault('DB_NAME', 'embassy_db')
os.environ.setdefault('DB_USER', 'postgres')
os.environ.setdefault('DB_PASSWORD', 'root')
os.environ.setdefault('DB_HOST', 'localhost')
os.environ.setdefault('DB_PORT', '5432')

if __name__ == '__main__':
    django.setup()
    
    # Test de connexion
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"✅ Connexion PostgreSQL réussie: {version[0]}")
        
    # Vérifier les tables existantes
    with connection.cursor() as cursor2:
        cursor2.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        tables = cursor2.fetchall()
        print(f"📋 Tables existantes: {[table[0] for table in tables]}")
    
    print("🎯 Django est maintenant configuré pour PostgreSQL!")
