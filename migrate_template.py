import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'instance', 'database.sqlite')

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('ALTER TABLE document_requests ADD COLUMN template_path VARCHAR(255) NULL;')
    conn.commit()
    print("Migration successful: added template_path to document_requests.")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e):
        print("Column template_path already exists.")
    else:
        print(f"Error: {e}")
finally:
    if conn:
        conn.close()
