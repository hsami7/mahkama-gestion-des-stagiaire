import sqlite3

try:
    conn = sqlite3.connect('backend/instance/database.sqlite')
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [t[0] for t in cursor.fetchall()]
    print('Tables in backend/instance/database.sqlite:', tables)
    if 'interns' in tables:
        cursor.execute('SELECT COUNT(*) FROM interns')
        print('Interns count:', cursor.fetchone()[0])
        cursor.execute("SELECT id, name, email FROM interns")
        print("Interns:", cursor.fetchall())
except Exception as e:
    print(e)
