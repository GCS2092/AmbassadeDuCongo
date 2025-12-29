"""
Scan all tables and text-like columns in the local SQLite DB and report values longer than 200 chars.
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'db.sqlite3')
DB_PATH = os.path.abspath(DB_PATH)

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# Get list of tables
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
tables = [r[0] for r in cur.fetchall()]

found = False
for table in tables:
    # get columns info
    cur.execute(f"PRAGMA table_info('{table}')")
    cols = [{ 'name': r['name'], 'type': r['type'] } for r in cur.fetchall()]
    text_cols = [c for c in cols if c['type'] is None or c['type']=='' or 'CHAR' in c['type'].upper() or 'TEXT' in c['type'].upper() or 'CLOB' in c['type'].upper()]
    for c in text_cols:
        col = c['name']
        try:
            query = f"SELECT rowid, LENGTH({col}) AS len FROM {table} WHERE {col} IS NOT NULL AND LENGTH({col}) > 200 ORDER BY len DESC LIMIT 10"
            cur.execute(query)
            rows = cur.fetchall()
            if rows:
                if not found:
                    print('\nFound fields with values >200 chars:')
                    found = True
                print('\n' + '-'*60)
                print(f"Table: {table} Column: {col} Type: {c['type']} -> {len(rows)} matching rows (showing up to 10)")
                for r in rows:
                    print(f" rowid={r['rowid']} len={r['len']}")
        except Exception as e:
            # ignore columns that cause errors (e.g., json fields stored differently)
            pass

if not found:
    print('No TEXT-like column values found exceeding 200 characters in DB (checked all tables).')

conn.close()