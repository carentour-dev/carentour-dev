TRUNCATE public.treatments RESTART IDENTITY CASCADE;
TRUNCATE public.treatment_procedures RESTART IDENTITY CASCADE;

WITH inserted AS (
    INSERT INTO public.treatments (
        id,
        name,
        slug,
        category,
        summary,
        description,
        overview,
        base_price,
        currency,
        duration_days,
        recovery_time_days,
        success_rate,
        ideal_candidates,
        card_image_url,
        hero_image_url,
        is_active,
        is_featured
    )
    VALUES
        (
            gen_random_uuid(),
            'IVF & Fertility Treatments',
            'ivf-fertility-treatments',
            'fertility-treatment',
            'Comprehensive IVF care with genetic testing and ' ||
            'concierge support.',
            'Personalised fertility programs combining IVF, embryo testing, ' ||
            'and wellness support tailored for international patients.',
            'Our fertility specialists coordinate ovarian stimulation, egg ' ||
            'retrieval, genetic testing, and embryo transfer with concierge ' ||
            'care throughout your stay in Cairo.',
            5800,
            'USD',
            18,
            14,
            68,
            ARRAY[
                'Couples pursuing IVF with genetic screening',
                'Women preserving fertility or using donor programs',
                'Patients seeking an accelerated IVF timeline ' ||
                'with concierge care'
            ],
            '/consultation.webp',
            '/consultation.webp',
            TRUE,
            TRUE
        ),
        (
            gen_random_uuid(),
            'Bariatric (Sleeve) Surgery',
            'bariatric-sleeve-surgery',
            'general-surgery',
            'Metabolic sleeve gastrectomy with dedicated nutrition and ' ||
            'recovery program.',
            'Lose weight safely with minimally invasive gastric sleeve ' ||
            'surgery supported by endocrinology and nutrition teams.',
            'Care N Tour bariatric surgeons use enhanced recovery pathways, ' ||
            'structured nutritional coaching, and concierge travel planning ' ||
            'for long-term success.',
            6400,
            'USD',
            5,
            21,
            90,
            ARRAY[
                'BMI 35+ with related health conditions',
                'Patients committed to lifestyle adjustments and follow-up',
                'Candidates cleared by pre-operative nutrition and ' ||
                'psychological screening'
            ],
            '/surgery-suite.webp',
            '/surgery-suite.webp',
            TRUE,
            TRUE
        ),
        (
            gen_random_uuid(),
            'Cosmetic & Plastic Surgery',
            'cosmetic-plastic-surgery',
            'cosmetic-surgery',
            'Premium aesthetic surgery packages with holistic recovery ' ||
            'care.',
            'Experience world-class cosmetic surgery in Egypt with ' ||
            'VASER liposuction, lifts, and contouring supported by luxury ' ||
            'recovery services.',
            'Our cosmetic surgeons deliver natural results through ' ||
            'advanced body contouring, rhinoplasty, and tailored aftercare ' ||
            'programs in accredited facilities.',
            7500,
            'USD',
            4,
            21,
            92,
            ARRAY[
                'Adults at a stable weight seeking aesthetic refinement',
                'Non-smokers or individuals able to cease smoking before ' ||
                'surgery',
                'Patients with realistic expectations and commitment to ' ||
                'post-op protocols'
            ],
            '/consultation.webp',
            '/consultation.webp',
            TRUE,
            TRUE
        ),
        (
            gen_random_uuid(),
            'Advanced Dental Care',
            'advanced-dental-care',
            'dental-care',
            'Digital smile design and implant dentistry in one coordinated ' ||
            'visit.',
            'Transform your smile with porcelain veneers, implants, and ' ||
            'full-mouth rehabilitation powered by digital planning.',
            'Care N Tour dental specialists craft custom treatment plans ' ||
            'blending implantology, cosmetic dentistry, and concierge ' ||
            'follow-up for international patients.',
            5400,
            'USD',
            7,
            10,
            96,
            ARRAY[
                'Patients seeking full-arch cosmetic rejuvenation',
                'Individuals requiring complex implant or restorative ' ||
                'dentistry',
                'Visitors wanting minimal clinic visits with predictable ' ||
                'smile design'
            ],
            '/surgery-suite.webp',
            '/surgery-suite.webp',
            TRUE,
            TRUE
        )
    RETURNING *
),
procedure_payloads AS (
    SELECT
        'ivf-fertility-treatments'::text AS slug,
        jsonb_build_array(
            jsonb_build_object(
                'name',
                'IVF with PGT-A',
                'description',
                'Targeted IVF cycle with genetic testing and embryo transfer.',
                'duration',
                '18 days',
                'recovery',
                '2 weeks',
                'price',
                '$5,600 - $6,200',
                'egypt_price',
                5800,
                'success_rate',
                '68%',
                'candidate_requirements',
                ARRAY[
                    'Fertility workup with AMH/FSH levels',
                    'No contraindications to pregnancy',
                    'Genetic counseling completed'
                ],
                'recovery_stages',
                jsonb_build_array(
                    jsonb_build_object(
                        'stage',
                        'Stimulation',
                        'description',
                        'Daily monitoring and medication adjustments.'
                    ),
                    jsonb_build_object(
                        'stage',
                        'Egg retrieval',
                        'description',
                        'Sedated procedure with same-day discharge.'
                    ),
                    jsonb_build_object(
                        'stage',
                        'Embryo culture',
                        'description',
                        'Laboratory monitoring with daily status updates.'
                    ),
                    jsonb_build_object(
                        'stage',
                        'Transfer',
                        'description',
                        'Embryo transfer and follow-up testing.'
                    )
                ),
                'international_prices',
                jsonb_build_array(
                    jsonb_build_object(
                        'country',
                        'United States',
                        'currency',
                        '$',
                        'price',
                        18500
                    ),
                    jsonb_build_object(
                        'country',
                        'Canada',
                        'currency',
                        'C$',
                        'price',
                        15000
                    ),
                    jsonb_build_object(
                        'country',
                        'United Kingdom',
                        'currency',
                        '£',
                        'price',
                        10800
                    )
                ),
                'display_order',
                0
            ),
            jsonb_build_object(
                'name',
                'Egg Freezing Retreat',
                'description',
                'Two-week fertility preservation program with concierge ' ||
                'wellness.',
                'duration',
                '14 days',
                'recovery',
                '5 days',
                'price',
                '$3,900 - $4,300',
                'egypt_price',
                4200,
                'success_rate',
                'Cycle dependent',
                'candidate_requirements',
                ARRAY[
                    'Baseline ovarian reserve tests',
                    'No contraindications to hormone therapy',
                    'Cryostorage consent and future planning'
                ],
                'recovery_stages',
                jsonb_build_array(
                    jsonb_build_object(
                        'stage',
                        'Stimulation',
                        'description',
                        'Hormone injections with monitoring in clinic.'
                    ),
                    jsonb_build_object(
                        'stage',
                        'Retrieval',
                        'description',
                        'Procedure with light sedation.'
                    ),
                    jsonb_build_object(
                        'stage',
                        'Recovery',
                        'description',
                        'Relaxation suites with nutrition support.'
                    ),
                    jsonb_build_object(
                        'stage',
                        'Follow-up',
                        'description',
                        'Hormonal review and future planning.'
                    )
                ),
                'international_prices',
                jsonb_build_array(
                    jsonb_build_object(
                        'country',
                        'United States',
                        'currency',
                        '$',
                        'price',
                        10500
                    ),
                    jsonb_build_object(
                        'country',
                        'Singapore',
                        'currency',
                        '$',
                        'price',
                        8200
                    ),
                    jsonb_build_object(
                        'country',
                        'Italy',
                        'currency',
                        '€',
                        'price',
                        7600
                    )
                ),
                'display_order',
                1
            )
        ) AS payload
    UNION ALL
    SELECT
        'bariatric-sleeve-surgery'::text AS slug,
        jsonb_build_array(
            jsonb_build_object(
                'name',
                'Laparoscopic Sleeve Gastrectomy',
                'description',
                'Minimally invasive gastric sleeve with enhanced recovery.',
                'duration',
                '2 hours',
                'recovery',
                '21 days',
                'price',
                '$6,000 - $6,800',
                'egypt_price',
                6400,
                'success_rate',
                '90%',
                'candidate_requirements',
                ARRAY[
                    'BMI 35+ with comorbidities',
                    'Pre-operative nutrition program',
                    'Psychological clearance'
                ],
                'recovery_stages',
                jsonb_build_array(
                    jsonb_build_object(
                        'stage',
                        'Day 0-1',
                        'description',
                        'Hospital stay and leak test.'
                    ),
                    jsonb_build_object(
                        'stage',
                        'Day 2-7',
                        'description',
                        'Liquid diet and guided ambulation.'
                    ),
                    jsonb_build_object(
                        'stage',
                        'Week 3',
                        'description',
                        'Transition to soft foods.'
                    ),
                    jsonb_build_object(
                        'stage',
                        'Month 3',
                        'description',
                        'Lifestyle coaching and activity ramp-up.'
                    )
                ),
                'international_prices',
                jsonb_build_array(
                    jsonb_build_object(
                        'country',
                        'United States',
                        'currency',
                        '$',
                        'price',
                        19500
                    ),
                    jsonb_build_object(
                        'country',
                        'United Kingdom',
                        'currency',
                        '£',
                        'price',
                        12500
                    ),
                    jsonb_build_object(
                        'country',
                        'Saudi Arabia',
                        'currency',
                        '﷼',
                        'price',
                        18000
                    )
                ),
                'display_order',
                0
            ),
            jsonb_build_object(
                'name',
                'Metabolic Diabetes Reset',
                'description',
                'Single-anastomosis bypass optimised for Type 2 diabetes ' ||
                'remission.',
                'duration',
                '3 hours',
                'recovery',
                '4 weeks',
                'price',
                '$6,800 - $7,500',
                'egypt_price',
                7100,
                'success_rate',
                '88%',
                'candidate_requirements',
                ARRAY[
                    'Endocrinology clearance',
                    'HbA1c above 7.5%',
                    'Commitment to post-op follow-up'
                ],
                'recovery_stages',
                jsonb_build_array(
                    jsonb_build_object(
                        'stage',
                        'Week 0',
                        'description',
                        'Hospital stay and glycemic monitoring.'
                    ),
                    jsonb_build_object(
                        'stage',
                        'Week 1-2',
                        'description',
                        'Diet progression with endocrinology consults.'
                    ),
                    jsonb_build_object(
                        'stage',
                        'Week 4',
                        'description',
                        'Return to light activity.'
                    ),
                    jsonb_build_object(
                        'stage',
                        'Month 3',
                        'description',
                        'Medication tapering and lifestyle integration.'
                    )
                ),
                'international_prices',
                jsonb_build_array(
                    jsonb_build_object(
                        'country',
                        'United States',
                        'currency',
                        '$',
                        'price',
                        22000
                    ),
                    jsonb_build_object(
                        'country',
                        'Germany',
                        'currency',
                        '€',
                        'price',
                        15500
                    ),
                    jsonb_build_object(
                        'country',
                        'United Arab Emirates',
                        'currency',
                        'د.إ',
                        'price',
                        18000
                    )
                ),
                'display_order',
                1
            )
        ) AS payload
    UNION ALL
    SELECT
        'cosmetic-plastic-surgery'::text AS slug,
        jsonb_build_array(
            jsonb_build_object(
                'name',
                '360 Lipo-Sculpt & Fat Transfer',
                'description',
                'High-definition VASER liposuction with targeted fat grafting.',
                'duration',
                '4 hours',
                'recovery',
                '3 weeks',
                'price',
                '$7,200 - $7,800',
                'egypt_price',
                7500,
                'success_rate',
                '92%',
                'candidate_requirements',
                ARRAY[
                    'BMI below 32',
                    'No bleeding disorders',
                    'Adherence to compression garment protocol'
                ],
                'recovery_stages',
                jsonb_build_array(
                    jsonb_build_object(
                        'stage',
                        'Week 1',
                        'description',
                        'Swelling control and lymphatic massage.'
                    ),
                    jsonb_build_object(
                        'stage',
                        'Week 2',
                        'description',
                        'Light activity and mobility.'
                    ),
                    jsonb_build_object(
                        'stage',
                        'Week 3',
                        'description',
                        'Begin contour refinement exercises.'
                    ),
                    jsonb_build_object(
                        'stage',
                        'Month 3',
                        'description',
                        'Final silhouette results.'
                    )
                ),
                'international_prices',
                jsonb_build_array(
                    jsonb_build_object(
                        'country',
                        'United States',
                        'currency',
                        '$',
                        'price',
                        20500
                    ),
                    jsonb_build_object(
                        'country',
                        'United Kingdom',
                        'currency',
                        '£',
                        'price',
                        15200
                    ),
                    jsonb_build_object(
                        'country',
                        'Brazil',
                        'currency',
                        'R$',
                        'price',
                        9800
                    )
                ),
                'display_order',
                0
            ),
            jsonb_build_object(
                'name',
                'Ultrasonic Rhinoplasty',
                'description',
                'Piezo-assisted rhinoplasty with cartilage preservation.',
                'duration',
                '3 hours',
                'recovery',
                '14 days',
                'price',
                '$3,400 - $3,800',
                'egypt_price',
                3650,
                'success_rate',
                '93%',
                'candidate_requirements',
                ARRAY[
                    'Stable nasal anatomy',
                    'No active sinus infections',
                    'Ability to avoid smoking pre/post surgery'
                ],
                'recovery_stages',
                jsonb_build_array(
                    jsonb_build_object(
                        'stage',
                        'Day 0-5',
                        'description',
                        'Splint and silicone stents in place.'
                    ),
                    jsonb_build_object(
                        'stage',
                        'Week 2',
                        'description',
                        'Return to work and light exercise.'
                    ),
                    jsonb_build_object(
                        'stage',
                        'Month 1',
                        'description',
                        'Swelling reduction and refinement.'
                    ),
                    jsonb_build_object(
                        'stage',
                        'Month 12',
                        'description',
                        'Final profile evaluation.'
                    )
                ),
                'international_prices',
                jsonb_build_array(
                    jsonb_build_object(
                        'country',
                        'United States',
                        'currency',
                        '$',
                        'price',
                        12500
                    ),
                    jsonb_build_object(
                        'country',
                        'France',
                        'currency',
                        '€',
                        'price',
                        8900
                    ),
                    jsonb_build_object(
                        'country',
                        'Turkey',
                        'currency',
                        '$',
                        'price',
                        5600
                    )
                ),
                'display_order',
                1
            )
        ) AS payload
    UNION ALL
    SELECT
        'advanced-dental-care'::text AS slug,
        jsonb_build_array(
            jsonb_build_object(
                'name',
                'Digital Smile Veneers',
                'description',
                '20-unit porcelain veneer package with digital preview and ' ||
                'mock-ups.',
                'duration',
                '3 visits',
                'recovery',
                '10 days',
                'price',
                '$5,000 - $6,000',
                'egypt_price',
                5400,
                'success_rate',
                '96%',
                'candidate_requirements',
                ARRAY[
                    'Healthy gingival tissues',
                    'Night guard compliance',
                    'Stable bite and enamel health'
                ],
                'recovery_stages',
                jsonb_build_array(
                    jsonb_build_object(
                        'stage',
                        'Day 0',
                        'description',
                        'Digital scans and smile design.'
                    ),
                    jsonb_build_object(
                        'stage',
                        'Day 3',
                        'description',
                        'Mock-up preview and adjustments.'
                    ),
                    jsonb_build_object(
                        'stage',
                        'Day 5',
                        'description',
                        'Veneer placement and bite balancing.'
                    ),
                    jsonb_build_object(
                        'stage',
                        'Month 1',
                        'description',
                        'Follow-up polish and maintenance.'
                    )
                ),
                'international_prices',
                jsonb_build_array(
                    jsonb_build_object(
                        'country',
                        'United States',
                        'currency',
                        '$',
                        'price',
                        19500
                    ),
                    jsonb_build_object(
                        'country',
                        'Canada',
                        'currency',
                        'C$',
                        'price',
                        16200
                    ),
                    jsonb_build_object(
                        'country',
                        'Spain',
                        'currency',
                        '€',
                        'price',
                        9800
                    )
                ),
                'display_order',
                0
            ),
            jsonb_build_object(
                'name',
                'All-on-4 Implant Rehabilitation',
                'description',
                'Full-arch implant placement with immediate provisional ' ||
                'bridge.',
                'duration',
                '5 days total stay',
                'recovery',
                '3 months',
                'price',
                '$9,500 - $10,500',
                'egypt_price',
                9800,
                'success_rate',
                '93%',
                'candidate_requirements',
                ARRAY[
                    'Cone-beam CT review',
                    'Systemic stability',
                    'Commitment to maintenance visits'
                ],
                'recovery_stages',
                jsonb_build_array(
                    jsonb_build_object(
                        'stage',
                        'Day 0',
                        'description',
                        'Implant placement and provisional bridge.'
                    ),
                    jsonb_build_object(
                        'stage',
                        'Day 1-5',
                        'description',
                        'Post-op checks and hygiene instruction.'
                    ),
                    jsonb_build_object(
                        'stage',
                        'Week 8',
                        'description',
                        'Impressions for final prosthesis.'
                    ),
                    jsonb_build_object(
                        'stage',
                        'Month 3',
                        'description',
                        'Delivery of definitive zirconia bridge.'
                    )
                ),
                'international_prices',
                jsonb_build_array(
                    jsonb_build_object(
                        'country',
                        'United States',
                        'currency',
                        '$',
                        'price',
                        32000
                    ),
                    jsonb_build_object(
                        'country',
                        'United Kingdom',
                        'currency',
                        '£',
                        'price',
                        21000
                    ),
                    jsonb_build_object(
                        'country',
                        'Germany',
                        'currency',
                        '€',
                        'price',
                        24500
                    )
                ),
                'display_order',
                1
            )
        ) AS payload
),
procedure_rows AS (
    SELECT
        payload.slug,
        procedure_record.*
    FROM procedure_payloads AS payload
    CROSS JOIN LATERAL jsonb_to_recordset(payload.payload) AS procedure_record(
        name text,
        description text,
        duration text,
        recovery text,
        price text,
        egypt_price numeric,
        success_rate text,
        candidate_requirements text[],
        recovery_stages jsonb,
        international_prices jsonb,
        display_order integer
    )
)

INSERT INTO public.treatment_procedures (
    id,
    treatment_id,
    name,
    description,
    duration,
    recovery,
    price,
    egypt_price,
    success_rate,
    candidate_requirements,
    recovery_stages,
    international_prices,
    display_order
)
SELECT
    gen_random_uuid(),
    inserted.id,
    procedure_rows.name,
    procedure_rows.description,
    procedure_rows.duration,
    procedure_rows.recovery,
    procedure_rows.price,
    procedure_rows.egypt_price,
    procedure_rows.success_rate,
    procedure_rows.candidate_requirements,
    procedure_rows.recovery_stages,
    procedure_rows.international_prices,
    procedure_rows.display_order
FROM inserted
JOIN procedure_rows ON procedure_rows.slug = inserted.slug
ORDER BY
    inserted.slug,
    procedure_rows.display_order;
