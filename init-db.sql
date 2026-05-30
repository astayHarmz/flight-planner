CREATE TABLE IF NOT EXISTS airports (
    id SERIAL PRIMARY KEY,
    code VARCHAR(3) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS airplanes (
    id SERIAL PRIMARY KEY,
    tail_number VARCHAR(20) UNIQUE NOT NULL,
    model VARCHAR(50) NOT NULL,
    capacity INTEGER NOT NULL,
    current_airport_id INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    image_path VARCHAR(255),

    CONSTRAINT fk_airplane_current_airport
        FOREIGN KEY (current_airport_id)
        REFERENCES airports(id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS flights (
    id SERIAL PRIMARY KEY,
    flight_number VARCHAR(10) NOT NULL,
    airplane_id INTEGER NOT NULL,
    departure_airport_id INTEGER NOT NULL,
    arrival_airport_id INTEGER NOT NULL,
    departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
    arrival_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Scheduled',
    crash_cause TEXT,
    
    CONSTRAINT fk_flight_airplane 
        FOREIGN KEY (airplane_id) 
        REFERENCES airplanes(id) 
        ON DELETE CASCADE,
        
    CONSTRAINT fk_flight_departure_airport 
        FOREIGN KEY (departure_airport_id) 
        REFERENCES airports(id) 
        ON DELETE RESTRICT,
        
    CONSTRAINT fk_flight_arrival_airport 
        FOREIGN KEY (arrival_airport_id) 
        REFERENCES airports(id) 
        ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS passengers (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    passport_number VARCHAR(20) UNIQUE NOT NULL,
    current_airport_id INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'Alive',
    image_path VARCHAR(255),

    CONSTRAINT fk_passenger_current_airport
        FOREIGN KEY (current_airport_id)
        REFERENCES airports(id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS flight_passengers (
    flight_id INTEGER NOT NULL,
    passenger_id INTEGER NOT NULL,
    
    PRIMARY KEY (flight_id, passenger_id),
    
    CONSTRAINT fk_fp_flight 
        FOREIGN KEY (flight_id) 
        REFERENCES flights(id) 
        ON DELETE CASCADE,
        
    CONSTRAINT fk_fp_passenger 
        FOREIGN KEY (passenger_id) 
        REFERENCES passengers(id) 
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role VARCHAR(50) NOT NULL,
    employee_number VARCHAR(20) UNIQUE NOT NULL,
    current_airport_id INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'Alive',
    image_path VARCHAR(255),

    CONSTRAINT fk_employee_current_airport
        FOREIGN KEY (current_airport_id)
        REFERENCES airports(id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS flight_crew (
    flight_id INTEGER NOT NULL,
    employee_id INTEGER NOT NULL,
    
    PRIMARY KEY (flight_id, employee_id),
    
    CONSTRAINT fk_fc_flight 
        FOREIGN KEY (flight_id) 
        REFERENCES flights(id) 
        ON DELETE CASCADE,
        
    CONSTRAINT fk_fc_employee 
        FOREIGN KEY (employee_id) 
        REFERENCES employees(id) 
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'User',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by INTEGER,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_approved_by
        FOREIGN KEY (approved_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_flights_departure_time ON flights(departure_time);
CREATE INDEX IF NOT EXISTS idx_flights_status ON flights(status);
CREATE INDEX IF NOT EXISTS idx_airplanes_status ON airplanes(status);
CREATE INDEX IF NOT EXISTS idx_airplanes_current_airport ON airplanes(current_airport_id);
CREATE INDEX IF NOT EXISTS idx_passengers_status ON passengers(status);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
