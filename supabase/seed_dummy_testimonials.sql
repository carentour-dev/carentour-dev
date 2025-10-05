-- Create dummy patients for testing testimonials system
-- This script creates realistic test data with patients, reviews, and stories

-- First, create some dummy patients
INSERT INTO public.patients (full_name, nationality, home_city, contact_email, travel_year, preferred_language) VALUES
('Sarah Johnson', 'United States', 'New York', 'sarah.j@example.com', 2024, 'en'),
('Mohammed Al-Rashid', 'Saudi Arabia', 'Riyadh', 'mohammed.r@example.com', 2024, 'ar'),
('Emma Schmidt', 'Germany', 'Berlin', 'emma.s@example.com', 2023, 'de'),
('Carlos Rodriguez', 'Spain', 'Madrid', 'carlos.r@example.com', 2024, 'es'),
('Yuki Tanaka', 'Japan', 'Tokyo', 'yuki.t@example.com', 2023, 'ja'),
('Maria Gonzalez', 'Mexico', 'Mexico City', 'maria.g@example.com', 2024, 'es'),
('David Chen', 'Canada', 'Toronto', 'david.c@example.com', 2024, 'en'),
('Fatima Hassan', 'United Kingdom', 'London', 'fatima.h@example.com', 2023, 'en'),
('Pierre Dubois', 'France', 'Paris', 'pierre.d@example.com', 2024, 'fr'),
('Olivia Brown', 'Australia', 'Sydney', 'olivia.b@example.com', 2023, 'en')
ON CONFLICT DO NOTHING;

-- Now create reviews for each doctor, linking to patients
-- We'll get the patient IDs and doctor IDs dynamically

DO $$
DECLARE
    patient_ids UUID[];
    treatment_ids UUID[];
    doctor_rec RECORD;
    patient_id UUID;
    treatment_id UUID;
    review_count INTEGER := 0;
    treatment_count INTEGER := 0;
BEGIN
    -- Get all patient IDs
    SELECT ARRAY_AGG(id) INTO patient_ids FROM public.patients;
    SELECT ARRAY_AGG(id ORDER BY slug) INTO treatment_ids FROM public.treatments;
    SELECT COALESCE(array_length(treatment_ids, 1), 0) INTO treatment_count;

    -- For each doctor, create 2-4 reviews
    FOR doctor_rec IN SELECT id, name FROM public.doctors LOOP
        -- Create 3 reviews per doctor
        FOR i IN 1..3 LOOP
            -- Cycle through patients
            patient_id := patient_ids[((review_count % array_length(patient_ids, 1)) + 1)];
            IF treatment_count > 0 THEN
              treatment_id := treatment_ids[((review_count % treatment_count) + 1)];
            ELSE
              treatment_id := NULL;
            END IF;

            INSERT INTO public.doctor_reviews (
                doctor_id,
                patient_id,
                patient_name,
                patient_country,
                treatment_id,
                rating,
                review_text,
                procedure_name,
                recovery_time,
                is_verified,
                published,
                highlight,
                display_order,
                locale
            )
            SELECT
                doctor_rec.id,
                patient_id,
                p.full_name,
                p.nationality,
                4.5 + (random() * 0.5), -- Rating between 4.5 and 5.0
                CASE (review_count % 6)
                    WHEN 0 THEN 'Absolutely outstanding experience! Dr. ' || doctor_rec.name || ' was incredibly professional and caring throughout my entire journey. The results exceeded my expectations.'
                    WHEN 1 THEN 'I traveled from abroad and was nervous, but the team made everything seamless. Dr. ' || doctor_rec.name || ' took time to answer all my questions and the outcome is perfect.'
                    WHEN 2 THEN 'Five stars all around! The quality of care was world-class, and the cost was a fraction of what I would pay at home. Highly recommend Dr. ' || doctor_rec.name || '.'
                    WHEN 3 THEN 'Dr. ' || doctor_rec.name || ' is truly gifted. The procedure was painless, recovery was smooth, and I couldn''t be happier with the results. Worth every penny!'
                    WHEN 4 THEN 'From consultation to follow-up, everything was handled professionally. Dr. ' || doctor_rec.name || ' has amazing expertise and the facilities are top-notch.'
                    ELSE 'Exceptional care and results! I did extensive research before choosing Dr. ' || doctor_rec.name || ', and I''m so glad I did. Life-changing experience!'
                END,
                CASE (review_count % 4)
                    WHEN 0 THEN 'Rhinoplasty'
                    WHEN 1 THEN 'Hair Transplant'
                    WHEN 2 THEN 'Dental Implants'
                    ELSE 'LASIK Surgery'
                END,
                CASE (review_count % 4)
                    WHEN 0 THEN '2-3 weeks'
                    WHEN 1 THEN '1 week'
                    WHEN 2 THEN '3-4 weeks'
                    ELSE '3-5 days'
                END,
                true, -- is_verified
                true, -- published
                (review_count % 3 = 0), -- highlight every 3rd review
                review_count, -- display_order
                p.preferred_language
            FROM public.patients p
            WHERE p.id = patient_id;

            review_count := review_count + 1;
        END LOOP;
    END LOOP;
END $$;

-- Now create patient stories (1-2 per doctor)
DO $$
DECLARE
    patient_ids UUID[];
    treatment_ids UUID[];
    treatment_slugs TEXT[];
    doctor_rec RECORD;
    patient_id UUID;
    treatment_id UUID;
    treatment_slug TEXT;
    story_count INTEGER := 0;
    treatment_count INTEGER := 0;
BEGIN
    -- Get all patient IDs
    SELECT ARRAY_AGG(id) INTO patient_ids FROM public.patients;
    SELECT ARRAY_AGG(id ORDER BY slug), ARRAY_AGG(slug ORDER BY slug)
      INTO treatment_ids, treatment_slugs
      FROM public.treatments;
    SELECT COALESCE(array_length(treatment_ids, 1), 0) INTO treatment_count;

    -- For each doctor, create 1-2 stories
    FOR doctor_rec IN SELECT id, name, specialization FROM public.doctors LOOP
        -- Create 2 stories per doctor
        FOR i IN 1..2 LOOP
            patient_id := patient_ids[((story_count % array_length(patient_ids, 1)) + 1)];
            IF treatment_count > 0 THEN
              treatment_id := treatment_ids[((story_count % treatment_count) + 1)];
              treatment_slug := treatment_slugs[((story_count % treatment_count) + 1)];
            ELSE
              treatment_id := NULL;
              treatment_slug := 'general-care';
            END IF;

            INSERT INTO public.patient_stories (
                patient_id,
                doctor_id,
                treatment_id,
                headline,
                excerpt,
                body_markdown,
                hero_image,
                locale,
                published,
                featured,
                display_order
            )
            SELECT
                patient_id,
                doctor_rec.id,
                treatment_id,
                CASE (story_count % 5)
                    WHEN 0 THEN 'My Life-Changing Journey to Egypt'
                    WHEN 1 THEN 'How Dr. ' || doctor_rec.name || ' Restored My Confidence'
                    WHEN 2 THEN 'From Consultation to Recovery: A Success Story'
                    WHEN 3 THEN 'Why I Chose Egypt for My Medical Treatment'
                    ELSE 'Exceptional Care and Amazing Results'
                END,
                CASE (story_count % 3)
                    WHEN 0 THEN 'After years of struggling, I finally found the solution I needed in Egypt with Dr. ' || doctor_rec.name || '.'
                    WHEN 1 THEN 'My experience exceeded all expectations. The combination of world-class expertise and affordable care was perfect.'
                    ELSE 'I was nervous about traveling abroad for treatment, but the entire process was seamless and professional.'
                END,
                '## My Journey Begins

I had been researching medical tourism for months before deciding to travel to Egypt. After extensive research and consultations, I chose Dr. ' || doctor_rec.name || ' based on their stellar reputation and impressive credentials in ' || doctor_rec.specialization || '.

## The Consultation

From the first video consultation, I knew I was in good hands. Dr. ' || doctor_rec.name || ' was patient, thorough, and took time to understand my specific needs and concerns. The treatment plan was clearly explained, and all my questions were answered in detail.

## Treatment Experience

The facilities were modern and exceeded international standards. The nursing staff was attentive and caring, making sure I was comfortable throughout the entire process. Dr. ' || doctor_rec.name || ' performed the procedure with incredible skill and precision.

## Recovery and Results

The post-operative care was exceptional. I was provided with detailed recovery instructions and had regular follow-up appointments to monitor my progress. The results have been absolutely transformative.

## Why Egypt?

1. **World-Class Expertise**: The medical professionals here are highly trained and experienced
2. **Affordable Excellence**: Quality care at a fraction of Western prices
3. **Comprehensive Support**: From airport pickup to post-op care, everything was handled
4. **Beautiful Country**: The opportunity to recover while experiencing Egyptian culture was amazing

## My Recommendation

If you''re considering medical treatment abroad, I cannot recommend Egypt and Dr. ' || doctor_rec.name || ' highly enough. The combination of expertise, care, and value is unmatched. This has been a truly life-changing experience, and I''m grateful I made this decision.

*Patient treated in ' || CASE WHEN random() < 0.5 THEN '2023' ELSE '2024' END || '*',
                NULL, -- hero_image
                p.preferred_language,
                true, -- published
                (story_count % 4 = 0), -- featured every 4th story
                story_count
            FROM public.patients p
            WHERE p.id = patient_id;

            story_count := story_count + 1;
        END LOOP;
    END LOOP;
END $$;

-- Show summary of what was created
SELECT
    'Patients Created' as type,
    COUNT(*) as count
FROM public.patients

UNION ALL

SELECT
    'Reviews Created' as type,
    COUNT(*) as count
FROM public.doctor_reviews
WHERE created_at > NOW() - INTERVAL '1 minute'

UNION ALL

SELECT
    'Stories Created' as type,
    COUNT(*) as count
FROM public.patient_stories
WHERE created_at > NOW() - INTERVAL '1 minute';

-- Show patient testimonial summary
SELECT
    p.full_name,
    p.nationality,
    p.has_testimonial,
    COUNT(DISTINCT dr.id) as review_count,
    COUNT(DISTINCT ps.id) as story_count
FROM public.patients p
LEFT JOIN public.doctor_reviews dr ON dr.patient_id = p.id
LEFT JOIN public.patient_stories ps ON ps.patient_id = p.id
GROUP BY p.id, p.full_name, p.nationality, p.has_testimonial
ORDER BY p.full_name;
