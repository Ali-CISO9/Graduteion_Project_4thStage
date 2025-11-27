import sqlite3

def check_database():
    try:
        conn = sqlite3.connect('medical_ai.db')
        cursor = conn.cursor()

        # Check if the patients table exists and has the new columns
        cursor.execute('PRAGMA table_info(patients)')
        columns = cursor.fetchall()

        print('Patients table columns:')
        for col in columns:
            print(f'  {col[1]}: {col[2]} (nullable: {col[3]})')

        # Check if there are any patients
        cursor.execute('SELECT COUNT(*) FROM patients')
        count = cursor.fetchone()[0]
        print(f'\nTotal patients: {count}')

        if count > 0:
            # Show first 3 patients with department and doctor info
            cursor.execute('SELECT id, name, patient_id, department, doctor_name, email, phone FROM patients LIMIT 3')
            patients = cursor.fetchall()
            print(f'\nFirst 3 patients:')
            for patient in patients:
                print(f'  ID {patient[0]}: {patient[1]} ({patient[2]})')
                print(f'    Dept: {patient[3]}, Dr: {patient[4]}')
                print(f'    Email: {patient[5]}, Phone: {patient[6]}')
                print()

        conn.close()
        return True
    except Exception as e:
        print(f'Error checking database: {e}')
        return False

if __name__ == '__main__':
    check_database()