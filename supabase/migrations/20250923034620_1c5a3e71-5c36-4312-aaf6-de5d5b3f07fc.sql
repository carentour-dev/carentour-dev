-- Create trip_plans table for storing user trip planning data
CREATE TABLE public.trip_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  treatment_type TEXT NOT NULL,
  preferred_travel_dates JSONB, -- {start_date: "YYYY-MM-DD", end_date: "YYYY-MM-DD", flexible: boolean}
  companion_count INTEGER DEFAULT 0,
  accommodation_preferences JSONB, -- {hotel_type: string, proximity_to_hospital: boolean, special_requirements: string[]}
  budget_range JSONB, -- {min: number, max: number, currency: string}
  special_requirements TEXT[],
  cultural_interests TEXT[],
  travel_insurance_needed BOOLEAN DEFAULT false,
  visa_assistance_needed BOOLEAN DEFAULT false,
  transportation_preferences JSONB, -- {airport_transfer: boolean, daily_transport: boolean, sightseeing: boolean}
  recovery_timeline INTEGER, -- Expected recovery days
  current_step INTEGER DEFAULT 1, -- Current step in the planning process
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_review', 'approved', 'completed')),
  total_estimated_cost DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.trip_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for trip_plans
CREATE POLICY "Users can view their own trip plans" 
ON public.trip_plans 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trip plans" 
ON public.trip_plans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trip plans" 
ON public.trip_plans 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trip plans" 
ON public.trip_plans 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trip_plan_accommodations table for accommodation options
CREATE TABLE public.trip_plan_accommodations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('hotel', 'apartment', 'medical_hotel', 'resort')),
  star_rating INTEGER CHECK (star_rating >= 1 AND star_rating <= 5),
  price_per_night DECIMAL(8,2) NOT NULL,
  distance_to_hospital_km DECIMAL(4,2),
  amenities TEXT[],
  images JSONB,
  location JSONB, -- {address: string, coordinates: {lat: number, lng: number}}
  special_medical_features TEXT[],
  available_from DATE,
  available_to DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on accommodations (read-only for all authenticated users)
ALTER TABLE public.trip_plan_accommodations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accommodations are viewable by authenticated users" 
ON public.trip_plan_accommodations 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create trip_plan_bookings table for confirmed bookings
CREATE TABLE public.trip_plan_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_plan_id UUID NOT NULL REFERENCES public.trip_plans(id) ON DELETE CASCADE,
  accommodation_id UUID REFERENCES public.trip_plan_accommodations(id),
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  guest_count INTEGER NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  booking_status TEXT DEFAULT 'pending' CHECK (booking_status IN ('pending', 'confirmed', 'cancelled')),
  booking_reference TEXT UNIQUE,
  special_requests TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on bookings
ALTER TABLE public.trip_plan_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookings" 
ON public.trip_plan_bookings 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.trip_plans 
  WHERE trip_plans.id = trip_plan_bookings.trip_plan_id 
  AND trip_plans.user_id = auth.uid()
));

CREATE POLICY "Users can create bookings for their trip plans" 
ON public.trip_plan_bookings 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.trip_plans 
  WHERE trip_plans.id = trip_plan_bookings.trip_plan_id 
  AND trip_plans.user_id = auth.uid()
));

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_trip_plans_updated_at
BEFORE UPDATE ON public.trip_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trip_plan_bookings_updated_at
BEFORE UPDATE ON public.trip_plan_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample accommodation data
INSERT INTO public.trip_plan_accommodations (name, type, star_rating, price_per_night, distance_to_hospital_km, amenities, location, special_medical_features) VALUES
('Cairo Medical Hotel', 'medical_hotel', 4, 85.00, 0.5, 
 ARRAY['Free WiFi', 'Room Service', 'Medical Equipment Storage', 'Nurse Call System'], 
 '{"address": "Downtown Cairo, near Cairo Medical Center", "coordinates": {"lat": 30.0444, "lng": 31.2357}}',
 ARRAY['Post-surgery care rooms', 'Medical equipment storage', 'Dietary meal plans']),
 
('Nile View Resort', 'resort', 5, 150.00, 2.5,
 ARRAY['Pool', 'Spa', 'Restaurant', 'Free WiFi', 'Gym'],
 '{"address": "Nile Corniche, Cairo", "coordinates": {"lat": 30.0561, "lng": 31.2394}}',
 ARRAY['Recovery wellness programs', 'Physical therapy facilities']),
 
('Downtown Medical Apartment', 'apartment', 3, 60.00, 1.0,
 ARRAY['Kitchenette', 'Free WiFi', 'Laundry', 'Balcony'],
 '{"address": "Medical District, Cairo", "coordinates": {"lat": 30.0626, "lng": 31.2497}}',
 ARRAY['Home-like recovery environment', 'Medication refrigeration']),
 
('Alexandria Premier Hotel', 'hotel', 4, 95.00, 0.8,
 ARRAY['Restaurant', 'Free WiFi', 'Concierge', 'Airport Shuttle'],
 '{"address": "Alexandria Medical Quarter", "coordinates": {"lat": 31.2001, "lng": 29.9187}}',
 ARRAY['Medical consultation rooms', 'Recovery-friendly rooms']);