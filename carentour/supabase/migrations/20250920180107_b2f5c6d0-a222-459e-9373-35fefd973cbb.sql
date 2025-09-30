-- Update doctor avatar URLs to use public folder paths
UPDATE public.doctors 
SET avatar_url = CASE 
  WHEN avatar_url = '/src/assets/doctor-ahmed-mansour.jpg' THEN '/doctor-ahmed-mansour.jpg'
  WHEN avatar_url = '/src/assets/doctor-khaled-rashed.jpg' THEN '/doctor-khaled-rashed.jpg'
  WHEN avatar_url = '/src/assets/doctor-layla-khalil.jpg' THEN '/doctor-layla-khalil.jpg'
  WHEN avatar_url = '/src/assets/doctor-nadia-salim.jpg' THEN '/doctor-nadia-salim.jpg'
  WHEN avatar_url = '/src/assets/doctor-omar-farouk.jpg' THEN '/doctor-omar-farouk.jpg'
  WHEN avatar_url = '/src/assets/doctor-youssef-elshamy.jpg' THEN '/doctor-youssef-elshamy.jpg'
  ELSE avatar_url
END
WHERE avatar_url LIKE '/src/assets/doctor-%';