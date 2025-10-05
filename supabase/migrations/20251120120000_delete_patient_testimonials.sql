BEGIN;

-- Remove all patient reviews and testimonials to reset public content.
DELETE FROM public.doctor_reviews;

DELETE FROM public.patient_stories;

-- Ensure patients no longer show as having testimonials.
UPDATE public.patients
SET has_testimonial = false
WHERE has_testimonial IS TRUE;

COMMIT;
