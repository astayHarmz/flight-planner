from database import db

class Airplane(db.Model):
    __tablename__ = 'airplanes'

    id = db.Column(db.Integer, primary_key=True)
    tail_number = db.Column(db.String(20), unique=True, nullable=False)
    model = db.Column(db.String(50), nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    image_path = db.Column(db.String(255), nullable=True)

    flights = db.relationship('Flight', backref='airplane', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f'<Airplane {self.tail_number}>'