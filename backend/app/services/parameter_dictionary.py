import re
from typing import Dict, Any, Optional, List, Tuple

# Comprehensive Common Medical Parameter Dictionary
# Dictionary serves as an aid for fuzzy matching, categorization, and normalization, but DOES NOT limit extraction.
COMMON_PARAMETER_DICTIONARY: Dict[str, Dict[str, Any]] = {
    # ==================== BLOOD COUNT (CBC) ====================
    "hemoglobin": {
        "display_name": "Hemoglobin (Hb)",
        "category": "BLOOD_COUNT",
        "synonyms": ["hb", "haemoglobin", "hgb", "hemoglobin level"],
        "default_unit": "g/dL",
        "reference_range": "13.0 - 17.0 g/dL (Male) / 12.0 - 15.5 g/dL (Female)"
    },
    "rbc": {
        "display_name": "Red Blood Cell Count (RBC)",
        "category": "BLOOD_COUNT",
        "synonyms": ["rbc count", "erythrocytes", "red cell count", "total rbc"],
        "default_unit": "million/mcL",
        "reference_range": "4.5 - 5.9 million/mcL"
    },
    "wbc": {
        "display_name": "Total Leukocyte Count (WBC)",
        "category": "BLOOD_COUNT",
        "synonyms": ["wbc count", "total wbc", "tlc", "white blood cells", "leukocyte count"],
        "default_unit": "cells/mcL",
        "reference_range": "4,000 - 11,000 cells/mcL"
    },
    "platelets": {
        "display_name": "Platelet Count",
        "category": "BLOOD_COUNT",
        "synonyms": ["platelet", "thrombocytes", "plt", "total platelets"],
        "default_unit": "cells/mcL",
        "reference_range": "150,000 - 450,000 cells/mcL"
    },
    "hematocrit": {
        "display_name": "Hematocrit (PCV)",
        "category": "BLOOD_COUNT",
        "synonyms": ["pcv", "packed cell volume", "hct"],
        "default_unit": "%",
        "reference_range": "38.5 - 50.0 %"
    },
    "mcv": {
        "display_name": "Mean Corpuscular Volume (MCV)",
        "category": "BLOOD_COUNT",
        "synonyms": ["mean corpuscular volume"],
        "default_unit": "fL",
        "reference_range": "80.0 - 100.0 fL"
    },
    "mch": {
        "display_name": "Mean Corpuscular Hemoglobin (MCH)",
        "category": "BLOOD_COUNT",
        "synonyms": ["mean corpuscular hemoglobin"],
        "default_unit": "pg",
        "reference_range": "27.0 - 33.0 pg"
    },
    "mchc": {
        "display_name": "Mean Corpuscular Hb Concentration (MCHC)",
        "category": "BLOOD_COUNT",
        "synonyms": ["mean corpuscular hemoglobin concentration"],
        "default_unit": "g/dL",
        "reference_range": "32.0 - 36.0 g/dL"
    },
    "rdw": {
        "display_name": "Red Cell Distribution Width (RDW)",
        "category": "BLOOD_COUNT",
        "synonyms": ["rdw-cv", "rdw-sd", "red cell distribution width"],
        "default_unit": "%",
        "reference_range": "11.5 - 14.5 %"
    },
    "neutrophils": {
        "display_name": "Neutrophils (Polymorphs)",
        "category": "BLOOD_COUNT",
        "synonyms": ["neutrophil percentage", "polymorphs", "segs"],
        "default_unit": "%",
        "reference_range": "40 - 75 %"
    },
    "lymphocytes": {
        "display_name": "Lymphocytes",
        "category": "BLOOD_COUNT",
        "synonyms": ["lymphocyte percentage", "lymphs"],
        "default_unit": "%",
        "reference_range": "20 - 45 %"
    },
    "monocytes": {
        "display_name": "Monocytes",
        "category": "BLOOD_COUNT",
        "synonyms": ["monocyte percentage"],
        "default_unit": "%",
        "reference_range": "2 - 10 %"
    },
    "eosinophils": {
        "display_name": "Eosinophils",
        "category": "BLOOD_COUNT",
        "synonyms": ["eosinophil percentage", "eos"],
        "default_unit": "%",
        "reference_range": "1 - 6 %"
    },
    "basophils": {
        "display_name": "Basophils",
        "category": "BLOOD_COUNT",
        "synonyms": ["basophil percentage", "basos"],
        "default_unit": "%",
        "reference_range": "0 - 2 %"
    },

    # ==================== DIABETES & METABOLIC ====================
    "fasting_blood_glucose": {
        "display_name": "Fasting Blood Glucose (FBS)",
        "category": "DIABETES",
        "synonyms": ["fbs", "fasting blood sugar", "glucose fasting", "blood sugar fasting"],
        "default_unit": "mg/dL",
        "reference_range": "70 - 99 mg/dL"
    },
    "postprandial_glucose": {
        "display_name": "Postprandial Blood Glucose (PPBS)",
        "category": "DIABETES",
        "synonyms": ["ppbs", "post prandial blood sugar", "glucose pp", "2hr post prandial glucose"],
        "default_unit": "mg/dL",
        "reference_range": "< 140 mg/dL"
    },
    "random_blood_glucose": {
        "display_name": "Random Blood Glucose (RBS)",
        "category": "DIABETES",
        "synonyms": ["rbs", "random blood sugar", "glucose random", "blood glucose random"],
        "default_unit": "mg/dL",
        "reference_range": "70 - 140 mg/dL"
    },
    "hba1c": {
        "display_name": "Glycated Hemoglobin (HbA1c)",
        "category": "DIABETES",
        "synonyms": ["glycated hemoglobin", "glycosylated hemoglobin", "a1c", "hemoglobin a1c"],
        "default_unit": "%",
        "reference_range": "< 5.7 % (Normal), 5.7 - 6.4 % (Prediabetes), >= 6.5 % (Diabetes)"
    },
    "estimated_average_glucose": {
        "display_name": "Estimated Average Glucose (eAG)",
        "category": "DIABETES",
        "synonyms": ["eag", "mean blood glucose"],
        "default_unit": "mg/dL",
        "reference_range": "90 - 120 mg/dL"
    },
    "fasting_insulin": {
        "display_name": "Fasting Serum Insulin",
        "category": "DIABETES",
        "synonyms": ["insulin fasting", "serum insulin"],
        "default_unit": "uIU/mL",
        "reference_range": "2.6 - 24.9 uIU/mL"
    },

    # ==================== LIPID PROFILE ====================
    "total_cholesterol": {
        "display_name": "Total Cholesterol",
        "category": "LIPID_PROFILE",
        "synonyms": ["cholesterol total", "serum cholesterol", "cholesterol"],
        "default_unit": "mg/dL",
        "reference_range": "< 200 mg/dL (Desirable)"
    },
    "triglycerides": {
        "display_name": "Triglycerides",
        "category": "LIPID_PROFILE",
        "synonyms": ["serum triglycerides", "tg", "triglyceride"],
        "default_unit": "mg/dL",
        "reference_range": "< 150 mg/dL (Normal)"
    },
    "hdl_cholesterol": {
        "display_name": "HDL Cholesterol (Good)",
        "category": "LIPID_PROFILE",
        "synonyms": ["hdl", "high density lipoprotein", "hdl-c"],
        "default_unit": "mg/dL",
        "reference_range": "> 40 mg/dL (Male) / > 50 mg/dL (Female)"
    },
    "ldl_cholesterol": {
        "display_name": "LDL Cholesterol (Calculated/Direct)",
        "category": "LIPID_PROFILE",
        "synonyms": ["ldl", "low density lipoprotein", "ldl-c", "direct ldl"],
        "default_unit": "mg/dL",
        "reference_range": "< 100 mg/dL (Optimal)"
    },
    "vldl_cholesterol": {
        "display_name": "VLDL Cholesterol",
        "category": "LIPID_PROFILE",
        "synonyms": ["vldl", "very low density lipoprotein", "vldl-c"],
        "default_unit": "mg/dL",
        "reference_range": "5 - 30 mg/dL"
    },
    "non_hdl_cholesterol": {
        "display_name": "Non-HDL Cholesterol",
        "category": "LIPID_PROFILE",
        "synonyms": ["non-hdl", "non hdl cholesterol"],
        "default_unit": "mg/dL",
        "reference_range": "< 130 mg/dL"
    },
    "cholesterol_hdl_ratio": {
        "display_name": "Total Cholesterol / HDL Ratio",
        "category": "LIPID_PROFILE",
        "synonyms": ["tc/hdl ratio", "chol/hdl ratio"],
        "default_unit": "ratio",
        "reference_range": "3.3 - 4.4"
    },

    # ==================== LIVER FUNCTION (LFT) ====================
    "alt": {
        "display_name": "Alanine Aminotransferase (ALT / SGPT)",
        "category": "LIVER_FUNCTION",
        "synonyms": ["sgpt", "alt (sgpt)", "alanine transaminase"],
        "default_unit": "U/L",
        "reference_range": "7 - 56 U/L"
    },
    "ast": {
        "display_name": "Aspartate Aminotransferase (AST / SGOT)",
        "category": "LIVER_FUNCTION",
        "synonyms": ["sgot", "ast (sgot)", "aspartate transaminase"],
        "default_unit": "U/L",
        "reference_range": "10 - 40 U/L"
    },
    "alp": {
        "display_name": "Alkaline Phosphatase (ALP)",
        "category": "LIVER_FUNCTION",
        "synonyms": ["alkaline phosphatase", "alk phos"],
        "default_unit": "U/L",
        "reference_range": "44 - 147 U/L"
    },
    "total_bilirubin": {
        "display_name": "Bilirubin Total",
        "category": "LIVER_FUNCTION",
        "synonyms": ["serum bilirubin total", "total bilirubin", "t. bilirubin"],
        "default_unit": "mg/dL",
        "reference_range": "0.2 - 1.2 mg/dL"
    },
    "direct_bilirubin": {
        "display_name": "Bilirubin Direct (Conjugated)",
        "category": "LIVER_FUNCTION",
        "synonyms": ["conjugated bilirubin", "direct bilirubin", "d. bilirubin"],
        "default_unit": "mg/dL",
        "reference_range": "0.0 - 0.3 mg/dL"
    },
    "total_protein": {
        "display_name": "Total Protein",
        "category": "LIVER_FUNCTION",
        "synonyms": ["serum protein total", "total protein serum"],
        "default_unit": "g/dL",
        "reference_range": "6.0 - 8.3 g/dL"
    },
    "serum_albumin": {
        "display_name": "Serum Albumin",
        "category": "LIVER_FUNCTION",
        "synonyms": ["albumin", "s. albumin"],
        "default_unit": "g/dL",
        "reference_range": "3.5 - 5.0 g/dL"
    },
    "serum_globulin": {
        "display_name": "Serum Globulin",
        "category": "LIVER_FUNCTION",
        "synonyms": ["globulin", "s. globulin"],
        "default_unit": "g/dL",
        "reference_range": "2.0 - 3.5 g/dL"
    },
    "ag_ratio": {
        "display_name": "Albumin / Globulin (A/G) Ratio",
        "category": "LIVER_FUNCTION",
        "synonyms": ["a/g ratio", "ag ratio"],
        "default_unit": "ratio",
        "reference_range": "1.2 - 2.2"
    },

    # ==================== KIDNEY FUNCTION (KFT / RFT) ====================
    "serum_creatinine": {
        "display_name": "Serum Creatinine",
        "category": "KIDNEY_FUNCTION",
        "synonyms": ["creatinine", "s. creatinine", "creatinine serum"],
        "default_unit": "mg/dL",
        "reference_range": "0.7 - 1.3 mg/dL (Male) / 0.6 - 1.1 mg/dL (Female)"
    },
    "blood_urea_nitrogen": {
        "display_name": "Blood Urea Nitrogen (BUN)",
        "category": "KIDNEY_FUNCTION",
        "synonyms": ["bun", "urea nitrogen"],
        "default_unit": "mg/dL",
        "reference_range": "7 - 20 mg/dL"
    },
    "blood_urea": {
        "display_name": "Blood Urea",
        "category": "KIDNEY_FUNCTION",
        "synonyms": ["serum urea", "urea"],
        "default_unit": "mg/dL",
        "reference_range": "15 - 45 mg/dL"
    },
    "egfr": {
        "display_name": "Estimated Glomerular Filtration Rate (eGFR)",
        "category": "KIDNEY_FUNCTION",
        "synonyms": ["egfr", "gfr", "estimated gfr"],
        "default_unit": "mL/min/1.73m2",
        "reference_range": "> 90 mL/min/1.73m2"
    },
    "uric_acid": {
        "display_name": "Serum Uric Acid",
        "category": "KIDNEY_FUNCTION",
        "synonyms": ["uric acid", "s. uric acid"],
        "default_unit": "mg/dL",
        "reference_range": "3.5 - 7.2 mg/dL (Male) / 2.6 - 6.0 mg/dL (Female)"
    },

    # ==================== THYROID PROFILE ====================
    "tsh": {
        "display_name": "Thyroid Stimulating Hormone (TSH)",
        "category": "THYROID",
        "synonyms": ["thyroid stimulating hormone", "ultrasensitive tsh", "s. tsh"],
        "default_unit": "uIU/mL",
        "reference_range": "0.4 - 4.5 uIU/mL"
    },
    "free_t3": {
        "display_name": "Free Triiodothyronine (FT3)",
        "category": "THYROID",
        "synonyms": ["ft3", "free t3"],
        "default_unit": "pg/mL",
        "reference_range": "2.3 - 4.2 pg/mL"
    },
    "free_t4": {
        "display_name": "Free Thyroxine (FT4)",
        "category": "THYROID",
        "synonyms": ["ft4", "free t4"],
        "default_unit": "ng/dL",
        "reference_range": "0.8 - 1.8 ng/dL"
    },
    "total_t3": {
        "display_name": "Total T3",
        "category": "THYROID",
        "synonyms": ["t3 total", "triiodothyronine total"],
        "default_unit": "ng/dL",
        "reference_range": "80 - 200 ng/dL"
    },
    "total_t4": {
        "display_name": "Total T4",
        "category": "THYROID",
        "synonyms": ["t4 total", "thyroxine total"],
        "default_unit": "ug/dL",
        "reference_range": "5.0 - 12.0 ug/dL"
    },

    # ==================== ELECTROLYTES ====================
    "serum_sodium": {
        "display_name": "Serum Sodium (Na+)",
        "category": "ELECTROLYTES",
        "synonyms": ["sodium", "na+", "s. sodium"],
        "default_unit": "mEq/L",
        "reference_range": "135 - 145 mEq/L"
    },
    "serum_potassium": {
        "display_name": "Serum Potassium (K+)",
        "category": "ELECTROLYTES",
        "synonyms": ["potassium", "k+", "s. potassium"],
        "default_unit": "mEq/L",
        "reference_range": "3.5 - 5.1 mEq/L"
    },
    "serum_chloride": {
        "display_name": "Serum Chloride (Cl-)",
        "category": "ELECTROLYTES",
        "synonyms": ["chloride", "cl-", "s. chloride"],
        "default_unit": "mEq/L",
        "reference_range": "96 - 106 mEq/L"
    },
    "serum_calcium": {
        "display_name": "Serum Calcium (Total)",
        "category": "ELECTROLYTES",
        "synonyms": ["calcium total", "s. calcium", "ca++"],
        "default_unit": "mg/dL",
        "reference_range": "8.5 - 10.2 mg/dL"
    },

    # ==================== VITAMINS & MINERALS ====================
    "vitamin_d": {
        "display_name": "25-Hydroxy Vitamin D (Total)",
        "category": "VITAMINS",
        "synonyms": ["vitamin d3", "25-oh vitamin d", "serum vitamin d", "25-hydroxycholecalciferol"],
        "default_unit": "ng/mL",
        "reference_range": "< 20 (Deficient), 20-30 (Insufficient), 30-100 (Sufficient)"
    },
    "vitamin_b12": {
        "display_name": "Vitamin B12 (Cyanocobalamin)",
        "category": "VITAMINS",
        "synonyms": ["cyanocobalamin", "b12", "serum b12", "s. vitamin b12"],
        "default_unit": "pg/mL",
        "reference_range": "200 - 900 pg/mL"
    },
    "serum_ferritin": {
        "display_name": "Serum Ferritin",
        "category": "VITAMINS",
        "synonyms": ["ferritin", "s. ferritin"],
        "default_unit": "ng/mL",
        "reference_range": "30 - 400 ng/mL (Male) / 15 - 150 ng/mL (Female)"
    },
    "serum_iron": {
        "display_name": "Serum Iron",
        "category": "VITAMINS",
        "synonyms": ["iron", "s. iron"],
        "default_unit": "ug/dL",
        "reference_range": "60 - 170 ug/dL"
    },

    # ==================== INFLAMMATION & CARDIAC ====================
    "crp": {
        "display_name": "C-Reactive Protein (CRP)",
        "category": "INFLAMMATION",
        "synonyms": ["c-reactive protein", "crp quantitative", "hs-crp"],
        "default_unit": "mg/L",
        "reference_range": "< 5.0 mg/L"
    },
    "esr": {
        "display_name": "Erythrocyte Sedimentation Rate (ESR)",
        "category": "INFLAMMATION",
        "synonyms": ["erythrocyte sedimentation rate", "westergren esr"],
        "default_unit": "mm/hr",
        "reference_range": "0 - 15 mm/hr (Male) / 0 - 20 mm/hr (Female)"
    }
}

def lookup_parameter(raw_name: str) -> Optional[Tuple[str, Dict[str, Any]]]:
    """
    High-precision matching helper for finding known parameter definition and category.
    Returns (key, dict) or None if dynamic parameter.
    """
    clean = re.sub(r'[^a-zA-Z0-9\s]', ' ', raw_name).strip().lower()
    clean_words = set(clean.split())
    
    # Pass 1: Exact Key or Exact Synonym Match
    for key, data in COMMON_PARAMETER_DICTIONARY.items():
        if clean == key or clean == key.replace('_', ' '):
            return key, data
        for syn in data.get("synonyms", []):
            if clean == syn.lower():
                return key, data

    # Disambiguate specific lipid sub-fractions before general cholesterol
    if "hdl" in clean_words:
        return "hdl_cholesterol", COMMON_PARAMETER_DICTIONARY["hdl_cholesterol"]
    if "ldl" in clean_words:
        return "ldl_cholesterol", COMMON_PARAMETER_DICTIONARY["ldl_cholesterol"]
    if "vldl" in clean_words:
        return "vldl_cholesterol", COMMON_PARAMETER_DICTIONARY["vldl_cholesterol"]
    if "hba1c" in clean_words or "a1c" in clean_words:
        return "hba1c", COMMON_PARAMETER_DICTIONARY["hba1c"]
    if "fasting" in clean_words and ("glucose" in clean_words or "blood sugar" in clean_words or "sugar" in clean_words):
        return "fasting_blood_glucose", COMMON_PARAMETER_DICTIONARY["fasting_blood_glucose"]
    if "albumin" in clean_words:
        return "albumin", COMMON_PARAMETER_DICTIONARY["albumin"]
    if "creatinine" in clean_words:
        return "creatinine", COMMON_PARAMETER_DICTIONARY["creatinine"]
    if "urea" in clean_words or "bun" in clean_words:
        return "blood_urea_nitrogen", COMMON_PARAMETER_DICTIONARY["blood_urea_nitrogen"]
    if "protein" in clean_words and "total" in clean_words:
        return "total_protein", COMMON_PARAMETER_DICTIONARY["total_protein"]
    if "triglyceride" in clean or "triglycerides" in clean:
        return "triglycerides", COMMON_PARAMETER_DICTIONARY["triglycerides"]
    if "cholesterol" in clean and ("total" in clean_words or len(clean_words) <= 2):
        return "total_cholesterol", COMMON_PARAMETER_DICTIONARY["total_cholesterol"]

    # Pass 2: Specific substring matching sorted by longest synonym length
    candidates = []
    for key, data in COMMON_PARAMETER_DICTIONARY.items():
        for syn in data.get("synonyms", []):
            syn_lower = syn.lower()
            if syn_lower in clean:
                candidates.append((len(syn_lower), key, data))

    if candidates:
        candidates.sort(key=lambda x: x[0], reverse=True)
        return candidates[0][1], candidates[0][2]
                
    return None

def categorize_parameter(param_name: str, document_type: str = "OTHER") -> str:
    """
    Returns appropriate category grouping for a parameter.
    """
    res = lookup_parameter(param_name)
    if res:
        return res[1].get("category", "GENERAL")
        
    p_lower = param_name.lower()
    if any(k in p_lower for k in ["blood", "rbc", "wbc", "platelet", "cell", "globin", "phils"]):
        return "BLOOD_COUNT"
    if any(k in p_lower for k in ["glucose", "sugar", "insulin", "hba1c", "a1c", "fbs", "ppbs"]):
        return "DIABETES"
    if any(k in p_lower for k in ["cholesterol", "lipid", "triglyceride", "hdl", "ldl", "vldl"]):
        return "LIPID_PROFILE"
    if any(k in p_lower for k in ["sgpt", "sgot", "alt", "ast", "bilirubin", "protein", "albumin"]):
        return "LIVER_FUNCTION"
    if any(k in p_lower for k in ["creatinine", "urea", "bun", "egfr", "uric", "kidney", "renal"]):
        return "KIDNEY_FUNCTION"
    if any(k in p_lower for k in ["tsh", "t3", "t4", "thyroid"]):
        return "THYROID"
    if any(k in p_lower for k in ["sodium", "potassium", "chloride", "calcium", "electrolyte"]):
        return "ELECTROLYTES"
    if any(k in p_lower for k in ["vitamin", "b12", "iron", "ferritin", "folate"]):
        return "VITAMINS"
    if any(k in p_lower for k in ["heart", "rhythm", "rate", "pr interval", "qrs", "ecg"]):
        return "CARDIAC_ECG"
    if any(k in p_lower for k in ["finding", "impression", "lung", "chest", "x-ray", "ct", "mri"]):
        return "IMAGING"
        
    return "OTHER_CLINICAL"
