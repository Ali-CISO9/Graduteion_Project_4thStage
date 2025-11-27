import sqlite3

conn = sqlite3.connect('backend/medical_ai.db')
cursor = conn.cursor()

# Get count
cursor.execute("SELECT COUNT(*) FROM patients;")
count = cursor.fetchone()[0]
print(f"Number of patients: {count}")

# List all patients
cursor.execute("SELECT * FROM patients;")
rows = cursor.fetchall()
print("All patients:")
for row in rows:
    print(row)

conn.close()