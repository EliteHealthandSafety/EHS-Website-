// Source of truth for the free H&S compliance self-check tool (/compliance-checklist/)
// and the printable version (/downloads/ehs-compliance-checklist.html).
// `fix` is what we show in the results panel when the answer is a gap.

export const checklist = [
  {
    id: 'fire',
    title: 'Fire safety',
    law: 'Fire (Scotland) Act 2005 · Fire Safety (Scotland) Regulations 2006',
    items: [
      {
        id: 'fire-fra',
        t: 'Fire risk assessment',
        d: 'Suitable and sufficient, and kept current.',
        cycle: 'Review annually & after any change',
        fix: 'A current fire risk assessment is a legal duty for almost every non-domestic premises. This is the first thing an enforcement officer asks for.',
      },
      {
        id: 'fire-alarm',
        t: 'Fire detection & alarms',
        d: 'In place, suitable for the building, and maintained.',
        cycle: 'User test weekly · service 6-monthly',
        fix: 'Check you have a maintenance contract and a fire log book recording weekly tests.',
      },
      {
        id: 'fire-light',
        t: 'Emergency lighting',
        d: 'Working across escape routes and final exits.',
        cycle: 'Monthly flick test · annual full duration test',
        fix: 'Emergency lighting needs a monthly function test and an annual full-duration test, both recorded.',
      },
      {
        id: 'fire-ext',
        t: 'Fire extinguishers',
        d: 'Correct types for the risks, accessible and signed.',
        cycle: 'Service annually · extended service 5-yearly',
        fix: 'Wrong extinguisher types are common: kitchens, electrical rooms and workshops each need specific classes.',
      },
      {
        id: 'fire-escape',
        t: 'Escape routes & signage',
        d: 'Clear, unobstructed and properly signed.',
        cycle: 'Check ongoing',
        fix: 'Blocked or locked escape routes are the most frequent enforcement finding, so it is worth a walk-round today.',
      },
      {
        id: 'fire-train',
        t: 'Staff fire awareness',
        d: 'Everyone knows the alarm, the route and the assembly point.',
        cycle: 'Refresh roughly annually · drill at least annually',
        fix: 'Fire awareness training plus a recorded evacuation drill closes this off. We run this on site.',
      },
    ],
  },
  {
    id: 'firstaid',
    title: 'First aid',
    law: 'Health and Safety (First-Aid) Regulations 1981',
    items: [
      {
        id: 'fa-needs',
        t: 'First-aid needs assessment',
        d: 'Matched to your risk level, headcount and layout.',
        cycle: 'Review after any change',
        fix: 'The needs assessment is what justifies how many first-aiders you have. Without it you are guessing.',
      },
      {
        id: 'fa-people',
        t: 'Enough trained first-aiders',
        d: 'Covering all shifts, sites and holiday absence.',
        cycle: 'Requalify every 3 years',
        fix: 'Check certificate expiry dates: lapsed first-aiders are as good as none. We run EFAW and FAW courses.',
      },
      {
        id: 'fa-kit',
        t: 'Stocked, in-date first-aid kits',
        d: 'With a named person responsible for restocking.',
        cycle: 'Check monthly',
        fix: 'Assign an owner and diarise a monthly kit check. It takes five minutes.',
      },
      {
        id: 'fa-record',
        t: 'Accident recording & RIDDOR',
        d: 'Accident book kept; reportable incidents understood.',
        cycle: 'RIDDOR: report within legal timescales',
        fix: 'Missing a RIDDOR report is a criminal offence. Worth confirming who in your business knows the triggers.',
      },
    ],
  },
  {
    id: 'policies',
    title: 'Policies & documents',
    law: 'Health and Safety at Work etc. Act 1974',
    items: [
      {
        id: 'pol-policy',
        t: 'Written health & safety policy',
        d: 'Legally required once you have 5 or more employees.',
        cycle: 'Review annually',
        fix: 'A written policy with named responsibilities and arrangements. We write these to suit your business, not a template.',
      },
      {
        id: 'pol-ra',
        t: 'Risk assessments',
        d: 'Covering your significant hazards, and actually used.',
        cycle: 'Review annually & on change',
        fix: 'Risk assessments should be specific to your tasks and communicated to staff. Generic downloads will not stand up.',
      },
      {
        id: 'pol-coshh',
        t: 'COSHH assessments',
        d: 'Wherever hazardous substances are used or created.',
        cycle: 'Review on change of substance or process',
        fix: 'Cleaning chemicals, fuels, dusts and fumes all count. Start from your safety data sheets.',
      },
      {
        id: 'pol-legionella',
        t: 'Legionella risk assessment',
        d: 'For your water systems, commonly missed.',
        cycle: 'Review roughly every 2 years',
        fix: 'This one catches most businesses out. If you have water storage, showers or infrequently used outlets, it applies to you.',
      },
      {
        id: 'pol-insurance',
        t: "Employers' liability insurance",
        d: 'In place, with the certificate available to staff.',
        cycle: 'Renew annually',
        fix: 'Legally required for almost all employers, and the certificate must be accessible to employees.',
      },
    ],
  },
  {
    id: 'training',
    title: 'Training & competence',
    law: 'Management of Health and Safety at Work Regulations 1999',
    items: [
      {
        id: 'tr-induct',
        t: 'Health & safety inductions',
        d: 'For the role and the site, before work starts.',
        cycle: 'On joining',
        fix: 'A short recorded induction covering your specific risks, welfare and emergency arrangements.',
      },
      {
        id: 'tr-role',
        t: 'Role-specific training',
        d: 'Manual handling, IOSH/SSSTS, asbestos awareness, work at height.',
        cycle: 'Refresh every 1 to 3 years',
        fix: 'Map each role to the training it actually needs. We deliver most of these in-house or on your site.',
      },
      {
        id: 'tr-records',
        t: 'Training records',
        d: 'Kept centrally with refresher dates tracked.',
        cycle: 'Keep current',
        fix: 'If you cannot produce a training matrix on request, the training effectively does not count.',
      },
    ],
  },
  {
    id: 'manage',
    title: 'Ongoing management',
    law: 'Management of Health and Safety at Work Regulations 1999',
    items: [
      {
        id: 'mg-person',
        t: 'Named responsible person',
        d: 'Someone owns health & safety day to day.',
        cycle: 'Ongoing',
        fix: 'Duties need an owner with the time and authority to act. Many businesses use us as their competent person.',
      },
      {
        id: 'mg-review',
        t: 'Review dates diarised',
        d: 'So assessments, servicing and certificates do not lapse.',
        cycle: 'Set reminders',
        fix: 'A simple compliance calendar prevents most of the failures on this list.',
      },
      {
        id: 'mg-contractor',
        t: 'Contractors managed',
        d: 'CDM duties met for construction and refurbishment work.',
        cycle: 'Per project',
        fix: 'If you commission building work you are a CDM client, with legal duties whether you realise it or not.',
      },
    ],
  },
];

export const totalItems = checklist.reduce((n, s) => n + s.items.length, 0);
