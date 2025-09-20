-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- Create storage policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update avatars" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Update doctors with avatar URLs using existing assets
UPDATE doctors 
SET avatar_url = CASE 
  WHEN name = 'Dr. Ahmed Mansour' THEN '/src/assets/doctor-ahmed-mansour.jpg'
  WHEN name = 'Dr. Layla Khalil' THEN '/src/assets/doctor-layla-khalil.jpg'
  WHEN name = 'Dr. Omar Farouk' THEN '/src/assets/doctor-omar-farouk.jpg'
  WHEN name = 'Dr. Nadia Salim' THEN '/src/assets/doctor-nadia-salim.jpg'
  WHEN name = 'Dr. Khaled Rashed' THEN '/src/assets/doctor-khaled-rashed.jpg'
  WHEN name = 'Dr. Youssef El-Shamy' THEN '/src/assets/doctor-youssef-elshamy.jpg'
  ELSE avatar_url
END
WHERE name IN (
  'Dr. Ahmed Mansour', 
  'Dr. Layla Khalil', 
  'Dr. Omar Farouk', 
  'Dr. Nadia Salim', 
  'Dr. Khaled Rashed', 
  'Dr. Youssef El-Shamy'
);