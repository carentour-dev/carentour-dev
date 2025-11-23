-- FAQs managed via the CMS instead of hardcoded content.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL CHECK (char_length(trim(category)) > 0),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('draft', 'published')),
    position INTEGER NOT NULL DEFAULT 0, -- noqa: RF04
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.faqs
DROP CONSTRAINT IF EXISTS uq_faqs_category_question;

ALTER TABLE public.faqs
ADD CONSTRAINT uq_faqs_category_question UNIQUE (category, question);

CREATE INDEX IF NOT EXISTS idx_faqs_category_position
ON public.faqs (category, position, created_at);

CREATE OR REPLACE FUNCTION public.faqs_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_faqs_updated_at ON public.faqs;
CREATE TRIGGER trg_faqs_updated_at
BEFORE UPDATE ON public.faqs
FOR EACH ROW
EXECUTE FUNCTION public.faqs_set_updated_at();

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS read_faqs ON public.faqs;
CREATE POLICY read_faqs
ON public.faqs
FOR SELECT
USING (status = 'published' OR public.is_admin_or_editor());

DROP POLICY IF EXISTS insert_faqs ON public.faqs;
CREATE POLICY insert_faqs
ON public.faqs
FOR INSERT
WITH CHECK (public.is_admin_or_editor());

DROP POLICY IF EXISTS update_faqs ON public.faqs;
CREATE POLICY update_faqs
ON public.faqs
FOR UPDATE
USING (public.is_admin_or_editor())
WITH CHECK (public.is_admin_or_editor());

DROP POLICY IF EXISTS delete_faqs ON public.faqs;
CREATE POLICY delete_faqs
ON public.faqs
FOR DELETE
USING (public.is_admin_or_editor());

-- Seed the table with the current FAQ content to preserve today’s experience.
-- noqa: disable=LT01,LT02,LT05
INSERT INTO public.faqs (category, question, answer, status, position)
VALUES
    ('general', $$What is medical tourism and why choose Egypt?$$, $$Medical tourism involves traveling to another country for medical treatment. Egypt offers world-class healthcare service providers, internationally trained doctors, significant cost savings (50-70% less than Western countries), and the opportunity to recover in a historically rich environment with excellent hospitality.$$ , 'published', 1),
    ('general', $$Are Egyptian medical service providers up to international standards?$$, $$Yes, our partner hospitals are internationally accredited (JCI, ISO) with state-of-the-art equipment and internationally trained doctors. Many Egyptian physicians have trained in Europe, the US, or Canada and hold international certifications.$$ , 'published', 2),
    ('general', $$What languages are spoken by medical staff?$$, $$All our partner doctors and medical coordinators are fluent in English. Many also speak Arabic, French, German, and other languages. We provide translation services when needed to ensure clear communication throughout your treatment.$$ , 'published', 3),
    ('general', $$How do I know if I'm a candidate for treatment in Egypt?$$, $$Our medical coordinators will review your medical history and current condition through a free consultation. We'll connect you with specialists who will assess your case and recommend the best treatment options available.$$ , 'published', 4),

    ('visa', $$Do I need a visa to visit Egypt for medical treatment?$$, $$Most nationalities require a visa to enter Egypt. We assist with medical visa applications, which often have expedited processing. Tourist visas are also acceptable for medical tourism. We provide detailed guidance based on your nationality.$$ , 'published', 1),
    ('visa', $$What documents do I need for medical treatment in Egypt?$$, $$You'll need a valid passport, visa, medical records, insurance documentation (if applicable), and any relevant test results. We provide a comprehensive checklist and assist with document preparation and translation if needed.$$ , 'published', 2),
    ('visa', $$How long can I stay in Egypt for treatment?$$, $$Tourist visas typically allow 30-day stays with possible extensions. Medical visas can accommodate longer treatment periods. We help coordinate visa duration with your treatment timeline and recovery needs.$$ , 'published', 3),
    ('visa', $$Do you provide airport pickup and assistance?$$, $$Yes, we offer complimentary airport pickup and drop-off services. Our team will meet you at Cairo International Airport and assist with all arrival procedures, including transportation to your accommodation or hospital.$$ , 'published', 4),

    ('treatments', $$What medical specialties are available?$$, $$We offer comprehensive medical services including cardiac surgery, orthopedics, cosmetic surgery, dental care, oncology, neurosurgery, fertility treatments, bariatric surgery, ophthalmology (LASIK), and organ transplants.$$ , 'published', 1),
    ('treatments', $$How do I choose the right doctor for my treatment?$$, $$Our medical coordinators will match you with specialists based on your condition, preferred treatment approach, and doctor qualifications. You can review doctor profiles, credentials, and patient testimonials before making your decision.$$ , 'published', 2),
    ('treatments', $$Can I get a second opinion before treatment?$$, $$Absolutely. We encourage second opinions and can arrange consultations with multiple specialists. This ensures you're completely confident in your treatment plan before proceeding.$$ , 'published', 3),
    ('treatments', $$What is the typical treatment timeline?$$, $$Treatment timelines vary by procedure. Simple treatments may require 3-7 days, while complex surgeries might need 2-4 weeks including recovery. We provide detailed timelines during your consultation and help plan accordingly.$$ , 'published', 4),

    ('costs', $$How much can I save compared to treatment in my home country?$$, $$Patients typically save 50-70% compared to US/European prices while receiving the same quality of care. For example, a heart bypass surgery costing $100,000+ in the US might cost $15,000-25,000 in Egypt, including accommodation and care.$$ , 'published', 1),
    ('costs', $$What is included in the treatment package?$$, $$Our packages include medical consultation, treatment/surgery, hospital stay, medications, follow-up visits, airport transfers, and medical coordination. Accommodation and additional services can be added based on your preferences.$$ , 'published', 2),
    ('costs', $$What payment methods do you accept?$$, $$We accept bank transfers, credit cards (Visa, MasterCard), and cash payments. Payment plans can be arranged for complex treatments. We provide detailed cost breakdowns and transparent pricing with no hidden fees.$$ , 'published', 3),
    ('costs', $$Will my insurance cover treatment in Egypt?$$, $$Some international insurance plans cover overseas medical treatment. We assist with insurance documentation and pre-authorization requests. Even with travel costs, many patients find significant savings compared to domestic treatment.$$ , 'published', 4),

    ('accommodation', $$What accommodation options are available?$$, $$We offer various options from 5-star hotels to comfortable apartments and medical hotels near hospitals. All accommodations are carefully selected for comfort, cleanliness, and proximity to medical service providers.$$ , 'published', 1),
    ('accommodation', $$Can my family accompany me during treatment?$$, $$Yes, we encourage family support during your medical journey. We can arrange accommodation for companions and provide guidance on their visa requirements. Many of our partner hotels offer family-friendly amenities.$$ , 'published', 2),
    ('accommodation', $$How is transportation handled during my stay?$$, $$We provide comprehensive transportation including airport transfers, hospital visits, and local sightseeing if your recovery allows. Our vehicles are comfortable and our drivers are experienced with medical tourism requirements.$$ , 'published', 3),
    ('accommodation', $$What amenities are available at your partner accommodations?$$, $$Our accommodations feature WiFi, 24/7 room service, medical-friendly amenities, proximity to hospitals, and comfortable environments for recovery. Many offer special services for medical tourists including nurse visits and dietary accommodations.$$ , 'published', 4),

    ('aftercare', $$What follow-up care is provided after treatment?$$, $$We provide comprehensive aftercare including post-operative check-ups, medication management, physical therapy if needed, and coordination with your home country physicians for ongoing care. Our support continues after you return home.$$ , 'published', 1),
    ('aftercare', $$How do you coordinate care with my doctor at home?$$, $$We provide detailed medical reports, imaging results, and treatment summaries to your home physicians. Our doctors can consult directly with your local healthcare team to ensure seamless care transition.$$ , 'published', 2),
    ('aftercare', $$What if complications arise after I return home?$$, $$Our doctors remain available for consultation after your return. We maintain communication channels and can provide guidance to your local physicians. In rare cases requiring additional treatment, we assist with return arrangements.$$ , 'published', 3),
    ('aftercare', $$Is rehabilitation therapy available in Egypt?$$, $$Yes, we have excellent rehabilitation service providers and experienced physical therapists. Extended recovery programs can be arranged in Egypt's favorable climate, often providing better outcomes than immediate return home.$$ , 'published', 4),

    ('emergency', $$What emergency support is available 24/7?$$, $$Our medical coordinators are available 24/7 for emergencies. We have direct connections to all partner hospitals and can arrange immediate medical attention. Emergency contact numbers are provided to all patients.$$ , 'published', 1),
    ('emergency', $$What safety measures are in place during treatment?$$, $$All partner service providers follow international safety protocols. We maintain comprehensive medical insurance, have emergency response procedures, and ensure all treatments are performed in accredited service providers with proper safety measures.$$ , 'published', 2),
    ('emergency', $$How do you handle medical emergencies?$$, $$We have established protocols for medical emergencies including immediate hospital access, specialist consultations, family notification procedures, and coordination with embassies if needed. Your safety is our top priority.$$ , 'published', 3),
    ('emergency', $$What if I need to return home urgently?$$, $$We assist with emergency travel arrangements including medical clearance for travel, escort services if needed, and coordination with airlines for medical accommodations. We work with international medical assistance companies when required.$$ , 'published', 4)
ON CONFLICT (category, question) DO NOTHING;
-- noqa: enable=LT01,LT02,LT05
