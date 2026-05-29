-- =============================================
--       ОЧИСТКА И НАСТРОЙКА БАЗЫ ДАННЫХ
-- =============================================

TRUNCATE TABLE flight_passengers, flight_crew, flights, airplanes, airports, passengers, employees RESTART IDENTITY CASCADE;
SET client_encoding = 'UTF8';

-- =============================================
--           ДАННЫЕ ОБ АЭРОПОРТАХ
-- =============================================

INSERT INTO airports (code, name, city, latitude, longitude) VALUES
('SVO', 'Шереметьево имени А.С. Пушкина', 'Москва', 55.9726, 37.4146),
('JFK', 'Международный аэропорт им. Джона Кеннеди', 'Нью-Йорк', 40.6413, -73.7781),
('LHR', 'Хитроу', 'Лондон', 51.4700, -0.4543),
('DXB', 'Международный аэропорт Дубай', 'Дубай', 25.2532, 55.3657),
('HND', 'Ханеда', 'Токио', 35.5494, 139.7798),
('CDG', 'Аэропорт Шарль-де-Голль', 'Париж', 49.0097, 2.5479),
('SIN', 'Аэропорт Чанги', 'Сингапур', 1.3644, 103.9915);

-- =============================================
--           ДАННЫЕ О САМОЛЕТАХ
-- =============================================

INSERT INTO airplanes (tail_number, model, capacity, image_path) VALUES
('RA-73025', 'Boeing 737-800', 168, '/static/img/planes/b737.png'),
('N101NV', 'Airbus A320', 180, '/static/img/planes/a320.png'),
('A6-EVK', 'Airbus A380', 515, '/static/img/planes/a380.png'),
('JA873A', 'Boeing 787 Dreamliner', 240, '/static/img/planes/b787.png');

-- =============================================
--           ДАННЫЕ О РЕЙСАХ
-- =============================================

INSERT INTO flights (flight_number, airplane_id, departure_airport_id, arrival_airport_id, departure_time, arrival_time, status)
VALUES (
    'SU-2130', 
    (SELECT id FROM airplanes WHERE tail_number = 'RA-73025'),
    (SELECT id FROM airports WHERE code = 'SVO'),
    (SELECT id FROM airports WHERE code = 'LHR'),
    NOW() - INTERVAL '10 hours', 
    NOW() - INTERVAL '6 hours', 
    'Arrived'
);

INSERT INTO flights (flight_number, airplane_id, departure_airport_id, arrival_airport_id, departure_time, arrival_time, status)
VALUES (
    'EK-312', 
    (SELECT id FROM airplanes WHERE tail_number = 'A6-EVK'),
    (SELECT id FROM airports WHERE code = 'DXB'),
    (SELECT id FROM airports WHERE code = 'HND'),
    NOW() - INTERVAL '20 hours', 
    NOW() - INTERVAL '11 hours', 
    'Arrived'
);

INSERT INTO flights (flight_number, airplane_id, departure_airport_id, arrival_airport_id, departure_time, arrival_time, status)
VALUES (
    'AA-100', 
    (SELECT id FROM airplanes WHERE tail_number = 'JA873A'),
    (SELECT id FROM airports WHERE code = 'JFK'),
    (SELECT id FROM airports WHERE code = 'CDG'),
    NOW() - INTERVAL '2 hours',
    NOW() + INTERVAL '5 hours',
    'In Flight'
);

INSERT INTO flights (flight_number, airplane_id, departure_airport_id, arrival_airport_id, departure_time, arrival_time, status)
VALUES (
    'SU-500', 
    (SELECT id FROM airplanes WHERE tail_number = 'RA-73025'),
    (SELECT id FROM airports WHERE code = 'SVO'),
    (SELECT id FROM airports WHERE code = 'DXB'),
    NOW() + INTERVAL '4 hours',
    NOW() + INTERVAL '9 hours', 
    'Scheduled'
);

INSERT INTO flights (flight_number, airplane_id, departure_airport_id, arrival_airport_id, departure_time, arrival_time, status)
VALUES (
    'SQ-21', 
    (SELECT id FROM airplanes WHERE tail_number = 'N101NV'),
    (SELECT id FROM airports WHERE code = 'SIN'),
    (SELECT id FROM airports WHERE code = 'JFK'),
    NOW() + INTERVAL '1 day 2 hours',
    NOW() + INTERVAL '1 day 20 hours', 
    'Scheduled'
);

INSERT INTO flights (flight_number, airplane_id, departure_airport_id, arrival_airport_id, departure_time, arrival_time, status)
VALUES (
    'NH-202', 
    (SELECT id FROM airplanes WHERE tail_number = 'JA873A'),
    (SELECT id FROM airports WHERE code = 'HND'),
    (SELECT id FROM airports WHERE code = 'LHR'),
    NOW() + INTERVAL '3 days', 
    NOW() + INTERVAL '3 days 12 hours', 
    'Scheduled'
);

INSERT INTO flights (flight_number, airplane_id, departure_airport_id, arrival_airport_id, departure_time, arrival_time, status)
VALUES (
    'AF-275', 
    (SELECT id FROM airplanes WHERE tail_number = 'A6-EVK'),
    (SELECT id FROM airports WHERE code = 'CDG'),
    (SELECT id FROM airports WHERE code = 'SIN'),
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '7 days 13 hours', 
    'Scheduled'
);


INSERT INTO flights (flight_number, airplane_id, departure_airport_id, arrival_airport_id, departure_time, arrival_time, status)
VALUES (
    'SU-502', 
    (SELECT id FROM airplanes WHERE tail_number = 'RA-73025'),
    (SELECT id FROM airports WHERE code = 'SVO'),
    (SELECT id FROM airports WHERE code = 'DXB'),
    NOW() - INTERVAL '1 hour',
    NOW() + INTERVAL '4 hours',
    'In Flight'
);

INSERT INTO flights (flight_number, airplane_id, departure_airport_id, arrival_airport_id, departure_time, arrival_time, status)
VALUES (
    'BA-007', 
    (SELECT id FROM airplanes WHERE tail_number = 'A6-EVK'),
    (SELECT id FROM airports WHERE code = 'LHR'),
    (SELECT id FROM airports WHERE code = 'HND'),
    NOW() - INTERVAL '3 hours',
    NOW() + INTERVAL '8 hours',
    'In Flight'
);

INSERT INTO flights (flight_number, airplane_id, departure_airport_id, arrival_airport_id, departure_time, arrival_time, status)
VALUES (
    'AF-1144', 
    (SELECT id FROM airplanes WHERE tail_number = 'N101NV'),
    (SELECT id FROM airports WHERE code = 'CDG'), 
    (SELECT id FROM airports WHERE code = 'SVO'), 
    NOW() - INTERVAL '2 hours 15 minutes', 
    NOW() + INTERVAL '1 minute', 
    'In Flight'
);

-- =============================================
--           ДАННЫЕ О ПАССАЖИРАХ
-- =============================================

INSERT INTO passengers (first_name, last_name, passport_number) VALUES
('Александр', 'Кузнецов', '4512-889900'),
('Ольга', 'Попова', '4615-112233'),
('Игорь', 'Макаров', '4520-556677'),
('Елена', 'Ветрова', '4518-993311'),
('Pierre', 'Martin', 'FR9921234'),
('Anna', 'Müller', 'DE7711223'),
('John', 'Doe', 'US4455667'),
('Jane', 'Smith', 'US9988776'),
('David', 'Kim', 'KR1122334'),
('Fatima', 'Al-Mansoori', 'AE5544332');

-- =============================================
--           ДАННЫЕ ОБ ЭКИПАЖЕ
-- =============================================

INSERT INTO employees (first_name, last_name, role, employee_number) VALUES

('Jean', 'Dupont', 'Pilot', 'EMP-1001'),
('Michel', 'Bernard', 'Co-Pilot', 'EMP-1002'),
('Chloé', 'Dubois', 'Flight Attendant', 'EMP-2001'),
('Lucas', 'Bertrand', 'Flight Attendant', 'EMP-2002'),
('Emma', 'Leroy', 'Flight Attendant', 'EMP-2003'),

('Алексей', 'Иванов', 'Pilot', 'EMP-1003'),
('Дмитрий', 'Петров', 'Co-Pilot', 'EMP-1004'),
('Мария', 'Смирнова', 'Flight Attendant', 'EMP-2004'),
('Наталья', 'Соколова', 'Flight Attendant', 'EMP-2005'),

('John', 'Walker', 'Pilot', 'EMP-1005'),
('William', 'Davis', 'Co-Pilot', 'EMP-1006'),
('Yuki', 'Tanaka', 'Flight Attendant', 'EMP-2006'),
('Aisha', 'Khan', 'Flight Attendant', 'EMP-2007');

-- =============================================
--      РАСПРЕДЕЛЕНИЕ ПАССАЖИРОВ НА РЕЙСЫ
-- =============================================

INSERT INTO flight_passengers (flight_id, passenger_id)
SELECT f.id, p.id FROM flights f, passengers p 
WHERE f.flight_number = 'AF-1144' AND p.passport_number IN ('4512-889900', '4615-112233', 'FR9921234', 'DE7711223');

INSERT INTO flight_passengers (flight_id, passenger_id)
SELECT f.id, p.id FROM flights f, passengers p 
WHERE f.flight_number = 'AA-100' AND p.passport_number IN ('US4455667', 'US9988776', 'FR9921234', 'DE7711223');

INSERT INTO flight_passengers (flight_id, passenger_id)
SELECT f.id, p.id FROM flights f, passengers p 
WHERE f.flight_number LIKE 'SU-%' AND p.passport_number IN ('4512-889900', '4615-112233', '4520-556677', '4518-993311');

INSERT INTO flight_passengers (flight_id, passenger_id)
SELECT f.id, p.id FROM flights f, passengers p 
WHERE f.flight_number IN ('EK-312', 'SQ-21', 'NH-202', 'AF-275', 'BA-007') 
  AND p.passport_number IN ('US4455667', 'US9988776', 'KR1122334', 'AE5544332');

-- =============================================
--      РАСПРЕДЕЛЕНИЕ ЭКИПАЖА НА РЕЙСЫ
-- =============================================

INSERT INTO flight_crew (flight_id, employee_id)
SELECT f.id, e.id FROM flights f, employees e 
WHERE f.flight_number LIKE 'SU-%' AND e.employee_number IN ('EMP-1003', 'EMP-1004', 'EMP-2004', 'EMP-2005');

INSERT INTO flight_crew (flight_id, employee_id)
SELECT f.id, e.id FROM flights f, employees e 
WHERE f.flight_number LIKE 'AF-%' AND e.employee_number IN ('EMP-1001', 'EMP-1002', 'EMP-2001', 'EMP-2002', 'EMP-2003');

INSERT INTO flight_crew (flight_id, employee_id)
SELECT f.id, e.id FROM flights f, employees e 
WHERE f.flight_number NOT LIKE 'SU-%' AND f.flight_number NOT LIKE 'AF-%' 
  AND e.employee_number IN ('EMP-1005', 'EMP-1006', 'EMP-2006', 'EMP-2007');