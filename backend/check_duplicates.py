import sqlite3
from collections import Counter

def check_duplicates():
    try:
        conn = sqlite3.connect('medical_ai.db')
        cursor = conn.cursor()

        print("=== DATABASE DUPLICATE CHECK ===\n")

        # Check for duplicate patients by patient_id
        cursor.execute('SELECT patient_id, COUNT(*) FROM patients GROUP BY patient_id HAVING COUNT(*) > 1')
        duplicate_patient_ids = cursor.fetchall()

        if duplicate_patient_ids:
            print("DUPLICATE PATIENT IDs FOUND:")
            for patient_id, count in duplicate_patient_ids:
                print(f"  Patient ID '{patient_id}': {count} occurrences")

                # Show details of duplicates
                cursor.execute('SELECT id, name, email, phone FROM patients WHERE patient_id = ?', (patient_id,))
                duplicates = cursor.fetchall()
                for dup in duplicates:
                    print(f"    - DB ID {dup[0]}: {dup[1]} (Email: {dup[2]}, Phone: {dup[3]})")
                print()
        else:
            print("No duplicate patient IDs found")

        # Check for duplicate patients by name + email combination
        cursor.execute('SELECT name, email, COUNT(*) FROM patients WHERE email IS NOT NULL AND email != "" GROUP BY name, email HAVING COUNT(*) > 1')
        duplicate_name_email = cursor.fetchall()

        if duplicate_name_email:
            print("DUPLICATE PATIENTS BY NAME+EMAIL:")
            for name, email, count in duplicate_name_email:
                print(f"  '{name}' with email '{email}': {count} occurrences")

                cursor.execute('SELECT id, patient_id FROM patients WHERE name = ? AND email = ?', (name, email))
                duplicates = cursor.fetchall()
                for dup in duplicates:
                    print(f"    - DB ID {dup[0]}: Patient ID {dup[1]}")
                print()
        else:
            print("No duplicate patients by name+email found")

        # Check for duplicate analyses by patient_id
        cursor.execute('SELECT patient_id, COUNT(*) FROM patient_analyses GROUP BY patient_id HAVING COUNT(*) > 1')
        duplicate_analyses = cursor.fetchall()

        if duplicate_analyses:
            print("❌ DUPLICATE ANALYSES BY PATIENT ID:")
            for patient_id, count in duplicate_analyses:
                print(f"  Patient ID '{patient_id}': {count} analyses")

                cursor.execute('SELECT id, diagnosis, created_at FROM patient_analyses WHERE patient_id = ?', (patient_id,))
                analyses = cursor.fetchall()
                for analysis in analyses:
                    print(f"    - Analysis ID {analysis[0]}: {analysis[1]} (Created: {analysis[2]})")
                print()
        else:
            print("✅ No duplicate analyses by patient ID found")

        # Get overall statistics
        cursor.execute('SELECT COUNT(*) FROM patients')
        total_patients = cursor.fetchone()[0]

        cursor.execute('SELECT COUNT(*) FROM patient_analyses')
        total_analyses = cursor.fetchone()[0]

        cursor.execute('SELECT COUNT(DISTINCT patient_id) FROM patients')
        unique_patient_ids = cursor.fetchone()[0]

        print("=== OVERALL STATISTICS ===")
        print(f"Total patients in database: {total_patients}")
        print(f"Unique patient IDs: {unique_patient_ids}")
        print(f"Total analyses: {total_analyses}")

        if total_patients != unique_patient_ids:
            print(f"⚠️  WARNING: {total_patients - unique_patient_ids} patients have duplicate IDs!")
        else:
            print("✅ All patient IDs are unique")

        # Check for orphaned analyses (analyses with patient_ids that don't exist in patients table)
        cursor.execute('''
            SELECT pa.id, pa.patient_id, pa.diagnosis
            FROM patient_analyses pa
            LEFT JOIN patients p ON pa.patient_id = p.id
            WHERE p.id IS NULL
        ''')
        orphaned_analyses = cursor.fetchall()

        if orphaned_analyses:
            print(f"\n❌ ORPHANED ANALYSES FOUND ({len(orphaned_analyses)}):")
            for analysis_id, patient_id, diagnosis in orphaned_analyses:
                print(f"  Analysis ID {analysis_id}: references non-existent patient ID {patient_id} ({diagnosis})")
        else:
            print("✅ No orphaned analyses found")

        conn.close()

        print("\n=== CHECK COMPLETE ===")
        return len(duplicate_patient_ids) == 0 and len(duplicate_name_email) == 0 and len(duplicate_analyses) == 0 and len(orphaned_analyses) == 0

    except Exception as e:
        print(f"❌ Error checking database: {e}")
        return False

if __name__ == '__main__':
    success = check_duplicates()
    if success:
        print("🎉 Database appears clean - no duplicates found!")
    else:
        print("⚠️  Issues found - duplicates detected!")