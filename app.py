"""
SchemeHelper.AI — Flask Backend
Gemini AI fully integrated for Smart Eligibility Finder & Chatbot.
"""

import os
import json
import uuid
from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import google.generativeai as genai

# ── Load environment variables ────────────────────────────────────────────────
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# ── Flask App ─────────────────────────────────────────────────────────────────
app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-key-change-me")

# ── Uploads Config ───────────────────────────────────────────────────────────────────────
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'static', 'uploads')
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg'}
MAX_FILE_MB = 5
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_MB * 1024 * 1024

# ── Schemes Database ──────────────────────────────────────────────────────────
SCHEMES_DB = [
    {
        "id": 1,
        "name": "PM Surya Ghar: Free Electricity Scheme",
        "sector": "Energy/Utility",
        "jurisdiction": "Central Indian",
        "benefits": "Up to 300 units of free electricity monthly through rooftop solar.",
        "eligibility_criteria": {"income_limit": 600000, "residency": "India"},
        "tags": ["Solar", "Free Electricity", "Sustainability"],
        "apply_url": "https://pmsuryaghar.gov.in/consumerRegistration",
        "ministry": "Ministry of New & Renewable Energy"
    },
    {
        "id": 2,
        "name": "PM-KISAN Samman Nidhi",
        "sector": "Agriculture",
        "jurisdiction": "Central Indian",
        "benefits": "₹6,000 per year in three equal installments directly to bank account.",
        "eligibility_criteria": {"occupation": "Farmer", "income_limit": 300000},
        "tags": ["Agriculture", "Income Support", "Direct Benefit"],
        "apply_url": "https://pmkisan.gov.in/RegistrationForm.aspx",
        "ministry": "Ministry of Agriculture & Farmers Welfare"
    },
    {
        "id": 3,
        "name": "Ayushman Bharat PM-JAY",
        "sector": "Healthcare",
        "jurisdiction": "Central Indian",
        "benefits": "Cashless health cover up to ₹5 Lakh per family per year.",
        "eligibility_criteria": {"income_limit": 120000},
        "tags": ["Health", "Insurance", "Free Treatment"],
        "apply_url": "https://beneficiary.nha.gov.in/",
        "ministry": "Ministry of Health & Family Welfare"
    },
    {
        "id": 4,
        "name": "Pudhumai Penn Scheme",
        "sector": "Education/Women",
        "jurisdiction": "Tamil Nadu",
        "benefits": "₹1,000 per month for girls studying in higher education.",
        "eligibility_criteria": {"gender": "Female", "schooling": "Government School"},
        "tags": ["Women Empowerment", "Education", "Monthly Assistance"],
        "apply_url": "https://pudumaipenn.tn.gov.in/",
        "ministry": "Tamil Nadu School Education Department"
    },
    {
        "id": 5,
        "name": "Kalaignar Magalir Urimai Thogai",
        "sector": "Women/Welfare",
        "jurisdiction": "Tamil Nadu",
        "benefits": "₹1,000 monthly grant for women household heads.",
        "eligibility_criteria": {"gender": "Female", "income_limit": 250000},
        "tags": ["Women Rights", "Direct Cash", "Family Support"],
        "apply_url": "https://mukt.tn.gov.in/",
        "ministry": "Tamil Nadu Social Welfare Dept."
    },
    {
        "id": 6,
        "name": "Tamil Puthalvan Scheme",
        "sector": "Education/Men",
        "jurisdiction": "Tamil Nadu",
        "benefits": "₹1,000 monthly support for boys in government-aided higher studies.",
        "eligibility_criteria": {"gender": "Male", "schooling": "Tamil Medium"},
        "tags": ["Education", "Youth Support"],
        "apply_url": "https://tnscholarship.gov.in/",
        "ministry": "Tamil Nadu School Education Department"
    },
    {
        "id": 7,
        "name": "PM Mudra Yojana (PMMY)",
        "sector": "Business/Entrepreneurship",
        "jurisdiction": "Central Indian",
        "benefits": "Collateral-free loans up to ₹10 Lakh for small businesses.",
        "eligibility_criteria": {"occupation": "Entrepreneur", "income_limit": 1000000},
        "tags": ["Business", "Loan", "MSME", "Startup"],
        "apply_url": "https://www.mudra.org.in/",
        "ministry": "Ministry of Finance"
    },
    {
        "id": 8,
        "name": "PM Fasal Bima Yojana (PMFBY)",
        "sector": "Agriculture/Insurance",
        "jurisdiction": "Central Indian",
        "benefits": "Crop insurance covering yield losses due to natural calamities.",
        "eligibility_criteria": {"occupation": "Farmer"},
        "tags": ["Agriculture", "Insurance", "Crop Protection"],
        "apply_url": "https://pmfby.gov.in/",
        "ministry": "Ministry of Agriculture & Farmers Welfare"
    },
    {
        "id": 9,
        "name": "National Scholarship Portal (NSP)",
        "sector": "Education",
        "jurisdiction": "Central Indian",
        "benefits": "Scholarships ranging ₹1,000–₹50,000 for students from pre-matric to PhD.",
        "eligibility_criteria": {"occupation": "Student", "income_limit": 250000},
        "tags": ["Scholarship", "Education", "Student"],
        "apply_url": "https://scholarships.gov.in/",
        "ministry": "Ministry of Electronics & IT"
    },
    {
        "id": 10,
        "name": "Startup India — Seed Fund Scheme",
        "sector": "Startup/Entrepreneurship",
        "jurisdiction": "Central Indian",
        "benefits": "Seed funding up to ₹50 Lakh for early-stage DPIIT-recognized startups.",
        "eligibility_criteria": {"occupation": "Entrepreneur"},
        "tags": ["Startup", "Seed Fund", "Innovation"],
        "apply_url": "https://seedfund.startupindia.gov.in/",
        "ministry": "Ministry of Commerce & Industry"
    },
    {
        "id": 11,
        "name": "Pradhan Mantri Awas Yojana (PMAY)",
        "sector": "Housing",
        "jurisdiction": "Central Indian",
        "benefits": "Home loan subsidy up to ₹2.67 Lakh for first-time home buyers under EWS/LIG.",
        "eligibility_criteria": {"income_limit": 600000},
        "tags": ["Housing", "Subsidy", "Home Loan"],
        "apply_url": "https://pmaymis.gov.in/",
        "ministry": "Ministry of Housing & Urban Affairs"
    },
    {
        "id": 12,
        "name": "eShram Card — Unorganised Workers",
        "sector": "Social Security",
        "jurisdiction": "Central Indian",
        "benefits": "₹2 Lakh accident insurance + priority access to 400+ welfare schemes.",
        "eligibility_criteria": {"income_limit": 180000},
        "tags": ["Labour", "Social Security", "Workers"],
        "apply_url": "https://eshram.gov.in/",
        "ministry": "Ministry of Labour & Employment"
    },
    {
        "id": 13,
        "name": "Sukanya Samriddhi Yojana (SSY)",
        "sector": "Savings/Women",
        "jurisdiction": "Central Indian",
        "benefits": "High-interest savings scheme (8.2% p.a.) for girl children. Tax-free maturity amount.",
        "eligibility_criteria": {"gender": "Female", "income_limit": 1500000},
        "tags": ["Girl Child", "Savings", "Tax-Free"],
        "apply_url": "https://www.indiapost.gov.in/Financial/Pages/Content/Sukanya-Samridhi-Account.aspx",
        "ministry": "Ministry of Finance"
    },
    {
        "id": 14,
        "name": "PM Vishwakarma Scheme",
        "sector": "Skill/Artisan",
        "jurisdiction": "Central Indian",
        "benefits": "Collateral-free loans up to ₹3 Lakh + skill training + toolkit support for traditional artisans.",
        "eligibility_criteria": {"occupation": "Artisan", "income_limit": 500000},
        "tags": ["Artisan", "Craft", "Skill", "Loan"],
        "apply_url": "https://pmvishwakarma.gov.in/",
        "ministry": "Ministry of MSME"
    },
    {
        "id": 15,
        "name": "Atal Pension Yojana (APY)",
        "sector": "Pension/Social Security",
        "jurisdiction": "Central Indian",
        "benefits": "Guaranteed monthly pension of ₹1,000–₹5,000 after age 60 for unorganised sector workers.",
        "eligibility_criteria": {"income_limit": 600000},
        "tags": ["Pension", "Retirement", "Security"],
        "apply_url": "https://npscra.nsdl.co.in/scheme-details.php",
        "ministry": "Ministry of Finance / PFRDA"
    },
    {
        "id": 16,
        "name": "PMEGP – Prime Minister's Employment Generation Programme",
        "sector": "Employment/Entrepreneurship",
        "jurisdiction": "Central Indian",
        "benefits": "Subsidy up to 35% on project cost (up to ₹50 Lakh) for new micro-enterprises.",
        "eligibility_criteria": {"occupation": "Entrepreneur", "income_limit": 1500000},
        "tags": ["Employment", "Business", "Subsidy", "MSME"],
        "apply_url": "https://www.kviconline.gov.in/pmegpeportal/pmegphome/index.jsp",
        "ministry": "Ministry of MSME / KVIC"
    },
    {
        "id": 17,
        "name": "Janani Suraksha Yojana (JSY)",
        "sector": "Maternal Health/Women",
        "jurisdiction": "Central Indian",
        "benefits": "Cash incentive of ₹700–₹1,400 to pregnant women for institutional delivery.",
        "eligibility_criteria": {"gender": "Female", "income_limit": 200000},
        "tags": ["Maternity", "Health", "Women", "Pregnancy"],
        "apply_url": "https://nhm.gov.in/index1.php?lang=1&level=3&sublinkid=842&lid=309",
        "ministry": "Ministry of Health & Family Welfare"
    },
    {
        "id": 18,
        "name": "Naan Mudhalvan Scheme",
        "sector": "Skill Development/Youth",
        "jurisdiction": "Tamil Nadu",
        "benefits": "Free industry-relevant skill training, internships, and placement support for youth in Tamil Nadu.",
        "eligibility_criteria": {"occupation": "Student", "residency": "Tamil Nadu"},
        "tags": ["Youth", "Skill", "Employment", "Tamil Nadu"],
        "apply_url": "https://www.naanmudhalvan.tn.gov.in/",
        "ministry": "Tamil Nadu Skill Development Corporation"
    },
    {
        "id": 19,
        "name": "PM SVANidhi – Street Vendor Credit",
        "sector": "Urban Livelihood",
        "jurisdiction": "Central Indian",
        "benefits": "Working capital loans starting at ₹10,000 for street vendors with no collateral required.",
        "eligibility_criteria": {"occupation": "Street Vendor", "income_limit": 200000},
        "tags": ["Street Vendor", "Loan", "Urban", "Livelihood"],
        "apply_url": "https://pmsvanidhi.mohua.gov.in/",
        "ministry": "Ministry of Housing & Urban Affairs"
    },
    {
        "id": 20,
        "name": "Free Bus Pass for Women — Tamil Nadu",
        "sector": "Transport/Women",
        "jurisdiction": "Tamil Nadu",
        "benefits": "Free travel on all Tamil Nadu state government buses for women.",
        "eligibility_criteria": {"gender": "Female", "residency": "Tamil Nadu"},
        "tags": ["Women", "Free Travel", "Tamil Nadu", "Transport"],
        "apply_url": "https://www.tnstc.in/",
        "ministry": "Tamil Nadu State Transport Corporation"
    },
]

# ══════════════════════════════════════════════════════════════════════════════
# GEMINI AI HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def get_gemini_model():
    """Return a configured Gemini GenerativeModel instance."""
    return genai.GenerativeModel("gemini-1.5-flash")


def ai_match_schemes(user_profile: dict) -> tuple[list, int]:
    """
    Use Gemini to intelligently rank schemes for the given user profile.
    Falls back to rule-based matching if Gemini is unavailable.
    """
    if not GEMINI_API_KEY:
        return _rule_based_match(user_profile)

    try:
        model = get_gemini_model()
        schemes_json = json.dumps(
            [{"id": s["id"], "name": s["name"], "sector": s["sector"],
              "benefits": s["benefits"], "criteria": s["eligibility_criteria"]}
             for s in SCHEMES_DB],
            ensure_ascii=False
        )
        prompt = f"""
You are an expert Government Scheme Advisor for India and Tamil Nadu.

User Profile:
- Age: {user_profile.get('age', 'Unknown')}
- Gender: {user_profile.get('gender', 'Unknown')}
- State / UT: {user_profile.get('state', 'Unknown')}
- Annual Family Income: ₹{user_profile.get('income', 'Unknown')}
- Occupation: {user_profile.get('occupation', 'Unknown')}
- Education: {user_profile.get('education', 'Unknown')}
- Life Event: {user_profile.get('life_event', 'Unknown')}

Available Schemes (JSON):
{schemes_json}

Task:
1. Identify which schemes this user is most likely eligible for.
   - Apply gender-based filtering strictly (e.g., female-only schemes for Male users = ineligible)
   - Apply state/jurisdiction filtering (Tamil Nadu schemes only match Tamil Nadu residents or All India)
   - Central Indian schemes are available to all states.
2. Return a JSON object with:
   - "eligible_ids": list of scheme IDs (integers) ordered by relevance (most relevant first)
   - "score": overall eligibility score (0-100 integer)
   - "explanation": one concise sentence explaining the top match

Respond ONLY with valid JSON. No extra text.
"""
        response = model.generate_content(prompt)
        text = response.text.strip()
        # Strip markdown code fences if present
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        data = json.loads(text)
        ids = data.get("eligible_ids", [])
        score = int(data.get("score", 50))
        matched = [s for s in SCHEMES_DB if s["id"] in ids]
        # Preserve Gemini-suggested order
        matched.sort(key=lambda s: ids.index(s["id"]) if s["id"] in ids else 99)
        return matched, score

    except Exception as e:
        print(f"[Gemini AI Error — Matching] {e}")
        return _rule_based_match(user_profile)


def _rule_based_match(user_profile: dict) -> tuple[list, int]:
    """Simple fallback if Gemini is unavailable."""
    results, score = [], 0
    for scheme in SCHEMES_DB:
        c = scheme["eligibility_criteria"]
        match = 0
        if c.get("occupation") == user_profile.get("occupation"):
            match += 40
        if user_profile.get("income") and c.get("income_limit"):
            try:
                if int(user_profile["income"]) <= c["income_limit"]:
                    match += 40
            except ValueError:
                pass
        if c.get("gender") == user_profile.get("gender"):
            match += 20
        if match >= 30:
            results.append(scheme)
            score = max(score, match)
    if not results:
        results = SCHEMES_DB[:3]
        score = 45
    return results, min(score, 100)


def ai_chat_response(query: str) -> str:
    """Use Gemini to answer citizen queries about government schemes."""
    if not GEMINI_API_KEY:
        return _rule_based_chat(query)

    try:
        model = get_gemini_model()
        prompt = f"""
You are a helpful, friendly Government Scheme Advisor for India and Tamil Nadu.
A citizen asked: "{query}"

Answer clearly and concisely (2-4 sentences max). Mention specific scheme names,
benefit amounts, and eligibility conditions where relevant.
If you don't know the answer, say so politely and suggest visiting myscheme.gov.in.
"""
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"[Gemini AI Error — Chat] {e}")
        return _rule_based_chat(query)

def ai_scheme_guide(scheme_name: str) -> str:
    """Use Gemini to generate application steps for a specific scheme."""
    if not GEMINI_API_KEY:
        return "1. Visit the official website.\n2. Click on 'Apply Now'.\n3. Fill in your details.\n4. Upload requested documents.\n5. Submit your application."
    try:
        model = get_gemini_model()
        prompt = f"""
You are a helpful Government Scheme expert in India.
Provide a clear, simple, step-by-step numbered guide (max 5-6 steps) on how to apply for the scheme: {scheme_name}.
Keep it concise. Use **bold** for important terms. Do not add intro/outro text.
"""
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"[Gemini AI Error — Guide] {e}")
        return "1. Visit the official website.\n2. Click on 'Apply Now'.\n3. Fill in your details.\n4. Upload requested documents.\n5. Submit your application."

def ai_verify_fraud(scheme_name: str) -> dict:
    """Use Gemini to determine if a scheme name sounds like a scam or is officially recognized."""
    if not GEMINI_API_KEY:
        return {"is_fraud": False, "message": "Cannot verify without AI, but please be cautious sharing data."}
    try:
        model = get_gemini_model()
        prompt = f"""
Analyze this scheme name circulated in India: "{scheme_name}"
Determine if it is a real government scheme or likely a fake/fraudulent phishing attempt (like "Free Laptop for All" or "WhatsApp Modi Yojana").
Return ONLY a JSON formatted string:
{{"is_fraud": true/false, "message": "1 short sentence explaining why it's real or fake"}}
"""
        response = model.generate_content(prompt)
        text = response.text.replace('```json', '').replace('```', '').strip()
        import json
        return json.loads(text)
    except Exception as e:
        print(f"[Gemini AI Error — Fraud Check] {e}")
        return {"is_fraud": False, "message": "Error analyzing scheme. Proceed with caution."}


def _rule_based_chat(query: str) -> str:
    q = query.lower()
    if "kisan" in q or "farmer" in q:
        return "PM-KISAN provides ₹6,000/year to eligible farmers in three installments. You can register at pmkisan.gov.in."
    elif "scholarship" in q or "student" in q:
        return "Pudhumai Penn (TN) offers ₹1,000/month for girls in government higher education. Visit tnscholarship.gov.in."
    elif "women" in q or "magalir" in q:
        return "Kalaignar Magalir Urimai Thogai provides ₹1,000/month to eligible women in Tamil Nadu."
    elif "health" in q or "ayushman" in q:
        return "Ayushman Bharat PM-JAY covers health expenses up to ₹5 Lakh/year for BPL families. Check pmjay.gov.in."
    elif "business" in q or "loan" in q:
        return "PM Mudra Yojana offers collateral-free loans up to ₹10 Lakh for small businesses. Apply at mudra.org.in."
    return "I can help with schemes for farmers, students, women, and startups. Please ask specifically about any of these!"


# ══════════════════════════════════════════════════════════════════════════════
# ROUTES
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/dashboard")
def dashboard():
    import random
    wildcards = random.sample(SCHEMES_DB, min(2, len(SCHEMES_DB)))
    return render_template("dashboard.html", wildcards=wildcards)


@app.route("/login")
def login():
    return render_template("login.html")


@app.route("/signup")
def signup():
    return render_template("signup.html")


# ── Profile Routes ─────────────────────────────────────────────────────────────────────
DEFAULT_PROFILE = {
    "full_name": "Citizen User",
    "aadhar": "",
    "mobile": "",
    "email": "",
    "dob": "",
    "gender": "Male",
    "state": "Tamil Nadu",
    "district": "",
    "occupation": "Farmer",
    "income": "150000",
    "education": "Graduate",
    "caste_category": "General",
}

DOC_TYPES = [
    {"key": "aadhaar",  "label": "Aadhaar Card",       "icon": "fa-id-card",          "color": "#1a3c6e"},
    {"key": "income",   "label": "Income Certificate",  "icon": "fa-file-invoice",     "color": "#16a34a"},
    {"key": "caste",    "label": "Caste Certificate",   "icon": "fa-certificate",      "color": "#f97316"},
    {"key": "bank",     "label": "Bank Passbook",       "icon": "fa-building-columns", "color": "#7c3aed"},
    {"key": "photo",    "label": "Passport Photo",      "icon": "fa-camera",           "color": "#0891b2"},
    {"key": "domicile", "label": "Domicile Certificate","icon": "fa-house-flag",       "color": "#be185d"},
]


def _allowed(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/profile", methods=["GET", "POST"])
def profile():
    """Profile view/edit page."""
    if "profile" not in session:
        session["profile"] = dict(DEFAULT_PROFILE)
    if "documents" not in session:
        session["documents"] = {}

    if request.method == "POST":
        for field in DEFAULT_PROFILE:
            val = request.form.get(field, "").strip()
            if val:
                session["profile"][field] = val
        session.modified = True
        flash("profile_saved", "success")
        return redirect(url_for("profile"))

    return render_template(
        "profile.html",
        prof=session["profile"],
        documents=session.get("documents", {}),
        doc_types=DOC_TYPES,
        saved="profile_saved" in [m for m in (session.get("_flashes") or [])],
    )


# ── API: Upload Document ───────────────────────────────────────────────────────────────
@app.route("/api/upload_document", methods=["POST"])
def upload_document():
    """Accept a file upload; associate it with a doc_type key."""
    doc_type = request.form.get("doc_type", "").strip()
    valid_keys = {d["key"] for d in DOC_TYPES}
    if doc_type not in valid_keys:
        return jsonify({"status": "error", "msg": "Invalid document type."}), 400

    if "file" not in request.files:
        return jsonify({"status": "error", "msg": "No file provided."}), 400

    f = request.files["file"]
    if f.filename == "":
        return jsonify({"status": "error", "msg": "Empty filename."}), 400

    if not _allowed(f.filename):
        return jsonify({"status": "error", "msg": "Only PDF, PNG, JPG allowed."}), 400

    ext = f.filename.rsplit('.', 1)[1].lower()
    unique_name = f"{doc_type}_{uuid.uuid4().hex[:8]}.{ext}"
    save_path = os.path.join(app.config["UPLOAD_FOLDER"], unique_name)
    f.save(save_path)

    if "documents" not in session:
        session["documents"] = {}

    # Delete previous file for this doc_type if exists
    old = session["documents"].get(doc_type, {})
    if old.get("filename"):
        old_path = os.path.join(app.config["UPLOAD_FOLDER"], old["filename"])
        if os.path.exists(old_path):
            os.remove(old_path)

    session["documents"][doc_type] = {
        "filename": unique_name,
        "original": secure_filename(f.filename),
        "url": f"/static/uploads/{unique_name}",
        "ext": ext,
    }
    session.modified = True
    return jsonify({"status": "success", "url": f"/static/uploads/{unique_name}", "filename": unique_name, "ext": ext})


# ── API: Delete Document ───────────────────────────────────────────────────────────────
@app.route("/api/delete_document", methods=["POST"])
def delete_document():
    doc_type = request.get_json(force=True).get("doc_type", "")
    docs = session.get("documents", {})
    if doc_type in docs:
        old_path = os.path.join(app.config["UPLOAD_FOLDER"], docs[doc_type]["filename"])
        if os.path.exists(old_path):
            os.remove(old_path)
        del session["documents"][doc_type]
        session.modified = True
    return jsonify({"status": "success"})


# ── API: AI Scheme Matching ───────────────────────────────────────────────────
@app.route("/api/predict_schemes", methods=["POST"])
def predict_schemes():
    """Smart scheme matcher powered by Gemini AI."""
    user_data = request.get_json(force=True)
    recommendations, score = ai_match_schemes(user_data)
    return jsonify({
        "status": "success",
        "recommendations": recommendations,
        "score": score,
    })


# ── API: AI Chatbot ───────────────────────────────────────────────────────────
@app.route("/api/chat", methods=["POST"])
def chat():
    """AI chatbot powered by Gemini."""
    query = request.get_json(force=True).get("query", "")
    answer = ai_chat_response(query)
    return jsonify({"answer": answer})


# ── API: Voice Input ──────────────────────────────────────────────────────────
@app.route("/api/voice_input", methods=["POST"])
def voice_input():
    return jsonify({"status": "success", "msg": "Voice received."})


# ── API: Scheme Guide ─────────────────────────────────────────────────────────
@app.route("/api/scheme_guide", methods=["POST"])
def scheme_guide():
    """Generates step-by-step guidance for a scheme."""
    scheme_name = request.get_json(force=True).get("scheme_name", "")
    guide_text = ai_scheme_guide(scheme_name)
    return jsonify({"status": "success", "guide": guide_text})


# ── API: Verify Fraud ─────────────────────────────────────────────────────────
@app.route("/api/verify_fraud", methods=["POST"])
def verify_fraud():
    """Checks if a user-submitted scheme name is fraudulent."""
    scheme_name = request.get_json(force=True).get("scheme_name", "")
    result = ai_verify_fraud(scheme_name)
    return jsonify(result)


# ── Run ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, port=5000, host="127.0.0.1", use_reloader=False)
