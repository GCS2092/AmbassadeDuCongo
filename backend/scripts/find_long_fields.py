"""
Script to find values exceeding configured max_length in the local SQLite DB.
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'db.sqlite3')
DB_PATH = os.path.abspath(DB_PATH)

checks = [
    # table, field, max_length
    ('users_user', 'phone_number', 200),
    ('users_user', 'consular_card_number', 200),
    ('users_user', 'first_name', 150),
    ('users_user', 'last_name', 150),
    ('users_user', 'username', 150),
    ('users_profile', 'birth_last_name', 200),
    ('users_profile', 'used_last_name', 200),
    ('users_profile', 'spouse_name', 200),
    ('users_profile', 'profession', 200),
    ('users_profile', 'employer', 200),
    ('users_profile', 'work_phone', 200),
    ('users_profile', 'emergency_contact_name', 200),
    ('users_profile', 'consular_number', 200),
    ('users_profile', 'passport_number', 200),
    ('users_profile', 'id_card_number', 200),
    ('users_profile', 'birth_certificate_number', 200),
    ('users_profile', 'driving_license_number', 200),
    ('notifications_notification', 'title', 200),
    ('notifications_notificationtemplate', 'email_subject', 200),
]

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

found_any = False
for table, field, maxlen in checks:
    # Check that the table and column exist
    try:
        cur.execute(f"PRAGMA table_info({table})")
        cols = [r['name'] for r in cur.fetchall()]
        if field not in cols:
            print(f"SKIP: {table}.{field} (column not present)")
            continue
    except Exception as e:
        print(f"ERROR: accessing table {table}: {e}")
        continue

    query = f"SELECT rowid, {field}, LENGTH({field}) as len FROM {table} WHERE {field} IS NOT NULL AND LENGTH({field}) > ? ORDER BY len DESC LIMIT 50"
    cur.execute(query, (maxlen,))
    rows = cur.fetchall()
    if rows:
        found_any = True
        print('\n' + '='*60)
        print(f"Table {table}.{field}: values longer than {maxlen} chars (showing up to 50)")
        for r in rows:
            value_preview = (r[field][:200] + '...') if r['len'] > 200 else r[field]
            print(f"rowid={r['rowid']} len={r['len']} preview={repr(value_preview)[:200]}")

if not found_any:
    print("No values found exceeding configured limits in the checked fields.")

conn.close()