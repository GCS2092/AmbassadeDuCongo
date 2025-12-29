import sqlite3, os
DB=os.path.join(os.path.dirname(__file__), '..', 'db.sqlite3')
DB=os.path.abspath(DB)
conn=sqlite3.connect(DB)
cur=conn.cursor()
cur.execute("SELECT id, LENGTH(phone_number) FROM users_user WHERE phone_number IS NOT NULL AND LENGTH(phone_number) > 200")
rows=cur.fetchall()
if rows:
    print('Found users with long phone_number:')
    for r in rows:
        print(r)
else:
    print('No users with phone_number > 200 chars')
conn.close()