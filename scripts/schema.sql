DO $$ BEGIN
  CREATE TYPE disability_enum AS ENUM ('blind', 'wheelchair', 'deaf', 'elderly', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE visit_reason_enum AS ENUM ('review', 'appointment', 'medication');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE task_status_enum AS ENUM ('new', 'accepted', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  photo_path TEXT,
  disability_type disability_enum NOT NULL,
  disability_note TEXT,
  fcm_token TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  nationality VARCHAR(20) NOT NULL CHECK (nationality IN ('jordanian', 'non_jordanian')),
  national_id VARCHAR(20) NOT NULL UNIQUE,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
  birth_date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  department VARCHAR(50),
  fcm_token TEXT,
  is_available BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS visits (
  id SERIAL PRIMARY KEY,
  patient_id INT NOT NULL REFERENCES patients(id),
  reason visit_reason_enum NOT NULL DEFAULT 'review',
  arrived_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  visit_id INT NOT NULL REFERENCES visits(id),
  staff_id INT REFERENCES staff(id),
  status task_status_enum DEFAULT 'new',
  created_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  completed_at TIMESTAMP
);