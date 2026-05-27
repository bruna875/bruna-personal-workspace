// js/ai-media-plans-api.js
// Mock API — 5 AI-generated Media Plans per analysis.
// Plans trace a concave-down arch on the scatter chart (x=imp, y=budget):
//   higher budget → MORE impressions AND LOWER CPM (volume/scale discounts)
//   lower  budget → fewer impressions AND HIGHER CPM (targeted/boutique)
//
//   Efficiency (8M, $80K, CPM≈$10) → Value (15M, $130K, CPM≈$8.67)
//   → Optimized (24M, $190K, CPM≈$7.92) ← recommended
//   → Scale (36M, $255K, CPM≈$7.08) → Premium (50M, $320K, CPM≈$6.40)
//
// est_dollar_value = round(est_cpm * est_impressions / 1000)

var MOCK_AI_MEDIA_PLANS = [

  // ─────────────────────────────────────────────────────────────
  //  PLAN 1 — Efficiency
  //  Targeted moments, smaller footprint, higher CPM.
  //  Arch point: (8M imp, $80K budget, CPM≈$10)
  // ─────────────────────────────────────────────────────────────
  {
    plan_id:     'PLAN001',
    plan_name:   'Efficiency',
    plan_type:   'efficiency',
    description: 'Targeted placements for lean budgets — fewer impressions, higher engagement per view',
    budget_k:    80,
    total_impressions_m: 8.0,
    moments: [
      {
        moment_id:        'MOM002',
        moment_name:      'Morning Coffee Ritual',
        channels:         ['HGTV','Food Network','Bravo','Lifetime','Hallmark Channel','TLC'],
        moment_type:      'VoD',
        moment_score:     72,
        est_cpm:          9.20,
        est_impressions:  1850000,
        est_dollar_value: 17020,
      },
      {
        moment_id:        'MOM026',
        moment_name:      'Newborn Baby Arrival',
        channels:         ['TLC','Lifetime','Hallmark Channel','OWN','A&E','Bravo'],
        moment_type:      'VoD',
        moment_score:     71,
        est_cpm:          9.50,
        est_impressions:  1400000,
        est_dollar_value: 13300,
      },
      {
        moment_id:        'MOM009',
        moment_name:      'Pet Rescue Heartwarming',
        channels:         ['Animal Planet','Discovery','TLC','Hallmark Channel','OWN','Lifetime'],
        moment_type:      'VoD',
        moment_score:     69,
        est_cpm:          9.00,
        est_impressions:  1500000,
        est_dollar_value: 13500,
      },
      {
        moment_id:        'MOM015',
        moment_name:      'Nature Documentary Sunrise',
        channels:         ['National Geographic','Discovery','Animal Planet','BBC America','PBS'],
        moment_type:      'VoD',
        moment_score:     62,
        est_cpm:          11.00,
        est_impressions:  980000,
        est_dollar_value: 10780,
      },
      {
        moment_id:        'MOM018',
        moment_name:      'Real Estate House Tour',
        channels:         ['HGTV','TLC','Bravo','A&E','Lifetime','Discovery'],
        moment_type:      'VoD',
        moment_score:     65,
        est_cpm:          10.50,
        est_impressions:  1300000,
        est_dollar_value: 13650,
      },
      {
        moment_id:        'MOM030',
        moment_name:      'Graduation Day Celebration',
        channels:         ['NBC','ABC','CBS','Hallmark Channel','OWN','Lifetime','TLC'],
        moment_type:      'VoD',
        moment_score:     75,
        est_cpm:          11.80,
        est_impressions:  1200000,
        est_dollar_value: 14160,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  //  PLAN 2 — Value
  //  Broad VoD inventory, good score-to-cost ratio.
  //  Arch point: (15M imp, $130K budget, CPM≈$8.67)
  // ─────────────────────────────────────────────────────────────
  {
    plan_id:     'PLAN002',
    plan_name:   'Value',
    plan_type:   'value',
    description: 'Broad VoD reach at mid-range CPM — strong score-to-cost ratio',
    budget_k:    130,
    total_impressions_m: 15.0,
    moments: [
      {
        moment_id:        'MOM003',
        moment_name:      'Family Movie Night',
        channels:         ['TBS','TNT','AMC','Freeform','USA Network','Disney Channel','Hallmark Channel'],
        moment_type:      'VoD',
        moment_score:     68,
        est_cpm:          8.00,
        est_impressions:  2700000,
        est_dollar_value: 21600,
      },
      {
        moment_id:        'MOM013',
        moment_name:      'Kids Birthday Celebration',
        channels:         ['Disney Channel','Nickelodeon','Cartoon Network','Freeform','TLC','Hallmark Channel'],
        moment_type:      'VoD',
        moment_score:     73,
        est_cpm:          7.50,
        est_impressions:  1650000,
        est_dollar_value: 12375,
      },
      {
        moment_id:        'MOM022',
        moment_name:      'Grocery Store Discovery',
        channels:         ['Food Network','TLC','Bravo','HGTV','Lifetime','Hallmark Channel','CBS'],
        moment_type:      'Organic Pause',
        moment_score:     70,
        est_cpm:          8.80,
        est_impressions:  4100000,
        est_dollar_value: 36080,
      },
      {
        moment_id:        'MOM009',
        moment_name:      'Pet Rescue Heartwarming',
        channels:         ['Animal Planet','Discovery','TLC','Hallmark Channel','OWN','Lifetime'],
        moment_type:      'VoD',
        moment_score:     69,
        est_cpm:          9.00,
        est_impressions:  1500000,
        est_dollar_value: 13500,
      },
      {
        moment_id:        'MOM028',
        moment_name:      'Back to School Season',
        channels:         ['Disney Channel','Nickelodeon','Cartoon Network','ABC','NBC','CBS','Freeform'],
        moment_type:      'VoD',
        moment_score:     73,
        est_cpm:          10.00,
        est_impressions:  3300000,
        est_dollar_value: 33000,
      },
      {
        moment_id:        'MOM026',
        moment_name:      'Newborn Baby Arrival',
        channels:         ['TLC','Lifetime','Hallmark Channel','OWN','A&E','Bravo'],
        moment_type:      'VoD',
        moment_score:     71,
        est_cpm:          9.50,
        est_impressions:  1400000,
        est_dollar_value: 13300,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  //  PLAN 3 — Optimized  ← default / recommended
  //  Balanced mix of formats and scores at mid CPM.
  //  Arch point: (24M imp, $190K budget, CPM≈$7.92)
  // ─────────────────────────────────────────────────────────────
  {
    plan_id:     'PLAN003',
    plan_name:   'Optimized',
    plan_type:   'optimized',
    description: 'Balanced mix of formats and audience quality — recommended starting point',
    budget_k:    190,
    total_impressions_m: 24.0,
    moments: [
      {
        moment_id:        'MOM022',
        moment_name:      'Grocery Store Discovery',
        channels:         ['Food Network','TLC','Bravo','HGTV','Lifetime','Hallmark Channel','CBS'],
        moment_type:      'Organic Pause',
        moment_score:     70,
        est_cpm:          8.80,
        est_impressions:  4100000,
        est_dollar_value: 36080,
      },
      {
        moment_id:        'MOM028',
        moment_name:      'Back to School Season',
        channels:         ['Disney Channel','Nickelodeon','Cartoon Network','ABC','NBC','CBS','Freeform'],
        moment_type:      'VoD',
        moment_score:     73,
        est_cpm:          10.00,
        est_impressions:  3300000,
        est_dollar_value: 33000,
      },
      {
        moment_id:        'MOM003',
        moment_name:      'Family Movie Night',
        channels:         ['TBS','TNT','AMC','Freeform','USA Network','Disney Channel','Hallmark Channel'],
        moment_type:      'VoD',
        moment_score:     68,
        est_cpm:          8.00,
        est_impressions:  2700000,
        est_dollar_value: 21600,
      },
      {
        moment_id:        'MOM011',
        moment_name:      'Fitness & Workout Grind',
        channels:         ['ESPN','ESPN2','NBC Sports','Fox Sports 1','CBS Sports','Discovery'],
        moment_type:      'VoD',
        moment_score:     79,
        est_cpm:          12.20,
        est_impressions:  2500000,
        est_dollar_value: 30500,
      },
      {
        moment_id:        'MOM017',
        moment_name:      'College Game Day',
        channels:         ['ESPN','ESPN2','ABC','CBS Sports','Fox Sports 1','NBC Sports'],
        moment_type:      'Live',
        moment_score:     85,
        est_cpm:          16.50,
        est_impressions:  3800000,
        est_dollar_value: 62700,
      },
      {
        moment_id:        'MOM016',
        moment_name:      'Wedding Day Ceremony',
        channels:         ['Lifetime','TLC','Hallmark Channel','Bravo','OWN','WE tv'],
        moment_type:      'VoD',
        moment_score:     77,
        est_cpm:          12.00,
        est_impressions:  1750000,
        est_dollar_value: 21000,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  //  PLAN 4 — Scale
  //  High-volume, multi-format, Live + VoD mix.
  //  Arch point: (36M imp, $255K budget, CPM≈$7.08)
  // ─────────────────────────────────────────────────────────────
  {
    plan_id:     'PLAN004',
    plan_name:   'Scale',
    plan_type:   'scale',
    description: 'High-volume multi-format buy — Live events and broad VoD for maximum audience size',
    budget_k:    255,
    total_impressions_m: 36.0,
    moments: [
      {
        moment_id:        'MOM022',
        moment_name:      'Grocery Store Discovery',
        channels:         ['Food Network','TLC','Bravo','HGTV','Lifetime','Hallmark Channel','CBS'],
        moment_type:      'Organic Pause',
        moment_score:     70,
        est_cpm:          8.80,
        est_impressions:  4100000,
        est_dollar_value: 36080,
      },
      {
        moment_id:        'MOM028',
        moment_name:      'Back to School Season',
        channels:         ['Disney Channel','Nickelodeon','Cartoon Network','ABC','NBC','CBS','Freeform'],
        moment_type:      'VoD',
        moment_score:     73,
        est_cpm:          10.00,
        est_impressions:  3300000,
        est_dollar_value: 33000,
      },
      {
        moment_id:        'MOM011',
        moment_name:      'Fitness & Workout Grind',
        channels:         ['ESPN','ESPN2','NBC Sports','Fox Sports 1','CBS Sports','Discovery'],
        moment_type:      'VoD',
        moment_score:     79,
        est_cpm:          12.20,
        est_impressions:  2500000,
        est_dollar_value: 30500,
      },
      {
        moment_id:        'MOM017',
        moment_name:      'College Game Day',
        channels:         ['ESPN','ESPN2','ABC','CBS Sports','Fox Sports 1','NBC Sports'],
        moment_type:      'Live',
        moment_score:     85,
        est_cpm:          16.50,
        est_impressions:  3800000,
        est_dollar_value: 62700,
      },
      {
        moment_id:        'MOM001',
        moment_name:      'Sports Comeback Moment',
        channels:         ['ESPN','ESPN2','CBS Sports','NBC Sports','Fox Sports 1','TNT'],
        moment_type:      'Live',
        moment_score:     91,
        est_cpm:          18.50,
        est_impressions:  4200000,
        est_dollar_value: 77700,
      },
      {
        moment_id:        'MOM006',
        moment_name:      'Tech Unboxing Reveal',
        channels:         ['TBS','Comedy Central','ESPN','FX','FXX','USA Network','Syfy'],
        moment_type:      'Organic Pause',
        moment_score:     82,
        est_cpm:          15.00,
        est_impressions:  3400000,
        est_dollar_value: 51000,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  //  PLAN 5 — Premium
  //  Maximum reach via tentpole Live events — highest impressions,
  //  lowest blended CPM through volume. Arch point: (50M, $320K)
  // ─────────────────────────────────────────────────────────────
  {
    plan_id:     'PLAN005',
    plan_name:   'Premium',
    plan_type:   'premium',
    description: 'Maximum reach through tentpole Live events — highest volume, lowest blended CPM',
    budget_k:    320,
    total_impressions_m: 50.0,
    moments: [
      {
        moment_id:        'MOM022',
        moment_name:      'Grocery Store Discovery',
        channels:         ['Food Network','TLC','Bravo','HGTV','Lifetime','Hallmark Channel','CBS'],
        moment_type:      'Organic Pause',
        moment_score:     70,
        est_cpm:          8.80,
        est_impressions:  4100000,
        est_dollar_value: 36080,
      },
      {
        moment_id:        'MOM004',
        moment_name:      'Holiday Shopping Rush',
        channels:         ['NBC','ABC','CBS','FOX','Lifetime','Hallmark Channel','TLC','Bravo'],
        moment_type:      'VoD',
        moment_score:     88,
        est_cpm:          22.00,
        est_impressions:  5800000,
        est_dollar_value: 127600,
      },
      {
        moment_id:        'MOM019',
        moment_name:      'Music Award Show',
        channels:         ['CBS','NBC','ABC','MTV','VH1','BET','E!'],
        moment_type:      'Live',
        moment_score:     93,
        est_cpm:          28.00,
        est_impressions:  7200000,
        est_dollar_value: 201600,
      },
      {
        moment_id:        'MOM001',
        moment_name:      'Sports Comeback Moment',
        channels:         ['ESPN','ESPN2','CBS Sports','NBC Sports','Fox Sports 1','TNT'],
        moment_type:      'Live',
        moment_score:     91,
        est_cpm:          18.50,
        est_impressions:  4200000,
        est_dollar_value: 77700,
      },
      {
        moment_id:        'MOM017',
        moment_name:      'College Game Day',
        channels:         ['ESPN','ESPN2','ABC','CBS Sports','Fox Sports 1','NBC Sports'],
        moment_type:      'Live',
        moment_score:     85,
        est_cpm:          16.50,
        est_impressions:  3800000,
        est_dollar_value: 62700,
      },
      {
        moment_id:        'MOM028',
        moment_name:      'Back to School Season',
        channels:         ['Disney Channel','Nickelodeon','Cartoon Network','ABC','NBC','CBS','Freeform'],
        moment_type:      'VoD',
        moment_score:     73,
        est_cpm:          10.00,
        est_impressions:  3300000,
        est_dollar_value: 33000,
      },
    ],
  },

];
