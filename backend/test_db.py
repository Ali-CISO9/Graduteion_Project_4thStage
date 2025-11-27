#!/usr/bin/env python3

import os
from database import get_db
from models import Patient, LabTest, MedicalReport

def test_database():
    print("Testing database connection...")

    try:
        db = next(get_db())

        # Test patients
        patients = db.query(Patient).all()
        print(f"Found {len(patients)} patients:")
        for patient in patients[:3]:  # Show first 3
            print(f"  - {patient.name} (ID: {patient.id}, MRN: {patient.medical_record_number})")

        # Test lab tests
        if patients:
            patient = patients[0]
            lab_tests = db.query(LabTest).filter(LabTest.patient_id == patient.id).all()
            print(f"Patient {patient.name} has {len(lab_tests)} lab tests")

        # Test medical reports
        reports = db.query(MedicalReport).all()
        print(f"Found {len(reports)} medical reports")

        print("Database test completed successfully!")

    except Exception as e:
        print(f"Database error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_database()