from flask import Flask, request, jsonify
from flask_bcrypt import Bcrypt
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity
)
from flask_cors import CORS
from datetime import timedelta
import re

from models import db, Admin, Opportunity

app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///admin_portal.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = "change-this-secret-key"

CORS(app)

db.init_app(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

with app.app_context():
    db.create_all()


def is_valid_email(email):
    return re.match(r"^[\w\.-]+@[\w\.-]+\.\w+$", email)


def normalize_category(category):
    category_map = {
        "technology": "Technology",
        "business": "Business",
        "design": "Design",
        "marketing": "Marketing",
        "data-science": "Data Science",
        "data science": "Data Science",
        "other": "Other",
        "Technology": "Technology",
        "Business": "Business",
        "Design": "Design",
        "Marketing": "Marketing",
        "Data Science": "Data Science",
        "Other": "Other"
    }

    return category_map.get(category)


@app.route("/")
def home():
    return jsonify({"message": "Flask backend is running"})


@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.get_json()

    full_name = data.get("full_name")
    email = data.get("email")
    password = data.get("password")
    confirm_password = data.get("confirm_password")

    if not full_name or not email or not password or not confirm_password:
        return jsonify({"error": "All fields are required"}), 400

    if not is_valid_email(email):
        return jsonify({"error": "Invalid email format"}), 400

    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    if password != confirm_password:
        return jsonify({"error": "Passwords do not match"}), 400

    existing_admin = Admin.query.filter_by(email=email).first()

    if existing_admin:
        return jsonify({"error": "Account already exists"}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")

    admin = Admin(
        full_name=full_name,
        email=email,
        password=hashed_password
    )

    db.session.add(admin)
    db.session.commit()

    return jsonify({"message": "Signup successful"}), 201


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()

    email = data.get("email")
    password = data.get("password")
    remember_me = data.get("remember_me", False)

    admin = Admin.query.filter_by(email=email).first()

    if not admin or not bcrypt.check_password_hash(admin.password, password):
        return jsonify({"error": "Invalid email or password"}), 401

    expiry_time = timedelta(days=7) if remember_me else timedelta(hours=3)

    token = create_access_token(
        identity=str(admin.id),
        expires_delta=expiry_time
    )

    return jsonify({
        "message": "Login successful",
        "token": token,
        "admin": {
            "id": admin.id,
            "full_name": admin.full_name,
            "email": admin.email
        }
    }), 200


@app.route("/api/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json()
    email = data.get("email")

    admin = Admin.query.filter_by(email=email).first()

    if admin:
        reset_token = create_access_token(
            identity=str(admin.id),
            expires_delta=timedelta(hours=1)
        )
        print("Reset link:", f"http://localhost:5500/admin.html?reset_token={reset_token}")

    return jsonify({
        "message": "If the email exists, a reset link has been generated"
    }), 200


@app.route("/api/opportunities", methods=["GET"])
@jwt_required()
def get_opportunities():
    admin_id = int(get_jwt_identity())

    opportunities = Opportunity.query.filter_by(admin_id=admin_id).all()

    result = []

    for opportunity in opportunities:
        result.append({
            "id": opportunity.id,
            "name": opportunity.name,
            "duration": opportunity.duration,
            "start_date": opportunity.start_date,
            "description": opportunity.description,
            "skills": opportunity.skills,
            "category": opportunity.category,
            "future_opportunities": opportunity.future_opportunities,
            "max_applicants": opportunity.max_applicants
        })

    return jsonify(result), 200


@app.route("/api/opportunities", methods=["POST"])
@jwt_required()
def create_opportunity():
    admin_id = int(get_jwt_identity())
    data = request.get_json()

    required_fields = [
        "name",
        "duration",
        "start_date",
        "description",
        "skills",
        "category",
        "future_opportunities"
    ]

    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    category = normalize_category(data.get("category"))

    if not category:
        return jsonify({"error": "Invalid category"}), 400

    opportunity = Opportunity(
        name=data.get("name"),
        duration=data.get("duration"),
        start_date=data.get("start_date"),
        description=data.get("description"),
        skills=data.get("skills"),
        category=category,
        future_opportunities=data.get("future_opportunities"),
        max_applicants=data.get("max_applicants"),
        admin_id=admin_id
    )

    db.session.add(opportunity)
    db.session.commit()

    return jsonify({
        "message": "Opportunity created successfully",
        "opportunity": {
            "id": opportunity.id,
            "name": opportunity.name,
            "duration": opportunity.duration,
            "start_date": opportunity.start_date,
            "description": opportunity.description,
            "skills": opportunity.skills,
            "category": opportunity.category,
            "future_opportunities": opportunity.future_opportunities,
            "max_applicants": opportunity.max_applicants
        }
    }), 201


@app.route("/api/opportunities/<int:opportunity_id>", methods=["GET"])
@jwt_required()
def get_single_opportunity(opportunity_id):
    admin_id = int(get_jwt_identity())

    opportunity = Opportunity.query.filter_by(
        id=opportunity_id,
        admin_id=admin_id
    ).first()

    if not opportunity:
        return jsonify({"error": "Opportunity not found"}), 404

    return jsonify({
        "id": opportunity.id,
        "name": opportunity.name,
        "duration": opportunity.duration,
        "start_date": opportunity.start_date,
        "description": opportunity.description,
        "skills": opportunity.skills,
        "category": opportunity.category,
        "future_opportunities": opportunity.future_opportunities,
        "max_applicants": opportunity.max_applicants
    }), 200


@app.route("/api/opportunities/<int:opportunity_id>", methods=["PUT"])
@jwt_required()
def update_opportunity(opportunity_id):
    admin_id = int(get_jwt_identity())

    opportunity = Opportunity.query.filter_by(
        id=opportunity_id,
        admin_id=admin_id
    ).first()

    if not opportunity:
        return jsonify({"error": "Opportunity not found"}), 404

    data = request.get_json()

    required_fields = [
        "name",
        "duration",
        "start_date",
        "description",
        "skills",
        "category",
        "future_opportunities"
    ]

    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"{field} is required"}), 400

    category = normalize_category(data.get("category"))

    if not category:
        return jsonify({"error": "Invalid category"}), 400

    opportunity.name = data.get("name")
    opportunity.duration = data.get("duration")
    opportunity.start_date = data.get("start_date")
    opportunity.description = data.get("description")
    opportunity.skills = data.get("skills")
    opportunity.category = category
    opportunity.future_opportunities = data.get("future_opportunities")
    opportunity.max_applicants = data.get("max_applicants")

    db.session.commit()

    return jsonify({
        "message": "Opportunity updated successfully",
        "opportunity": {
            "id": opportunity.id,
            "name": opportunity.name,
            "duration": opportunity.duration,
            "start_date": opportunity.start_date,
            "description": opportunity.description,
            "skills": opportunity.skills,
            "category": opportunity.category,
            "future_opportunities": opportunity.future_opportunities,
            "max_applicants": opportunity.max_applicants
        }
    }), 200


@app.route("/api/opportunities/<int:opportunity_id>", methods=["DELETE"])
@jwt_required()
def delete_opportunity(opportunity_id):
    admin_id = int(get_jwt_identity())

    opportunity = Opportunity.query.filter_by(
        id=opportunity_id,
        admin_id=admin_id
    ).first()

    if not opportunity:
        return jsonify({"error": "Opportunity not found"}), 404

    db.session.delete(opportunity)
    db.session.commit()

    return jsonify({"message": "Opportunity deleted successfully"}), 200


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=10000)
