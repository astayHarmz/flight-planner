from database import db


class Passenger(db.Model):
    __tablename__ = 'passengers'

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    passport_number = db.Column(db.String(20), unique=True, nullable=False)
    current_airport_id = db.Column(db.Integer, db.ForeignKey('airports.id', ondelete='SET NULL'), nullable=True)
    status = db.Column(db.String(20), nullable=False, default='Alive')
    image_path = db.Column(db.String(255), nullable=True)

    current_airport = db.relationship('Airport', backref=db.backref('passengers', lazy=True))

    def __repr__(self):
        return f'<Passenger {self.first_name} {self.last_name}>'
