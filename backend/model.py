import os
from typing import Tuple

# Try to import ML dependencies
try:
    import pandas as pd
    import numpy as np
    import joblib
    PANDAS_AVAILABLE = True
    print("ML dependencies loaded successfully")
except ImportError:
    PANDAS_AVAILABLE = False
    print("Warning: ML dependencies not available, using rule-based prediction")

# Model column definitions (only define if pandas is available)
if PANDAS_AVAILABLE:
    GLOBAL_COLS = ['Age', 'Gender', 'TB', 'DB', 'AlkPhos', 'ALT', 'AST', 'TP', 'ALB', 'AGR']
    HEP_COLS = ['ID', 'Age', 'Gender', 'ALB', 'AlkPhos', 'ALT', 'AST', 'TB', 'CHE', 'Cholesterol', 'Creatinine', 'GGT', 'TP']
    CIRR_COLS = ['ID', 'N_Days', 'Status', 'Drug', 'Age', 'Gender', 'Ascites', 'Hepatomegaly', 'Spiders', 'Edema', 'TB', 'Cholesterol', 'ALB', 'Copper', 'AlkPhos', 'AST', 'Tryglicerides', 'Platelets', 'Prothrombin']
else:
    GLOBAL_COLS = None
    HEP_COLS = None
    CIRR_COLS = None

# Load the trained models
MODEL_DIR = os.path.dirname(__file__)
if PANDAS_AVAILABLE:
    try:
        model_global = joblib.load(os.path.join(MODEL_DIR, 'model_global_best.pkl'))
        model_hep = joblib.load(os.path.join(MODEL_DIR, 'model_hep_best.pkl'))
        model_cirr = joblib.load(os.path.join(MODEL_DIR, 'model_cirr_best.pkl'))
        print("All 3 ML models loaded successfully")
    except Exception as e:
        print(f"Model loading failed: {e}")
        print("Falling back to enhanced rule-based prediction")
        model_global = None
        model_hep = None
        model_cirr = None
else:
    print("Using enhanced rule-based prediction")
    model_global = None
    model_hep = None
    model_cirr = None

def predict_liver_disease(alt: float, ast: float, bilirubin: float, ggt: float, age: float = 45, gender: str = 'male', alkphos: float = 100, tp: float = 7.0, alb: float = 4.0) -> Tuple[str, int, str]:
    """
    Predict liver disease risk using the 3-model ML system

    Args:
        alt: ALT enzyme level
        ast: AST enzyme level
        bilirubin: Bilirubin level
        ggt: GGT enzyme level

    Returns:
        Tuple of (diagnosis, confidence, advice)
    """
    if model_global is None or model_hep is None or model_cirr is None:
        # Enhanced rule-based prediction when ML models unavailable
        print("Using enhanced rule-based prediction (models not loaded)")
        return _enhanced_rule_based_prediction(alt, ast, bilirubin, ggt, age, gender, alkphos, tp, alb)

    try:
        # Create comprehensive input data with defaults for missing features
        input_data = {
            # Basic patient info
            'Age': 45,  # Default age
            'Gender': 1,  # Male
            'ID': 1,    # Patient ID

            # Liver function tests (from our inputs)
            'ALT': alt,
            'AST': ast,
            'TB': bilirubin,  # Total Bilirubin
            'GGT': ggt,

            # Additional features with medical defaults
            'DB': bilirubin * 0.3,  # Direct Bilirubin
            'AlkPhos': 100,         # Alkaline Phosphatase
            'TP': 7.0,             # Total Protein
            'ALB': 4.0,            # Albumin
            'AGR': 1.2,            # Albumin/Globulin Ratio

            # Additional features for cirrhosis model
            'N_Days': 1000,        # Days since diagnosis
            'Status': 1,           # Status
            'Drug': 1,             # On drug treatment
            'Ascites': 0,          # No ascites
            'Hepatomegaly': 0,     # No hepatomegaly
            'Spiders': 0,          # No spider angiomas
            'Edema': 0,            # No edema
            'Cholesterol': 180,    # Cholesterol
            'Copper': 100,         # Copper levels
            'Tryglicerides': 120,  # Triglycerides
            'Platelets': 250000,   # Platelet count
            'Prothrombin': 10.5,   # Prothrombin time

            # Hepatitis-specific features
            'CHE': 8.0,           # Cholinesterase
            'Creatinine': 0.8,    # Creatinine
        }

        # ----------------------------------------------------------
        # 1. Global Prediction (Binary: Disease/No Disease)
        # ----------------------------------------------------------
        df_global = pd.DataFrame([input_data])
        df_global_pred = df_global[GLOBAL_COLS].copy()

        # Convert gender to string for model
        df_global_pred['Gender'] = df_global_pred['Gender'].map({0: 'female', 1: 'male'})

        pred_global = model_global.predict(df_global_pred)[0]
        print(f"Global Model Prediction: {pred_global}")

        if pred_global == 0:
            # No disease detected
            return "Low risk", 85, "No significant liver disease detected. Continue routine monitoring."

        # ----------------------------------------------------------
        # 2. Specialized Predictions (Hepatitis C and Cirrhosis)
        # ----------------------------------------------------------

        # Hepatitis C prediction
        df_hep = pd.DataFrame([input_data])
        df_hep_pred = pd.DataFrame(0, index=[0], columns=HEP_COLS)
        common_hep_cols = set(HEP_COLS).intersection(df_hep.columns)
        for col in common_hep_cols:
            df_hep_pred[col] = df_hep[col]

        pred_hep = model_hep.predict(df_hep_pred)[0]
        print(f"Hepatitis Model Prediction: {pred_hep}")

        # Cirrhosis prediction
        df_cirr = pd.DataFrame([input_data])
        df_cirr_pred = pd.DataFrame(0, index=[0], columns=CIRR_COLS)
        common_cirr_cols = set(CIRR_COLS).intersection(df_cirr.columns)
        for col in common_cirr_cols:
            df_cirr_pred[col] = df_cirr[col]

        pred_cirr = model_cirr.predict(df_cirr_pred)[0]
        print(f"Cirrhosis Model Prediction: {pred_cirr}")

        # ----------------------------------------------------------
        # 3. Determine final diagnosis based on specialized predictions
        # ----------------------------------------------------------

        # If Hepatitis C detected
        if pred_hep > 0:  # Hepatitis detected
            stage = int(pred_hep)
            diagnosis = f"Hepatitis C (Stage {stage})"
            confidence = 90
            advice = f"Hepatitis C detected at stage {stage}. Immediate specialist consultation required."

        # If Cirrhosis detected
        elif pred_cirr > 0:  # Cirrhosis detected
            stage = int(pred_cirr)
            diagnosis = f"Liver Cirrhosis (Stage {stage})"
            confidence = 85
            advice = f"Liver cirrhosis detected at stage {stage}. Urgent hepatologist consultation needed."

        # If global model detected disease but specialized models didn't
        else:
            diagnosis = "Liver Disease Detected"
            confidence = 75
            advice = "Liver disease indicated but specific type unclear. Further diagnostic tests recommended."

        return diagnosis, confidence, advice

    except Exception as e:
        error_msg = f"ML prediction error: {str(e)}"
        print(f"Error: {error_msg}")
        print("Falling back to enhanced rule-based prediction")
        diagnosis, confidence, advice = _enhanced_rule_based_prediction(alt, ast, bilirubin, ggt, age, gender, alkphos, tp, alb)
        # Add error info to advice for debugging
        advice += f" [DEBUG: {error_msg}]"
        return diagnosis, confidence, advice

def _enhanced_rule_based_prediction(alt: float, ast: float, bilirubin: float, ggt: float, age: float = 45, gender: str = 'male', alkphos: float = 100, tp: float = 7.0, alb: float = 4.0) -> Tuple[str, int, str]:
    """Enhanced rule-based prediction with specific medical diagnoses"""

    # Calculate medically significant ratios
    alt_ast_ratio = alt / ast if ast > 0 else 0
    print(f"ENHANCED ANALYSIS: ALT={alt}, AST={ast}, BILI={bilirubin}, GGT={ggt}, Age={age}, Gender={gender}")
    print(f"Ratios: ALT/AST={alt_ast_ratio:.2f}")

    # Analyze patterns for specific diagnoses

    # Most specific patterns first (Hepatitis C, Cirrhosis, etc.)

    # Hepatitis C pattern: High ALT, moderate AST, elevated GGT
    hep_c_condition = alt > 80 and ast < 120 and ggt > 60 and alt_ast_ratio >= 1.5
    print(f"Hepatitis C check: ALT>80({alt > 80}), AST<120({ast < 120}), GGT>60({ggt > 60}), Ratio>=1.5({alt_ast_ratio >= 1.5}) = {hep_c_condition}")

    if hep_c_condition:
        print("Hepatitis C pattern detected!")
        stage = min(4, max(1, int((alt - 80) / 40) + 1))
        diagnosis = f"Hepatitis C (Stage {stage})"
        advice = f"Hepatitis C detected at stage {stage}. Immediate specialist consultation required. Consider viral load testing and liver biopsy if indicated."
        print(f"FINAL RESULT: {diagnosis}")
        return diagnosis, 88, advice

    # Cirrhosis pattern: High AST, low ALT, elevated bilirubin
    elif ast > alt and bilirubin > 2.0 and alt_ast_ratio < 0.8:
        stage = min(4, max(1, int(bilirubin / 0.8)))
        return f"Liver Cirrhosis (Stage {stage})", 85, f"Liver cirrhosis detected at stage {stage}. Urgent hepatologist consultation needed. Evaluate for varices, ascites, and hepatocellular carcinoma screening."

    # Cholestasis pattern: Very high GGT, elevated bilirubin
    elif ggt > 100 and bilirubin > 1.5:
        return "Cholestasis", 82, "Evidence of bile duct obstruction or cholestasis. Further investigation required including abdominal ultrasound and liver biopsy if indicated."

    # Acute hepatitis pattern: Very high ALT/AST, elevated bilirubin
    elif (alt > 200 or ast > 200) and bilirubin > 2.0:
        return "Acute Hepatitis", 90, "Signs of acute hepatitis. Immediate medical attention required. Rule out viral hepatitis, drug-induced liver injury, and autoimmune hepatitis."

    # Drug-induced liver injury pattern
    elif alt > 150 and ast > 150 and alt_ast_ratio < 5:
        return "Drug-Induced Liver Injury", 80, "Possible drug-induced liver injury. Review medications and consult hepatologist immediately."

    # Non-alcoholic fatty liver disease (NAFLD) pattern
    elif alt_ast_ratio > 2.0 and alt < 150 and ast < 100 and ggt < 80:
        return "NAFLD", 75, "Suspected non-alcoholic fatty liver disease. Lifestyle modification recommended including weight loss, exercise, and dietary changes."

    # General liver disease patterns (catch-all for less specific cases)
    elif alt > 100 or ast > 100 or bilirubin > 2.0 or ggt > 80:
        return "Liver Disease Detected", 78, "Liver function abnormalities detected. Further evaluation required including detailed history, additional tests, and specialist consultation."

    # Mild elevations - could be various causes
    elif alt > 40 or ast > 40 or bilirubin > 1.2 or ggt > 50:
        return "Mild Liver Enzyme Elevation", 65, "Mild liver enzyme elevations detected. Monitor with repeat testing in 2-4 weeks. Review medications and alcohol intake."

    # Normal results
    else:
        return "Normal Liver Function", 95, "All liver function tests within normal ranges. Continue routine health monitoring and healthy lifestyle."