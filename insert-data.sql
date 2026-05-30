-- =============================================
--       DATABASE CLEANUP & CONFIGURATION
-- =============================================

SET client_min_messages = WARNING;
SET client_encoding = 'UTF8';

BEGIN;
TRUNCATE TABLE 
    flight_passengers, 
    flight_crew, 
    flights, 
    airplanes, 
    airports, 
    passengers, 
    employees, 
    users 
RESTART IDENTITY CASCADE;
COMMIT;

BEGIN;

-- =============================================
--               USER DATA
-- =============================================

INSERT INTO users (username, email, password_hash, role, is_verified, approved_at)
VALUES (
    'admin',
    'admin@example.com',
    'pbkdf2:sha256:600000$adminseed$6e8dde013c410309aafbc2cbca0530cae6fb09572d4a84255be41b90016917ca',
    'Admin',
    TRUE,
    CURRENT_TIMESTAMP
);

-- =============================================
--               AIRPORT DATA
-- =============================================

INSERT INTO airports (code, name, city, latitude, longitude) VALUES
('SVO', 'Sheremetyevo International Airport named after A.S. Pushkin', 'Moscow', 55.9726, 37.4146),
('JFK', 'John F. Kennedy International Airport', 'New York', 40.6413, -73.7781),
('LHR', 'Heathrow Airport', 'London', 51.4700, -0.4543),
('DXB', 'Dubai International Airport', 'Dubai', 25.2532, 55.3657),
('HND', 'Haneda Airport', 'Tokyo', 35.5494, 139.7798),
('CDG', 'Charles de Gaulle Airport', 'Paris', 49.0097, 2.5479),
('SIN', 'Singapore Changi Airport', 'Singapore', 1.3644, 103.9915),
('AMS', 'Amsterdam Airport Schiphol', 'Amsterdam', 52.3105, 4.7683),
('FRA', 'Frankfurt Airport', 'Frankfurt', 50.0379, 8.5622),
('MAD', 'Adolfo Suarez Madrid-Barajas Airport', 'Madrid', 40.4983, -3.5676),
('FCO', 'Leonardo da Vinci-Fiumicino Airport', 'Rome', 41.8003, 12.2389),
('IST', 'Istanbul Airport', 'Istanbul', 41.2753, 28.7519),
('DOH', 'Hamad International Airport', 'Doha', 25.2731, 51.6081),
('SYD', 'Sydney Kingsford Smith Airport', 'Sydney', -33.9399, 151.1753),
('LAX', 'Los Angeles International Airport', 'Los Angeles', 33.9416, -118.4085),
('ORD', 'Chicago O Hare International Airport', 'Chicago', 41.9742, -87.9073),
('YYZ', 'Toronto Pearson International Airport', 'Toronto', 43.6777, -79.6248),
('GRU', 'Sao Paulo-Guarulhos International Airport', 'Sao Paulo', -23.4356, -46.4731),
('CPT', 'Cape Town International Airport', 'Cape Town', -33.9715, 18.6021),
('ICN', 'Incheon International Airport', 'Seoul', 37.4602, 126.4407);

-- =============================================
--               AIRCRAFT DATA
-- =============================================

INSERT INTO airplanes (tail_number, model, capacity, current_airport_id, status, image_path) VALUES
('RA-73025', 'Boeing 737-800', 168, (SELECT id FROM airports WHERE code = 'DXB'), 'Active', '/static/img/planes/b737.png'),
('N101NV', 'Airbus A320', 180, (SELECT id FROM airports WHERE code = 'SIN'), 'Active', '/static/img/planes/a320.png'),
('A6-EVK', 'Airbus A380', 515, (SELECT id FROM airports WHERE code = 'HND'), 'Active', '/static/img/planes/a380.png'),
('JA873A', 'Boeing 787 Dreamliner', 240, (SELECT id FROM airports WHERE code = 'JFK'), 'Active', '/static/img/planes/b787.png'),
('FP-001', 'Airbus A321neo', 220, (SELECT id FROM airports WHERE code = 'AMS'), 'Active', '/static/img/planes/a320.png'),
('FP-002', 'Boeing 737 MAX 8', 178, (SELECT id FROM airports WHERE code = 'FRA'), 'Active', '/static/img/planes/b737.png'),
('FP-003', 'Airbus A330-300', 295, (SELECT id FROM airports WHERE code = 'MAD'), 'Active', '/static/img/planes/a320.png'),
('FP-004', 'Boeing 777-300ER', 396, (SELECT id FROM airports WHERE code = 'FCO'), 'Active', '/static/img/planes/b787.png'),
('FP-005', 'Airbus A350-900', 325, (SELECT id FROM airports WHERE code = 'IST'), 'Active', '/static/img/planes/a320.png'),
('FP-006', 'Boeing 787-9', 290, (SELECT id FROM airports WHERE code = 'DOH'), 'Active', '/static/img/planes/b787.png'),
('FP-007', 'Airbus A220-300', 145, (SELECT id FROM airports WHERE code = 'SYD'), 'Active', '/static/img/planes/a320.png'),
('FP-008', 'Boeing 767-300ER', 261, (SELECT id FROM airports WHERE code = 'LAX'), 'Active', '/static/img/planes/b737.png'),
('FP-009', 'Embraer E195-E2', 132, (SELECT id FROM airports WHERE code = 'ORD'), 'Active', '/static/img/planes/a320.png'),
('FP-010', 'Airbus A319', 144, (SELECT id FROM airports WHERE code = 'YYZ'), 'Active', '/static/img/planes/a320.png'),
('FP-011', 'Boeing 757-200', 200, (SELECT id FROM airports WHERE code = 'GRU'), 'Active', '/static/img/planes/b737.png'),
('FP-012', 'Airbus A340-600', 380, (SELECT id FROM airports WHERE code = 'CPT'), 'Active', '/static/img/planes/a380.png'),
('FP-013', 'Boeing 747-8', 410, (SELECT id FROM airports WHERE code = 'ICN'), 'Active', '/static/img/planes/a380.png'),
('FP-014', 'Airbus A320neo', 186, (SELECT id FROM airports WHERE code = 'AMS'), 'Active', '/static/img/planes/a320.png'),
('FP-015', 'Boeing 737-900ER', 180, (SELECT id FROM airports WHERE code = 'FRA'), 'Active', '/static/img/planes/b737.png'),
('FP-016', 'Airbus A350-1000', 366, (SELECT id FROM airports WHERE code = 'MAD'), 'Active', '/static/img/planes/a320.png'),
('CR-PLN', 'Boeing 737-800', 168, NULL, 'Crashed', '/static/img/planes/b737.png');

-- =============================================
--               FLIGHT DATA
-- =============================================

INSERT INTO flights (flight_number, airplane_id, departure_airport_id, arrival_airport_id, departure_time, arrival_time, status)
VALUES (
    'SU-2130', 
    (SELECT id FROM airplanes WHERE tail_number = 'RA-73025'),
    (SELECT id FROM airports WHERE code = 'DXB'),
    (SELECT id FROM airports WHERE code = 'SVO'),
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
    'SU-502', 
    (SELECT id FROM airplanes WHERE tail_number = 'RA-73025'),
    (SELECT id FROM airports WHERE code = 'DXB'),
    (SELECT id FROM airports WHERE code = 'SVO'),
    NOW() - INTERVAL '1 hour',
    NOW() + INTERVAL '4 hours',
    'In Flight'
);

INSERT INTO flights (flight_number, airplane_id, departure_airport_id, arrival_airport_id, departure_time, arrival_time, status)
VALUES (
    'BA-007', 
    (SELECT id FROM airplanes WHERE tail_number = 'A6-EVK'),
    (SELECT id FROM airports WHERE code = 'HND'),
    (SELECT id FROM airports WHERE code = 'LHR'),
    NOW() - INTERVAL '3 hours',
    NOW() + INTERVAL '8 hours',
    'In Flight'
);

INSERT INTO flights (flight_number, airplane_id, departure_airport_id, arrival_airport_id, departure_time, arrival_time, status)
VALUES (
    'AF-1144', 
    (SELECT id FROM airplanes WHERE tail_number = 'N101NV'),
    (SELECT id FROM airports WHERE code = 'SIN'),
    (SELECT id FROM airports WHERE code = 'SVO'), 
    NOW() - INTERVAL '2 hours 15 minutes', 
    NOW() + INTERVAL '4 hours', 
    'In Flight'
);

INSERT INTO flights (flight_number, airplane_id, departure_airport_id, arrival_airport_id, departure_time, arrival_time, status)
VALUES
('LH-900', (SELECT id FROM airplanes WHERE tail_number = 'FP-001'), (SELECT id FROM airports WHERE code = 'AMS'), (SELECT id FROM airports WHERE code = 'FRA'), NOW() + INTERVAL '2 hours', NOW() + INTERVAL '4 hours', 'Scheduled'),
('IB-321', (SELECT id FROM airplanes WHERE tail_number = 'FP-003'), (SELECT id FROM airports WHERE code = 'MAD'), (SELECT id FROM airports WHERE code = 'FCO'), NOW() + INTERVAL '6 hours', NOW() + INTERVAL '8 hours', 'Scheduled'),
('QR-088', (SELECT id FROM airplanes WHERE tail_number = 'FP-006'), (SELECT id FROM airports WHERE code = 'DOH'), (SELECT id FROM airports WHERE code = 'SYD'), NOW() + INTERVAL '10 hours', NOW() + INTERVAL '20 hours', 'Scheduled'),
('AC-077', (SELECT id FROM airplanes WHERE tail_number = 'FP-010'), (SELECT id FROM airports WHERE code = 'YYZ'), (SELECT id FROM airports WHERE code = 'ORD'), NOW() + INTERVAL '12 hours', NOW() + INTERVAL '14 hours', 'Scheduled'),
('KE-055', (SELECT id FROM airplanes WHERE tail_number = 'FP-013'), (SELECT id FROM airports WHERE code = 'ICN'), (SELECT id FROM airports WHERE code = 'LAX'), NOW() + INTERVAL '16 hours', NOW() + INTERVAL '27 hours', 'Scheduled');

INSERT INTO flights (flight_number, airplane_id, departure_airport_id, arrival_airport_id, departure_time, arrival_time, status)
VALUES
('SU-500', (SELECT id FROM airplanes WHERE tail_number = 'RA-73025'), (SELECT id FROM airports WHERE code = 'DXB'), (SELECT id FROM airports WHERE code = 'LHR'), NOW() + INTERVAL '12 hours', NOW() + INTERVAL '17 hours', 'Scheduled'),
('SQ-21', (SELECT id FROM airplanes WHERE tail_number = 'N101NV'), (SELECT id FROM airports WHERE code = 'SIN'), (SELECT id FROM airports WHERE code = 'JFK'), NOW() + INTERVAL '1 day 2 hours', NOW() + INTERVAL '1 day 20 hours', 'Scheduled'),
('KL-120', (SELECT id FROM airplanes WHERE tail_number = 'FP-014'), (SELECT id FROM airports WHERE code = 'AMS'), (SELECT id FROM airports WHERE code = 'CDG'), NOW() + INTERVAL '4 hours', NOW() + INTERVAL '5 hours 30 minutes', 'Scheduled'),
('LH-430', (SELECT id FROM airplanes WHERE tail_number = 'FP-002'), (SELECT id FROM airports WHERE code = 'FRA'), (SELECT id FROM airports WHERE code = 'ORD'), NOW() + INTERVAL '8 hours', NOW() + INTERVAL '17 hours', 'Scheduled'),
('AZ-201', (SELECT id FROM airplanes WHERE tail_number = 'FP-004'), (SELECT id FROM airports WHERE code = 'FCO'), (SELECT id FROM airports WHERE code = 'IST'), NOW() + INTERVAL '3 hours', NOW() + INTERVAL '5 hours 30 minutes', 'Scheduled'),
('TK-192', (SELECT id FROM airplanes WHERE tail_number = 'FP-005'), (SELECT id FROM airports WHERE code = 'IST'), (SELECT id FROM airports WHERE code = 'DOH'), NOW() + INTERVAL '5 hours', NOW() + INTERVAL '9 hours', 'Scheduled'),
('QF-12', (SELECT id FROM airplanes WHERE tail_number = 'FP-007'), (SELECT id FROM airports WHERE code = 'SYD'), (SELECT id FROM airports WHERE code = 'SIN'), NOW() + INTERVAL '14 hours', NOW() + INTERVAL '22 hours', 'Scheduled'),
('AA-902', (SELECT id FROM airplanes WHERE tail_number = 'FP-008'), (SELECT id FROM airports WHERE code = 'LAX'), (SELECT id FROM airports WHERE code = 'JFK'), NOW() + INTERVAL '7 hours', NOW() + INTERVAL '13 hours', 'Scheduled'),
('UA-441', (SELECT id FROM airplanes WHERE tail_number = 'FP-009'), (SELECT id FROM airports WHERE code = 'ORD'), (SELECT id FROM airports WHERE code = 'YYZ'), NOW() + INTERVAL '2 hours', NOW() + INTERVAL '3 hours 45 minutes', 'Scheduled'),
('LA-801', (SELECT id FROM airplanes WHERE tail_number = 'FP-011'), (SELECT id FROM airports WHERE code = 'GRU'), (SELECT id FROM airports WHERE code = 'MAD'), NOW() + INTERVAL '23 hours', NOW() + INTERVAL '1 day 10 hours', 'Scheduled'),
('SA-320', (SELECT id FROM airplanes WHERE tail_number = 'FP-012'), (SELECT id FROM airports WHERE code = 'CPT'), (SELECT id FROM airports WHERE code = 'FRA'), NOW() + INTERVAL '11 hours', NOW() + INTERVAL '23 hours', 'Scheduled'),
('IB-610', (SELECT id FROM airplanes WHERE tail_number = 'FP-016'), (SELECT id FROM airports WHERE code = 'MAD'), (SELECT id FROM airports WHERE code = 'GRU'), NOW() + INTERVAL '9 hours', NOW() + INTERVAL '20 hours', 'Scheduled');

INSERT INTO flights (flight_number, airplane_id, departure_airport_id, arrival_airport_id, departure_time, arrival_time, status, crash_cause)
VALUES (
    'CR-404',
    (SELECT id FROM airplanes WHERE tail_number = 'CR-PLN'),
    (SELECT id FROM airports WHERE code = 'AMS'),
    (SELECT id FROM airports WHERE code = 'FRA'),
    NOW() - INTERVAL '12 days 5 hours',
    NOW() - INTERVAL '12 days 3 hours',
    'Crashed',
    'Severe engine failure caused by undetected maintenance damage.'
);

-- =============================================
--               PASSENGER DATA
-- =============================================

INSERT INTO passengers (first_name, last_name, passport_number, current_airport_id, status, image_path) VALUES
('Александр', 'Кузнецов', '45 12 889900', (SELECT id FROM airports WHERE code = 'SVO'), 'Alive', '/static/img/passengers/placeholder.png'),
('Ольга', 'Попова', '46 15 112233', (SELECT id FROM airports WHERE code = 'SVO'), 'Alive', '/static/img/passengers/placeholder.png'),
('Игорь', 'Макаров', '45 20 556677', (SELECT id FROM airports WHERE code = 'SVO'), 'Alive', '/static/img/passengers/placeholder.png'),
('Елена', 'Ветрова', '45 18 993311', (SELECT id FROM airports WHERE code = 'SVO'), 'Alive', '/static/img/passengers/placeholder.png'),
('Пьер', 'Мартен', '77 14 992123', (SELECT id FROM airports WHERE code = 'SIN'), 'Alive', '/static/img/passengers/placeholder.png'),
('Анна', 'Мюллер', '10 44 771122', (SELECT id FROM airports WHERE code = 'SIN'), 'Alive', '/static/img/passengers/placeholder.png'),
('Джон', 'Доу', '32 18 445566', (SELECT id FROM airports WHERE code = 'JFK'), 'Alive', '/static/img/passengers/placeholder.png'),
('Джейн', 'Смит', '54 21 998877', (SELECT id FROM airports WHERE code = 'JFK'), 'Alive', '/static/img/passengers/placeholder.png'),
('Дэвид', 'Ким', '82 03 112233', (SELECT id FROM airports WHERE code = 'HND'), 'Alive', '/static/img/passengers/placeholder.png'),
('Фатима', 'Аль-Мансури', '12 99 554433', (SELECT id FROM airports WHERE code = 'DXB'), 'Alive', '/static/img/passengers/placeholder.png'),
('Марк', 'Стоун', '22 15 400101', NULL, 'Dead', '/static/img/passengers/placeholder.png'),
('Лаура', 'Хилл', '39 11 400102', NULL, 'Alive', '/static/img/passengers/placeholder.png'),
('Ной', 'Рид', '14 88 400103', NULL, 'Dead', '/static/img/passengers/placeholder.png');

INSERT INTO passengers (first_name, last_name, passport_number, current_airport_id, status, image_path) VALUES
('Дмитрий', 'Иванов', '45 14 101001', (SELECT id FROM airports WHERE code = 'SVO'), 'Alive', '/static/img/passengers/placeholder.png'),
('Максим', 'Петров', '45 15 101002', (SELECT id FROM airports WHERE code = 'SVO'), 'Alive', '/static/img/passengers/placeholder.png'),
('Иван', 'Смирнов', '46 12 101003', (SELECT id FROM airports WHERE code = 'JFK'), 'Alive', '/static/img/passengers/placeholder.png'),
('Михаил', 'Сергеев', '46 16 101004', (SELECT id FROM airports WHERE code = 'JFK'), 'Alive', '/static/img/passengers/placeholder.png'),
('Андрей', 'Волков', '45 01 101005', (SELECT id FROM airports WHERE code = 'LHR'), 'Alive', '/static/img/passengers/placeholder.png'),
('Сергей', 'Кузнецов', '45 08 101006', (SELECT id FROM airports WHERE code = 'DXB'), 'Alive', '/static/img/passengers/placeholder.png'),
('Николай', 'Попов', '46 11 101007', (SELECT id FROM airports WHERE code = 'HND'), 'Alive', '/static/img/passengers/placeholder.png'),
('Джеймс', 'Смит', '24 15 101008', (SELECT id FROM airports WHERE code = 'CDG'), 'Alive', '/static/img/passengers/placeholder.png'),
('Роберт', 'Джонсон', '34 19 101009', (SELECT id FROM airports WHERE code = 'SIN'), 'Alive', '/static/img/passengers/placeholder.png'),
('Уильям', 'Браун', '52 11 101010', (SELECT id FROM airports WHERE code = 'AMS'), 'Alive', '/static/img/passengers/placeholder.png'),
('Томас', 'Миллер', '61 03 101011', (SELECT id FROM airports WHERE code = 'FRA'), 'Alive', '/static/img/passengers/placeholder.png'),
('Вольфганг', 'Шмидт', '44 19 101012', (SELECT id FROM airports WHERE code = 'MAD'), 'Alive', '/static/img/passengers/placeholder.png'),
('Жан', 'Дюбуа', '18 22 101013', (SELECT id FROM airports WHERE code = 'FCO'), 'Alive', '/static/img/passengers/placeholder.png'),
('Сато', 'Танака', '91 04 101014', (SELECT id FROM airports WHERE code = 'IST'), 'Alive', '/static/img/passengers/placeholder.png'),
('Али', 'Хан', '73 05 101015', (SELECT id FROM airports WHERE code = 'DOH'), 'Alive', '/static/img/passengers/placeholder.png'),
('Ахмед', 'Аль-Фарси', '66 12 101016', (SELECT id FROM airports WHERE code = 'SYD'), 'Alive', '/static/img/passengers/placeholder.png'),
('Артем', 'Тейлор', '45 19 101017', (SELECT id FROM airports WHERE code = 'LAX'), 'Alive', '/static/img/passengers/placeholder.png'),
('Юссеф', 'Эль-Амин', '81 07 101018', (SELECT id FROM airports WHERE code = 'ORD'), 'Alive', '/static/img/passengers/placeholder.png'),
('Филипп', 'Лоран', '29 11 101019', (SELECT id FROM airports WHERE code = 'YYZ'), 'Alive', '/static/img/passengers/placeholder.png'),
('Стефан', 'Вебер', '38 06 101020', (SELECT id FROM airports WHERE code = 'GRU'), 'Alive', '/static/img/passengers/placeholder.png');

DO $$
DECLARE
    male_first TEXT[] := ARRAY['Александр', 'Савва', 'Грег', 'Дмитрий', 'Сергей', 'Джастин', 'Джек', 'Майкл', 'Гейб', 'Уильям', 'Марат', 'Годжо', 'Асаку', 'Мигуэль', 'Сальвадор'];
    male_last TEXT[] := ARRAY['Смит', 'Шнайдер', 'Линдеманн', 'Лоренц', 'Ридель', 'Круспе', 'Ландерс', 'Лин', 'Ньюэлл', 'Хинато', 'Сатору', 'Обама', 'Козлов', 'Тихонов', 'Киято'];
    
    female_first TEXT[] := ARRAY['Елена', 'София', 'Анна', 'Мария', 'Мэри', 'Лиса', 'Сакура', 'Нобара', 'Мэй', 'Изабелла', 'Кассандра', 'Дороти', 'Виктория', 'Лампа', 'Славя'];
    female_last TEXT[] := ARRAY['Смит', 'Шнайдер', 'Линдеманн', 'Лоренц', 'Ридель', 'Круспе', 'Ландерс', 'Лин', 'Ньюэлл', 'Хинато', 'Сатору', 'Обама', 'Козлова', 'Тихонова', 'Киято'];
    
    final_first TEXT;
    final_last TEXT;
    passport_str TEXT;
BEGIN
    FOR i IN 1..250 LOOP
        IF RANDOM() > 0.5 THEN
            final_first := male_first[1 + floor(RANDOM() * array_length(male_first, 1))];
            final_last := male_last[1 + floor(RANDOM() * array_length(male_last, 1))];
        ELSE
            final_first := female_first[1 + floor(RANDOM() * array_length(female_first, 1))];
            final_last := female_last[1 + floor(RANDOM() * array_length(female_last, 1))];
        END IF;

        passport_str := LPAD(floor(RANDOM() * 90 + 10)::text, 2, '0') || ' ' || 
                        LPAD(floor(RANDOM() * 90 + 10)::text, 2, '0') || ' ' || 
                        LPAD(floor(RANDOM() * 900000 + 100000)::text, 6, '0');

        INSERT INTO passengers (first_name, last_name, passport_number, current_airport_id, status, image_path)
        VALUES (
            final_first,
            final_last,
            passport_str,
            (SELECT id FROM airports ORDER BY RANDOM() LIMIT 1),
            'Alive',
            '/static/img/passengers/placeholder.png'
        );
    END LOOP;
END $$;

-- =============================================
--               CREW DATA
-- =============================================

INSERT INTO employees (first_name, last_name, role, employee_number, current_airport_id, status, image_path) VALUES
('Жан', 'Дюпон', 'Pilot', 'CTR-001001', (SELECT id FROM airports WHERE code = 'SIN'), 'Alive', '/static/img/crew/placeholder.png'),
('Мишель', 'Бернар', 'Co-Pilot', 'CTR-001002', (SELECT id FROM airports WHERE code = 'SIN'), 'Alive', '/static/img/crew/placeholder.png'),
('Хлоя', 'Дюбуа', 'Flight Attendant', 'CTR-002001', (SELECT id FROM airports WHERE code = 'SIN'), 'Alive', '/static/img/crew/placeholder.png'),
('Люка', 'Бертран', 'Flight Attendant', 'CTR-002002', (SELECT id FROM airports WHERE code = 'CDG'), 'Alive', '/static/img/crew/placeholder.png'),
('Эмма', 'Леруа', 'Flight Attendant', 'CTR-002003', (SELECT id FROM airports WHERE code = 'CDG'), 'Alive', '/static/img/crew/placeholder.png'),
('Алексей', 'Иванов', 'Pilot', 'CTR-001003', (SELECT id FROM airports WHERE code = 'SVO'), 'Alive', '/static/img/crew/placeholder.png'),
('Дмитрий', 'Петров', 'Co-Pilot', 'CTR-001004', (SELECT id FROM airports WHERE code = 'SVO'), 'Alive', '/static/img/crew/placeholder.png'),
('Мария', 'Смирнова', 'Flight Attendant', 'CTR-002004', (SELECT id FROM airports WHERE code = 'SVO'), 'Alive', '/static/img/crew/placeholder.png'),
('Наталья', 'Соколова', 'Flight Attendant', 'CTR-002005', (SELECT id FROM airports WHERE code = 'SVO'), 'Alive', '/static/img/crew/placeholder.png'),
('Джон', 'Уокер', 'Pilot', 'CTR-001005', (SELECT id FROM airports WHERE code = 'JFK'), 'Alive', '/static/img/crew/placeholder.png'),
('Уильям', 'Дэвис', 'Co-Pilot', 'CTR-001006', (SELECT id FROM airports WHERE code = 'JFK'), 'Alive', '/static/img/crew/placeholder.png'),
('Юки', 'Танака', 'Flight Attendant', 'CTR-002006', (SELECT id FROM airports WHERE code = 'HND'), 'Alive', '/static/img/crew/placeholder.png'),
('Аиша', 'Хан', 'Flight Attendant', 'CTR-002007', (SELECT id FROM airports WHERE code = 'HND'), 'Alive', '/static/img/crew/placeholder.png'),
('Виктор', 'Хейз', 'Pilot', 'CTR-004001', NULL, 'Dead', '/static/img/crew/placeholder.png'),
('Мия', 'Коул', 'Co-Pilot', 'CTR-004002', NULL, 'Alive', '/static/img/crew/placeholder.png'),
('Сара', 'Уэллс', 'Flight Attendant', 'CTR-004003', NULL, 'Dead', '/static/img/crew/placeholder.png');

INSERT INTO employees (first_name, last_name, role, employee_number, current_airport_id, status, image_path) VALUES
('Оливер', 'Морозов', 'Pilot', 'CTR-005001', (SELECT id FROM airports WHERE code = 'LHR'), 'Alive', '/static/img/crew/placeholder.png'),
('Гарри', 'Новиков', 'Co-Pilot', 'CTR-005002', (SELECT id FROM airports WHERE code = 'LHR'), 'Alive', '/static/img/crew/placeholder.png'),
('Джордж', 'Федоров', 'Flight Attendant', 'CTR-005003', (SELECT id FROM airports WHERE code = 'LHR'), 'Alive', '/static/img/crew/placeholder.png'),
('Ной', 'Григорьев', 'Pilot', 'CTR-005004', (SELECT id FROM airports WHERE code = 'DXB'), 'Alive', '/static/img/crew/placeholder.png'),
('Джек', 'Васильев', 'Co-Pilot', 'CTR-005005', (SELECT id FROM airports WHERE code = 'DXB'), 'Alive', '/static/img/crew/placeholder.png'),
('Амелия', 'Уайт', 'Flight Attendant', 'CTR-005006', (SELECT id FROM airports WHERE code = 'DXB'), 'Alive', '/static/img/crew/placeholder.png'),
('Оливия', 'Харрис', 'Pilot', 'CTR-005007', (SELECT id FROM airports WHERE code = 'AMS'), 'Alive', '/static/img/crew/placeholder.png'),
('Ава', 'Мартин', 'Co-Pilot', 'CTR-005008', (SELECT id FROM airports WHERE code = 'AMS'), 'Alive', '/static/img/crew/placeholder.png'),
('София', 'Кларк', 'Flight Attendant', 'CTR-005009', (SELECT id FROM airports WHERE code = 'AMS'), 'Alive', '/static/img/crew/placeholder.png');

DO $$
DECLARE
    male_first TEXT[] := ARRAY['Александр', 'Савва', 'Грег', 'Дмитрий', 'Сергей', 'Джастин', 'Джек', 'Майкл', 'Гейб', 'Уильям', 'Марат', 'Годжо', 'Асаку', 'Мигуэль', 'Сальвадор'];
    male_last TEXT[] := ARRAY['Смит', 'Шнайдер', 'Линдеманн', 'Лоренц', 'Ридель', 'Круспе', 'Ландерс', 'Лин', 'Ньюэлл', 'Хинато', 'Сатору', 'Обама', 'Козлов', 'Тихонов', 'Киято'];
    
    female_first TEXT[] := ARRAY['Елена', 'София', 'Анна', 'Мария', 'Мэри', 'Лиса', 'Сакура', 'Нобара', 'Мэй', 'Изабелла', 'Кассандра', 'Дороти', 'Виктория', 'Лампа', 'Славя'];
    female_last TEXT[] := ARRAY['Смит', 'Шнайдер', 'Линдеманн', 'Лоренц', 'Ридель', 'Круспе', 'Ландерс', 'Лин', 'Ньюэлл', 'Хинато', 'Сатору', 'Обама', 'Козлова', 'Тихонова', 'Киято'];
    
    final_first TEXT;
    final_last TEXT;
    contract_str TEXT;
BEGIN
    FOR i IN 1..40 LOOP
        IF RANDOM() > 0.5 THEN
            final_first := male_first[1 + floor(RANDOM() * array_length(male_first, 1))];
            final_last := male_last[1 + floor(RANDOM() * array_length(male_last, 1))];
        ELSE
            final_first := female_first[1 + floor(RANDOM() * array_length(female_first, 1))];
            final_last := female_last[1 + floor(RANDOM() * array_length(female_last, 1))];
        END IF;

        contract_str := 'CTR-' || LPAD((6000 + i)::text, 6, '0');

        INSERT INTO employees (first_name, last_name, role, employee_number, current_airport_id, status, image_path)
        VALUES (
            final_first,
            final_last,
            CASE WHEN i % 3 = 0 THEN 'Pilot' WHEN i % 3 = 1 THEN 'Co-Pilot' ELSE 'Flight Attendant' END,
            contract_str,
            (SELECT id FROM airports ORDER BY RANDOM() LIMIT 1),
            'Alive',
            '/static/img/crew/placeholder.png'
        );
    END LOOP;
END $$;

-- =============================================
--         PASSENGER FLIGHT ASSIGNMENT
-- =============================================

INSERT INTO flight_passengers (flight_id, passenger_id)
VALUES 
((SELECT id FROM flights WHERE flight_number = 'AF-1144'), (SELECT id FROM passengers WHERE passport_number = '77 14 992123')),
((SELECT id FROM flights WHERE flight_number = 'AF-1144'), (SELECT id FROM passengers WHERE passport_number = '10 44 771122')),
((SELECT id FROM flights WHERE flight_number = 'SQ-21'), (SELECT id FROM passengers WHERE passport_number = '77 14 992123')),
((SELECT id FROM flights WHERE flight_number = 'SQ-21'), (SELECT id FROM passengers WHERE passport_number = '10 44 771122')),
((SELECT id FROM flights WHERE flight_number = 'AA-100'), (SELECT id FROM passengers WHERE passport_number = '32 18 445566')),
((SELECT id FROM flights WHERE flight_number = 'AA-100'), (SELECT id FROM passengers WHERE passport_number = '54 21 998877')),
((SELECT id FROM flights WHERE flight_number = 'SU-502'), (SELECT id FROM passengers WHERE passport_number = '45 12 889900')),
((SELECT id FROM flights WHERE flight_number = 'SU-502'), (SELECT id FROM passengers WHERE passport_number = '46 15 112233')),
((SELECT id FROM flights WHERE flight_number = 'SU-500'), (SELECT id FROM passengers WHERE passport_number = '12 99 554433')),
((SELECT id FROM flights WHERE flight_number = 'BA-007'), (SELECT id FROM passengers WHERE passport_number = '82 03 112233')),
((SELECT id FROM flights WHERE flight_number = 'CR-404'), (SELECT id FROM passengers WHERE passport_number = '22 15 400101')),
((SELECT id FROM flights WHERE flight_number = 'CR-404'), (SELECT id FROM passengers WHERE passport_number = '39 11 400102')),
((SELECT id FROM flights WHERE flight_number = 'CR-404'), (SELECT id FROM passengers WHERE passport_number = '14 88 400103'));

INSERT INTO flight_passengers (flight_id, passenger_id) VALUES
((SELECT id FROM flights WHERE flight_number = 'LH-900'), (SELECT id FROM passengers WHERE passport_number = '52 11 101010')),
((SELECT id FROM flights WHERE flight_number = 'LH-900'), (SELECT id FROM passengers WHERE passport_number = '61 03 101011')),
((SELECT id FROM flights WHERE flight_number = 'IB-321'), (SELECT id FROM passengers WHERE passport_number = '44 19 101012')),
((SELECT id FROM flights WHERE flight_number = 'IB-321'), (SELECT id FROM passengers WHERE passport_number = '18 22 101013')),
((SELECT id FROM flights WHERE flight_number = 'QR-088'), (SELECT id FROM passengers WHERE passport_number = '73 05 101015')),
((SELECT id FROM flights WHERE flight_number = 'QR-088'), (SELECT id FROM passengers WHERE passport_number = '66 12 101016')),
((SELECT id FROM flights WHERE flight_number = 'SU-2130'), (SELECT id FROM passengers WHERE passport_number = '45 08 101006')),
((SELECT id FROM flights WHERE flight_number = 'EK-312'), (SELECT id FROM passengers WHERE passport_number = '46 11 101007'));

DO $$
DECLARE
    f_rec RECORD;
    p_id INT;
    counter INT;
BEGIN
    FOR f_rec IN SELECT id FROM flights LOOP
        counter := 0;
        FOR p_id IN 
            SELECT id FROM passengers 
            WHERE id NOT IN (SELECT passenger_id FROM flight_passengers WHERE flight_id = f_rec.id)
            ORDER BY RANDOM() 
            LIMIT 15
        LOOP
            INSERT INTO flight_passengers (flight_id, passenger_id) 
            VALUES (f_rec.id, p_id)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- =============================================
--           CREW FLIGHT ASSIGNMENT
-- =============================================

INSERT INTO flight_crew (flight_id, employee_id)
VALUES
((SELECT id FROM flights WHERE flight_number = 'SU-502'), (SELECT id FROM employees WHERE employee_number = 'CTR-001003')),
((SELECT id FROM flights WHERE flight_number = 'SU-502'), (SELECT id FROM employees WHERE employee_number = 'CTR-001004')),
((SELECT id FROM flights WHERE flight_number = 'SU-502'), (SELECT id FROM employees WHERE employee_number = 'CTR-002004')),
((SELECT id FROM flights WHERE flight_number = 'SU-502'), (SELECT id FROM employees WHERE employee_number = 'CTR-002005')),

((SELECT id FROM flights WHERE flight_number = 'SU-500'), (SELECT id FROM employees WHERE employee_number = 'CTR-001003')),
((SELECT id FROM flights WHERE flight_number = 'SU-500'), (SELECT id FROM employees WHERE employee_number = 'CTR-001004')),
((SELECT id FROM flights WHERE flight_number = 'SU-500'), (SELECT id FROM employees WHERE employee_number = 'CTR-002004')),
((SELECT id FROM flights WHERE flight_number = 'SU-500'), (SELECT id FROM employees WHERE employee_number = 'CTR-002005')),

((SELECT id FROM flights WHERE flight_number = 'AF-1144'), (SELECT id FROM employees WHERE employee_number = 'CTR-001001')),
((SELECT id FROM flights WHERE flight_number = 'AF-1144'), (SELECT id FROM employees WHERE employee_number = 'CTR-001002')),
((SELECT id FROM flights WHERE flight_number = 'AF-1144'), (SELECT id FROM employees WHERE employee_number = 'CTR-002001')),

((SELECT id FROM flights WHERE flight_number = 'SQ-21'), (SELECT id FROM employees WHERE employee_number = 'CTR-001001')),
((SELECT id FROM flights WHERE flight_number = 'SQ-21'), (SELECT id FROM employees WHERE employee_number = 'CTR-001002')),
((SELECT id FROM flights WHERE flight_number = 'SQ-21'), (SELECT id FROM employees WHERE employee_number = 'CTR-002001')),

((SELECT id FROM flights WHERE flight_number = 'AA-100'), (SELECT id FROM employees WHERE employee_number = 'CTR-001005')),
((SELECT id FROM flights WHERE flight_number = 'AA-100'), (SELECT id FROM employees WHERE employee_number = 'CTR-001006')),

((SELECT id FROM flights WHERE flight_number = 'BA-007'), (SELECT id FROM employees WHERE employee_number = 'CTR-002006')),
((SELECT id FROM flights WHERE flight_number = 'BA-007'), (SELECT id FROM employees WHERE employee_number = 'CTR-002007')),

((SELECT id FROM flights WHERE flight_number = 'CR-404'), (SELECT id FROM employees WHERE employee_number = 'CTR-004001')),
((SELECT id FROM flights WHERE flight_number = 'CR-404'), (SELECT id FROM employees WHERE employee_number = 'CTR-004002')),
((SELECT id FROM flights WHERE flight_number = 'CR-404'), (SELECT id FROM employees WHERE employee_number = 'CTR-004003'));

INSERT INTO flight_crew (flight_id, employee_id) VALUES
((SELECT id FROM flights WHERE flight_number = 'LH-900'), (SELECT id FROM employees WHERE employee_number = 'CTR-005007')),
((SELECT id FROM flights WHERE flight_number = 'LH-900'), (SELECT id FROM employees WHERE employee_number = 'CTR-005008')),
((SELECT id FROM flights WHERE flight_number = 'LH-900'), (SELECT id FROM employees WHERE employee_number = 'CTR-005009'));

DO $$
DECLARE
    f_rec RECORD;
    emp_p INT;
    emp_cp INT;
    emp_fa INT;
BEGIN
    FOR f_rec IN SELECT id FROM flights WHERE flight_number NOT IN ('SU-502', 'SU-500', 'AF-1144', 'SQ-21', 'AA-100', 'BA-007', 'CR-404', 'LH-900') LOOP
        
        SELECT id INTO emp_p FROM employees WHERE role = 'Pilot' AND status = 'Alive' ORDER BY RANDOM() LIMIT 1;
        IF emp_p IS NOT NULL THEN
            INSERT INTO flight_crew (flight_id, employee_id) VALUES (f_rec.id, emp_p) ON CONFLICT DO NOTHING;
        END IF;

        SELECT id INTO emp_cp FROM employees WHERE role = 'Co-Pilot' AND status = 'Alive' ORDER BY RANDOM() LIMIT 1;
        IF emp_cp IS NOT NULL THEN
            INSERT INTO flight_crew (flight_id, employee_id) VALUES (f_rec.id, emp_cp) ON CONFLICT DO NOTHING;
        END IF;

        FOR emp_fa IN SELECT id FROM employees WHERE role = 'Flight Attendant' AND status = 'Alive' ORDER BY RANDOM() LIMIT 2 LOOP
            INSERT INTO flight_crew (flight_id, employee_id) VALUES (f_rec.id, emp_fa) ON CONFLICT DO NOTHING;
        END LOOP;

    END LOOP;
END $$;

COMMIT;
END;