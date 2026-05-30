from database import db

flight_crew = db.Table('flight_crew',
    db.Column('flight_id', db.Integer, db.ForeignKey('flights.id', ondelete='CASCADE'), primary_key=True),
    db.Column('employee_id', db.Integer, db.ForeignKey('employees.id', ondelete='CASCADE'), primary_key=True)
)

flight_passengers = db.Table('flight_passengers',
    db.Column('flight_id', db.Integer, db.ForeignKey('flights.id', ondelete='CASCADE'), primary_key=True),
    db.Column('passenger_id', db.Integer, db.ForeignKey('passengers.id', ondelete='CASCADE'), primary_key=True)
)


class Flight(db.Model):
    __tablename__ = 'flights'

    id = db.Column(db.Integer, primary_key=True)
    flight_number = db.Column(db.String(10), nullable=False)

    airplane_id = db.Column(db.Integer, db.ForeignKey('airplanes.id', ondelete='CASCADE'), nullable=False)
    departure_airport_id = db.Column(db.Integer, db.ForeignKey('airports.id', ondelete='RESTRICT'), nullable=False)
    arrival_airport_id = db.Column(db.Integer, db.ForeignKey('airports.id', ondelete='RESTRICT'), nullable=False)

    departure_time = db.Column(db.DateTime(timezone=True), nullable=False)
    arrival_time = db.Column(db.DateTime(timezone=True), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='Scheduled')
    crash_cause = db.Column(db.Text, nullable=True)

    passengers = db.relationship('Passenger', secondary=flight_passengers, backref=db.backref('flights', lazy=True))
    crew = db.relationship('Employee', secondary=flight_crew, backref=db.backref('flights', lazy=True))

    def __repr__(self):
        return f'<Flight {self.flight_number}>'
