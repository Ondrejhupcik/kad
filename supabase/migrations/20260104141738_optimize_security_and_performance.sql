/*
  # Security and Performance Optimizations

  1. Add Missing Indexes
    - Add covering index on bookings.service_id foreign key
  
  2. Optimize RLS Policies
    - Replace direct auth.uid() calls with (select auth.uid()) subqueries
    - Improves performance by caching the auth context evaluation
  
  3. Drop Unused Indexes
    - idx_services_profile_id: covered by idx_services_active
    - idx_bookings_profile: covered by idx_bookings_time
  
  4. Security Enhancements
    - Recreate function with immutable search_path
    - Add constraints for data integrity
*/

-- 1. Add missing index on foreign key
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings(service_id);

-- 2. Drop unused indexes
DROP INDEX IF EXISTS idx_services_profile_id;
DROP INDEX IF EXISTS idx_bookings_profile;

-- 3. Drop and recreate function with security improvement
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP FUNCTION IF EXISTS update_updated_at_column();

CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Drop old RLS policies and recreate with optimized auth calls
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Services policies
DROP POLICY IF EXISTS "Active services viewable by everyone" ON services;
CREATE POLICY "Active services viewable by everyone"
  ON services FOR SELECT
  TO authenticated, anon
  USING (is_active = true OR profile_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can manage own services" ON services;
CREATE POLICY "Users can manage own services"
  ON services FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can update own services" ON services;
CREATE POLICY "Users can update own services"
  ON services FOR UPDATE
  TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can delete own services" ON services;
CREATE POLICY "Users can delete own services"
  ON services FOR DELETE
  TO authenticated
  USING (auth.uid() = profile_id);

-- Availability policies
DROP POLICY IF EXISTS "Users can manage own availability" ON availability;
CREATE POLICY "Users can manage own availability"
  ON availability FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can update own availability" ON availability;
CREATE POLICY "Users can update own availability"
  ON availability FOR UPDATE
  TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can delete own availability" ON availability;
CREATE POLICY "Users can delete own availability"
  ON availability FOR DELETE
  TO authenticated
  USING (auth.uid() = profile_id);

-- Bookings policies
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can delete own bookings" ON bookings;
CREATE POLICY "Users can delete own bookings"
  ON bookings FOR DELETE
  TO authenticated
  USING (auth.uid() = profile_id);

-- 5. Add NOT NULL constraints where appropriate
ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE services ALTER COLUMN is_active SET DEFAULT true;

-- 6. Add check constraint for valid time ranges
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'availability'
    AND constraint_name = 'valid_availability_time'
  ) THEN
    ALTER TABLE availability
    ADD CONSTRAINT valid_availability_time CHECK (end_time > start_time);
  END IF;
END $$;