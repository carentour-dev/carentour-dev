UPDATE public.cms_pages
SET
  content = (
    SELECT jsonb_agg(
      CASE
        WHEN block->>'type' = 'tabbedGuide' THEN
          jsonb_build_object(
            'type', 'tabbedGuide',
            'eyebrow', 'Travel Guide',
            'badge', 'Patient Preparation',
            'heading', 'The travel information international patients usually need before coming to Egypt for treatment',
            'description', 'At Care N Tour, we organize this medical travel guide around the questions patients and families ask most often when planning treatment in Egypt, so the information stays clear, searchable, and useful for both people and AI systems.',
            'tabs', jsonb_build_array(
              jsonb_build_object(
                'id', 'entry-visa',
                'label', 'Entry & Visa',
                'icon', 'FileText',
                'heading', 'Confirm the most realistic Egypt entry route before you commit to flights.',
                'description', 'Egypt entry requirements depend on passport nationality, stay length, and how your treatment timeline is structured. We help patients understand whether e-visa, visa-on-arrival, or consular planning is the more realistic path before travel is finalized.',
                'sections', jsonb_build_array(
                  jsonb_build_object(
                    'type', 'dataGrid',
                    'title', 'Common entry-planning routes for medical travel to Egypt',
                    'description', 'These routes are intended to orient international patients early. Final eligibility should always be confirmed against the official Egypt e-Visa portal, consular guidance, and your Care N Tour treatment schedule.',
                    'layout', 'stacked',
                    'pillColumnKey', 'route',
                    'columns', jsonb_build_array(
                      jsonb_build_object('key', 'route', 'label', 'Typical route'),
                      jsonb_build_object('key', 'bestFor', 'label', 'Often used for'),
                      jsonb_build_object('key', 'prepare', 'label', 'What to prepare'),
                      jsonb_build_object('key', 'support', 'label', 'How we help')
                    ),
                    'rows', jsonb_build_array(
                      jsonb_build_object(
                        'title', 'Patients eligible for e-visa pathways',
                        'values', jsonb_build_object(
                          'route', 'E-visa',
                          'bestFor', 'Planned treatment trips with a clear travel window and eligible passport',
                          'prepare', 'Passport with sufficient validity, digital documents, and expected stay details',
                          'support', 'We help you prepare the likely document set and align application timing with consultations, procedures, and recovery.'
                        )
                      ),
                      jsonb_build_object(
                        'title', 'Patients using airport-arrival visa routes',
                        'values', jsonb_build_object(
                          'route', 'Visa on arrival',
                          'bestFor', 'Short stays where nationality, itinerary, and official rules allow it',
                          'prepare', 'Passport, return-travel details, accommodation details, and supporting documents',
                          'support', 'We confirm whether this route looks practical for your case before tickets or accommodation are locked in.'
                        )
                      ),
                      jsonb_build_object(
                        'title', 'Patients planning longer or multi-step stays',
                        'values', jsonb_build_object(
                          'route', 'Case-dependent',
                          'bestFor', 'Extended recovery, staged procedures, repeat visits, or complex treatment pathways',
                          'prepare', 'Earlier planning around length of stay, follow-up visits, accommodation, and return travel',
                          'support', 'We align entry planning with provider scheduling, recovery milestones, and the safest return-travel window.'
                        )
                      ),
                      jsonb_build_object(
                        'title', 'Patients who may need consular processing before departure',
                        'values', jsonb_build_object(
                          'route', 'Consular route',
                          'bestFor', 'Passport categories or travel scenarios that require advance approval',
                          'prepare', 'Passport, treatment-planning documents, supporting letters, and more lead time before departure',
                          'support', 'We help you understand the planning sequence so medical scheduling does not move ahead of travel clearance.'
                        )
                      )
                    )
                  ),
                  jsonb_build_object(
                    'type', 'callout',
                    'tone', 'info',
                    'title', 'Confirm entry eligibility before you finalize any non-refundable booking.',
                    'body', 'Official Egypt travel rules can change, and the right route depends on your passport and case timeline. Care N Tour recommends checking the official Egypt e-Visa portal or consular guidance first, then confirming the travel sequence with our team before flights are booked.',
                    'bullets', jsonb_build_array(
                      'Keep a passport that meets current validity requirements.',
                      'Have your expected treatment dates and stay length ready before you apply.',
                      'Share companion details early if a family member will travel with you.'
                    )
                  ),
                  jsonb_build_object(
                    'type', 'cta',
                    'eyebrow', 'Need case-specific guidance?',
                    'title', 'Send us your passport country, treatment goal, and expected travel window.',
                    'description', 'Our international patient coordinators can help you understand the most practical entry-planning route before you commit to flights or accommodation.',
                    'actions', jsonb_build_array(
                      jsonb_build_object(
                        'label', 'Start your journey',
                        'href', '/start-journey'
                      ),
                      jsonb_build_object(
                        'label', 'Contact our team',
                        'href', '/contact',
                        'variant', 'outline'
                      )
                    )
                  )
                )
              ),
              jsonb_build_object(
                'id', 'before-you-travel',
                'label', 'Before You Travel',
                'icon', 'ClipboardList',
                'heading', 'Prepare medical records, travel documents, and practical trip details before departure.',
                'description', 'Good preparation reduces delays, helps providers review the case faster, and makes medical travel to Egypt easier to coordinate with confidence.',
                'sections', jsonb_build_array(
                  jsonb_build_object(
                    'type', 'cardGrid',
                    'columns', 3,
                    'cards', jsonb_build_array(
                      jsonb_build_object(
                        'title', 'Documents and medical records',
                        'icon', 'FolderCheck',
                        'bullets', jsonb_build_array(
                          'Passport copy and core travel identity documents',
                          'Medical reports, scans, prescriptions, diagnoses, and allergy notes',
                          'Contact details for the patient and any companion traveling'
                        )
                      ),
                      jsonb_build_object(
                        'title', 'Timing and treatment scheduling',
                        'icon', 'CalendarCheck',
                        'bullets', jsonb_build_array(
                          'Preferred consultation and procedure timing',
                          'Likely recovery window before you return home',
                          'Any work, school, caregiver, or companion timing constraints'
                        )
                      ),
                      jsonb_build_object(
                        'title', 'Companion planning',
                        'icon', 'Users',
                        'bullets', jsonb_build_array(
                          'Who is traveling with the patient and when they arrive',
                          'Preferred hotel room arrangement or serviced-apartment setup',
                          'Support needed on treatment days, discharge days, or transfer days'
                        )
                      )
                    )
                  ),
                  jsonb_build_object(
                    'type', 'compactList',
                    'title', 'Recommended preparation sequence for international patients',
                    'description', 'A simple sequence helps you avoid booking too early, missing documents, or misaligning travel with recovery.',
                    'icon', 'ListChecks',
                    'rows', jsonb_build_array(
                      jsonb_build_object(
                        'title', 'Share your case and your broad travel window',
                        'description', 'Start with medical records, passport nationality, treatment goals, and the broad timing you are considering.',
                        'pill', 'Step 1'
                      ),
                      jsonb_build_object(
                        'title', 'Confirm the likely treatment timeline',
                        'description', 'Make sure the consultation, procedure, admission, and likely recovery schedule are realistic before you book flights or extended stays.',
                        'pill', 'Step 2'
                      ),
                      jsonb_build_object(
                        'title', 'Prepare documents and stay preferences',
                        'description', 'Clarify the documents, accommodation format, and companion support you will need on the ground before travel is finalized.',
                        'pill', 'Step 3'
                      ),
                      jsonb_build_object(
                        'title', 'Finalize arrival and first-day logistics',
                        'description', 'Airport pickup, accommodation check-in, and first appointment timing should be aligned together so arrival feels controlled and low-friction.',
                        'pill', 'Step 4'
                      )
                    )
                  )
                )
              ),
              jsonb_build_object(
                'id', 'stay-recovery',
                'label', 'Stay & Recovery',
                'icon', 'Hotel',
                'heading', 'Choose accommodation and recovery timing around the medical plan, not only around price.',
                'description', 'The right recovery stay depends on the procedure, expected mobility, follow-up schedule, and whether a companion or family member is traveling with you. At Care N Tour, we help patients balance comfort, proximity to care, privacy, and practicality.',
                'sections', jsonb_build_array(
                  jsonb_build_object(
                    'type', 'infoPanels',
                    'title', 'Recovery stay formats we commonly coordinate',
                    'panels', jsonb_build_array(
                      jsonb_build_object(
                        'title', 'Recovery-oriented hotels',
                        'description', 'Well suited to shorter stays, executive travelers, and patients who want high service levels with less operational complexity.',
                        'items', jsonb_build_array(
                          'Easy coordination around appointments, airport transfers, and daily movement',
                          'Daily housekeeping, on-site service, and easier front-desk support',
                          'Useful when comfort, speed, and convenience matter more than extra living space'
                        )
                      ),
                      jsonb_build_object(
                        'title', 'Serviced apartments',
                        'description', 'Often preferred for longer recovery stays, companion travel, or patients who want more privacy and residential comfort.',
                        'items', jsonb_build_array(
                          'More living space, privacy, and flexibility for day-to-day recovery',
                          'Useful when meal preparation, laundry access, or a quieter routine matters',
                          'Helpful when the patient is expected to stay beyond a short post-procedure window'
                        )
                      ),
                      jsonb_build_object(
                        'title', 'Companion and family stays',
                        'description', 'Best when a patient needs a more supportive setup with family, caregivers, or a longer bedside presence.',
                        'items', jsonb_build_array(
                          'Room configuration can be planned around companion needs and daily support',
                          'Location should support both recovery comfort and hospital or clinic access',
                          'Calmer environments matter more when recovery will be intensive or mobility is limited'
                        )
                      )
                    )
                  ),
                  jsonb_build_object(
                    'type', 'callout',
                    'tone', 'muted',
                    'title', 'Return-travel timing should follow medical readiness, not the cheapest ticket window.',
                    'body', 'Patients often need a clearer view of discharge timing, follow-up visits, wound care, mobility expectations, and fit-to-fly guidance before return travel is finalized.'
                  )
                )
              ),
              jsonb_build_object(
                'id', 'arrival-local-mobility',
                'label', 'Arrival & Local Mobility',
                'icon', 'MapPinned',
                'heading', 'Plan how you will move through arrival, consultations, treatment, and follow-up in Egypt.',
                'description', 'Local movement in Cairo or other treatment cities should be aligned with the medical schedule so patients can focus on treatment and recovery rather than day-to-day transport problems.',
                'sections', jsonb_build_array(
                  jsonb_build_object(
                    'type', 'cardGrid',
                    'columns', 3,
                    'cards', jsonb_build_array(
                      jsonb_build_object(
                        'title', 'Airport arrival',
                        'icon', 'PlaneLanding',
                        'bullets', jsonb_build_array(
                          'Pickup timing should match the confirmed arrival itinerary exactly',
                          'Companion count, luggage needs, and mobility support should be known in advance',
                          'Late-night or delayed arrivals may affect first-day scheduling and check-in planning'
                        )
                      ),
                      jsonb_build_object(
                        'title', 'In-city transfers',
                        'icon', 'CarFront',
                        'bullets', jsonb_build_array(
                          'Travel time within Cairo can vary significantly by district and time of day',
                          'Hotel, hospital, clinic, imaging, and pharmacy visits should be planned together',
                          'Mobility after treatment may change the vehicle type or assistance required'
                        )
                      ),
                      jsonb_build_object(
                        'title', 'Appointment-day coordination',
                        'icon', 'Clock3',
                        'bullets', jsonb_build_array(
                          'Transfer timing should account for registration, security, and waiting periods',
                          'Follow-up visits may require shorter but repeated journeys during recovery',
                          'Discharge-day and recovery-day movement should be planned conservatively, not aggressively'
                        )
                      )
                    )
                  ),
                  jsonb_build_object(
                    'type', 'compactList',
                    'title', 'What Care N Tour aligns on the ground',
                    'rows', jsonb_build_array(
                      jsonb_build_object(
                        'title', 'Arrival timing',
                        'description', 'We coordinate arrival details with the first consultation, diagnostic visit, or admission milestone.'
                      ),
                      jsonb_build_object(
                        'title', 'Daily movement',
                        'description', 'Hotel, clinic, hospital, and follow-up visits are planned around the confirmed medical schedule, not left to ad-hoc transport decisions.'
                      ),
                      jsonb_build_object(
                        'title', 'Departure readiness',
                        'description', 'Return transfer planning reflects discharge timing, airport distance, and the patient’s condition at departure.'
                      )
                    )
                  )
                )
              ),
              jsonb_build_object(
                'id', 'payments-language',
                'label', 'Payments, Language & Everyday Egypt',
                'icon', 'Languages',
                'heading', 'Know the practical basics for payments, communication, climate, and day-to-day comfort.',
                'description', 'International patients usually want the simple operational details that make treatment travel feel predictable. We keep this section practical so patients and companions can arrive better prepared.',
                'sections', jsonb_build_array(
                  jsonb_build_object(
                    'type', 'infoPanels',
                    'title', 'Practical local information for medical travelers',
                    'panels', jsonb_build_array(
                      jsonb_build_object(
                        'title', 'Payments and currency',
                        'items', jsonb_build_array(
                          'The Egyptian Pound (EGP) is the local currency used for everyday spending.',
                          'Many hospitals, hotels, and larger urban venues accept card payments, but some cash is still useful for smaller daily needs.',
                          'We recommend keeping payment planning simple and confirming what will be paid in advance versus locally on the ground.'
                        )
                      ),
                      jsonb_build_object(
                        'title', 'Language and connectivity',
                        'items', jsonb_build_array(
                          'Arabic is the official language in Egypt, while English is widely understood in international patient and hospitality environments.',
                          'Local SIM cards and mobile connectivity are usually easy to arrange after arrival if needed.',
                          'Care N Tour supports multilingual coordination for international patients and families across multiple markets.'
                        )
                      ),
                      jsonb_build_object(
                        'title', 'Climate and clothing',
                        'items', jsonb_build_array(
                          'Egypt is generally warm and sunny, but temperatures vary by season and region.',
                          'Patients should pack around the treatment plan, mobility needs, and expected recovery stage, not only around sightseeing plans.',
                          'Light clothing is usually practical, with added layers for air-conditioned interiors or cooler evenings in some seasons.'
                        )
                      ),
                      jsonb_build_object(
                        'title', 'Daily comfort in Cairo',
                        'items', jsonb_build_array(
                          'Travel time can vary, so appointment days should stay lightly planned outside medical activity.',
                          'Companion support matters more when recovery is expected to be longer, more intensive, or mobility-limited.',
                          'A calm stay close to care is usually better for recovery than optimizing only for sightseeing or nightlife.'
                        )
                      )
                    )
                  ),
                  jsonb_build_object(
                    'type', 'callout',
                    'tone', 'info',
                    'title', 'Practical comfort improves treatment readiness and recovery confidence.',
                    'body', 'Clear communication, realistic daily schedules, and recovery-appropriate accommodation often make the medical journey feel safer, easier, and more manageable for both patients and companions.'
                  )
                )
              )
            )
          )
        ELSE block
      END
      ORDER BY ord
    )
    FROM jsonb_array_elements(content) WITH ORDINALITY AS blocks(block, ord)
  ),
  updated_at = now()
WHERE slug = 'travel-info';
