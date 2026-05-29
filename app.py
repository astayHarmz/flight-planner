from flask import Flask, render_template, jsonify
from database import db
from models import Airport, Airplane, Flight, Employee, Passenger
from datetime import datetime, timezone
from flask import request

app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:@localhost:5432/flight-planner'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

def update_flight_status_if_arrived(flight, now):
    if flight.status == 'In Flight' and now >= flight.arrival_time:
        flight.status = 'Arrived'
        db.session.commit()
        return True
    return False


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/flights/active', methods=['GET'])
def get_active_flights():
    active_flights = Flight.query.filter_by(status='In Flight').all()
    now = datetime.now(timezone.utc)

    result = []
    for f in active_flights:
        if update_flight_status_if_arrived(f, now):
            continue

        result.append({
            "id": f.id,
            "flight_number": f.flight_number,
            "status": f.status,
            "departure_time": f.departure_time.isoformat(),
            "arrival_time": f.arrival_time.isoformat(),
            "airplane": {
                "model": f.airplane.model,
                "tail_number": f.airplane.tail_number,
                "capacity": f.airplane.capacity,
                "image_path": f.airplane.image_path
            },
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

        result = []
        for f in flights:
            update_flight_status_if_arrived(f, now)

            result.append({
                "id": f.id,
                "flight_number": f.flight_number,
                "status": f.status,
                "departure_time": f.departure_time.isoformat(),
                "arrival_time": f.arrival_time.isoformat(),
                "airplane": {
                    "model": f.airplane.model,
                    "tail_number": f.airplane.tail_number
                },
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

@app.route('/api/flights/<int:flight_id>', methods=['GET'])
def get_flight_details(flight_id):
    try:
        # Ищем рейс по id, если не нашли — SQLAlchemy автоматически вернет ошибку 404
        flight = Flight.query.get_or_404(flight_id)

        # Перед отправкой проверяем статус на актуальность
        now = datetime.now(timezone.utc)
        update_flight_status_if_arrived(flight, now)

        # Собираем данные об экипаже
        crew_list = []
        for member in flight.crew:
            crew_list.append({
                "id": member.id,
                "first_name": member.first_name,
                "last_name": member.last_name,
                "role": member.role,
                "employee_number": member.employee_number
            })

        # Собираем данные о пассажирах
        passenger_list = []
        for p in flight.passengers:
            passenger_list.append({
                "id": p.id,
                "first_name": p.first_name,
                "last_name": p.last_name,
                "passport_number": p.passport_number
            })

        # Формируем итоговый JSON ответ
        return jsonify({
            "id": flight.id,
            "flight_number": flight.flight_number,
            "status": flight.status,
            "departure_time": flight.departure_time.isoformat(),
            "arrival_time": flight.arrival_time.isoformat(),
            "airplane": {
                "model": flight.airplane.model,
                "tail_number": flight.airplane.tail_number,
                "capacity": flight.airplane.capacity
            },
            "departure_airport": {
                "code": flight.departure_airport.code,
                "name": flight.departure_airport.name,
                "city": flight.departure_airport.city
            },
            "arrival_airport": {
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

        result = []
        for a in airports:
            result.append({
                "id": a.id,
                "code": a.code,
                "name": a.name,
                "city": a.city,
                "latitude": a.latitude,
                "longitude": a.longitude
            })
        return jsonify(result)

    except Exception as e:
        print(f"Ошибка сервера при получении аэропортов: {e}")
        return jsonify([]), 500


@app.route('/api/airports/<string:code>', methods=['GET'])
def get_airport_details(code):
    try:
        # Ищем аэропорт по его трехбуквенному коду IATA
        airport = Airport.query.filter_by(code=code.upper()).first_or_404()

        # Находим все рейсы, где этот аэропорт является точкой вылета ИЛИ прилета
        all_flights = Flight.query.filter(
            (Flight.departure_airport_id == airport.id) |
            (Flight.arrival_airport_id == airport.id)
        ).all()

        # Обновляем статусы рейсов "на лету" перед отправкой
        now = datetime.now(timezone.utc)
        for f in all_flights:
            update_flight_status_if_arrived(f, now)

        # Функция для сериализации рейса
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

        # Сортируем рейсы по группам согласно приоритету: Scheduled -> In Flight -> Arrived
        scheduled_flights = [serialize_flight(f) for f in all_flights if f.status == 'Scheduled']
        inflight_flights = [serialize_flight(f) for f in all_flights if f.status == 'In Flight']
        arrived_flights = [serialize_flight(f) for f in all_flights if f.status == 'Arrived']

        # Объединяем списки в нужном порядке: запланированные, в полете, завершенные
        sorted_flights = scheduled_flights + inflight_flights + arrived_flights

        return jsonify({
            "code": airport.code,
            "name": airport.name,
            "city": airport.city,
            "latitude": airport.latitude,  # Отдаем координаты только для карты
            "longitude": airport.longitude,
            "flights": sorted_flights
        })

    except Exception as e:
        print(f"Ошибка при получении данных аэропорта {code}: {e}")
        return jsonify({"error": "Внутренняя ошибка сервера"}), 500


if __name__ == '__main__':
    app.run(debug=True)