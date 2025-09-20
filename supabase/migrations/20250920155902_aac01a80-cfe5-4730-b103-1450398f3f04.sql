-- Create doctors table with comprehensive profile information
CREATE TABLE public.doctors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  specialization TEXT NOT NULL,
  bio TEXT,
  experience_years INTEGER NOT NULL,
  education TEXT NOT NULL,
  languages TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  achievements TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  research_publications INTEGER DEFAULT 0,
  successful_procedures INTEGER DEFAULT 0,
  patient_rating DECIMAL(3,2) DEFAULT 0.0,
  total_reviews INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create doctor specialties lookup table
CREATE TABLE public.doctor_specialties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create doctor reviews table
CREATE TABLE public.doctor_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  patient_country TEXT,
  procedure_name TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  recovery_time TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table for doctor-treatment relationships
CREATE TABLE public.doctor_treatments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  treatment_category TEXT NOT NULL,
  is_primary_specialist BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_treatments ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Doctors are viewable by everyone" 
ON public.doctors 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Doctor specialties are viewable by everyone" 
ON public.doctor_specialties 
FOR SELECT 
USING (true);

CREATE POLICY "Doctor reviews are viewable by everyone" 
ON public.doctor_reviews 
FOR SELECT 
USING (true);

CREATE POLICY "Doctor treatments are viewable by everyone" 
ON public.doctor_treatments 
FOR SELECT 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_doctors_updated_at
BEFORE UPDATE ON public.doctors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_doctor_reviews_updated_at
BEFORE UPDATE ON public.doctor_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample specialties
INSERT INTO public.doctor_specialties (name, description) VALUES
('Cardiac Surgery', 'Heart and cardiovascular surgical procedures'),
('Ophthalmology', 'Eye and vision care procedures'),
('Cosmetic Surgery', 'Aesthetic and reconstructive surgery'),
('Dental Care', 'Comprehensive dental and oral health treatments'),
('General Surgery', 'Wide range of general surgical procedures'),
('Orthopedic Surgery', 'Bone, joint, and musculoskeletal procedures');

-- Insert sample doctors data
INSERT INTO public.doctors (name, title, specialization, bio, experience_years, education, languages, achievements, certifications, research_publications, successful_procedures, patient_rating) VALUES
('Dr. Ahmed Mansour', 'Chief Cardiac Surgeon', 'Minimally Invasive Cardiac Surgery', 'Leading cardiac surgeon with expertise in complex heart procedures and minimally invasive techniques. Trained internationally and committed to providing world-class cardiac care.', 18, 'Cairo University, Harvard Medical Fellowship', '{"English", "Arabic", "French"}', '{"1,500+ successful surgeries", "Published 40+ research papers", "International training in Germany"}', '{"Board Certified Cardiac Surgeon", "Fellow of American College of Surgeons", "European Society of Cardiology Member"}', 42, 1500, 4.9),

('Dr. Layla Khalil', 'Chief Ophthalmologist', 'Refractive & Cataract Surgery', 'Expert ophthalmologist specializing in LASIK, cataract surgery, and advanced eye treatments. Pioneer in Egypt for advanced intraocular lens technology.', 15, 'Alexandria University, Johns Hopkins Fellowship', '{"English", "Arabic", "Italian"}', '{"5,000+ LASIK procedures", "Pioneer in Egypt for advanced IOLs", "International speaker at eye conferences"}', '{"American Board of Ophthalmology", "European Society of Cataract Surgery", "International Council of Ophthalmology"}', 28, 5000, 4.8),

('Dr. Omar Farouk', 'Chief Plastic Surgeon', 'Aesthetic & Reconstructive Surgery', 'Renowned plastic surgeon combining artistic vision with surgical excellence. Trained in Beverly Hills techniques for natural-looking aesthetic results.', 16, 'Cairo University, Beverly Hills Fellowship', '{"English", "Arabic", "Spanish"}', '{"2,000+ aesthetic procedures", "Celebrity surgeon", "International aesthetic surgery trainer"}', '{"American Board of Plastic Surgery", "International Society of Aesthetic Surgery", "European Association of Plastic Surgeons"}', 35, 2000, 4.7),

('Dr. Nadia Salim', 'Chief Dental Officer', 'Cosmetic & Implant Dentistry', 'Expert in dental implants and cosmetic dentistry with advanced training in UCLA implantology. Specialist in full mouth rehabilitation and smile makeovers.', 14, 'Cairo University, UCLA Advanced Implantology', '{"English", "Arabic", "Portuguese"}', '{"3,000+ dental implants placed", "Expert in All-on-4 technique", "International cosmetic dentistry certification"}', '{"International Congress of Oral Implantologists", "American Academy of Cosmetic Dentistry", "European Association of Osseointegration"}', 22, 3000, 4.9),

('Dr. Khaled Rashed', 'Chief General Surgeon', 'Laparoscopic & Robotic Surgery', 'Leading general surgeon specializing in minimally invasive procedures. Expert in laparoscopic and robotic surgery with excellent patient outcomes.', 12, 'Ain Shams University, Mayo Clinic Fellowship', '{"English", "Arabic", "German"}', '{"1,200+ laparoscopic procedures", "Robotic surgery certification", "Minimal complication rate"}', '{"American College of Surgeons", "European Association of Endoscopic Surgery", "Society of American Gastrointestinal Surgeons"}', 18, 1200, 4.8),

('Dr. Youssef Elshamy', 'Chief Orthopedic Surgeon', 'Joint Replacement & Sports Medicine', 'Orthopedic surgeon specializing in joint replacement and sports medicine. Uses latest techniques for faster recovery and better outcomes.', 13, 'Cairo University, Hospital for Special Surgery Fellowship', '{"English", "Arabic", "Russian"}', '{"800+ joint replacements", "Sports medicine expert", "Advanced arthroscopy techniques"}', '{"American Academy of Orthopedic Surgeons", "International Association of Orthopedic Surgery", "Arthroscopy Association"}', 25, 800, 4.7);

-- Link doctors to their treatment categories
INSERT INTO public.doctor_treatments (doctor_id, treatment_category, is_primary_specialist) VALUES
((SELECT id FROM public.doctors WHERE name = 'Dr. Ahmed Mansour'), 'cardiac-surgery', true),
((SELECT id FROM public.doctors WHERE name = 'Dr. Layla Khalil'), 'eye-surgery', true),
((SELECT id FROM public.doctors WHERE name = 'Dr. Omar Farouk'), 'cosmetic-surgery', true),
((SELECT id FROM public.doctors WHERE name = 'Dr. Nadia Salim'), 'dental-care', true),
((SELECT id FROM public.doctors WHERE name = 'Dr. Khaled Rashed'), 'general-surgery', true),
((SELECT id FROM public.doctors WHERE name = 'Dr. Youssef Elshamy'), 'orthopedic-surgery', true);

-- Insert sample reviews
INSERT INTO public.doctor_reviews (doctor_id, patient_name, patient_country, procedure_name, rating, review_text, recovery_time, is_verified) VALUES
((SELECT id FROM public.doctors WHERE name = 'Dr. Ahmed Mansour'), 'Robert Johnson', 'United States', 'Coronary Bypass Surgery', 5, 'Dr. Mansour and his team saved my life. The quality of care was exceptional, and the cost was a fraction of what I would pay in the US. The hospital facilities were world-class.', '6 weeks', true),
((SELECT id FROM public.doctors WHERE name = 'Dr. Ahmed Mansour'), 'Maria Schmidt', 'Germany', 'Heart Valve Replacement', 5, 'Outstanding experience from consultation to recovery. The medical team was professional, and the coordinator spoke perfect German. I am completely satisfied with my results.', '4 weeks', true),
((SELECT id FROM public.doctors WHERE name = 'Dr. Layla Khalil'), 'Sarah Williams', 'United Kingdom', 'LASIK Surgery', 5, 'Perfect vision after 20 years of glasses! Dr. Khalil was incredibly thorough during the consultation. The procedure was quick and painless. Best decision I ever made.', '1 week', true),
((SELECT id FROM public.doctors WHERE name = 'Dr. Omar Farouk'), 'Jennifer Lopez', 'United States', 'Rhinoplasty', 5, 'Dr. Farouk gave me the nose I always dreamed of. The results look completely natural, and the recovery was smoother than expected. Highly recommend!', '2 weeks', true),
((SELECT id FROM public.doctors WHERE name = 'Dr. Nadia Salim'), 'Michael Thompson', 'Canada', 'Full Mouth Dental Implants', 5, 'Dr. Salim completely transformed my smile with All-on-4 implants. The quality is exceptional and the cost was 70% less than in Canada. I can eat everything again!', '3 months', true);