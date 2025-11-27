from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from typing import Optional, List
import json
import requests
from datetime import datetime

# Load environment variables
load_dotenv()

from model import predict_liver_disease
from database import get_db, engine, Base
from models import Patient, LabTest, MedicalReport, User
from sqlalchemy.orm import Session
from sqlalchemy import desc

print(f"DATABASE_URL: {os.getenv('DATABASE_URL')}")

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(title="Medical AI Backend", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class LabValues(BaseModel):
    ALT: Optional[float] = None
    AST: Optional[float] = None
    Bilirubin: Optional[float] = None
    GGT: Optional[float] = None

class ChatbotRequest(BaseModel):
    message: str

class PatientData(BaseModel):
    id: str
    name: str
    age: int
    gender: str

class LabTestResponse(BaseModel):
    testName: str
    value: float
    unit: str
    normalRange: str
    status: str
    date: str

class Visit(BaseModel):
    date: str
    type: str
    doctor: str

class PatientResponse(BaseModel):
    success: bool
    patient: PatientData
    labTests: List[LabTestResponse]
    recentVisits: List[Visit]

# Initialize Hugging Face API
HUGGINGFACE_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN")

@app.get("/")
async def root():
    return {"message": "Medical AI Backend API", "status": "running"}

@app.post("/analyze")
async def analyze_data(
    file: Optional[UploadFile] = File(None),
    lab_values: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    try:
        if file:
            # Handle image upload (mock for now)
            # TODO: Integrate ML model for image analysis
            return {
                "success": True,
                "analysis": {
                    "diagnosis": "Normal liver function",
                    "confidence": 95,
                    "advice": "Continue routine check-ups and maintain healthy lifestyle.",
                    "scanType": "X-Ray",
                    "findings": [
                        {
                            "region": "Chest",
                            "condition": "Normal",
                            "confidence": 0.95,
                            "description": "No abnormalities detected",
                        }
                    ],
                    "overallAssessment": "Scan appears normal",
                    "recommendations": ["Continue routine check-ups"],
                    "timestamp": datetime.now().isoformat(),
                }
            }
        elif lab_values:
            # Handle lab values
            lab_data = json.loads(lab_values)
            alt = float(lab_data.get('ALT', 0))
            ast = float(lab_data.get('AST', 0))
            bilirubin = float(lab_data.get('Bilirubin', 0))
            ggt = float(lab_data.get('GGT', 0))

            # Extract additional parameters for enhanced analysis
            age = float(lab_data.get('Age', 45))
            gender = lab_data.get('Gender', 'male')
            alkphos = float(lab_data.get('AlkPhos', 100))
            tp = float(lab_data.get('TP', 7.0))
            alb = float(lab_data.get('ALB', 4.0))

            # Use enhanced ML model for prediction
            diagnosis, confidence, advice = predict_liver_disease(alt, ast, bilirubin, ggt, age, gender, alkphos, tp, alb)

            # Save medical report to database (optional - only if patient_id is provided)
            patient_id = lab_data.get('patient_id')
            if patient_id:
                try:
                    # Create medical report record
                    medical_report = MedicalReport(
                        patient_id=int(patient_id),
                        diagnosis=diagnosis,
                        confidence=float(confidence),
                        advice=advice
                    )
                    db.add(medical_report)
                    db.commit()
                    db.refresh(medical_report)
                except Exception as db_error:
                    print(f"Database error saving medical report: {db_error}")
                    # Continue without failing the analysis

            return {
                "success": True,
                "analysis": {
                    "diagnosis": diagnosis,
                    "confidence": confidence,
                    "advice": advice,
                    "labValues": {
                        "ALT": alt,
                        "AST": ast,
                        "Bilirubin": bilirubin,
                        "GGT": ggt,
                    },
                    "timestamp": datetime.now().isoformat(),
                }
            }
        else:
            raise HTTPException(status_code=400, detail="No data provided")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chatbot")
async def chatbot(request: ChatbotRequest, db: Session = Depends(get_db)):
    try:
        # Fetch database context
        patients = db.query(Patient).order_by(desc(Patient.created_at)).limit(10).all()
        analyses = db.query(MedicalReport).order_by(desc(MedicalReport.created_at)).limit(10).all()

        # Build context from database
        context = {
            "patients": patients,
            "analyses": analyses,
            "total_patients": len(patients),
            "total_analyses": len(analyses)
        }

        user_message = request.message.lower().strip()

        # Simple rule-based responses based on database context
        response = ""

        # Handle analysis-related questions
        if any(word in user_message for word in ["analysis", "analyses", "diagnosis", "report", "results"]):
            if "how many" in user_message or "count" in user_message:
                response = f"We have performed {context['total_analyses']} medical analysis(es) in our system."
            elif "recent" in user_message or "latest" in user_message:
                if context['analyses']:
                    analysis = context['analyses'][0]
                    patient = db.query(Patient).filter(Patient.id == analysis.patient_id).first()
                    patient_name = patient.name if patient else "Unknown Patient"
                    response = f"The most recent analysis was for {patient_name} with a diagnosis of {analysis.diagnosis} (confidence: {analysis.confidence}%)."
                else:
                    response = "No medical analyses have been performed yet."
            else:
                response = f"We have completed {context['total_analyses']} medical analysis(es). Our system uses AI-powered liver disease analysis to provide accurate diagnoses and treatment recommendations."

        # Handle patient-related questions
        elif any(word in user_message for word in ["patient", "patients", "who"]) or ("how many" in user_message and "patient" in user_message):
            if "how many" in user_message or "count" in user_message:
                response = f"We currently have {context['total_patients']} patient(s) in our system."
                if context['patients']:
                    patient_names = [p.name for p in context['patients'][:3]]
                    response += f" Recent patients include: {', '.join(patient_names)}"
                    if len(context['patients']) > 3:
                        response += f" and {len(context['patients']) - 3} others."
            elif "list" in user_message or "show" in user_message:
                if context['patients']:
                    response = "Here are our current patients:\n"
                    for patient in context['patients'][:5]:
                        response += f"• {patient.name} (ID: {patient.patient_id})"
                        if patient.department:
                            response += f" - {patient.department}"
                        if patient.doctor_name:
                            response += f" - Dr. {patient.doctor_name}"
                        response += "\n"
                else:
                    response = "No patients are currently registered in the system."
            else:
                response = f"We have {context['total_patients']} patient(s) in our medical database. I can provide information about specific patients or show you a list of all patients."

        # Handle system capability questions
        elif any(word in user_message for word in ["system", "capabilities", "features", "what can you do", "help"]):
            response = f"I am your AI Medical Assistant with access to the healthcare system's database. Here's what I can help you with:\n\n"
            response += "• **Patient Information**: View patient records, demographics, and medical history\n"
            response += "• **Medical Analyses**: Access AI-powered liver disease analysis results and confidence scores\n"
            response += "• **Lab Results**: Review laboratory test results and interpretations\n"
            response += "• **Appointment Management**: Schedule and manage patient appointments\n"
            response += "• **Medical Reports**: Generate comprehensive medical reports\n"
            response += "• **General Medical Information**: Answer questions about medical conditions and health advice\n\n"
            response += f"I have real-time access to {context['total_patients']} patients and {context['total_analyses']} medical analyses in our system."

        # Handle greetings
        elif any(word in user_message for word in ["hello", "hi", "hey", "greetings"]):
            response = f"Hello! I'm your AI Medical Assistant. I have access to {context['total_patients']} patients and {context['total_analyses']} medical analyses in our healthcare system. How can I help you today?"

        # Handle general questions
        elif any(word in user_message for word in ["liver", "disease", "medical", "health"]):
            response = """Regarding liver health and medical conditions:

• Our system specializes in AI-powered liver disease analysis
• We analyze liver function tests (ALT, AST, bilirubin, GGT) using machine learning models
• Recent analyses show we're helping patients with accurate diagnoses and treatment recommendations
• For specific medical advice, please consult with a healthcare professional

I can provide information about our system's capabilities and current patient data."""

        # Default response
        else:
            response = f"I understand you're asking about: '{request.message}'. As your AI Medical Assistant, I have access to {context['total_patients']} patients and {context['total_analyses']} medical analyses in our healthcare system. I can help you with patient information, medical analyses, system capabilities, or general medical questions. Could you please be more specific about what you'd like to know?"

        # Always add disclaimer
        response += "\n\n*Please note: I am an AI assistant and not a substitute for professional medical advice. Always consult with qualified healthcare providers for medical decisions.*"

        return {
            "success": True,
            "response": response,
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        print(f"Chatbot error: {e}")
        return {
            "success": True,
            "response": "I apologize for the technical issue. Our medical system is currently operational with patient management and AI analysis capabilities. For specific medical advice, please consult with a healthcare professional.",
            "timestamp": datetime.now().isoformat(),
        }

@app.get("/patient-data")
async def get_patient_data(db: Session = Depends(get_db)):
    try:
        print(f"DATABASE_URL in endpoint: {os.getenv('DATABASE_URL')}")
        # Get the first patient (for demo purposes)
        patient = db.query(Patient).first()
        print(f"Patient found: {patient}")
        print(f"Patient name: {patient.name if patient else 'None'}")
        print(f"Patient ID: {patient.id if patient else 'None'}")

        if not patient:
            # Return mock data if no patients in database
            return {
                "success": True,
                "patient": {
                    "id": "P-2024-001",
                    "name": "John Smith",
                    "age": 45,
                    "gender": "Male",
                },
                "labTests": [
                    {
                        "testName": "Blood Glucose",
                        "value": 95,
                        "unit": "mg/dL",
                        "normalRange": "70-100",
                        "status": "normal",
                        "date": "2024-01-15",
                    },
                    {
                        "testName": "Cholesterol",
                        "value": 185,
                        "unit": "mg/dL",
                        "normalRange": "< 200",
                        "status": "normal",
                        "date": "2024-01-15",
                    },
                ],
                "recentVisits": [
                    {
                        "date": "2024-01-15",
                        "type": "Routine Checkup",
                        "doctor": "Dr. Sarah Ahmed",
                    },
                ],
            }

        # Get lab tests for the patient
        lab_tests = db.query(LabTest).filter(LabTest.patient_id == patient.id).order_by(desc(LabTest.date)).limit(10).all()

        # Convert to response format
        lab_tests_response = [
            {
                "testName": test.test_name,
                "value": test.value,
                "unit": test.unit,
                "normalRange": test.normal_range,
                "status": test.status,
                "date": test.date.isoformat() if test.date else None,
            }
            for test in lab_tests
        ]

        return {
            "success": True,
            "patient": {
                "id": patient.patient_id,
                "name": patient.name,
                "birth_date": patient.birth_date,
            },
            "labTests": lab_tests_response,
            "recentVisits": [
                {
                    "date": "2024-01-15",  # This would come from a visits table in a real implementation
                    "type": "Routine Checkup",
                    "doctor": "Dr. Sarah Ahmed",
                },
            ],
        }
    except Exception as e:
        print(f"Database error in get_patient_data: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@app.get("/lab-tests")
async def get_lab_tests(patientId: str, db: Session = Depends(get_db)):
    try:
        # Find patient by patient ID
        patient = db.query(Patient).filter(Patient.patient_id == patientId).first()

        if not patient:
            return {"success": False, "message": "Patient not found"}

        # Get lab tests for the patient
        lab_tests = db.query(LabTest).filter(LabTest.patient_id == patient.id).order_by(desc(LabTest.date)).all()

        # Convert to response format
        lab_tests_response = [
            {
                "testName": test.test_name,
                "value": test.value,
                "unit": test.unit,
                "normalRange": test.normal_range,
                "status": test.status,
                "date": test.date.isoformat() if test.date else None,
            }
            for test in lab_tests
        ]

        return {
            "success": True,
            "labTests": lab_tests_response,
        }
    except Exception as e:
        print(f"Database error in get_lab_tests: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@app.get("/patients")
async def get_patients(db: Session = Depends(get_db)):
    try:
        patients = db.query(Patient).order_by(desc(Patient.created_at)).all()

        patients_response = [
            {
                "id": patient.id,
                "name": patient.name,
                "patient_id": patient.patient_id,
                "birth_date": patient.birth_date,
                "email": patient.email,
                "phone": patient.phone,
                "profile_picture": patient.profile_picture,
                "department": patient.department,
                "doctor_name": patient.doctor_name,
                "created_at": patient.created_at.isoformat() if patient.created_at else None,
                "updated_at": patient.updated_at.isoformat() if patient.updated_at else None,
            }
            for patient in patients
        ]

        return {
            "success": True,
            "patients": patients_response,
        }
    except Exception as e:
        print(f"Database error in get_patients: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@app.put("/patients/{patient_id}")
async def update_patient(patient_id: str, patient_data: dict = None, db: Session = Depends(get_db)):
    try:
        # Find patient by patient_id (string field)
        patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()

        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        # Update patient fields
        if "name" in patient_data:
            patient.name = patient_data["name"]
        if "patient_id" in patient_data:
            patient.patient_id = patient_data["patient_id"]
        if "birth_date" in patient_data:
            patient.birth_date = patient_data["birth_date"]
        if "email" in patient_data:
            patient.email = patient_data["email"]
        if "phone" in patient_data:
            patient.phone = patient_data["phone"]
        if "profile_picture" in patient_data:
            patient.profile_picture = patient_data["profile_picture"]
        if "department" in patient_data:
            patient.department = patient_data["department"]
        if "doctor_name" in patient_data:
            patient.doctor_name = patient_data["doctor_name"]

        db.commit()
        db.refresh(patient)

        return {"success": True, "patient": {
            "id": patient.id,
            "name": patient.name,
            "patient_id": patient.patient_id,
            "birth_date": patient.birth_date,
            "email": patient.email,
            "phone": patient.phone,
            "profile_picture": patient.profile_picture,
            "department": patient.department,
            "doctor_name": patient.doctor_name
        }, "message": "Patient updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Database error in update_patient: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@app.delete("/patients/{patient_id}")
async def delete_patient(patient_id: str, db: Session = Depends(get_db)):
    try:
        # Find patient by patient_id (string field)
        patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()

        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        # Delete the patient
        db.delete(patient)
        db.commit()

        return {"success": True, "message": "Patient deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Database error in delete_patient: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@app.post("/patients")
async def create_or_update_patient(patient_data: dict, db: Session = Depends(get_db)):
    try:
        patient_id = patient_data.get("patient_id")
        name = patient_data.get("name")
        birth_date_str = patient_data.get("birth_date")

        if not patient_id or not name:
            raise HTTPException(status_code=400, detail="Patient ID and name are required")

        # Check if patient already exists
        existing_patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()

        if existing_patient:
            # Return error for duplicate patient ID
            raise HTTPException(status_code=400, detail="ID is Currently used")

        # birth_date is now stored as string
        birth_date = birth_date_str if birth_date_str else None

        # Create new patient
        new_patient = Patient(
            name=name,
            birth_date=birth_date,
            patient_id=patient_id,
            email=patient_data.get("email"),
            phone=patient_data.get("phone"),
            profile_picture=patient_data.get("profile_picture"),
            department=patient_data.get("department"),
            doctor_name=patient_data.get("doctor_name")
        )

        db.add(new_patient)
        db.commit()
        db.refresh(new_patient)

        return {"success": True, "patient": {
            "id": new_patient.id,
            "name": new_patient.name,
            "patient_id": new_patient.patient_id,
            "birth_date": new_patient.birth_date,
            "email": new_patient.email,
            "phone": new_patient.phone,
            "profile_picture": new_patient.profile_picture,
            "department": new_patient.department,
            "doctor_name": new_patient.doctor_name
        }}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Database error in create_or_update_patient: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@app.get("/patient-analyses")
async def get_patient_analyses(db: Session = Depends(get_db)):
    try:
        # Get all medical reports
        analyses = db.query(MedicalReport).order_by(desc(MedicalReport.created_at)).all()

        print(f"Found {len(analyses)} analyses")

        # Convert to response format
        analyses_response = []
        for analysis in analyses:
            # Explicitly fetch the patient
            patient = db.query(Patient).filter(Patient.id == analysis.patient_id).first()

            print(f"Analysis {analysis.id}: patient_id={analysis.patient_id}, patient_found={patient is not None}")
            if patient:
                print(f"  Patient: {patient.name}, dept={patient.department}, doctor={patient.doctor_name}")

            patient_data = {
                "id": analysis.id,
                "patient_id": analysis.patient_id,
                "diagnosis": analysis.diagnosis,
                "confidence": analysis.confidence,
                "advice": analysis.advice,
                "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
                "updated_at": patient.updated_at.isoformat() if patient and patient.updated_at else None,
                "patient_name": patient.name if patient else "Unknown",
                "patient_id_display": patient.patient_id if patient else "Unknown",
                "birth_date": patient.birth_date if patient else None,
                "email": patient.email if patient else None,
                "phone": patient.phone if patient else None,
                "profile_picture": patient.profile_picture if patient else None,
                "department": patient.department if patient else None,
                "doctor_name": patient.doctor_name if patient else None,
            }
            analyses_response.append(patient_data)

        return {
            "success": True,
            "analyses": analyses_response,
        }
    except Exception as e:
        print(f"Database error in get_patient_analyses: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@app.put("/patient-analyses/{analysis_id}")
async def update_patient_analysis(analysis_id: int, analysis_data: dict, db: Session = Depends(get_db)):
    try:
        analysis = db.query(MedicalReport).filter(MedicalReport.id == analysis_id).first()

        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")

        # Update fields
        if "diagnosis" in analysis_data:
            analysis.diagnosis = analysis_data["diagnosis"]
        if "confidence" in analysis_data:
            analysis.confidence = analysis_data["confidence"]
        if "advice" in analysis_data:
            analysis.advice = analysis_data["advice"]
        if "patient_id" in analysis_data:
            # Verify that the patient exists
            patient = db.query(Patient).filter(Patient.id == analysis_data["patient_id"]).first()
            if not patient:
                raise HTTPException(status_code=400, detail="Patient not found")
            analysis.patient_id = analysis_data["patient_id"]

        db.commit()
        db.refresh(analysis)

        return {"success": True, "analysis": {
            "id": analysis.id,
            "patient_id": analysis.patient_id,
            "diagnosis": analysis.diagnosis,
            "confidence": analysis.confidence,
            "advice": analysis.advice
        }}

    except Exception as e:
        print(f"Database error in update_patient_analysis: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@app.delete("/patient-analyses/{analysis_id}")
async def delete_patient_analysis(analysis_id: int, db: Session = Depends(get_db)):
    try:
        analysis = db.query(MedicalReport).filter(MedicalReport.id == analysis_id).first()

        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")

        db.delete(analysis)
        db.commit()

        return {"success": True, "message": "Analysis deleted successfully"}

    except Exception as e:
        print(f"Database error in delete_patient_analysis: {e}")
        raise HTTPException(status_code=500, detail="Database error")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)