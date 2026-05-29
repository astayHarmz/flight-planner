from database import db

class Airport(db.Model):
    __tablename__ = 'airports'

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(3), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)

    departing_flights = db.relationship('Flight', foreign_keys='Flight.departure_airport_id', backref='departure_airport', lazy=True)
    arriving_flights = db.relationship('Flight', foreign_keys='Flight.arrival_airport_id', backref='arrival_airport', lazy=True)

    def __repr__(self):
        return f'<Airport {self.code}>'