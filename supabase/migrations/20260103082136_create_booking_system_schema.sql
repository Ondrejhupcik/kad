/*
  # Multi-tenant Booking System Schema
  
  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `slug` (text, unique) - URL-friendly identifier for public booking page
      - `name` (text) - Hairdresser's full name
      - `email` (text) - Contact email
      - `phone` (text) - Contact phone number
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `services`
      - `id` (uuid, primary key)
      - `profile_id` (uuid, references profiles)
      - `name` (text) - Service name (e.g., "Dámsky strih")
      - `duration_minutes` (integer) - Duration in minutes
      - `price` (numeric) - Price in EUR
      - `is_active` (boolean) - Whether service is currently offered
      - `created_at` (timestamptz)
    
    - `availability`
      - `id` (uuid, primary key)
      - `profile_id` (uuid, references profiles)
      - `day_of_week` (integer) - 0=Sunday, 1=Monday, etc.
      - `start_time` (time) - Opening time
      - `end_time` (time) - Closing time
      - `created_at` (timestamptz)
    
    - `bookings`
      - `id` (uuid, primary key)
      - `profile_id` (uuid, references profiles)
      - `service_id` (uuid, references services)
      - `client_name` (text) - Customer's full name
      - `client_phone` (text) - Customer's phone number
      - `client_email` (text) - Customer's email (optional)
      - `start_time` (timestamptz) - Booking start time
      - `end_time` (timestamptz) - Booking end time
      - `status` (text) - 'pending', 'confirmed', 'cancelled', 'completed'
      - `notes` (text) - Optional notes
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Profiles: Users can read all profiles (for public booking pages), but only update their own
    - Services: Public can read active services, owners can manage their own
    - Availability: Public can read, owners can manage their own
    - Bookings: Owners can manage their own, public can create new bookings
  
  3. Indexes
    - profiles(slug) for fast public page lookups
    - services(profile_id) for filtering by hairdresser
    - availability(profile_id, day_of_week) for schedule lookups
    - bookings(profile_id, start_time) for conflict checking
    - bookings(status) for filtering
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  price numeric(10, 2) NOT NULL CHECK (price >= 0),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create availability table
CREATE TABLE IF NOT EXISTS availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  client_name text NOT NULL,
  client_phone text NOT NULL,
  client_email text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_booking_time CHECK (end_time > start_time)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON profiles(slug);
CREATE INDEX IF NOT EXISTS idx_services_profile_id ON services(profile_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(profile_id, is_active);
CREATE INDEX IF NOT EXISTS idx_availability_profile ON availability(profile_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_bookings_profile ON bookings(profile_id);
CREATE INDEX IF NOT EXISTS idx_bookings_time ON bookings(profile_id, start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for services
CREATE POLICY "Active services viewable by everyone"
  ON services FOR SELECT
  TO authenticated, anon
  USING (is_active = true OR profile_id = auth.uid());

CREATE POLICY "Users can manage own services"
  ON services FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own services"
  ON services FOR UPDATE
  TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete own services"
  ON services FOR DELETE
  TO authenticated
  USING (auth.uid() = profile_id);

-- RLS Policies for availability
CREATE POLICY "Availability viewable by everyone"
  ON availability FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can manage own availability"
  ON availability FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own availability"
  ON availability FOR UPDATE
  TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete own availability"
  ON availability FOR DELETE
  TO authenticated
  USING (auth.uid() = profile_id);

-- RLS Policies for bookings
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = profile_id);

CREATE POLICY "Anyone can create bookings"
  ON bookings FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete own bookings"
  ON bookings FOR DELETE
  TO authenticated
  USING (auth.uid() = profile_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();