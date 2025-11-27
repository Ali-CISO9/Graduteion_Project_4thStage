from database import get_db, engine, Base
from models import Patient
from sqlalchemy.orm import Session

Base.metadata.create_all(bind=engine)

departments = [
    "Hepatology",
    "Gastroenterology",
    "Internal Medicine",
    "Emergency",
    "Cardiology",
    "Neurology",
    "Radiology"
]

doctors = [
    "Dr. Sarah Ahmed",
    "Dr. Michael Chen",
    "Dr. Emily Johnson",
    "Dr. David Wilson",
    "Dr. Lisa Brown",
    "Dr. James Davis",
    "Dr. Maria Garcia"
]

def populate_departments():
    db = next(get_db())
    try:
        # Get all patients
        patients = db.query(Patient).all()
        print(f'Found {len(patients)} patients to update')

        for i, patient in enumerate(patients):
            # Assign department and doctor
            department = departments[i % len(departments)]
            doctor = doctors[i % len(doctors)]

            patient.department = department
            patient.doctor_name = doctor

            print(f'Updated {patient.name}: Department={department}, Doctor={doctor}')

        db.commit()
        print(f'Successfully updated {len(patients)} patients')

        # Verify the updates
        updated_patients = db.query(Patient).limit(3).all()
        print('\nVerification - First 3 patients:')
        for patient in updated_patients:
            print(f'  {patient.name}: {patient.department} - {patient.doctor_name}')

    except Exception as e:
        print(f'Error: {e}')
        db.rollback()
    finally:
        db.close()

if __name__ == '__main__':
    populate_departments()