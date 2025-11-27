import requests
import json

def test_patient_analyses():
    try:
        response = requests.get('http://localhost:8000/patient-analyses')
        if response.status_code == 200:
            data = response.json()
            analyses = data.get('analyses', [])
            print(f'Total analyses: {len(analyses)}')

            # Show first 3 analyses
            for i, analysis in enumerate(analyses[:3]):
                print(f'\nAnalysis {i+1}:')
                print(f'  Patient: {analysis.get("patient_name")}')
                print(f'  Department: {analysis.get("department")}')
                print(f'  Doctor: {analysis.get("doctor_name")}')
                print(f'  Diagnosis: {analysis.get("diagnosis")}')
        else:
            print(f'API call failed with status: {response.status_code}')
    except Exception as e:
        print(f'Error: {e}')

if __name__ == '__main__':
    test_patient_analyses()