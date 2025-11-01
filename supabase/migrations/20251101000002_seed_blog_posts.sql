-- Seed script to populate blog system with initial content
-- This will create initial categories, an author, and seed blog posts

-- First, create categories
INSERT INTO public.blog_categories (name, slug, description, color)
VALUES
  ('Medical Tourism', 'medical-tourism', 'Comprehensive guides about medical tourism in Egypt', '#3B82F6'),
  ('Eye Surgery', 'eye-surgery', 'Information about LASIK and other eye procedures', '#10B981'),
  ('Cardiac Surgery', 'cardiac-surgery', 'Insights into cardiac procedures and heart health', '#EF4444'),
  ('Dental Care', 'dental-care', 'Dental tourism and procedures in Egypt', '#8B5CF6'),
  ('Wellness', 'wellness', 'Recovery tips and wellness advice', '#F59E0B'),
  ('Insurance', 'insurance', 'Medical insurance and coverage information', '#6366F1')
ON CONFLICT (slug) DO NOTHING;

-- Create a default author for migrated posts
INSERT INTO public.blog_authors (name, slug, email, bio, avatar, active)
VALUES (
  'CarenTour Editorial Team',
  'carentour-editorial',
  'editorial@carentour.com',
  'The CarenTour editorial team consists of medical tourism experts, healthcare professionals, and experienced writers dedicated to providing accurate and helpful information about medical travel to Egypt.',
  '/team-dr-sarah-ahmed.jpg',
  true
)
ON CONFLICT (slug) DO NOTHING;

-- Get the IDs we need
DO $$
DECLARE
  v_author_id UUID;
  v_medical_tourism_id UUID;
  v_eye_surgery_id UUID;
  v_cardiac_surgery_id UUID;
  v_dental_care_id UUID;
  v_wellness_id UUID;
  v_insurance_id UUID;
BEGIN
  -- Get author ID
  SELECT id INTO v_author_id FROM public.blog_authors WHERE slug = 'carentour-editorial' LIMIT 1;

  -- Get category IDs
  SELECT id INTO v_medical_tourism_id FROM public.blog_categories WHERE slug = 'medical-tourism' LIMIT 1;
  SELECT id INTO v_eye_surgery_id FROM public.blog_categories WHERE slug = 'eye-surgery' LIMIT 1;
  SELECT id INTO v_cardiac_surgery_id FROM public.blog_categories WHERE slug = 'cardiac-surgery' LIMIT 1;
  SELECT id INTO v_dental_care_id FROM public.blog_categories WHERE slug = 'dental-care' LIMIT 1;
  SELECT id INTO v_wellness_id FROM public.blog_categories WHERE slug = 'wellness' LIMIT 1;
  SELECT id INTO v_insurance_id FROM public.blog_categories WHERE slug = 'insurance' LIMIT 1;

  -- Insert blog posts
  -- Post 1: Medical Tourism Guide
  INSERT INTO public.blog_posts (
    slug, title, excerpt, content, featured_image, category_id, author_id,
    status, publish_date, reading_time, seo_title, seo_description, featured
  ) VALUES (
    'complete-guide-medical-tourism-egypt',
    'Complete Guide to Medical Tourism in Egypt: What You Need to Know',
    'Discover everything about medical tourism in Egypt, from choosing the right hospital to understanding the process and costs involved.',
    '{"type": "html", "data": "<p>Egypt has emerged as one of the world''s leading destinations for medical tourism, offering world-class healthcare services at a fraction of the cost found in Western countries. With its rich history, modern medical facilities, and highly trained physicians, Egypt provides an ideal combination of quality healthcare and cultural experience.</p><h2>Why Choose Egypt for Medical Tourism?</h2><p>Egypt''s medical tourism industry has grown exponentially over the past decade, driven by several key factors:</p><ul><li><strong>Cost Effectiveness:</strong> Medical procedures in Egypt cost 60-80% less than equivalent treatments in the US or Europe</li><li><strong>Quality Care:</strong> Many Egyptian hospitals are internationally accredited with state-of-the-art equipment</li><li><strong>Experienced Physicians:</strong> Egyptian doctors often train in top international medical schools</li><li><strong>No Waiting Lists:</strong> Immediate access to treatments that might have months-long waiting periods elsewhere</li></ul><h2>Planning Your Medical Journey</h2><p>Successfully planning a medical trip to Egypt requires careful consideration of several factors:</p><h3>1. Research and Hospital Selection</h3><p>Begin by researching accredited hospitals and clinics that specialize in your required procedure. Look for facilities with international certifications such as JCI (Joint Commission International) accreditation.</p><h3>2. Visa and Travel Arrangements</h3><p>Most visitors can obtain a tourist visa on arrival or through e-visa services. Plan to arrive a few days before your procedure to allow for consultation and pre-operative assessments.</p><h3>3. Accommodation and Recovery</h3><p>Many medical facilities offer partnerships with nearby hotels or recovery centers. Consider staying close to your treatment provider for follow-up appointments.</p><h2>Popular Medical Procedures</h2><p>Egypt excels in several medical specialties:</p><ul><li>Cardiac Surgery and Interventional Cardiology</li><li>Orthopedic Surgery including Joint Replacements</li><li>LASIK and Advanced Eye Surgeries</li><li>Cosmetic and Plastic Surgery</li><li>Dental Treatments and Implants</li><li>Fertility Treatments and IVF</li></ul><h2>What to Expect</h2><p>Egyptian medical facilities maintain international standards while offering personalized care. Most medical staff speak English, and many hospitals have dedicated international patient coordinators to assist with every aspect of your stay.</p><p>The combination of ancient culture and modern medicine makes Egypt a unique destination where you can combine healing with exploration of one of the world''s most fascinating civilizations.</p>"}',
    '/blog-medical-tourism.jpg',
    v_medical_tourism_id,
    v_author_id,
    'published',
    NOW() - INTERVAL '12 days',
    8,
    'Complete Guide to Medical Tourism in Egypt | CarenTour',
    'Discover everything about medical tourism in Egypt, from choosing the right hospital to understanding costs. Expert guide for medical travelers.',
    true
  ) ON CONFLICT (slug) DO NOTHING;

  -- Post 2: LASIK Surgery
  INSERT INTO public.blog_posts (
    slug, title, excerpt, content, featured_image, category_id, author_id,
    status, publish_date, reading_time, seo_title, seo_description
  ) VALUES (
    'lasik-surgery-egypt-technology-prices',
    'LASIK Surgery in Egypt: Advanced Technology at Affordable Prices',
    'Learn about the latest LASIK technology available in Egypt and why thousands choose Egyptian eye clinics for vision correction.',
    '{"type": "html", "data": "<p>LASIK surgery in Egypt has become increasingly popular among international patients seeking high-quality vision correction at affordable prices. Egyptian eye clinics utilize the most advanced laser technology and techniques, delivering results comparable to the world''s best facilities.</p><h2>Advanced LASIK Technology in Egypt</h2><p>Egyptian eye clinics are equipped with state-of-the-art technology including:</p><ul><li><strong>Femtosecond Lasers:</strong> For creating precise corneal flaps without blades</li><li><strong>Wavefront Technology:</strong> Custom mapping of your eye for personalized treatment</li><li><strong>Topography-Guided LASIK:</strong> Advanced correction for complex prescriptions</li><li><strong>Contoura Vision:</strong> Ultra-precise vision correction technology</li></ul><h2>The LASIK Procedure Process</h2><h3>Pre-Operative Assessment</h3><p>Your journey begins with a comprehensive eye examination including corneal thickness measurement, pupil size evaluation, refractive error mapping, and overall eye health assessment.</p><h3>Surgery Day</h3><p>The LASIK procedure typically takes 15-30 minutes for both eyes and includes local anesthetic eye drops, corneal flap creation using femtosecond laser, corneal reshaping with excimer laser, and flap repositioning with natural healing.</p><h2>Cost Comparison</h2><p>LASIK surgery costs in Egypt are significantly lower than international prices: Egypt: $1,200-$2,500 per eye vs USA: $2,500-$4,000 per eye.</p><h2>Recovery and Results</h2><p>Most patients experience immediate vision improvement with optimal results achieved within 1-3 months. The recovery process is quick with Day 1 showing initial healing and Month 3 achieving complete healing and optimal vision.</p><h2>Success Rates and Safety</h2><p>Egyptian LASIK centers report success rates of 95-98%, with most patients achieving 20/20 vision or better. Complications are rare and typically minor when they occur.</p>"}',
    '/blog-lasik-surgery.jpg',
    v_eye_surgery_id,
    v_author_id,
    'published',
    NOW() - INTERVAL '15 days',
    6,
    'LASIK Surgery in Egypt: Advanced Technology & Affordable Prices',
    'Discover why Egypt is a top destination for LASIK surgery. Learn about advanced technology, costs, and success rates at Egyptian eye clinics.'
  ) ON CONFLICT (slug) DO NOTHING;

  -- Post 3: Cardiac Surgery
  INSERT INTO public.blog_posts (
    slug, title, excerpt, content, featured_image, category_id, author_id,
    status, publish_date, reading_time, seo_title, seo_description
  ) VALUES (
    'cardiac-surgery-excellence-egypt-heart-centers',
    'Cardiac Surgery Excellence: Egypt''s World-Class Heart Centers',
    'Explore Egypt''s leading cardiac surgery facilities and the internationally trained surgeons performing life-saving procedures.',
    '{"type": "html", "data": "<p>Egypt has established itself as a regional leader in cardiac surgery, with world-class heart centers that attract patients from across the Middle East, Africa, and beyond. The combination of expert surgeons, advanced technology, and cost-effective treatments makes Egypt an excellent choice for cardiac care.</p><h2>Leading Cardiac Centers</h2><p>Egypt''s top cardiac facilities include internationally accredited hospitals with specialized heart centers featuring state-of-the-art cardiac catheterization laboratories, advanced cardiac surgery suites, intensive cardiac care units, cardiac rehabilitation programs, and 24/7 emergency cardiac services.</p><h2>Specialized Cardiac Procedures</h2><h3>Coronary Artery Bypass Surgery (CABG)</h3><p>Egyptian cardiac surgeons perform both traditional and minimally invasive bypass procedures with success rates exceeding 95%. Techniques include off-pump coronary artery bypass, minimally invasive direct coronary artery bypass, and robotic-assisted cardiac surgery.</p><h3>Heart Valve Surgery</h3><p>Comprehensive valve repair and replacement services using mechanical valve prosthetics, biological valve options, transcatheter aortic valve implantation (TAVI), and mitral valve clip procedures.</p><h3>Interventional Cardiology</h3><p>Advanced catheter-based treatments including coronary angioplasty and stenting, balloon valvuloplasty, atrial septal defect closure, and patent ductus arteriosus closure.</p><h2>Surgeon Expertise</h2><p>Egyptian cardiac surgeons are highly qualified with training from prestigious international institutions. Many hold certifications from the European Society of Cardiology, American College of Cardiology, Society of Thoracic Surgeons, and International Society for Heart and Lung Transplantation.</p><h2>Cost Advantages</h2><p>Cardiac surgery costs in Egypt are significantly lower than Western countries: Coronary Bypass: $12,500-$18,000 (vs $70,000+ in USA), Valve Replacement: $15,000-$22,000 (vs $80,000+ in USA), and Angioplasty: $8,500-$12,000 (vs $30,000+ in USA).</p>"}',
    '/blog-cardiac-surgery.jpg',
    v_cardiac_surgery_id,
    v_author_id,
    'published',
    NOW() - INTERVAL '17 days',
    10,
    'Cardiac Surgery in Egypt: World-Class Heart Centers & Expert Care',
    'Explore Egypt''s leading cardiac surgery centers. Learn about procedures, surgeon expertise, technology, and cost advantages for heart patients.'
  ) ON CONFLICT (slug) DO NOTHING;

  -- Post 4: Dental Tourism
  INSERT INTO public.blog_posts (
    slug, title, excerpt, content, featured_image, category_id, author_id,
    status, publish_date, reading_time, seo_title, seo_description
  ) VALUES (
    'dental-tourism-egypt-top-destination',
    'Dental Tourism: Why Egypt is Becoming the Top Destination',
    'From dental implants to cosmetic dentistry, discover why Egypt offers the perfect combination of quality and affordability.',
    '{"type": "html", "data": "<p>Egypt''s dental tourism industry has experienced remarkable growth, attracting thousands of international patients seeking high-quality dental care at affordable prices. With modern clinics, skilled dentists, and comprehensive treatment options, Egypt has become a premier destination for dental tourism.</p><h2>Why Choose Egypt for Dental Care?</h2><h3>Exceptional Value</h3><p>Dental treatments in Egypt cost 60-80% less than equivalent procedures in Western countries, without compromising on quality or safety standards.</p><h3>Modern Facilities</h3><p>Egyptian dental clinics feature state-of-the-art equipment and technology, digital imaging and 3D scanning, computer-aided design and manufacturing (CAD/CAM), laser dentistry capabilities, and sterile and comfortable treatment environments.</p><h3>Qualified Professionals</h3><p>Egyptian dentists receive excellent training with many holding international qualifications and certifications from prestigious dental schools worldwide.</p><h2>Popular Dental Procedures</h2><h3>Dental Implants</h3><p>Egyptian dental clinics excel in implant dentistry using premium implant systems: Single Implants: $800-$1,500 (vs $3,000+ elsewhere), All-on-4: $6,000-$10,000 (vs $20,000+ elsewhere), All-on-6: $8,000-$12,000 (vs $25,000+ elsewhere).</p><h3>Cosmetic Dentistry</h3><p>Transform your smile with advanced cosmetic treatments: Porcelain Veneers: $300-$600 per tooth, Teeth Whitening: $200-$400, Composite Bonding: $150-$300 per tooth, and complete Smile Makeover packages available.</p><h3>Restorative Dentistry</h3><p>Comprehensive restoration services include crowns and bridges, root canal treatment, dentures (traditional and implant-supported), and periodontal treatment.</p><h2>Quality Assurance</h2><p>Egyptian dental clinics maintain high standards through international accreditation, strict sterilization protocols, premium materials and implant systems, comprehensive warranties, and follow-up care programs.</p>"}',
    '/blog-dental-care.jpg',
    v_dental_care_id,
    v_author_id,
    'published',
    NOW() - INTERVAL '19 days',
    7,
    'Dental Tourism in Egypt: Top Destination for Quality & Affordability',
    'Discover why Egypt is a leading dental tourism destination. Learn about procedures, costs, quality standards, and why thousands choose Egypt.'
  ) ON CONFLICT (slug) DO NOTHING;

  -- Post 5: Recovery and Wellness
  INSERT INTO public.blog_posts (
    slug, title, excerpt, content, featured_image, category_id, author_id,
    status, publish_date, reading_time, seo_title, seo_description
  ) VALUES (
    'recovery-wellness-medical-trip-egypt',
    'Recovery and Wellness: Making the Most of Your Medical Trip',
    'Tips for a smooth recovery while exploring Egypt''s rich culture and history during your medical tourism journey.',
    '{"type": "html", "data": "<p>Recovery from medical procedures doesn''t have to mean being confined to a hospital room. Egypt offers unique opportunities to combine healing with cultural exploration, creating a holistic wellness experience that can enhance your recovery journey.</p><h2>Planning Your Recovery Phase</h2><h3>Pre-Procedure Preparation</h3><p>Optimize your recovery by preparing in advance: Arrive 2-3 days before your procedure for acclimatization, book accommodation near your medical facility, arrange for a companion or caregiver if needed, research recovery-friendly activities, and understand your post-procedure limitations.</p><h3>Immediate Post-Procedure Care</h3><p>Focus on healing during the initial recovery period: Follow all medical instructions carefully, stay hydrated and maintain proper nutrition, get adequate rest and sleep, take prescribed medications as directed, and attend all follow-up appointments.</p><h2>Recovery-Friendly Activities</h2><h3>Gentle Cultural Exploration</h3><p>Once cleared by your medical team, consider these low-impact activities: Museum visits to explore Egyptian Museum or Coptic Museum at your own pace, garden walks in Al-Azhar Park or Botanical Gardens, cultural center visits to art galleries, and local market browsing at Khan el-Khalili for souvenirs.</p><h3>Wellness Activities</h3><p>Incorporate wellness practices into your recovery: Spa treatments with gentle massages and relaxation therapies, meditation and mindfulness in peaceful settings, light yoga with gentle stretching and breathing exercises, and thermal baths for therapeutic relaxation.</p><h2>Nutrition for Recovery</h2><h3>Egyptian Healthy Cuisine</h3><p>Egypt offers numerous nutritious foods that support healing: Fresh fruits like dates and figs rich in vitamins, herbal teas including hibiscus and mint for hydration, lean proteins from fresh fish and poultry, whole grains in traditional bread and rice dishes, and fresh vegetables in salads and cooked dishes.</p><h2>Mental Health and Wellness</h2><p>Recovery involves emotional as well as physical healing: Stay connected with family and friends, join online support groups, consider counseling services if available, practice stress-reduction techniques, and maintain a positive outlook.</p>"}',
    '/blog-wellness-recovery.jpg',
    v_wellness_id,
    v_author_id,
    'published',
    NOW() - INTERVAL '22 days',
    5,
    'Recovery & Wellness Tips for Medical Tourism in Egypt',
    'Learn how to optimize your recovery while enjoying Egypt''s culture. Tips for wellness activities, nutrition, and making the most of your medical trip.'
  ) ON CONFLICT (slug) DO NOTHING;

  -- Post 6: Medical Insurance
  INSERT INTO public.blog_posts (
    slug, title, excerpt, content, featured_image, category_id, author_id,
    status, publish_date, reading_time, seo_title, seo_description
  ) VALUES (
    'medical-insurance-international-coverage-guide',
    'Understanding Medical Insurance and International Coverage',
    'Navigate the complexities of medical insurance for international treatments and learn about coverage options.',
    '{"type": "html", "data": "<p>Understanding medical insurance coverage for international treatments is crucial for medical tourists. While insurance policies vary significantly, there are ways to maximize coverage and minimize out-of-pocket expenses for your medical journey to Egypt.</p><h2>Types of Insurance Coverage</h2><h3>Domestic Health Insurance</h3><p>Most domestic health insurance plans have limitations for international treatment: Emergency coverage usually covers emergency treatments abroad, elective procedures are rarely covered when performed internationally, pre-authorization may be required for coverage consideration, and network restrictions with out-of-network penalties may apply.</p><h3>Travel Health Insurance</h3><p>Specialized travel insurance can provide additional coverage: Emergency medical treatment, medical evacuation, trip cancellation due to medical reasons, extended stay coverage, and prescription medication coverage.</p><h3>International Health Insurance</h3><p>Comprehensive international plans offer broader coverage: Worldwide treatment coverage, planned medical procedures, ongoing treatment continuation, multiple country coverage, and higher coverage limits.</p><h2>Insurance Strategies for Medical Tourism</h2><h3>Pre-Approval Process</h3><p>Maximize your chances of coverage approval: Obtain detailed medical necessity letters, demonstrate cost savings compared to domestic treatment, provide hospital accreditation and surgeon credentials, and allow ample time for the approval process.</p><h3>Coverage Scenarios</h3><p>Different situations may affect coverage: Medical necessity with required treatments have better coverage chances, procedures unavailable locally or domestically, emergency situations due to long domestic wait lists, and cost effectiveness with significant savings may influence coverage.</p><h2>Working with Egyptian Healthcare Providers</h2><h3>Documentation Requirements</h3><p>Ensure proper documentation for insurance claims: Detailed medical reports, itemized billing statements, procedure codes (ICD-10/CPT), physician credentials and licenses, and hospital accreditation certificates.</p><h2>Reimbursement Strategies</h2><p>Optimize your reimbursement chances: Submit claims promptly, include all required documentation, provide English translations when necessary, follow up on claim status regularly, and appeal denials with additional evidence.</p>"}',
    '/blog-medical-insurance.jpg',
    v_insurance_id,
    v_author_id,
    'published',
    NOW() - INTERVAL '24 days',
    9,
    'Medical Insurance Guide for International Treatment Coverage',
    'Navigate medical insurance for international treatments. Learn about coverage types, strategies for approval, and maximizing reimbursement.'
  ) ON CONFLICT (slug) DO NOTHING;

END $$;

-- Add some common tags
INSERT INTO public.blog_tags (name, slug)
VALUES
  ('Medical Tourism', 'medical-tourism'),
  ('Healthcare', 'healthcare'),
  ('Egypt', 'egypt'),
  ('Cost Savings', 'cost-savings'),
  ('Quality Care', 'quality-care'),
  ('Recovery', 'recovery'),
  ('Patient Guide', 'patient-guide'),
  ('Surgery', 'surgery'),
  ('LASIK', 'lasik'),
  ('Cardiac Care', 'cardiac-care'),
  ('Dental Care', 'dental-care'),
  ('Wellness', 'wellness'),
  ('Insurance', 'insurance'),
  ('Travel Tips', 'travel-tips')
ON CONFLICT (slug) DO NOTHING;

-- Link tags to posts (example for first post)
DO $$
DECLARE
  v_post_id UUID;
  v_tag_id UUID;
BEGIN
  -- Get post ID for medical tourism guide
  SELECT id INTO v_post_id FROM public.blog_posts WHERE slug = 'complete-guide-medical-tourism-egypt' LIMIT 1;

  IF v_post_id IS NOT NULL THEN
    -- Add tags to the medical tourism post
    INSERT INTO public.blog_post_tags (post_id, tag_id)
    SELECT v_post_id, id FROM public.blog_tags WHERE slug IN ('medical-tourism', 'egypt', 'patient-guide', 'healthcare')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
