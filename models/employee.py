from database import db

class Employee(db.Model):
    __tablename__ = 'employees'

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    role = db.Column(db.String(50), nullable=False) # 'Pilot', 'Co-Pilot', 'Flight Attendant'
    employee_number = db.Column(db.String(20), unique=True, nullable=False)

    def __repr__(self):
        return f'<{self.role} {self.first_name} {self.last_name}>'