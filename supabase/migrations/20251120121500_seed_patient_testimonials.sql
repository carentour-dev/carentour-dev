BEGIN;

WITH patient_seed AS (
  SELECT *
  FROM (VALUES
    (1, 'amelia.carter@example.com', 'Amelia Carter', 'United States', 'New York', 'en', 'USD', 2024),
    (2, 'rohan.mehta@example.com', 'Rohan Mehta', 'India', 'Mumbai', 'en', 'USD', 2024),
    (3, 'sofia.garcia@example.com', 'Sofia Garcia', 'Spain', 'Madrid', 'es', 'EUR', 2023),
    (4, 'hatem.elmasry@example.com', 'Hatem Elmasry', 'Egypt', 'Alexandria', 'ar', 'EGP', 2024),
    (5, 'chloe.martin@example.com', 'Chloe Martin', 'France', 'Paris', 'fr', 'EUR', 2024),
    (6, 'abdullah.hassan@example.com', 'Abdullah Hassan', 'Saudi Arabia', 'Riyadh', 'ar', 'SAR', 2023),
    (7, 'daniel.novak@example.com', 'Daniel Novak', 'Czech Republic', 'Prague', 'en', 'EUR', 2024),
    (8, 'mia.rossi@example.com', 'Mia Rossi', 'Italy', 'Milan', 'it', 'EUR', 2024),
    (9, 'aiko.tanaka@example.com', 'Aiko Tanaka', 'Japan', 'Tokyo', 'ja', 'JPY', 2023),
    (10, 'lucas.nguyen@example.com', 'Lucas Nguyen', 'Canada', 'Toronto', 'en', 'CAD', 2024),
    (11, 'emily.baker@example.com', 'Emily Baker', 'United Kingdom', 'London', 'en', 'GBP', 2024),
    (12, 'valentina.petrova@example.com', 'Valentina Petrova', 'Bulgaria', 'Sofia', 'en', 'EUR', 2023),
    (13, 'omar.abdallah@example.com', 'Omar Abdallah', 'United Arab Emirates', 'Dubai', 'ar', 'AED', 2024),
    (14, 'hannah.lee@example.com', 'Hannah Lee', 'South Korea', 'Seoul', 'en', 'KRW', 2023),
    (15, 'lucas.ferreira@example.com', 'Lucas Ferreira', 'Brazil', 'Sao Paulo', 'pt', 'BRL', 2023),
    (16, 'noah.williams@example.com', 'Noah Williams', 'United States', 'Chicago', 'en', 'USD', 2024),
    (17, 'petra.schmidt@example.com', 'Petra Schmidt', 'Germany', 'Berlin', 'de', 'EUR', 2023),
    (18, 'ahmed.yildiz@example.com', 'Ahmed Yildiz', 'Turkey', 'Istanbul', 'tr', 'TRY', 2024),
    (19, 'sarah.ali@example.com', 'Sarah Ali', 'Kuwait', 'Kuwait City', 'ar', 'KWD', 2023),
    (20, 'liam.oconnor@example.com', 'Liam Oconnor', 'Ireland', 'Dublin', 'en', 'EUR', 2024),
    (21, 'isabella.cruz@example.com', 'Isabella Cruz', 'Mexico', 'Mexico City', 'es', 'MXN', 2024),
    (22, 'david.chen@example.com', 'David Chen', 'Singapore', 'Singapore', 'en', 'SGD', 2023),
    (23, 'grace.johnson@example.com', 'Grace Johnson', 'United States', 'Austin', 'en', 'USD', 2024),
    (24, 'marco.silva@example.com', 'Marco Silva', 'Portugal', 'Lisbon', 'pt', 'EUR', 2023)
  ) AS ps(seed_order, contact_email, full_name, nationality, home_city, preferred_language, preferred_currency, travel_year)
)
INSERT INTO public.patients (full_name, contact_email, nationality, home_city, preferred_language, preferred_currency, travel_year)
SELECT
  ps.full_name,
  ps.contact_email,
  ps.nationality,
  ps.home_city,
  ps.preferred_language,
  ps.preferred_currency,
  ps.travel_year
FROM patient_seed ps
WHERE NOT EXISTS (
  SELECT 1
  FROM public.patients existing
  WHERE existing.contact_email = ps.contact_email
)
ORDER BY ps.seed_order;

WITH patient_seed AS (
  SELECT *
  FROM (VALUES
    (1, 'amelia.carter@example.com', 'Amelia Carter', 'United States', 'New York', 'en', 'USD', 2024),
    (2, 'rohan.mehta@example.com', 'Rohan Mehta', 'India', 'Mumbai', 'en', 'USD', 2024),
    (3, 'sofia.garcia@example.com', 'Sofia Garcia', 'Spain', 'Madrid', 'es', 'EUR', 2023),
    (4, 'hatem.elmasry@example.com', 'Hatem Elmasry', 'Egypt', 'Alexandria', 'ar', 'EGP', 2024),
    (5, 'chloe.martin@example.com', 'Chloe Martin', 'France', 'Paris', 'fr', 'EUR', 2024),
    (6, 'abdullah.hassan@example.com', 'Abdullah Hassan', 'Saudi Arabia', 'Riyadh', 'ar', 'SAR', 2023),
    (7, 'daniel.novak@example.com', 'Daniel Novak', 'Czech Republic', 'Prague', 'en', 'EUR', 2024),
    (8, 'mia.rossi@example.com', 'Mia Rossi', 'Italy', 'Milan', 'it', 'EUR', 2024),
    (9, 'aiko.tanaka@example.com', 'Aiko Tanaka', 'Japan', 'Tokyo', 'ja', 'JPY', 2023),
    (10, 'lucas.nguyen@example.com', 'Lucas Nguyen', 'Canada', 'Toronto', 'en', 'CAD', 2024),
    (11, 'emily.baker@example.com', 'Emily Baker', 'United Kingdom', 'London', 'en', 'GBP', 2024),
    (12, 'valentina.petrova@example.com', 'Valentina Petrova', 'Bulgaria', 'Sofia', 'en', 'EUR', 2023),
    (13, 'omar.abdallah@example.com', 'Omar Abdallah', 'United Arab Emirates', 'Dubai', 'ar', 'AED', 2024),
    (14, 'hannah.lee@example.com', 'Hannah Lee', 'South Korea', 'Seoul', 'en', 'KRW', 2023),
    (15, 'lucas.ferreira@example.com', 'Lucas Ferreira', 'Brazil', 'Sao Paulo', 'pt', 'BRL', 2023),
    (16, 'noah.williams@example.com', 'Noah Williams', 'United States', 'Chicago', 'en', 'USD', 2024),
    (17, 'petra.schmidt@example.com', 'Petra Schmidt', 'Germany', 'Berlin', 'de', 'EUR', 2023),
    (18, 'ahmed.yildiz@example.com', 'Ahmed Yildiz', 'Turkey', 'Istanbul', 'tr', 'TRY', 2024),
    (19, 'sarah.ali@example.com', 'Sarah Ali', 'Kuwait', 'Kuwait City', 'ar', 'KWD', 2023),
    (20, 'liam.oconnor@example.com', 'Liam Oconnor', 'Ireland', 'Dublin', 'en', 'EUR', 2024),
    (21, 'isabella.cruz@example.com', 'Isabella Cruz', 'Mexico', 'Mexico City', 'es', 'MXN', 2024),
    (22, 'david.chen@example.com', 'David Chen', 'Singapore', 'Singapore', 'en', 'SGD', 2023),
    (23, 'grace.johnson@example.com', 'Grace Johnson', 'United States', 'Austin', 'en', 'USD', 2024),
    (24, 'marco.silva@example.com', 'Marco Silva', 'Portugal', 'Lisbon', 'pt', 'EUR', 2023)
  ) AS ps(seed_order, contact_email, full_name, nationality, home_city, preferred_language, preferred_currency, travel_year)
),
ordered_patients AS (
  SELECT
    p.id,
    ps.seed_order,
    ps.contact_email,
    COALESCE(p.nationality, ps.nationality) AS nationality,
    COALESCE(p.preferred_language, ps.preferred_language) AS preferred_language,
    ROW_NUMBER() OVER (ORDER BY ps.seed_order) AS rn
  FROM patient_seed ps
  JOIN public.patients p ON p.contact_email = ps.contact_email
),
patient_count AS (
  SELECT COUNT(*) AS total FROM ordered_patients
),
doctor_catalog AS (
  SELECT
    d.id AS doctor_id,
    d.name AS doctor_name,
    ROW_NUMBER() OVER (ORDER BY d.created_at, d.id) AS doctor_index,
    COALESCE(
      (
        SELECT dt.treatment_category
        FROM public.doctor_treatments dt
        WHERE dt.doctor_id = d.id
        ORDER BY dt.is_primary_specialist DESC, dt.created_at DESC
        LIMIT 1
      ),
      'general-care'
    ) AS treatment_category
  FROM public.doctors d
  WHERE d.is_active IS DISTINCT FROM false
),
treatment_details AS (
  SELECT
    dc.doctor_id,
    COALESCE(
      (
        SELECT t.id
        FROM public.treatments t
        WHERE t.category = dc.treatment_category
        ORDER BY t.created_at, t.slug, t.id
        LIMIT 1
      ),
      (
        SELECT t.id
        FROM public.treatments t
        WHERE t.slug = 'general-care'
        LIMIT 1
      )
    ) AS treatment_id
  FROM doctor_catalog dc
),
augmented_details AS (
  SELECT
    dc.doctor_id,
    dc.doctor_name,
    dc.doctor_index,
    td.treatment_id,
    t.name AS treatment_name
  FROM doctor_catalog dc
  JOIN treatment_details td ON td.doctor_id = dc.doctor_id
  JOIN public.treatments t ON t.id = td.treatment_id
),
review_templates AS (
  SELECT *
  FROM (VALUES
    (1,
     'From the airport pickup to the final checkup, %2$s and the Care N Tour team delivered world-class expertise on my %1$s. I felt informed at every step.',
     'Precision Treatment Planning',
     '4 weeks',
     5,
     true
    ),
    (2,
     'I chose Care N Tour for %1$s after weeks of research. %2$s explained every detail and the results exceeded my expectations.',
     'Specialist Procedure',
     '3 weeks',
     5,
     false
    ),
    (3,
     'What impressed me most was the bilingual nursing staff and daily follow-ups during my %1$s. %2$s kept my recovery on track even after I flew home.',
     'Recovery Coaching',
     '2 weeks',
     4,
     false
    ),
    (4,
     'The value was unbelievable. Traveling for %1$s with %2$s cut my costs by more than half while delivering premium facilities and hospitality.',
     'Comprehensive Care Bundle',
     '5 weeks',
     5,
     false
    )
  ) AS rt(template_index, review_text_template, procedure_name, recovery_time, rating, highlight)
),
review_source AS (
  SELECT
    ad.doctor_id,
    ad.doctor_name,
    ad.doctor_index,
    ad.treatment_id,
    ad.treatment_name,
    rt.template_index,
    format(rt.review_text_template, ad.treatment_name, ad.doctor_name) AS review_text,
    rt.procedure_name,
    rt.recovery_time,
    rt.rating,
    rt.highlight,
    rt.template_index - 1 AS display_order,
    ((ad.doctor_index - 1) * 4 + rt.template_index - 1) AS global_index
  FROM augmented_details ad
  CROSS JOIN review_templates rt
),
prepared_reviews AS (
  SELECT
    rs.*,
    pc.total,
    ((rs.global_index % pc.total) + 1) AS target_rn
  FROM review_source rs
  CROSS JOIN patient_count pc
),
final_reviews AS (
  SELECT
    pr.doctor_id,
    pr.treatment_id,
    pr.review_text,
    pr.procedure_name,
    pr.recovery_time,
    pr.rating,
    pr.highlight,
    pr.display_order,
    op.id AS patient_id,
    op.nationality,
    op.preferred_language,
    op.rn
  FROM prepared_reviews pr
  JOIN ordered_patients op ON op.rn = pr.target_rn
)
INSERT INTO public.doctor_reviews (
  doctor_id,
  patient_id,
  patient_name,
  patient_country,
  treatment_id,
  procedure_name,
  rating,
  review_text,
  recovery_time,
  is_verified,
  published,
  highlight,
  display_order,
  locale,
  media
)
SELECT
  fr.doctor_id,
  fr.patient_id,
  format('Patient #%s', 8000 + fr.rn),
  CASE WHEN (fr.rn % 3) = 0 THEN 'Overseas Patient' ELSE 'International Patient' END,
  fr.treatment_id,
  fr.procedure_name,
  fr.rating,
  fr.review_text,
  fr.recovery_time,
  true,
  true,
  fr.highlight,
  fr.display_order,
  COALESCE(fr.preferred_language, 'en'),
  '[]'::jsonb
FROM final_reviews fr;

WITH patient_seed AS (
  SELECT *
  FROM (VALUES
    (1, 'amelia.carter@example.com', 'Amelia Carter', 'United States', 'New York', 'en', 'USD', 2024),
    (2, 'rohan.mehta@example.com', 'Rohan Mehta', 'India', 'Mumbai', 'en', 'USD', 2024),
    (3, 'sofia.garcia@example.com', 'Sofia Garcia', 'Spain', 'Madrid', 'es', 'EUR', 2023),
    (4, 'hatem.elmasry@example.com', 'Hatem Elmasry', 'Egypt', 'Alexandria', 'ar', 'EGP', 2024),
    (5, 'chloe.martin@example.com', 'Chloe Martin', 'France', 'Paris', 'fr', 'EUR', 2024),
    (6, 'abdullah.hassan@example.com', 'Abdullah Hassan', 'Saudi Arabia', 'Riyadh', 'ar', 'SAR', 2023),
    (7, 'daniel.novak@example.com', 'Daniel Novak', 'Czech Republic', 'Prague', 'en', 'EUR', 2024),
    (8, 'mia.rossi@example.com', 'Mia Rossi', 'Italy', 'Milan', 'it', 'EUR', 2024),
    (9, 'aiko.tanaka@example.com', 'Aiko Tanaka', 'Japan', 'Tokyo', 'ja', 'JPY', 2023),
    (10, 'lucas.nguyen@example.com', 'Lucas Nguyen', 'Canada', 'Toronto', 'en', 'CAD', 2024),
    (11, 'emily.baker@example.com', 'Emily Baker', 'United Kingdom', 'London', 'en', 'GBP', 2024),
    (12, 'valentina.petrova@example.com', 'Valentina Petrova', 'Bulgaria', 'Sofia', 'en', 'EUR', 2023),
    (13, 'omar.abdallah@example.com', 'Omar Abdallah', 'United Arab Emirates', 'Dubai', 'ar', 'AED', 2024),
    (14, 'hannah.lee@example.com', 'Hannah Lee', 'South Korea', 'Seoul', 'en', 'KRW', 2023),
    (15, 'lucas.ferreira@example.com', 'Lucas Ferreira', 'Brazil', 'Sao Paulo', 'pt', 'BRL', 2023),
    (16, 'noah.williams@example.com', 'Noah Williams', 'United States', 'Chicago', 'en', 'USD', 2024),
    (17, 'petra.schmidt@example.com', 'Petra Schmidt', 'Germany', 'Berlin', 'de', 'EUR', 2023),
    (18, 'ahmed.yildiz@example.com', 'Ahmed Yildiz', 'Turkey', 'Istanbul', 'tr', 'TRY', 2024),
    (19, 'sarah.ali@example.com', 'Sarah Ali', 'Kuwait', 'Kuwait City', 'ar', 'KWD', 2023),
    (20, 'liam.oconnor@example.com', 'Liam Oconnor', 'Ireland', 'Dublin', 'en', 'EUR', 2024),
    (21, 'isabella.cruz@example.com', 'Isabella Cruz', 'Mexico', 'Mexico City', 'es', 'MXN', 2024),
    (22, 'david.chen@example.com', 'David Chen', 'Singapore', 'Singapore', 'en', 'SGD', 2023),
    (23, 'grace.johnson@example.com', 'Grace Johnson', 'United States', 'Austin', 'en', 'USD', 2024),
    (24, 'marco.silva@example.com', 'Marco Silva', 'Portugal', 'Lisbon', 'pt', 'EUR', 2023)
  ) AS ps(seed_order, contact_email, full_name, nationality, home_city, preferred_language, preferred_currency, travel_year)
),
ordered_patients AS (
  SELECT
    p.id,
    ps.seed_order,
    ps.contact_email,
    COALESCE(p.nationality, ps.nationality) AS nationality,
    COALESCE(p.preferred_language, ps.preferred_language) AS preferred_language,
    ROW_NUMBER() OVER (ORDER BY ps.seed_order) AS rn
  FROM patient_seed ps
  JOIN public.patients p ON p.contact_email = ps.contact_email
),
patient_count AS (
  SELECT COUNT(*) AS total FROM ordered_patients
),
doctor_catalog AS (
  SELECT
    d.id AS doctor_id,
    d.name AS doctor_name,
    ROW_NUMBER() OVER (ORDER BY d.created_at, d.id) AS doctor_index,
    COALESCE(
      (
        SELECT dt.treatment_category
        FROM public.doctor_treatments dt
        WHERE dt.doctor_id = d.id
        ORDER BY dt.is_primary_specialist DESC, dt.created_at DESC
        LIMIT 1
      ),
      'general-care'
    ) AS treatment_category
  FROM public.doctors d
  WHERE d.is_active IS DISTINCT FROM false
),
treatment_details AS (
  SELECT
    dc.doctor_id,
    COALESCE(
      (
        SELECT t.id
        FROM public.treatments t
        WHERE t.category = dc.treatment_category
        ORDER BY t.created_at, t.slug, t.id
        LIMIT 1
      ),
      (
        SELECT t.id
        FROM public.treatments t
        WHERE t.slug = 'general-care'
        LIMIT 1
      )
    ) AS treatment_id
  FROM doctor_catalog dc
),
augmented_details AS (
  SELECT
    dc.doctor_id,
    dc.doctor_name,
    dc.doctor_index,
    td.treatment_id,
    t.name AS treatment_name
  FROM doctor_catalog dc
  JOIN treatment_details td ON td.doctor_id = dc.doctor_id
  JOIN public.treatments t ON t.id = td.treatment_id
),
story_templates AS (
  SELECT *
  FROM (VALUES
    (1, 1,
     'My Seamless %1$s Journey in Egypt',
     'Care N Tour coordinated every detail so I could focus on healing after %1$s with %2$s.',
     E'## Preparing for Treatment\n\nI arrived in Cairo feeling reassured after speaking with the Care N Tour coordinators. %2$s reviewed the plan for my %1$s the next morning.\n\n## Exceptional Clinical Team\n\nEvery nurse checked on me twice a day and translators were available whenever I needed them.\n\n## Lasting Results\n\nTwo weeks later I was exploring the city while scheduling virtual follow ups back home.',
     true
    ),
    (2, 2,
     'Regaining Confidence After %1$s',
     'From pre-op planning to post-op wellness sessions, %2$s and the hospital team exceeded expectations.',
     E'## Arrival Support\n\nThe concierge met me at the gate and handled each appointment so I could rest.\n\n## World-Class Expertise\n\n%2$s explained every stage of %1$s in clear, compassionate detail.\n\n## Recovery Guidance\n\nCare N Tour arranged therapy sessions and medication management before I flew home.',
     false
    )
  ) AS st(template_index, patient_offset, headline_template, excerpt_template, body_template, featured)
),
story_source AS (
  SELECT
    ad.doctor_id,
    ad.doctor_index,
    ad.treatment_id,
    ad.treatment_name,
    st.template_index,
    st.patient_offset,
    format(st.headline_template, ad.treatment_name) AS headline,
    format(st.excerpt_template, ad.treatment_name, ad.doctor_name) AS excerpt,
    format(st.body_template, ad.treatment_name, ad.doctor_name) AS body_markdown,
    st.featured,
    st.template_index - 1 AS display_order,
    ((ad.doctor_index - 1) * 4 + st.patient_offset - 1) AS global_index
  FROM augmented_details ad
  CROSS JOIN story_templates st
),
prepared_stories AS (
  SELECT
    ss.*,
    pc.total,
    ((ss.global_index % pc.total) + 1) AS target_rn
  FROM story_source ss
  CROSS JOIN patient_count pc
),
final_stories AS (
  SELECT
    ps.doctor_id,
    ps.treatment_id,
    ps.headline,
    ps.excerpt,
    ps.body_markdown,
    ps.featured,
    ps.display_order,
    op.id AS patient_id,
    op.preferred_language
  FROM prepared_stories ps
  JOIN ordered_patients op ON op.rn = ps.target_rn
)
INSERT INTO public.patient_stories (
  patient_id,
  doctor_id,
  treatment_id,
  headline,
  excerpt,
  body_markdown,
  outcome_summary,
  media,
  hero_image,
  locale,
  published,
  featured,
  display_order
)
SELECT
  fs.patient_id,
  fs.doctor_id,
  fs.treatment_id,
  fs.headline,
  fs.excerpt,
  fs.body_markdown,
  '[]'::jsonb,
  '[]'::jsonb,
  NULL,
  COALESCE(fs.preferred_language, 'en'),
  true,
  fs.featured,
  fs.display_order
FROM final_stories fs;

COMMIT;
