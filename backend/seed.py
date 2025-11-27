#!/usr/bin/env python3
"""
Database seeding script for the Medical AI backend.
This script populates the database with sample medical data for testing and development.
"""

import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Add the current directory to the path so we can import our modules
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, engine, Base
from models import Patient, LabTest, MedicalReport, User

# Load environment variables
load_dotenv()

def seed_database():
    """Seed the database with sample data."""
    print("Starting database seeding...")

    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # Check if data already exists
        existing_patients = db.query(Patient).count()
        if existing_patients > 0:
            print(f"Database already contains {existing_patients} patients. Skipping seeding.")
            return

        print("Seeding sample data...")

        # Create sample patients
        patients_data = [
            {
                "name": "John Smith",
                "birth_date": (datetime.now() - timedelta(days=45*365)).strftime('%Y-%m-%d'),
                "patient_id": "P-2024-001"
            },
            {
                "name": "Sarah Johnson",
                "birth_date": (datetime.now() - timedelta(days=32*365)).strftime('%Y-%m-%d'),
                "patient_id": "P-2024-002"
            },
            {
                "name": "Michael Brown",
                "birth_date": (datetime.now() - timedelta(days=58*365)).strftime('%Y-%m-%d'),
                "patient_id": "P-2024-003"
            },
            {
                "name": "Emily Davis",
                "birth_date": (datetime.now() - timedelta(days=29*365)).strftime('%Y-%m-%d'),
                "patient_id": "P-2024-004"
            },
            {
                "name": "Robert Wilson",
                "birth_date": (datetime.now() - timedelta(days=67*365)).strftime('%Y-%m-%d'),
                "patient_id": "P-2024-005"
            }
        ]

        patients = []
        for patient_data in patients_data:
            patient = Patient(**patient_data)
            db.add(patient)
            patients.append(patient)

        db.commit()

        # Refresh patients to get their IDs
        for patient in patients:
            db.refresh(patient)

        print(f"Created {len(patients)} patients")

        # Create sample lab tests
        lab_tests_data = [
            # John Smith's tests
            {"patient": patients[0], "test_name": "ALT", "value": 35.0, "unit": "U/L", "normal_range": "7-56", "status": "normal", "days_ago": 7},
            {"patient": patients[0], "test_name": "AST", "value": 25.0, "unit": "U/L", "normal_range": "10-40", "status": "normal", "days_ago": 7},
            {"patient": patients[0], "test_name": "Bilirubin", "value": 0.8, "unit": "mg/dL", "normal_range": "0.3-1.2", "status": "normal", "days_ago": 7},
            {"patient": patients[0], "test_name": "GGT", "value": 28.0, "unit": "U/L", "normal_range": "9-48", "status": "normal", "days_ago": 7},
            {"patient": patients[0], "test_name": "Blood Glucose", "value": 95.0, "unit": "mg/dL", "normal_range": "70-100", "status": "normal", "days_ago": 14},
            {"patient": patients[0], "test_name": "Cholesterol", "value": 185.0, "unit": "mg/dL", "normal_range": "< 200", "status": "normal", "days_ago": 14},

            # Sarah Johnson's tests (some abnormal values)
            {"patient": patients[1], "test_name": "ALT", "value": 85.0, "unit": "U/L", "normal_range": "7-56", "status": "high", "days_ago": 3},
            {"patient": patients[1], "test_name": "AST", "value": 65.0, "unit": "U/L", "normal_range": "10-40", "status": "high", "days_ago": 3},
            {"patient": patients[1], "test_name": "Bilirubin", "value": 1.8, "unit": "mg/dL", "normal_range": "0.3-1.2", "status": "high", "days_ago": 3},
            {"patient": patients[1], "test_name": "GGT", "value": 75.0, "unit": "U/L", "normal_range": "9-48", "status": "high", "days_ago": 3},

            # Michael Brown's tests (cirrhosis indicators)
            {"patient": patients[2], "test_name": "ALT", "value": 45.0, "unit": "U/L", "normal_range": "7-56", "status": "normal", "days_ago": 1},
            {"patient": patients[2], "test_name": "AST", "value": 120.0, "unit": "U/L", "normal_range": "10-40", "status": "high", "days_ago": 1},
            {"patient": patients[2], "test_name": "Bilirubin", "value": 2.5, "unit": "mg/dL", "normal_range": "0.3-1.2", "status": "high", "days_ago": 1},
            {"patient": patients[2], "test_name": "Albumin", "value": 2.8, "unit": "g/dL", "normal_range": "3.5-5.0", "status": "low", "days_ago": 1},
        ]

        for test_data in lab_tests_data:
            test_date = datetime.now() - timedelta(days=test_data["days_ago"])
            lab_test = LabTest(
                patient_id=test_data["patient"].id,
                test_name=test_data["test_name"],
                value=test_data["value"],
                unit=test_data["unit"],
                normal_range=test_data["normal_range"],
                status=test_data["status"],
                date=test_date
            )
            db.add(lab_test)

        db.commit()
        print(f"Created {len(lab_tests_data)} lab tests")

        # Create sample medical reports
        medical_reports_data = [
            {
                "patient": patients[0],
                "diagnosis": "Normal Liver Function",
                "confidence": 95.0,
                "advice": "All liver function tests are within normal ranges. Continue routine monitoring and healthy lifestyle.",
                "days_ago": 7
            },
            {
                "patient": patients[1],
                "diagnosis": "Hepatitis C (Stage 2)",
                "confidence": 88.0,
                "advice": "Elevated liver enzymes suggest possible hepatitis C. Further diagnostic testing including viral load and liver biopsy recommended.",
                "days_ago": 3
            },
            {
                "patient": patients[2],
                "diagnosis": "Liver Cirrhosis (Stage 3)",
                "confidence": 85.0,
                "advice": "Signs of advanced liver disease with cirrhosis. Immediate specialist consultation required. Screen for hepatocellular carcinoma and varices.",
                "days_ago": 1
            }
        ]

        for report_data in medical_reports_data:
            report_date = datetime.now() - timedelta(days=report_data["days_ago"])
            medical_report = MedicalReport(
                patient_id=report_data["patient"].id,
                diagnosis=report_data["diagnosis"],
                confidence=report_data["confidence"],
                advice=report_data["advice"],
                created_at=report_date
            )
            db.add(medical_report)

        db.commit()
        print(f"Created {len(medical_reports_data)} medical reports")

        # Create sample users
        users_data = [
            {
                "username": "admin",
                "email": "admin@medical-ai.com",
                "hashed_password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8GqH3VxGK",  # password: admin123
                "role": "admin"
            },
            {
                "username": "doctor1",
                "email": "doctor1@medical-ai.com",
                "hashed_password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8GqH3VxGK",  # password: admin123
                "role": "doctor"
            }
        ]

        for user_data in users_data:
            user = User(**user_data)
            db.add(user)

        db.commit()
        print(f"Created {len(users_data)} users")

        print("Database seeding completed successfully!")

    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()