-- Seed demo data for treatments, facilities, and hotels
INSERT INTO public.treatments (name, slug, category, summary, description, base_price, currency, duration_days, recovery_time_days, success_rate)
VALUES
  (
    'Minimally Invasive Heart Bypass',
    'cardiac-surgery',
    'Cardiac Surgery',
    'Life-saving heart bypass using minimally invasive techniques.',
    'Performed by internationally trained cardiac surgeons with advanced imaging and post-operative cardiac rehab included.',
    8500,
    'USD',
    7,
    21,
    98
  ),
  (
    'LASIK Vision Correction',
    'eye-surgery',
    'Ophthalmology',
    'Laser-assisted vision correction with same-day discharge.',
    'Comprehensive pre-operative evaluation, bladeless laser technology, and follow-up care to ensure long-term clarity.',
    1200,
    'USD',
    1,
    7,
    99
  ),
  (
    'Full Mouth Dental Implants',
    'dental-care',
    'Dental Care',
    'All-on-4 implant system with immediate-loading smile design.',
    'Digital smile design, immediate implant placement, and ceramic restorations crafted by master dental technicians.',
    6500,
    'USD',
    3,
    30,
    96
  ),
  (
    'Comprehensive Cosmetic Body Contouring',
    'cosmetic-surgery',
    'Cosmetic Surgery',
    '360° liposuction with muscle definition and skin tightening.',
    'Includes pre-operative planning, advanced contouring techniques, and VIP recovery suites with nursing support.',
    3800,
    'USD',
    2,
    21,
    95
  );

-- Seed partner facilities
INSERT INTO public.facilities (
  name,
  slug,
  facility_type,
  description,
  address,
  contact_info,
  amenities,
  specialties,
  images,
  rating,
  review_count
) VALUES
  (
    'Cairo Heart Institute',
    'cairo-heart-institute',
    'hospital',
    'Premier cardiac center with hybrid operating theaters and 24/7 cardiac ICU.',
    '{"street": "New Cairo Medical City", "city": "Cairo", "country": "Egypt"}',
    '{"phone": "+20 101 234 5678", "email": "care@cairoheart.com", "website": "https://cairoheart.com"}',
    ARRAY['Hybrid operating theaters', 'Cardiac ICU', 'International patient lounge', 'Telemedicine follow-up'],
    ARRAY['Cardiac Surgery', 'Cardiology', 'Electrophysiology'],
    '{"hero": "/hospital-cairo-medical.jpg"}',
    4.9,
    320
  ),
  (
    'Alexandria Premier Clinic',
    'alexandria-premier-clinic',
    'clinic',
    'Luxury boutique clinic specializing in cosmetic and ophthalmic surgery.',
    '{"street": "Corniche El Maadi", "city": "Alexandria", "country": "Egypt"}',
    '{"phone": "+20 102 456 7890", "email": "hello@alexpremier.com", "website": "https://alexpremier.com"}',
    ARRAY['VIP suites', 'Concierge service', 'Recovery spa', 'Multilingual team'],
    ARRAY['Cosmetic Surgery', 'Ophthalmology', 'Dermatology'],
    '{"hero": "/clinic-alexandria-premier.jpg"}',
    4.8,
    210
  ),
  (
    'Nile Valley Medical Complex',
    'nile-valley-medical-complex',
    'clinic',
    'Integrated fertility and bariatric treatment center with on-site rehab.',
    '{"street": "Luxor Health District", "city": "Luxor", "country": "Egypt"}',
    '{"phone": "+20 103 654 9870", "email": "info@nilevalley.com", "website": "https://nilevalley.com"}',
    ARRAY['Research center', 'Clinical trials', 'Wellness programs', 'Medical tourism concierge'],
    ARRAY['Fertility', 'Bariatric Surgery', 'Rehabilitation'],
    '{"hero": "/clinic-nile-valley.jpg"}',
    4.7,
    145
  );

-- Seed partner hotels
INSERT INTO public.hotels (
  name,
  slug,
  description,
  star_rating,
  nightly_rate,
  currency,
  distance_to_facility_km,
  address,
  contact_info,
  amenities,
  medical_services,
  images,
  rating,
  review_count
) VALUES
  (
    'Nile View Recovery Suites',
    'nile-view-recovery',
    'Riverfront recovery hotel offering premium medical amenities and private suites.',
    5,
    220,
    'USD',
    0.8,
    '{"street": "Corniche El Nil", "city": "Cairo", "country": "Egypt"}',
    '{"phone": "+20 104 321 7654", "email": "stay@nileview.com", "website": "https://nileview.com"}',
    ARRAY['In-room dining', 'Spa & wellness', 'Airport transfers', 'Concierge desk'],
    ARRAY['On-call nurse', 'Medication storage', 'Physiotherapy room'],
    '{"hero": "/hotel-nile-view.jpg"}',
    4.9,
    420
  ),
  (
    'Cairo Downtown Medical Hotel',
    'cairo-downtown-medical-hotel',
    'Modern medical-grade hotel located minutes from partner hospitals.',
    4,
    150,
    'USD',
    1.2,
    '{"street": "Tahrir Square", "city": "Cairo", "country": "Egypt"}',
    '{"phone": "+20 105 222 8899", "email": "reservations@cdmh.com", "website": "https://cdmh.com"}',
    ARRAY['Fitness center', 'Business lounge', 'International cuisine', 'Wi-Fi everywhere'],
    ARRAY['Post-op suites', 'Accessible rooms', 'Transport desk'],
    '{"hero": "/hotel-cairo-downtown.jpg"}',
    4.6,
    305
  ),
  (
    'Luxor Serenity Resort',
    'luxor-serenity-resort',
    'Boutique recovery resort overlooking the Nile with holistic wellness programs.',
    5,
    280,
    'USD',
    3.5,
    '{"street": "Karnak Road", "city": "Luxor", "country": "Egypt"}',
    '{"phone": "+20 106 543 2100", "email": "relax@luxorserenity.com", "website": "https://luxorserenity.com"}',
    ARRAY['Infinity pool', 'Sunset terrace', 'Cultural excursions', 'Fine dining'],
    ARRAY['24/7 medical staff', 'Rehab gym', 'Dietician support'],
    '{"hero": "/hotel-luxor-serenity.jpg"}',
    4.8,
    178
  );
