import os
import re
import hashlib
import threading
import time
from uuid import uuid4
from math import asin, cos, radians, sin, sqrt
from functools import wraps
from sqlalchemy.exc import IntegrityError
from flask import Flask, render_template, jsonify, request, session
from werkzeug.exceptions import RequestEntityTooLarge
from werkzeug.utils import secure_filename
from database import db
from models import Airport, Airplane, Flight, Employee, Passenger, User
from datetime import datetime, timedelta, timezone

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:@localhost:5432/flight-planner'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-change-before-production')
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024

ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
FLIGHT_CRASH_CHANCE = 0.03
CRASH_SURVIVAL_CHANCE = 0.06
FLIGHT_LIFECYCLE_CHECK_INTERVAL_SECONDS = 30
CRASH_CAUSES = (
    'Crew error during a critical phase of flight caused loss of control.',
    'Engine failure escalated before the crew could complete an emergency landing.',
    'Severe weather caused structural stress and loss of aircraft control.',
    'Navigation system failure led the aircraft into unsafe terrain conditions.',
    'Hydraulic failure made the aircraft impossible to control safely.',
    'Runway incident during takeoff or landing caused catastrophic damage.',
    'Fuel system failure caused power loss across critical aircraft systems.'
)

db.init_app(app)
flight_lifecycle_worker_started = False


@app.errorhandler(RequestEntityTooLarge)
def handle_large_upload(_error):
    return error_response("Image must be 5 MB or smaller", 413)


def error_response(message, status_code=400):
    return jsonify({"error": message}), status_code


def get_request_data():
    if request.form:
        return request.form

    return request.get_json(silent=True) or {}


def save_uploaded_image(file, folder_name):
    if not file or not file.filename:
        return None

    original_filename = file.filename
    extension = original_filename.rsplit('.', 1)[-1].lower() if '.' in original_filename else ''
    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValueError("Only PNG, JPG, JPEG, GIF and WEBP images are allowed")

    upload_dir = os.path.join(app.root_path, 'static', 'img', folder_name)
    os.makedirs(upload_dir, exist_ok=True)

    filename = secure_filename(original_filename)
    if not filename:
        filename = f"upload.{extension}"

    saved_filename = f"{uuid4().hex}.{extension}"
    file.save(os.path.join(upload_dir, saved_filename))

    return f"/static/img/{folder_name}/{saved_filename}"


def serialize_user(user):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "is_verified": user.is_verified,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }


def get_current_user():
    user_id = session.get('user_id')
    if not user_id:
        return None

    return User.query.get(user_id)


def require_admin(view_func):
    @wraps(view_func)
    def wrapper(*args, **kwargs):
        user = get_current_user()
        if not user:
            return error_response("Authentication required", 401)

        if user.role.lower() != 'admin':
            return error_response("Admin access required", 403)

        return view_func(*args, **kwargs)

    return wrapper


def require_verified_user(view_func):
    @wraps(view_func)
    def wrapper(*args, **kwargs):
        user = get_current_user()
        if not user:
            return error_response("Authentication required", 401)

        if not user.is_verified:
            return error_response("Verified account required", 403)

        return view_func(*args, **kwargs)

    return wrapper


def get_stable_random_unit(seed):
    digest = hashlib.sha256(seed.encode('utf-8')).hexdigest()
    return int(digest[:16], 16) / 0xFFFFFFFFFFFFFFFF


def get_flight_crash_seed(flight):
    departure_time = flight.departure_time.isoformat() if flight.departure_time else ''
    return f"{flight.id}:{flight.flight_number}:{flight.airplane_id}:{departure_time}"


def get_flight_crash_plan(flight):
    duration_seconds = (flight.arrival_time - flight.departure_time).total_seconds()
    if duration_seconds <= 0:
        return {"will_crash": False, "crash_time": None, "cause": None}

    seed = get_flight_crash_seed(flight)
    will_crash = get_stable_random_unit(f"{seed}:will-crash") < FLIGHT_CRASH_CHANCE
    if not will_crash:
        return {"will_crash": False, "crash_time": None, "cause": None}

    crash_offset_ratio = 0.1 + (get_stable_random_unit(f"{seed}:crash-time") * 0.8)
    crash_time = flight.departure_time + timedelta(seconds=duration_seconds * crash_offset_ratio)
    cause_index = int(get_stable_random_unit(f"{seed}:cause") * len(CRASH_CAUSES))

    return {
        "will_crash": True,
        "crash_time": crash_time,
        "cause": CRASH_CAUSES[min(cause_index, len(CRASH_CAUSES) - 1)]
    }


def person_survives_crash(flight, person, group_name):
    seed = f"{get_flight_crash_seed(flight)}:{group_name}:{person.id}:survival"
    return get_stable_random_unit(seed) < CRASH_SURVIVAL_CHANCE


def apply_flight_crash(flight, cause):
    flight.status = 'Crashed'
    flight.crash_cause = flight.crash_cause or cause
    flight.airplane.status = 'Crashed'
    flight.airplane.current_airport = None

    for employee in flight.crew:
        employee.status = 'Alive' if person_survives_crash(flight, employee, 'crew') else 'Dead'
        employee.current_airport = None

    for passenger in flight.passengers:
        passenger.status = 'Alive' if person_survives_crash(flight, passenger, 'passenger') else 'Dead'
        passenger.current_airport = None


def update_flight_status(flight, now):
    if flight.status in ('Arrived', 'Crashed'):
        return False

    status_changed = False
    if flight.status == 'Scheduled' and now >= flight.departure_time:
        flight.status = 'In Flight'
        status_changed = True

    if flight.status == 'In Flight':
        crash_plan = get_flight_crash_plan(flight)
        if crash_plan["will_crash"] and now >= crash_plan["crash_time"]:
            apply_flight_crash(flight, crash_plan["cause"])
            db.session.commit()
            return True

        if now >= flight.arrival_time:
            flight.status = 'Arrived'
            flight.airplane.current_airport = flight.arrival_airport
            for employee in flight.crew:
                if employee.status == 'Alive':
                    employee.current_airport = flight.arrival_airport
            for passenger in flight.passengers:
                if passenger.status == 'Alive':
                    passenger.current_airport = flight.arrival_airport
            db.session.commit()
            return True

    if status_changed:
        db.session.commit()
        return True

    return False


def run_flight_lifecycle_check():
    with app.app_context():
        try:
            now = datetime.now(timezone.utc)
            flights = Flight.query.filter(Flight.status.in_(('Scheduled', 'In Flight'))).all()
            for flight in flights:
                update_flight_status(flight, now)
        except Exception:
            db.session.rollback()
            raise


def flight_lifecycle_worker():
    while True:
        try:
            run_flight_lifecycle_check()
        except Exception as err:
            print(f"Flight lifecycle worker error: {err}")

        time.sleep(FLIGHT_LIFECYCLE_CHECK_INTERVAL_SECONDS)


def start_flight_lifecycle_worker():
    global flight_lifecycle_worker_started
    if flight_lifecycle_worker_started:
        return

    flight_lifecycle_worker_started = True
    thread = threading.Thread(target=flight_lifecycle_worker, daemon=True)
    thread.start()


@app.before_request
def ensure_flight_lifecycle_worker():
    start_flight_lifecycle_worker()


def parse_datetime(value):
    if not value:
        return None

    try:
        parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))
    except ValueError:
        return None

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)

    return parsed.astimezone(timezone.utc)


def calculate_distance_km(departure_airport, arrival_airport):
    earth_radius_km = 6371
    lat1 = radians(departure_airport.latitude)
    lon1 = radians(departure_airport.longitude)
    lat2 = radians(arrival_airport.latitude)
    lon2 = radians(arrival_airport.longitude)
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    haversine = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2

    return 2 * earth_radius_km * asin(sqrt(haversine))


def calculate_arrival_time(departure_airport, arrival_airport, departure_time):
    distance_km = calculate_distance_km(departure_airport, arrival_airport)
    flight_hours = max(distance_km / 850, 0.5)
    return departure_time + timedelta(minutes=round(flight_hours * 60))


def has_overlapping_flight(item, departure_time, arrival_time, current_flight_id=None):
    for flight in item.flights:
        if current_flight_id and flight.id == current_flight_id:
            continue

        if flight.status == 'Arrived':
            continue

        if flight.departure_time < arrival_time and flight.arrival_time > departure_time:
            return True

    return False


def is_person_in_departure_city(person, departure_airport):
    return person.current_airport and person.current_airport.city == departure_airport.city


def is_person_available_for_departure(person, departure_airport):
    return (
        person.status == 'Alive'
        and is_person_in_departure_city(person, departure_airport)
    )


def is_airplane_available_for_departure(airplane, departure_airport):
    return (
        airplane.status == 'Active'
        and airplane.current_airport_id == departure_airport.id
    )


def serialize_airplane(airplane):
    return {
        "id": airplane.id,
        "tail_number": airplane.tail_number,
        "model": airplane.model,
        "capacity": airplane.capacity,
        "status": airplane.status,
        "image_path": airplane.image_path,
        "current_airport": {
            "id": airplane.current_airport.id,
            "code": airplane.current_airport.code,
            "city": airplane.current_airport.city
        } if airplane.current_airport else None
    }


def serialize_airport(airport):
    return {
        "id": airport.id,
        "code": airport.code,
        "name": airport.name,
        "city": airport.city,
        "latitude": airport.latitude,
        "longitude": airport.longitude
    }


def serialize_employee(employee, include_sensitive=True):
    data = {
        "id": employee.id,
        "first_name": employee.first_name,
        "last_name": employee.last_name,
        "role": employee.role,
        "status": employee.status,
        "image_path": employee.image_path,
        "current_airport": {
            "id": employee.current_airport.id,
            "code": employee.current_airport.code,
            "city": employee.current_airport.city
        } if employee.current_airport else None
    }

    if include_sensitive:
        data["employee_number"] = employee.employee_number

    return data


def serialize_passenger(passenger, include_sensitive=True):
    data = {
        "id": passenger.id,
        "first_name": passenger.first_name,
        "last_name": passenger.last_name,
        "status": passenger.status,
        "image_path": passenger.image_path,
        "current_airport": {
            "id": passenger.current_airport.id,
            "code": passenger.current_airport.code,
            "city": passenger.current_airport.city
        } if passenger.current_airport else None
    }

    if include_sensitive:
        data["passport_number"] = passenger.passport_number

    return data

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/auth/register', methods=['POST'])
def register_user():
    data = get_request_data()
    username = (data.get('username') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not username or not email or not password:
        return error_response("Username, email and password are required")

    if len(username) < 3 or len(username) > 50:
        return error_response("Username must be between 3 and 50 characters")

    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        return error_response("Invalid email address")

    if len(password) < 6:
        return error_response("Password must be at least 6 characters")

    existing_user = User.query.filter(
        (User.username == username) | (User.email == email)
    ).first()
    if existing_user:
        return error_response("User with this username or email already exists", 409)

    user = User(username=username, email=email, role='User', is_verified=False)
    user.set_password(password)

    try:
        db.session.add(user)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return error_response("User with this username or email already exists", 409)

    return jsonify({
        "message": "Registration request created. Wait for administrator approval.",
        "user": serialize_user(user)
    }), 201


@app.route('/api/auth/login', methods=['POST'])
def login_user():
    data = get_request_data()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not email or not password:
        return error_response("Email and password are required")

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return error_response("Invalid email or password", 401)

    if not user.is_verified:
        return error_response("Account is waiting for administrator approval", 403)

    session.clear()
    session['user_id'] = user.id

    return jsonify({
        "message": "Logged in successfully",
        "user": serialize_user(user)
    })


@app.route('/api/auth/logout', methods=['POST'])
def logout_user():
    session.clear()
    return jsonify({"message": "Logged out successfully"})


@app.route('/api/auth/me', methods=['GET'])
def get_auth_user():
    user = get_current_user()
    if not user:
        return jsonify({"user": None})

    return jsonify({"user": serialize_user(user)})


@app.route('/api/admin/registration-requests', methods=['GET'])
@require_admin
def get_registration_requests():
    users = User.query.filter_by(is_verified=False).order_by(User.created_at.asc()).all()
    return jsonify([serialize_user(user) for user in users])


@app.route('/api/admin/users', methods=['GET'])
@require_admin
def get_admin_users():
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([serialize_user(user) for user in users])


@app.route('/api/admin/users/<int:user_id>/approve', methods=['POST'])
@require_admin
def approve_user(user_id):
    user = User.query.get_or_404(user_id)
    admin = get_current_user()

    if user.is_verified:
        return jsonify({
            "message": "User is already approved",
            "user": serialize_user(user)
        })

    user.approve(admin)
    db.session.commit()

    return jsonify({
        "message": "User approved successfully",
        "user": serialize_user(user)
    })


@app.route('/api/admin/users/<int:user_id>/reject', methods=['POST'])
@require_admin
def reject_user(user_id):
    user = User.query.get_or_404(user_id)

    if user.is_verified:
        return error_response("Approved users cannot be rejected from this panel", 400)

    db.session.delete(user)
    db.session.commit()

    return jsonify({"message": "Registration request rejected"})


@app.route('/api/admin/users/<int:user_id>/promote', methods=['POST'])
@require_admin
def promote_user(user_id):
    user = User.query.get_or_404(user_id)

    if not user.is_verified:
        return error_response("Only verified users can be promoted", 400)

    if user.role.lower() == 'admin':
        return jsonify({
            "message": "User is already an admin",
            "user": serialize_user(user)
        })

    user.role = 'Admin'
    db.session.commit()

    return jsonify({
        "message": "User promoted to admin",
        "user": serialize_user(user)
    })


@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@require_admin
def delete_user(user_id):
    admin = get_current_user()
    user = User.query.get_or_404(user_id)

    if user.id == admin.id:
        return error_response("You cannot delete your own account", 400)

    db.session.delete(user)
    db.session.commit()

    return jsonify({"message": "Account deleted"})


@app.route('/api/flights/active', methods=['GET'])
def get_active_flights():
    active_flights = Flight.query.filter(Flight.status.in_(('Scheduled', 'In Flight'))).all()
    now = datetime.now(timezone.utc)

    result = []
    for f in active_flights:
        update_flight_status(f, now)
        if f.status != 'In Flight':
            continue

        result.append({
            "id": f.id,
            "flight_number": f.flight_number,
            "status": f.status,
            "crash_cause": f.crash_cause,
            "departure_time": f.departure_time.isoformat(),
            "arrival_time": f.arrival_time.isoformat(),
            "airplane": serialize_airplane(f.airplane),
            "departure_airport": {
                "code": f.departure_airport.code,
                "name": f.departure_airport.name,
                "city": f.departure_airport.city,
                "coordinates": [f.departure_airport.longitude, f.departure_airport.latitude]
            },
            "arrival_airport": {
                "code": f.arrival_airport.code,
                "name": f.arrival_airport.name,
                "city": f.arrival_airport.city,
                "coordinates": [f.arrival_airport.longitude, f.arrival_airport.latitude]
            }
        })

    return jsonify(result)


@app.route('/api/flights', methods=['GET'])
def get_all_flights():
    try:
        flights = Flight.query.order_by(Flight.departure_time.desc()).all()
        now = datetime.now(timezone.utc)
        can_see_crashed = bool(get_current_user() and get_current_user().is_verified)

        result = []
        for f in flights:
            update_flight_status(f, now)
            if f.status == 'Crashed' and not can_see_crashed:
                continue

            result.append({
                "id": f.id,
                "flight_number": f.flight_number,
                "status": f.status,
                "crash_cause": f.crash_cause,
                "departure_time": f.departure_time.isoformat(),
                "arrival_time": f.arrival_time.isoformat(),
                "airplane": serialize_airplane(f.airplane),
                "departure_airport": {
                    "code": f.departure_airport.code,
                    "city": f.departure_airport.city
                },
                "arrival_airport": {
                    "code": f.arrival_airport.code,
                    "city": f.arrival_airport.city
                }
            })
        return jsonify(result)

    except Exception as e:
        print(f"Ошибка сервера: {e}")
        return jsonify([]), 500

@app.route('/api/airplanes', methods=['GET'])
def get_all_airplanes():
    airplanes = Airplane.query.order_by(Airplane.model.asc()).all()
    return jsonify([serialize_airplane(airplane) for airplane in airplanes])


@app.route('/api/airplanes/available', methods=['GET'])
@require_verified_user
def get_available_airplanes():
    departure_airport_id = request.args.get('departure_airport_id', type=int)

    if not departure_airport_id:
        return error_response("Departure airport is required")

    departure_airport = Airport.query.get_or_404(departure_airport_id)
    airplanes = Airplane.query.filter_by(status='Active', current_airport_id=departure_airport.id).order_by(Airplane.model.asc()).all()

    return jsonify([serialize_airplane(airplane) for airplane in airplanes])


@app.route('/api/airplanes', methods=['POST'])
@require_verified_user
def create_airplane():
    data = get_request_data()
    tail_number = (data.get('tail_number') or '').strip().upper()
    model = (data.get('model') or '').strip()
    capacity = data.get('capacity')
    current_airport_id = data.get('current_airport_id')

    if not tail_number or not model or not capacity or not current_airport_id:
        return error_response("Tail number, model, capacity and current airport are required")

    try:
        capacity = int(capacity)
    except (TypeError, ValueError):
        return error_response("Capacity must be a number")

    if capacity <= 0:
        return error_response("Capacity must be greater than zero")

    try:
        image_path = save_uploaded_image(request.files.get('image'), 'planes')
    except ValueError as err:
        return error_response(str(err))

    current_airport = Airport.query.get_or_404(current_airport_id)
    airplane = Airplane(
        tail_number=tail_number,
        model=model,
        capacity=capacity,
        current_airport=current_airport,
        status='Active',
        image_path=image_path
    )

    try:
        db.session.add(airplane)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return error_response("Airplane with this tail number already exists", 409)

    return jsonify(serialize_airplane(airplane)), 201


@app.route('/api/flights/estimate-arrival', methods=['GET'])
@require_verified_user
def estimate_flight_arrival():
    departure_airport_id = request.args.get('departure_airport_id', type=int)
    arrival_airport_id = request.args.get('arrival_airport_id', type=int)
    departure_time = parse_datetime(request.args.get('departure_time'))

    if not departure_airport_id or not arrival_airport_id or not departure_time:
        return error_response("Departure airport, arrival airport and departure time are required")

    if departure_airport_id == arrival_airport_id:
        return error_response("Departure and arrival airports must be different")

    departure_airport = Airport.query.get_or_404(departure_airport_id)
    arrival_airport = Airport.query.get_or_404(arrival_airport_id)
    arrival_time = calculate_arrival_time(departure_airport, arrival_airport, departure_time)

    return jsonify({
        "departure_time": departure_time.isoformat(),
        "arrival_time": arrival_time.isoformat()
    })


@app.route('/api/crew/available', methods=['GET'])
@require_verified_user
def get_available_crew():
    departure_airport_id = request.args.get('departure_airport_id', type=int)
    arrival_airport_id = request.args.get('arrival_airport_id', type=int)
    current_flight_id = request.args.get('flight_id', type=int)
    departure_time = parse_datetime(request.args.get('departure_time'))

    if not departure_airport_id or not arrival_airport_id or not departure_time:
        return error_response("Departure airport, arrival airport and departure time are required")

    departure_airport = Airport.query.get_or_404(departure_airport_id)
    arrival_airport = Airport.query.get_or_404(arrival_airport_id)
    arrival_time = calculate_arrival_time(departure_airport, arrival_airport, departure_time)
    employees = Employee.query.filter_by(status='Alive').all()
    available = [
        employee for employee in employees
        if is_person_available_for_departure(employee, departure_airport)
        and not has_overlapping_flight(employee, departure_time, arrival_time, current_flight_id)
    ]

    return jsonify([serialize_employee(employee) for employee in available])


@app.route('/api/passengers/available', methods=['GET'])
@require_verified_user
def get_available_passengers():
    departure_airport_id = request.args.get('departure_airport_id', type=int)
    arrival_airport_id = request.args.get('arrival_airport_id', type=int)
    current_flight_id = request.args.get('flight_id', type=int)
    departure_time = parse_datetime(request.args.get('departure_time'))

    if not departure_airport_id or not arrival_airport_id or not departure_time:
        return error_response("Departure airport, arrival airport and departure time are required")

    departure_airport = Airport.query.get_or_404(departure_airport_id)
    arrival_airport = Airport.query.get_or_404(arrival_airport_id)
    arrival_time = calculate_arrival_time(departure_airport, arrival_airport, departure_time)
    passengers = Passenger.query.filter_by(status='Alive').all()
    available = [
        passenger for passenger in passengers
        if is_person_available_for_departure(passenger, departure_airport)
        and not has_overlapping_flight(passenger, departure_time, arrival_time, current_flight_id)
    ]

    return jsonify([serialize_passenger(passenger) for passenger in available])


@app.route('/api/employees', methods=['POST'])
@require_verified_user
def create_employee():
    data = get_request_data()
    first_name = (data.get('first_name') or '').strip()
    last_name = (data.get('last_name') or '').strip()
    role = (data.get('role') or '').strip()
    employee_number = (data.get('employee_number') or '').strip()
    current_airport_id = data.get('current_airport_id')

    if not first_name or not last_name or not role or not employee_number or not current_airport_id:
        return error_response("First name, last name, role, employee number and airport are required")

    try:
        image_path = save_uploaded_image(request.files.get('image'), 'crew') or '/static/img/crew/placeholder.png'
    except ValueError as err:
        return error_response(str(err))

    current_airport = Airport.query.get_or_404(current_airport_id)
    employee = Employee(
        first_name=first_name,
        last_name=last_name,
        role=role,
        employee_number=employee_number,
        current_airport=current_airport,
        image_path=image_path
    )

    try:
        db.session.add(employee)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return error_response("Employee with this number already exists", 409)

    return jsonify(serialize_employee(employee)), 201


@app.route('/api/passengers', methods=['POST'])
@require_verified_user
def create_passenger():
    data = get_request_data()
    first_name = (data.get('first_name') or '').strip()
    last_name = (data.get('last_name') or '').strip()
    passport_number = (data.get('passport_number') or '').strip()
    current_airport_id = data.get('current_airport_id')

    if not first_name or not last_name or not passport_number or not current_airport_id:
        return error_response("First name, last name, passport number and airport are required")

    try:
        image_path = save_uploaded_image(request.files.get('image'), 'passengers') or '/static/img/passengers/placeholder.png'
    except ValueError as err:
        return error_response(str(err))

    current_airport = Airport.query.get_or_404(current_airport_id)
    passenger = Passenger(
        first_name=first_name,
        last_name=last_name,
        passport_number=passport_number,
        current_airport=current_airport,
        image_path=image_path
    )

    try:
        db.session.add(passenger)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return error_response("Passenger with this passport number already exists", 409)

    return jsonify(serialize_passenger(passenger)), 201


def save_flight_from_payload(flight=None):
    data = get_request_data()
    flight_number = (data.get('flight_number') or '').strip()
    airplane_id = data.get('airplane_id')
    departure_airport_id = data.get('departure_airport_id')
    arrival_airport_id = data.get('arrival_airport_id')
    departure_time = parse_datetime(data.get('departure_time'))
    crew_ids = data.get('crew_ids') or []
    passenger_ids = data.get('passenger_ids') or []

    if not flight_number or not airplane_id or not departure_airport_id or not arrival_airport_id or not departure_time:
        return None, error_response("Flight number, airplane, airports and departure time are required")

    if departure_airport_id == arrival_airport_id:
        return None, error_response("Departure and arrival airports must be different")

    if flight is None and departure_time < datetime.now(timezone.utc):
        return None, error_response("Departure time cannot be in the past")

    airplane = Airplane.query.get_or_404(airplane_id)
    departure_airport = Airport.query.get_or_404(departure_airport_id)
    arrival_airport = Airport.query.get_or_404(arrival_airport_id)
    arrival_time = calculate_arrival_time(departure_airport, arrival_airport, departure_time)
    current_flight_id = flight.id if flight else None
    crew = Employee.query.filter(Employee.id.in_(crew_ids)).all() if crew_ids else []
    passengers = Passenger.query.filter(Passenger.id.in_(passenger_ids)).all() if passenger_ids else []

    if len(crew) != len(set(crew_ids)):
        return None, error_response("One or more selected crew members do not exist")

    if len(passengers) != len(set(passenger_ids)):
        return None, error_response("One or more selected passengers do not exist")

    if len(passengers) > airplane.capacity:
        return None, error_response("Passenger count exceeds airplane capacity")

    if not is_airplane_available_for_departure(airplane, departure_airport):
        return None, error_response("Selected aircraft is not available at the departure airport")

    for employee in crew:
        if employee.status != 'Alive':
            return None, error_response(f"{employee.first_name} {employee.last_name} cannot be assigned because they are not alive")
        if not is_person_in_departure_city(employee, departure_airport):
            return None, error_response(f"{employee.first_name} {employee.last_name} is not in the departure city")
        if has_overlapping_flight(employee, departure_time, arrival_time, current_flight_id):
            return None, error_response(f"{employee.first_name} {employee.last_name} is already assigned to another flight")

    for passenger in passengers:
        if passenger.status != 'Alive':
            return None, error_response(f"{passenger.first_name} {passenger.last_name} cannot be assigned because they are not alive")
        if not is_person_in_departure_city(passenger, departure_airport):
            return None, error_response(f"{passenger.first_name} {passenger.last_name} is not in the departure city")
        if has_overlapping_flight(passenger, departure_time, arrival_time, current_flight_id):
            return None, error_response(f"{passenger.first_name} {passenger.last_name} is already on another flight")

    if flight is None:
        flight = Flight()
        db.session.add(flight)

    flight.flight_number = flight_number
    flight.airplane = airplane
    flight.departure_airport = departure_airport
    flight.arrival_airport = arrival_airport
    flight.departure_time = departure_time
    flight.arrival_time = arrival_time
    flight.status = data.get('status') or (flight.status if current_flight_id else 'Scheduled')
    flight.crew = crew
    flight.passengers = passengers

    db.session.commit()
    return flight, None


@app.route('/api/flights', methods=['POST'])
@require_verified_user
def create_flight():
    flight, error = save_flight_from_payload()
    if error:
        return error

    return jsonify({"message": "Flight created successfully", "id": flight.id}), 201


@app.route('/api/flights/<int:flight_id>', methods=['PUT'])
@require_verified_user
def update_flight(flight_id):
    flight = Flight.query.get_or_404(flight_id)
    flight, error = save_flight_from_payload(flight)
    if error:
        return error

    return jsonify({"message": "Flight updated successfully", "id": flight.id})


@app.route('/api/flights/<int:flight_id>', methods=['DELETE'])
@require_verified_user
def delete_flight(flight_id):
    flight = Flight.query.get_or_404(flight_id)
    db.session.delete(flight)
    db.session.commit()

    return jsonify({"message": "Flight deleted successfully"})


@app.route('/api/flights/<int:flight_id>', methods=['GET'])
def get_flight_details(flight_id):
    try:
        
        flight = Flight.query.get_or_404(flight_id)

        
        now = datetime.now(timezone.utc)
        update_flight_status(flight, now)

        
        include_sensitive = bool(get_current_user() and get_current_user().is_verified)
        if flight.status == 'Crashed' and not include_sensitive:
            return error_response("Verified account required", 403)

        crew_list = []
        for member in flight.crew:
            crew_list.append(serialize_employee(member, include_sensitive))

        
        passenger_list = []
        for p in flight.passengers:
            passenger_list.append(serialize_passenger(p, include_sensitive))

        
        return jsonify({
            "id": flight.id,
            "flight_number": flight.flight_number,
            "status": flight.status,
            "crash_cause": flight.crash_cause,
            "departure_time": flight.departure_time.isoformat(),
            "arrival_time": flight.arrival_time.isoformat(),
            "airplane": serialize_airplane(flight.airplane),
            "departure_airport": {
                "id": flight.departure_airport.id,
                "code": flight.departure_airport.code,
                "name": flight.departure_airport.name,
                "city": flight.departure_airport.city
            },
            "arrival_airport": {
                "id": flight.arrival_airport.id,
                "code": flight.arrival_airport.code,
                "name": flight.arrival_airport.name,
                "city": flight.arrival_airport.city
            },
            "crew": crew_list,
            "passengers": passenger_list
        })

    except Exception as e:
        print(f"Ошибка при получении деталей рейса {flight_id}: {e}")
        return jsonify({"error": "Внутренняя ошибка сервера"}), 500


@app.route('/api/airports', methods=['GET'])
def get_all_airports():
    try:
        airports = Airport.query.order_by(Airport.city.asc()).all()

        return jsonify([serialize_airport(airport) for airport in airports])

    except Exception as e:
        print(f"Ошибка сервера при получении аэропортов: {e}")
        return jsonify([]), 500


@app.route('/api/airports', methods=['POST'])
@require_verified_user
def create_airport():
    data = get_request_data()
    code = (data.get('code') or '').strip().upper()
    name = (data.get('name') or '').strip()
    city = (data.get('city') or '').strip()
    latitude = data.get('latitude')
    longitude = data.get('longitude')

    if not code or not name or not city or latitude is None or longitude is None:
        return error_response("Code, name, city, latitude and longitude are required")

    if len(code) != 3:
        return error_response("Airport code must contain 3 letters")

    try:
        latitude = float(latitude)
        longitude = float(longitude)
    except (TypeError, ValueError):
        return error_response("Latitude and longitude must be numbers")

    airport = Airport(code=code, name=name, city=city, latitude=latitude, longitude=longitude)

    try:
        db.session.add(airport)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return error_response("Airport with this code already exists", 409)

    return jsonify(serialize_airport(airport)), 201


@app.route('/api/airports/<string:code>', methods=['GET'])
def get_airport_details(code):
    try:
        
        airport = Airport.query.filter_by(code=code.upper()).first_or_404()

        
        all_flights = Flight.query.filter(
            (Flight.departure_airport_id == airport.id) |
            (Flight.arrival_airport_id == airport.id)
        ).all()

        
        now = datetime.now(timezone.utc)
        for f in all_flights:
            update_flight_status(f, now)

        
        def serialize_flight(f):
            return {
                "id": f.id,
                "flight_number": f.flight_number,
                "status": f.status,
                "departure_time": f.departure_time.isoformat(),
                "arrival_time": f.arrival_time.isoformat(),
                "airplane": {"model": f.airplane.model},
                "departure_airport": {"code": f.departure_airport.code, "city": f.departure_airport.city},
                "arrival_airport": {"code": f.arrival_airport.code, "city": f.arrival_airport.city}
            }

        
        scheduled_flights = [serialize_flight(f) for f in all_flights if f.status == 'Scheduled']
        inflight_flights = [serialize_flight(f) for f in all_flights if f.status == 'In Flight']
        arrived_flights = [serialize_flight(f) for f in all_flights if f.status == 'Arrived']

        
        sorted_flights = scheduled_flights + inflight_flights + arrived_flights

        return jsonify({
            "code": airport.code,
            "name": airport.name,
            "city": airport.city,
            "latitude": airport.latitude,  
            "longitude": airport.longitude,
            "flights": sorted_flights
        })

    except Exception as e:
        print(f"Ошибка при получении данных аэропорта {code}: {e}")
        return jsonify({"error": "Внутренняя ошибка сервера"}), 500


if __name__ == '__main__':
    if os.environ.get('WERKZEUG_RUN_MAIN') == 'true':
        start_flight_lifecycle_worker()

    app.run(debug=True)
