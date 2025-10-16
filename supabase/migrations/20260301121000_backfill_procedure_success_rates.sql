BEGIN;

WITH source AS (
    SELECT
        source_data.treatment_slug,
        source_data.procedure_name,
        source_data.success_rate
    FROM (
        VALUES
        (
            'advanced-cardiac-bypass',
            'Hybrid Coronary Artery Bypass',
            '95%'
        ),
        (
            'tavr-program',
            'TAVR Procedure',
            '92%'
        ),
        (
            'retinal-repair-macular-care',
            'Pars Plana Vitrectomy',
            '94%'
        ),
        (
            'laser-vision-elite',
            'Custom LASIK',
            '97%'
        ),
        (
            'signature-smile-makeover',
            'Digital Smile Veneer Set',
            '96%'
        ),
        (
            'full-mouth-implant-rehab',
            'All-on-4 Implant Rehabilitation',
            '93%'
        ),
        (
            'comprehensive-bariatric-sleeve',
            'Laparoscopic Sleeve Gastrectomy',
            '90%'
        ),
        (
            'metabolic-diabetes-reset',
            'Mini Gastric Bypass',
            '88%'
        ),
        (
            'precision-orthopedic-knee-suite',
            'Robotic Knee Arthroplasty',
            '94%'
        ),
        (
            'comprehensive-fertility-journey',
            'IVF with PGT-A',
            '68%'
        ),
        (
            'concierge-egg-freezing-retreat',
            'Egg Freezing Cycle',
            'Cycle dependent'
        ),
        (
            'premium-body-contour',
            '360 Lipo-Sculpt & Fat Transfer',
            '92%'
        ),
        (
            'rhinoplasty-harmony-package',
            'Ultrasonic Rhinoplasty',
            '93%'
        ),
        (
            'advanced-neurosurgery-suite',
            'Intraoperative MRI Tumor Resection',
            '89%'
        ),
        (
            'targeted-oncology-proton-plan',
            'Hybrid Proton Planning & Surgery',
            '87%'
        ),
        (
            'oncology-chemotherapy-hub',
            'Genomic-Guided Chemo Cycle',
            'Variable by cancer type'
        ),
        (
            'advanced-lasik-cataract-center',
            'Femtosecond Laser Cataract Surgery',
            '95%'
        ),
        (
            'premium-oncology-immunotherapy',
            'Checkpoint Inhibitor Infusion Cycle',
            '78%'
        ),
        (
            'cardio-wellness-rehab-retreat',
            'Monitored Cardiac Fitness Program',
            'Program dependent'
        )
    ) AS source_data (treatment_slug, procedure_name, success_rate)
),

updates AS (
    SELECT
        tp.id,
        source_rows.success_rate
    FROM source AS source_rows
    INNER JOIN public.treatments AS t
        ON source_rows.treatment_slug = t.slug
    INNER JOIN public.treatment_procedures AS tp
        ON
            t.id = tp.treatment_id
            AND source_rows.procedure_name = tp.name
    WHERE
        tp.success_rate IS NULL
        OR btrim(tp.success_rate) = ''
)

UPDATE public.treatment_procedures AS tp
SET success_rate = updates.success_rate
FROM updates
WHERE tp.id = updates.id;

COMMIT;
