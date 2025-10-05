INSERT INTO public.treatments
  (name, slug, category, summary, description, overview, base_price, currency,
   duration_days, recovery_time_days, success_rate, ideal_candidates, procedures, is_active)
VALUES
  (
    'Advanced Cardiac Bypass',
    'advanced-cardiac-bypass',
    'cardiac-surgery',
    'Comprehensive bypass program for multi-vessel disease.',
    'Minimally invasive CABG with full cardiac rehab support.',
    'Our cardiac surgeons deliver multi-vessel bypass using hybrid OR suites and enhanced recovery protocols for international patients.',
    15500, 'USD', 7, 21, 95,
    ARRAY[
      'Patients with triple vessel disease',
      'Adults cleared for general anesthesia',
      'Individuals seeking shorter ICU stays'
    ],
    '[
      {
        "name": "Hybrid Coronary Artery Bypass",
        "description": "Combination of minimally invasive grafting with catheter-based stenting.",
        "duration": "6 hours",
        "recovery": "3 weeks",
        "price": "$14,500 - $17,500",
        "egyptPrice": 15500,
        "success_rate": "95%",
        "internationalPrices": [
          { "country": "United States", "flag": "🇺🇸", "price": 98000, "currency": "$" },
          { "country": "United Kingdom", "flag": "🇬🇧", "price": 42000, "currency": "£" },
          { "country": "Germany", "flag": "🇩🇪", "price": 52000, "currency": "€" }
        ],
        "candidateRequirements": [
          "Documented multi-vessel coronary disease",
          "Adequate ventricular function",
          "Completion of cardiac workup"
        ],
        "recoveryStages": [
          { "stage": "ICU (Day 0-1)", "description": "Hemodynamic monitoring and ventilation weaning." },
          { "stage": "Ward (Day 2-5)", "description": "Mobilisation, respiratory therapy, pain control." },
          { "stage": "Week 2", "description": "Outpatient cardiac rehab initiation." },
          { "stage": "Week 6", "description": "Return to work evaluation." }
        ]
      }
    ]'::jsonb,
    TRUE
  ),
  (
    'Transcatheter Aortic Valve Program',
    'tavr-program',
    'cardiac-surgery',
    'Valve replacement for high-risk aortic stenosis patients.',
    'Catheter-based valve replacement performed under conscious sedation.',
    'State-of-the-art TAVR suites deliver rapid recovery valve care with international standards.',
    18500, 'USD', 4, 14, 92,
    ARRAY[
      'Severe symptomatic aortic stenosis',
      'Patients not suitable for open surgery',
      'Individuals requiring short hospital stays'
    ],
    '[
      {
        "name": "TAVR Procedure",
        "description": "Percutaneous replacement of stenotic aortic valve using transfemoral access.",
        "duration": "2 hours",
        "recovery": "10 days",
        "price": "$18,000 - $22,000",
        "egyptPrice": 18500,
        "success_rate": "92%",
        "internationalPrices": [
          { "country": "United States", "flag": "🇺🇸", "price": 78000, "currency": "$" },
          { "country": "Canada", "flag": "🇨🇦", "price": 62000, "currency": "C$" },
          { "country": "France", "flag": "🇫🇷", "price": 48000, "currency": "€" }
        ],
        "candidateRequirements": [
          "Confirmed severe aortic valve stenosis",
          "Heart team eligibility assessment",
          "CTA imaging completed"
        ],
        "recoveryStages": [
          { "stage": "Day 0", "description": "Procedure and monitored recovery in hybrid suite." },
          { "stage": "Day 1-2", "description": "Telemetry observation and ambulation." },
          { "stage": "Week 1", "description": "First clinic follow-up with echocardiogram." },
          { "stage": "Month 1", "description": "Rehabilitation and medication optimisation." }
        ]
      }
    ]'::jsonb,
    TRUE
  ),
  (
    'Retinal Repair & Macular Care',
    'retinal-repair-macular-care',
    'eye-surgery',
    'Vitrectomy and macular services with advanced imaging.',
    'High-resolution OCT-guided retinal surgery for macular disorders.',
    'Ophthalmology experts deliver precise retinal interventions using 3D visualisation and fast-track recovery pathways.',
    3400, 'USD', 2, 7, 94,
    ARRAY[
      'Patients with macular holes or puckers',
      'Individuals with retinal detachments',
      'Medical tourists needing short stays'
    ],
    '[
      {
        "name": "Pars Plana Vitrectomy",
        "description": "Micro-incision retinal surgery for macular pathology and floaters.",
        "duration": "90 minutes",
        "recovery": "7 days",
        "price": "$3,200 - $3,600",
        "egyptPrice": 3400,
        "success_rate": "94%",
        "internationalPrices": [
          { "country": "United States", "flag": "🇺🇸", "price": 12500, "currency": "$" },
          { "country": "United Kingdom", "flag": "🇬🇧", "price": 7200, "currency": "£" },
          { "country": "Germany", "flag": "🇩🇪", "price": 6900, "currency": "€" }
        ],
        "candidateRequirements": [
          "Retinal surgeon evaluation",
          "Pre-operative imaging (OCT, fundus)",
          "Controlled systemic conditions"
        ],
        "recoveryStages": [
          { "stage": "Day 0", "description": "Same-day discharge with protective eye shield." },
          { "stage": "Day 1-3", "description": "Positioning regimen, topical medications." },
          { "stage": "Week 1", "description": "Follow-up exam and vision assessment." },
          { "stage": "Month 1", "description": "Return to regular activities." }
        ]
      }
    ]'::jsonb,
    TRUE
  ),
  (
    'Laser Vision Elite Package',
    'laser-vision-elite',
    'eye-surgery',
    'Wavefront-guided LASIK with corneal cross-linking option.',
    'Comprehensive refractive surgery package with lifetime enhancement warranty.',
    'Our refractive surgeons customise laser profiles to deliver premium vision outcomes for international clients.',
    2150, 'USD', 1, 5, 97,
    ARRAY[
      'Stable prescription for at least one year',
      'No underlying corneal diseases',
      'Age 21-55 with realistic expectations'
    ],
    '[
      {
        "name": "Custom LASIK",
        "description": "Wavefront-guided LASIK with topography integration and femtosecond flap creation.",
        "duration": "45 minutes",
        "recovery": "5 days",
        "price": "$2,000 - $2,400",
        "egyptPrice": 2150,
        "success_rate": "97%",
        "internationalPrices": [
          { "country": "United States", "flag": "🇺🇸", "price": 4500, "currency": "$" },
          { "country": "Australia", "flag": "🇦🇺", "price": 3800, "currency": "$" },
          { "country": "Germany", "flag": "🇩🇪", "price": 3600, "currency": "€" }
        ],
        "candidateRequirements": [
          "Corneal thickness > 500 microns",
          "Stable refraction documented",
          "No active ocular surface disease"
        ],
        "recoveryStages": [
          { "stage": "Day 0", "description": "Procedure and first check after 2 hours." },
          { "stage": "Day 1", "description": "Vision clarity 70%, lubricating drops regimen." },
          { "stage": "Day 3", "description": "Return to office work." },
          { "stage": "Month 1", "description": "Final refraction and enhancement planning." }
        ]
      }
    ]'::jsonb,
    TRUE
  ),
  (
    'Signature Smile Makeover',
    'signature-smile-makeover',
    'dental-care',
    'Full-arch aesthetic reconstruction in 7 days.',
    'Ceramic veneers and digital smile design for complete aesthetic transformation.',
    'Our dental artisans blend cosmetic expertise with digital workflows to deliver enduring smile makeovers.',
    5400, 'USD', 7, 10, 96,
    ARRAY[
      'Adults seeking a full cosmetic smile change',
      'Patients with healthy periodontal foundations',
      'Visitors wanting minimal clinic visits'
    ],
    '[
      {
        "name": "Digital Smile Veneer Set",
        "description": "20-unit porcelain veneer package with preview mock-ups.",
        "duration": "3 clinical visits",
        "recovery": "10 days",
        "price": "$5,000 - $6,000",
        "egyptPrice": 5400,
        "success_rate": "96%",
        "internationalPrices": [
          { "country": "United States", "flag": "🇺🇸", "price": 19500, "currency": "$" },
          { "country": "Canada", "flag": "🇨🇦", "price": 16200, "currency": "C$" },
          { "country": "Spain", "flag": "🇪🇸", "price": 9800, "currency": "€" }
        ],
        "candidateRequirements": [
          "Healthy gingival tissues",
          "Consent to enamel preparation",
          "Night guard compliance"
        ],
        "recoveryStages": [
          { "stage": "Day 0", "description": "Digital scans and prototype design." },
          { "stage": "Day 3", "description": "Mock-up preview and adjustments." },
          { "stage": "Day 5", "description": "Veneer cementation and bite balancing." },
          { "stage": "Month 1", "description": "Follow-up polish and maintenance plan." }
        ]
      }
    ]'::jsonb,
    TRUE
  ),
  (
    'Full-Mouth Implant Rehabilitation',
    'full-mouth-implant-rehab',
    'dental-care',
    'All-on-4/6 implant solution with same-day provisional teeth.',
    'Advanced bone grafting, guided surgery, and immediate loading for edentulous arches.',
    'Implantologists coordinate full-arch restorations using in-house labs and digital planning for predictable outcomes.',
    9800, 'USD', 5, 90, 93,
    ARRAY[
      'Edentulous or failing dentition',
      'Adequate bone or graft acceptance',
      'Non-smokers or committed to cessation'
    ],
    '[
      {
        "name": "All-on-4 Implant Rehabilitation",
        "description": "Full-arch implant placement with immediate provisional bridge.",
        "duration": "5 days total stay",
        "recovery": "3 months",
        "price": "$9,500 - $10,500",
        "egyptPrice": 9800,
        "success_rate": "93%",
        "internationalPrices": [
          { "country": "United States", "flag": "🇺🇸", "price": 32000, "currency": "$" },
          { "country": "United Kingdom", "flag": "🇬🇧", "price": 21000, "currency": "£" },
          { "country": "Germany", "flag": "🇩🇪", "price": 24500, "currency": "€" }
        ],
        "candidateRequirements": [
          "Cone-beam CT review",
          "Systemic stability",
          "Commitment to maintenance visits"
        ],
        "recoveryStages": [
          { "stage": "Day 0", "description": "Implant placement and provisional bridge." },
          { "stage": "Day 1-5", "description": "Post-op checks and hygiene instruction." },
          { "stage": "Week 8", "description": "Impressions for final prosthesis." },
          { "stage": "Month 3", "description": "Delivery of definitive zirconia bridge." }
        ]
      }
    ]'::jsonb,
    TRUE
  ),
  (
    'Comprehensive Bariatric Sleeve',
    'comprehensive-bariatric-sleeve',
    'general-surgery',
    'Minimally invasive sleeve gastrectomy with metabolic support.',
    'Multidisciplinary bariatric care including endocrinology, nutrition, and lifestyle coaching.',
    'Our bariatric center provides enhanced recovery sleeve procedures paired with concierge follow-up.',
    6400, 'USD', 5, 21, 90,
    ARRAY[
      'BMI 35+ with comorbidities',
      'Commitment to lifestyle change',
      'Psychological clearance'
    ],
    '[
      {
        "name": "Laparoscopic Sleeve Gastrectomy",
        "description": "Keyhole removal of gastric fundus to reduce stomach capacity.",
        "duration": "2 hours",
        "recovery": "21 days",
        "price": "$6,000 - $6,800",
        "egyptPrice": 6400,
        "success_rate": "90%",
        "internationalPrices": [
          { "country": "United States", "flag": "🇺🇸", "price": 19500, "currency": "$" },
          { "country": "United Kingdom", "flag": "🇬🇧", "price": 12500, "currency": "£" },
          { "country": "Saudi Arabia", "flag": "🇸🇦", "price": 18000, "currency": "﷼" }
        ],
        "candidateRequirements": [
          "Pre-op dietary compliance",
          "Endocrinology screening",
          "No active severe GERD"
        ],
        "recoveryStages": [
          { "stage": "Day 0-1", "description": "Hospital stay with leak test." },
          { "stage": "Day 2-7", "description": "Liquids and vitamin supplementation." },
          { "stage": "Week 3", "description": "Transition to soft diet." },
          { "stage": "Month 3", "description": "Lifestyle coaching and exercise ramp-up." }
        ]
      }
    ]'::jsonb,
    TRUE
  ),
  (
    'Metabolic Diabetes Reset',
    'metabolic-diabetes-reset',
    'general-surgery',
    'Metabolic gastric bypass tailored for Type 2 diabetes remission.',
    'High-resolution imaging and hormonal profiling guide bypass selection.',
    'We combine surgical expertise with metabolic clinics to reverse diabetes for global patients.',
    7100, 'USD', 6, 28, 88,
    ARRAY[
      'BMI 30-40 with uncontrolled Type 2 diabetes',
      'Patients seeking medication reduction',
      'Ability to follow nutritional plans'
    ],
    '[
      {
        "name": "Mini Gastric Bypass",
        "description": "Single-anastomosis bypass promoting hormonal changes for glycemic control.",
        "duration": "3 hours",
        "recovery": "4 weeks",
        "price": "$6,800 - $7,500",
        "egyptPrice": 7100,
        "success_rate": "88%",
        "internationalPrices": [
          { "country": "United States", "flag": "🇺🇸", "price": 22000, "currency": "$" },
          { "country": "Germany", "flag": "🇩🇪", "price": 15500, "currency": "€" },
          { "country": "United Arab Emirates", "flag": "🇦🇪", "price": 18000, "currency": "د.إ" }
        ],
        "candidateRequirements": [
          "Endocrinologist clearance",
          "HbA1c > 7.5%",
          "Commitment to post-op follow-up"
        ],
        "recoveryStages": [
          { "stage": "Week 0", "description": "Hospital stay and glycemic monitoring." },
          { "stage": "Week 1-2", "description": "Diet progression with endocrinology consults." },
          { "stage": "Week 4", "description": "Return to light activity." },
          { "stage": "Month 3", "description": "Medication tapering and lifestyle integration." }
        ]
      }
    ]'::jsonb,
    TRUE
  ),
  (
    'Precision Orthopedic Knee Suite',
    'precision-orthopedic-knee-suite',
    'orthopedic-surgery',
    'Computer-assisted knee replacement with rapid rehab.',
    'Orthopedic robotics and personalised implants restore mobility in record time.',
    'We deliver high-performance joint replacements with gait analysis and sports rehab facilities.',
    8700, 'USD', 6, 56, 94,
    ARRAY[
      'Severe osteoarthritis',
      'Failed conservative management',
      'Healthy weight-bearing capacity'
    ],
    '[
      {
        "name": "Robotic Knee Arthroplasty",
        "description": "Robotic-guided implant placement for optimal alignment and ligament balance.",
        "duration": "3 hours",
        "recovery": "8 weeks",
        "price": "$8,200 - $9,400",
        "egyptPrice": 8700,
        "success_rate": "94%",
        "internationalPrices": [
          { "country": "United States", "flag": "🇺🇸", "price": 52000, "currency": "$" },
          { "country": "United Kingdom", "flag": "🇬🇧", "price": 28000, "currency": "£" },
          { "country": "Australia", "flag": "🇦🇺", "price": 31000, "currency": "$" }
        ],
        "candidateRequirements": [
          "Radiographic confirmation of knee degeneration",
          "BMI < 40",
          "Commitment to post-op physio"
        ],
        "recoveryStages": [
          { "stage": "Day 0-2", "description": "Hospital stay and continuous passive motion." },
          { "stage": "Week 1-3", "description": "Outpatient physio and muscle strengthening." },
          { "stage": "Week 6", "description": "Return to daily activities." },
          { "stage": "Month 3", "description": "Low-impact sports clearance." }
        ]
      }
    ]'::jsonb,
    TRUE
  ),
  (
    'Spine Fusion & Disc Center',
    'spine-fusion-disc-center',
    'orthopedic-surgery',
    'Lumbar and cervical fusion with neuro-monitoring.',
    'Spine surgeons collaborate with neuromonitoring teams to stabilise complex degenerative conditions.',
    'International spine patients benefit from 3D navigation, neurology consults, and personalised rehab.',
    9200, 'USD', 8, 90, 91,
    ARRAY[
      'Chronic discogenic pain with instability',
      'Failed conservative therapy (6+ months)',
      'Smoking cessation adherence'
    ],
    '[
      {
        "name": "Transforaminal Lumbar Interbody Fusion",
        "description": "Restores spinal stability using cage implants and pedicle screw fixation.",
        "duration": "4 hours",
        "recovery": "12 weeks",
        "price": "$9,000 - $9,600",
        "egyptPrice": 9200,
        "success_rate": "91%",
        "internationalPrices": [
          { "country": "United States", "flag": "🇺🇸", "price": 73000, "currency": "$" },
          { "country": "Canada", "flag": "🇨🇦", "price": 44000, "currency": "C$" },
          { "country": "Germany", "flag": "🇩🇪", "price": 39000, "currency": "€" }
        ],
        "candidateRequirements": [
          "MRI and EMG correlation",
          "Bone density within acceptable range",
          "No uncontrolled diabetes"
        ],
        "recoveryStages": [
          { "stage": "Day 0-3", "description": "Hospital stay with bracing." },
          { "stage": "Week 2", "description": "Wound check and medication taper." },
          { "stage": "Week 6", "description": "Physical therapy and core strengthening." },
          { "stage": "Month 3", "description": "Return-to-work evaluation." }
        ]
      }
    ]'::jsonb,
    TRUE
  ),
  (
    'Comprehensive Fertility Journey',
    'comprehensive-fertility-journey',
    'fertility-treatment',
    'Full IVF cycle with genetic testing and donor matching options.',
    'Fertility specialists coordinate IVF, PGT-A testing, and personalised donor programs.',
    'The fertility journey includes concierge support, embryology innovations, and mental wellness coaching.',
    5800, 'USD', 18, 14, 68,
    ARRAY[
      'Couples with unexplained infertility',
      'Individuals requiring donor options',
      'Patients seeking gender selection under guidelines'
    ],
    '[
      {
        "name": "IVF with PGT-A",
        "description": "Ovarian stimulation, embryo biopsy, and euploid embryo transfer.",
        "duration": "18 days",
        "recovery": "2 weeks",
        "price": "$5,600 - $6,200",
        "egyptPrice": 5800,
        "success_rate": "68%",
        "internationalPrices": [
          { "country": "United States", "flag": "🇺🇸", "price": 18500, "currency": "$" },
          { "country": "Canada", "flag": "🇨🇦", "price": 15000, "currency": "C$" },
          { "country": "UK", "flag": "🇬🇧", "price": 10800, "currency": "£" }
        ],
        "candidateRequirements": [
          "Fertility workup with AMH/FSH levels",
          "No contraindications to pregnancy",
          "Genetic counseling completed"
        ],
        "recoveryStages": [
          { "stage": "Stimulation (Day 1-10)", "description": "Daily monitoring and injections." },
          { "stage": "Egg Retrieval (Day 11-12)", "description": "Sedation procedure and rest." },
          { "stage": "Embryo Biopsy", "description": "Lab testing and vitrification." },
          { "stage": "Transfer (Day 18)", "description": "Euploid embryo transfer and luteal support." }
        ]
      }
    ]'::jsonb,
    TRUE
  ),
  (
    'Concierge Egg Freezing Retreat',
    'concierge-egg-freezing-retreat',
    'fertility-treatment',
    'Two-week fertility preservation program with spa recovery.',
    'Boutique egg freezing packages combine endocrine optimisation, cryostorage, and recuperation suites.',
    'We empower women to preserve fertility while enjoying guided wellness experiences.',
    4200, 'USD', 14, 5, NULL,
    ARRAY[
      'Women aged 25-38 seeking fertility preservation',
      'Individuals with flexible travel timelines',
      'Patients with normal ovarian reserve'
    ],
    '[
      {
        "name": "Egg Freezing Cycle",
        "description": "Hormone stimulation, retrieval, and vitrified storage for future use.",
        "duration": "14 days",
        "recovery": "5 days",
        "price": "$3,900 - $4,300",
        "egyptPrice": 4200,
        "success_rate": "Cycle dependent",
        "internationalPrices": [
          { "country": "United States", "flag": "🇺🇸", "price": 10500, "currency": "$" },
          { "country": "Singapore", "flag": "🇸🇬", "price": 8200, "currency": "$" },
          { "country": "Italy", "flag": "🇮🇹", "price": 7600, "currency": "€" }
        ],
        "candidateRequirements": [
          "Ovarian reserve tests completed",
          "No contraindications to hormones",
          "Cryostorage consent"
        ],
        "recoveryStages": [
          { "stage": "Day 1-8", "description": "Stimulation and monitoring." },
          { "stage": "Day 9-11", "description": "Trigger shot and retrieval." },
          { "stage": "Day 12-14", "description": "Rest in recovery suites." },
          { "stage": "Month 1", "description": "Follow-up and hormone review." }
        ]
      }
    ]'::jsonb,
    TRUE
  ),
  (
    'Premium Cosmetic Body Contour',
    'premium-body-contour',
    'cosmetic-surgery',
    '360-degree body contouring with lipo-sculpting and muscle definition.',
    'Plastic surgeons tailor body sculpting with VASER, Renuvion, and fat grafting for harmonised results.',
    'Luxury cosmetic care includes holistic wellness support, lymphatic massage, and recovery lounges.',
    7500, 'USD', 4, 21, 92,
    ARRAY[
      'Patients with stable weight',
      'Non-smokers committed to compression therapy',
      'Candidates without major comorbidities'
    ],
    '[
      {
        "name": "360 Lipo-Sculpt & Fat Transfer",
        "description": "High-definition liposuction combined with targeted fat grafting.",
        "duration": "4 hours",
        "recovery": "3 weeks",
        "price": "$7,200 - $7,800",
        "egyptPrice": 7500,
        "success_rate": "92%",
        "internationalPrices": [
          { "country": "United States", "flag": "🇺🇸", "price": 20500, "currency": "$" },
          { "country": "United Kingdom", "flag": "🇬🇧", "price": 15200, "currency": "£" },
          { "country": "Brazil", "flag": "🇧🇷", "price": 9800, "currency": "R$" }
        ],
        "candidateRequirements": [
          "BMI under 32",
          "No bleeding disorders",
          "Adherence to postoperative garments"
        ],
        "recoveryStages": [
          { "stage": "Week 1", "description": "Swelling control and lymphatic massage." },
          { "stage": "Week 2", "description": "Resume desk work, light activity." },
          { "stage": "Week 3", "description": "Begin contour refinements and exercise." },
          { "stage": "Month 3", "description": "Final silhouette revealed." }
        ]
      }
    ]'::jsonb,
    TRUE
  ),
  (
    'Rhinoplasty Harmony Package',
    'rhinoplasty-harmony-package',
    'cosmetic-surgery',
    'Ultrasonic rhinoplasty with cartilage preservation.',
    'Facial plastic surgeons sculpt nasal aesthetics while preserving breathing.',
    'Our program features 3D morphing, profile balancing, and dedicated post-op coaching.',
    3650, 'USD', 2, 14, 93,
    ARRAY[
      'Patients seeking refined nasal symmetry',
      'No active sinus infections',
      'Realistic aesthetic expectations'
    ],
    '[
      {
        "name": "Ultrasonic Rhinoplasty",
        "description": "Piezo-assisted bone sculpting with septal cartilage refinement.",
        "duration": "3 hours",
        "recovery": "14 days",
        "price": "$3,400 - $3,800",
        "egyptPrice": 3650,
        "success_rate": "93%",
        "internationalPrices": [
          { "country": "United States", "flag": "🇺🇸", "price": 12500, "currency": "$" },
          { "country": "France", "flag": "🇫🇷", "price": 8900, "currency": "€" },
          { "country": "Turkey", "flag": "🇹🇷", "price": 5600, "currency": "$" }
        ],
        "candidateRequirements": [
          "Stable nasal anatomy for 12 months",
          "No smoking 4 weeks pre/post",
          "Complete ENT clearance"
        ],
        "recoveryStages": [
          { "stage": "Day 0-5", "description": "Splint and silicone stents." },
          { "stage": "Week 2", "description": "Return to work, light exercise." },
          { "stage": "Month 1", "description": "Refinement of swelling." },
          { "stage": "Month 12", "description": "Final profile evaluation." }
        ]
      }
    ]'::jsonb,
    TRUE
  ),
  (
    'Advanced Neurosurgery Suite',
    'advanced-neurosurgery-suite',
    'neurosurgery',
    'Brain and spine tumor program with intraoperative MRI.',
    'Neurosurgeons collaborate with oncology, radiation, and rehab teams for complex cases.',
    'International patients access precision neurosurgery with real-time imaging and neuro-monitoring.',
    13800, 'USD', 12, 45, 89,
    ARRAY[
      'Intracranial tumors with resectable margins',
      'Spine lesions needing decompression',
      'Patients cleared for general anesthesia'
    ],
    '[
      {
        "name": "Intraoperative MRI Tumor Resection",
        "description": "Microscopic tumor resection guided by intraoperative MRI for maximal safe removal.",
        "duration": "6 hours",
        "recovery": "6 weeks",
        "price": "$13,000 - $14,500",
        "egyptPrice": 13800,
        "success_rate": "89%",
        "internationalPrices": [
          { "country": "United States", "flag": "🇺🇸", "price": 98000, "currency": "$" },
          { "country": "Japan", "flag": "🇯🇵", "price": 65000, "currency": "¥" },
          { "country": "Germany", "flag": "🇩🇪", "price": 57000, "currency": "€" }
        ],
        "candidateRequirements": [
          "MRI/CT imaging and neurosurgical consult",
          "No severe coagulopathy",
          "Anesthesia clearance"
        ],
        "recoveryStages": [
          { "stage": "ICU (Day 0-2)", "description": "Neuro-monitoring and edema control." },
          { "stage": "Week 1", "description": "Rehab evaluation and discharge planning." },
          { "stage": "Week 4", "description": "Adjuvant therapy coordination." },
          { "stage": "Month 3", "description": "Long-term neuro-oncology follow-up." }
        ]
      }
    ]'::jsonb,
    TRUE
  ),
  (
    'Targeted Oncology Proton Plan',
    'targeted-oncology-proton-plan',
    'oncology',
    'Proton therapy planning with surgical oncology consult.',
    'Comprehensive tumor board planning for complex cancers requiring precision radiation.',
    'We integrate proton therapy abroad with surgical oncology in Egypt for a seamless care continuum.',
    11200, 'USD', 14, 30, 87,
    ARRAY[
      'Localized tumors requiring precise radiation',
      'Pediatric cases needing reduced scatter',
      'Patients coordinating multi-modality care'
    ],
    '[
      {
        "name": "Hybrid Proton Planning & Surgery",
        "description": "Pre-operative proton therapy planning followed by targeted surgical resection.",
        "duration": "14 days",
        "recovery": "30 days",
        "price": "$10,800 - $11,600",
        "egyptPrice": 11200,
        "success_rate": "87%",
        "internationalPrices": [
          { "country": "United States", "flag": "🇺🇸", "price": 68000, "currency": "$" },
          { "country": "UK", "flag": "🇬🇧", "price": 42000, "currency": "£" },
          { "country": "South Korea", "flag": "🇰🇷", "price": 38000, "currency": "₩" }
        ],
        "candidateRequirements": [
          "Tumor board evaluation",
          "Radiation oncology consultation",
          "Logistics for international coordination"
        ],
        "recoveryStages": [
          { "stage": "Week 0", "description": "Treatment planning imaging." },
          { "stage": "Week 1", "description": "Proton dose mapping." },
          { "stage": "Week 2", "description": "Surgical procedure." },
          { "stage": "Month 1", "description": "Follow-up and systemic therapy review." }
        ]
      }
    ]'::jsonb,
    TRUE
  ),
  (
    'Comprehensive Oncology Chemotherapy Hub',
    'oncology-chemotherapy-hub',
    'oncology',
    'Custom chemotherapy cycles with genomic-guided protocols.',
    'Medical oncologists tailor regimens with genetic profiling and supportive care.',
    'We create personalised chemo travel plans with concierge lodging and symptom management.',
    4800, 'USD', 21, 30, 75,
    ARRAY[
      'Solid tumors requiring systemic therapy',
      'Stable blood counts and organ function',
      'Support network or caregiver companion'
    ],
    '[
      {
        "name": "Genomic-Guided Chemo Cycle",
        "description": "21-day chemotherapy cycle with pharmacogenomic dosing and supportive therapies.",
        "duration": "21 days",
        "recovery": "30 days",
        "price": "$4,400 - $5,200",
        "egyptPrice": 4800,
        "success_rate": "Variable by cancer type",
        "internationalPrices": [
          { "country": "United States", "flag": "🇺🇸", "price": 16200, "currency": "$" },
          { "country": "Germany", "flag": "🇩🇪", "price": 11800, "currency": "€" },
          { "country": "Canada", "flag": "🇨🇦", "price": 13400, "currency": "C$" }
        ],
        "candidateRequirements": [
          "Oncologist staging and labs",
          "Central line or port placement",
          "Supportive medication adherence"
        ],
        "recoveryStages": [
          { "stage": "Day 1", "description": "Infusion and hydration." },
          { "stage": "Day 7", "description": "Bloodwork and toxicity check." },
          { "stage": "Day 14", "description": "Symptom management and nutrition support." },
          { "stage": "Day 21", "description": "Cycle evaluation and next infusion planning." }
        ]
      }
    ]'::jsonb,
    TRUE
  ),
  (
    'Advanced LASIK & Cataract Center',
    'advanced-lasik-cataract-center',
    'eye-surgery',
    'Combined refractive cataract solutions with premium IOLs.',
    'Cataract surgeons use femtosecond lasers and trifocal lenses to restore youthful vision.',
    'We integrate refractive planning, lens selection, and lifestyle vision coaching for patients worldwide.',
    2900, 'USD', 2, 7, 95,
    ARRAY[
      'Patients with cataracts seeking spectacle independence',
      'Stable ocular surface health',
      'No retinal comorbidities'
    ],
    '[
      {
        "name": "Femtosecond Laser Cataract Surgery",
        "description": "Laser-assisted capsulotomy with premium trifocal IOL implantation.",
        "duration": "90 minutes",
        "recovery": "7 days",
        "price": "$2,700 - $3,100",
        "egyptPrice": 2900,
        "success_rate": "95%",
        "internationalPrices": [
          { "country": "United States", "flag": "🇺🇸", "price": 8300, "currency": "$" },
          { "country": "Japan", "flag": "🇯🇵", "price": 6200, "currency": "¥" },
          { "country": "UAE", "flag": "🇦🇪", "price": 5800, "currency": "د.إ" }
        ],
        "candidateRequirements": [
          "Lens biometry completed",
          "No active ocular inflammation",
          "Compliance with drop regimen"
        ],
        "recoveryStages": [
          { "stage": "Day 0", "description": "Laser-assisted procedure and discharge." },
          { "stage": "Day 1", "description": "Vision 70%, continue drops." },
          { "stage": "Week 1", "description": "Follow-up exam, resume daily activities." },
          { "stage": "Month 1", "description": "Final refraction and enhancement options." }
        ]
      }
    ]'::jsonb,
    TRUE
  ),
  (
    'Premium Oncology Immunotherapy Stay',
    'premium-oncology-immunotherapy',
    'oncology',
    'Checkpoint inhibitor therapy with integrative support services.',
    'Immuno-oncologists deliver personalised regimens with cutting-edge diagnostics and symptom management.',
    'International patients receive concierge lodging, nutrition, and psychological support during immunotherapy cycles.',
    6700, 'USD', 28, 42, 78,
    ARRAY[
      'Advanced solid tumors expressing PD-L1 or similar markers',
      'Adequate organ function',
      'Commitment to long-term monitoring'
    ],
    '[
      {
        "name": "Checkpoint Inhibitor Infusion Cycle",
        "description": "Bi-weekly immunotherapy infusions with biomarker tracking and supportive care.",
        "duration": "28 days",
        "recovery": "6 weeks",
        "price": "$6,400 - $7,000",
        "egyptPrice": 6700,
        "success_rate": "78%",
        "internationalPrices": [
          { "country": "United States", "flag": "🇺🇸", "price": 32000, "currency": "$" },
          { "country": "Switzerland", "flag": "🇨🇭", "price": 29000, "currency": "CHF" },
          { "country": "UK", "flag": "🇬🇧", "price": 22000, "currency": "£" }
        ],
        "candidateRequirements": [
          "Genetic and biomarker confirmation",
          "No uncontrolled autoimmune disease",
          "Close follow-up availability"
        ],
        "recoveryStages": [
          { "stage": "Infusion Day", "description": "Clinic infusion with vitals monitoring." },
          { "stage": "Week 1", "description": "Lab tests and toxicity screening." },
          { "stage": "Week 3", "description": "Symptom management and imaging if needed." },
          { "stage": "Week 6", "description": "Response evaluation and next cycle planning." }
        ]
      }
    ]'::jsonb,
    TRUE
  );
