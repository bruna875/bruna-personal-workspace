// moments-api.js  v=20260526a
// Mock Moments API — source of truth for all moment metadata
// moment_id, moment_name, moment_type come from the Moments table (DB) — placeholders here
// moment_type:  'VoD' | 'Live' | 'Organic Pause'
// moment_score: decimal 0–100 — UI renders as badge: ≥75 → High, <75 → Standard
// est_dollar_value = est_impressions * est_cpm / 1000

var MOCK_MOMENTS_API = [
  {
    moment_id: 'MOM001',
    moment_name: 'Sports Comeback Moment',
    moment_type: 'Live',
    moment_score: 91,
    est_impressions: 4200000,
    est_cpm: 18.50,
    get est_dollar_value() { return Math.round(this.est_impressions * this.est_cpm / 1000); },
    pods: 240,
    channels: ['ESPN', 'ESPN2', 'CBS Sports', 'NBC Sports', 'Fox Sports 1', 'TNT'],
    taxonomies: {
      emotions:     ['E6', 'E5', 'E1'],
      sentiment:    ['S1'],
      brand_safety: [],
      objects:      ['Ball', 'Stadium', 'Trophy', 'Crowd'],
      locations:    ['Loc14'],
      logos:        ['Logo420', 'Logo421'],
      iab:          [484, 485, 486],
      faces:        ['Celeb120', 'Celeb121']
    }
  },
  {
    moment_id: 'MOM002',
    moment_name: 'Morning Coffee Ritual',
    moment_type: 'VoD',
    moment_score: 72,
    est_impressions: 1850000,
    est_cpm: 9.20,
    get est_dollar_value() { return Math.round(this.est_impressions * this.est_cpm / 1000); },
    pods: 140,
    channels: ['HGTV', 'Food Network', 'Bravo', 'Lifetime', 'Hallmark Channel', 'TLC'],
    taxonomies: {
      emotions:     ['E1', 'E3'],
      sentiment:    ['S1'],
      brand_safety: [],
      objects:      ['Coffee Cup', 'Kettle', 'Newspaper', 'Laptop'],
      locations:    ['Loc19', 'Loc20'],
      logos:        ['Logo45', 'Logo46', 'Logo47'],
      iab:          [198, 199, 200],
      faces:        []
    }
  },
  {
    moment_id: 'MOM003',
    moment_name: 'Family Movie Night',
    moment_type: 'VoD',
    moment_score: 68,
    est_impressions: 2700000,
    est_cpm: 8.00,
    get est_dollar_value() { return Math.round(this.est_impressions * this.est_cpm / 1000); },
    pods: 175,
    channels: ['TBS', 'TNT', 'AMC', 'Freeform', 'USA Network', 'Disney Channel', 'Hallmark Channel'],
    taxonomies: {
      emotions:     ['E1', 'E7'],
      sentiment:    ['S1', 'S4'],
      brand_safety: [],
      objects:      ['Popcorn', 'Remote Control', 'Sofa', 'Television'],
      locations:    ['Loc25'],
      logos:        ['Logo212'],
      iab:          [152, 153],
      faces:        []
    }
  },
  {
    moment_id: 'MOM004',
    moment_name: 'Holiday Shopping Rush',
    moment_type: 'VoD',
    moment_score: 88,
    est_impressions: 5800000,
    est_cpm: 22.00,
    get est_dollar_value() { return Math.round(this.est_impressions * this.est_cpm / 1000); },
    pods: 290,
    channels: ['NBC', 'ABC', 'CBS', 'FOX', 'Lifetime', 'Hallmark Channel', 'TLC', 'Bravo'],
    taxonomies: {
      emotions:     ['E1', 'E6'],
      sentiment:    ['S1', 'S2'],
      brand_safety: [],
      objects:      ['Shopping Bag', 'Gift Box', 'Wrapping Paper', 'Christmas Tree'],
      locations:    ['Loc35', 'Loc36'],
      logos:        ['Logo99', 'Logo100', 'Logo101'],
      iab:          [391, 392, 393],
      faces:        []
    }
  },
  {
    moment_id: 'MOM005',
    moment_name: 'Outdoor Adventure Escape',
    moment_type: 'VoD',
    moment_score: 76,
    est_impressions: 1100000,
    est_cpm: 14.50,
    get est_dollar_value() { return Math.round(this.est_impressions * this.est_cpm / 1000); },
    pods: 120,
    channels: ['Discovery', 'National Geographic', 'Travel Channel', 'Animal Planet', 'History'],
    taxonomies: {
      emotions:     ['E6', 'E1', 'E3'],
      sentiment:    ['S1'],
      brand_safety: [],
      objects:      ['Hiking Boot', 'Backpack', 'Tent', 'Campfire', 'Mountain Bike'],
      locations:    ['Loc55', 'Loc56', 'Loc57'],
      logos:        ['Logo310', 'Logo311'],
      iab:          [359, 360, 361],
      faces:        []
    }
  },
  {
    moment_id: 'MOM006',
    moment_name: 'Tech Unboxing Reveal',
    moment_type: 'Organic Pause',
    moment_score: 82,
    est_impressions: 3400000,
    est_cpm: 15.00,
    get est_dollar_value() { return Math.round(this.est_impressions * this.est_cpm / 1000); },
    pods: 200,
    channels: ['TBS', 'Comedy Central', 'ESPN', 'FX', 'FXX', 'USA Network', 'Syfy'],
    taxonomies: {
      emotions:     ['E3', 'E1'],
      sentiment:    ['S1', 'S2'],
      brand_safety: [],
      objects:      ['Smartphone', 'Laptop', 'Headphones', 'Box', 'Cable'],
      locations:    ['Loc66'],
      logos:        ['Logo1', 'Logo2', 'Logo3'],
      iab:          [551, 552, 553],
      faces:        ['Celeb200', 'Celeb201']
    }
  },
  {
    moment_id: 'MOM007',
    moment_name: 'Cooking Competition Finals',
    moment_type: 'VoD',
    moment_score: 64,
    est_impressions: 2100000,
    est_cpm: 10.80,
    get est_dollar_value() { return Math.round(this.est_impressions * this.est_cpm / 1000); },
    pods: 160,
    channels: ['Food Network', 'Bravo', 'TLC', 'Lifetime', 'A&E', 'E!'],
    taxonomies: {
      emotions:     ['E6', 'E5', 'E9'],
      sentiment:    ['S4'],
      brand_safety: [],
      objects:      ['Knife', 'Frying Pan', 'Plate', 'Oven', 'Mixing Bowl'],
      locations:    ['Loc20'],
      logos:        ['Logo80', 'Logo81'],
      iab:          [198, 201, 202],
      faces:        []
    }
  },
  {
    moment_id: 'MOM008',
    moment_name: 'Late Night Comedy Punchline',
    moment_type: 'Organic Pause',
    moment_score: 71,
    est_impressions: 1900000,
    est_cpm: 11.50,
    get est_dollar_value() { return Math.round(this.est_impressions * this.est_cpm / 1000); },
    pods: 145,
    channels: ['NBC', 'CBS', 'ABC', 'Comedy Central', 'TBS', 'Conan'],
    taxonomies: {
      emotions:     ['E1', 'E3'],
      sentiment:    ['S1'],
      brand_safety: [],
      objects:      ['Microphone', 'Stage Lights', 'Desk', 'Camera'],
      locations:    ['Loc80'],
      logos:        [],
      iab:          [152, 154],
      faces:        ['Celeb5', 'Celeb6', 'Celeb7']
    }
  },
  {
    moment_id: 'MOM009',
    moment_name: 'Pet Rescue Heartwarming',
    moment_type: 'VoD',
    moment_score: 69,
    est_impressions: 1500000,
    est_cpm: 9.00,
    get est_dollar_value() { return Math.round(this.est_impressions * this.est_cpm / 1000); },
    pods: 130,
    channels: ['Animal Planet', 'Discovery', 'TLC', 'Hallmark Channel', 'OWN', 'Lifetime'],
    taxonomies: {
      emotions:     ['E7', 'E1'],
      sentiment:    ['S1'],
      brand_safety: [],
      objects:      ['Dog', 'Cat', 'Leash', 'Toy', 'Bowl'],
      locations:    ['Loc25'],
      logos:        ['Logo290', 'Logo291'],
      iab:          [344, 345, 346],
      faces:        []
    }
  },
  {
    moment_id: 'MOM010',
    moment_name: 'Thriller Chase Scene',
    moment_type: 'Organic Pause',
    moment_score: 43,
    est_impressions: 3100000,
    est_cpm: 13.00,
    get est_dollar_value() { return Math.round(this.est_impressions * this.est_cpm / 1000); },
    pods: 210,
    channels: ['AMC', 'FX', 'TNT', 'USA Network', 'Syfy', 'A&E', 'CBS'],
    taxonomies: {
      emotions:     ['E6', 'E8'],
      sentiment:    ['S5'],
      brand_safety: ['G14'],
      objects:      ['Car', 'Gun', 'Police Car', 'Bridge'],
      locations:    ['Loc3', 'Loc88'],
      logos:        [],
      iab:          [152, 155],
      faces:        ['Celeb10', 'Celeb11']
    }
  },
  {
    moment_id: 'MOM011',
    moment_name: 'Fitness & Workout Grind',
    moment_type: 'VoD',
    moment_score: 79,
    est_impressions: 2500000,
    est_cpm: 12.20,
    get est_dollar_value() { return Math.round(this.est_impressions * this.est_cpm / 1000); },
    pods: 180,
    channels: ['ESPN', 'ESPN2', 'NBC Sports', 'Fox Sports 1', 'CBS Sports', 'Discovery'],
    taxonomies: {
      emotions:     ['E5', 'E6', 'E1'],
      sentiment:    ['S1'],
      brand_safety: [],
      objects:      ['Dumbbell', 'Running Shoe', 'Yoga Mat', 'Water Bottle', 'Treadmill'],
      locations:    ['Loc42'],
      logos:        ['Logo420', 'Logo421', 'Logo422'],
      iab:          [240, 241, 242],
      faces:        ['Celeb130', 'Celeb131']
    }
  },
  {
    moment_id: 'MOM012',
    moment_name: 'Breaking News Alert',
    moment_type: 'Live',
    moment_score: 51,
    est_impressions: 6200000,
    est_cpm: 25.00,
    get est_dollar_value() { return Math.round(this.est_impressions * this.est_cpm / 1000); },
    pods: 300,
    channels: ['CNN', 'MSNBC', 'Fox News', 'NBC', 'ABC', 'CBS', 'BBC America'],
    taxonomies: {
      emotions:     ['E9', 'E3'],
      sentiment:    ['S4', 'S5'],
      brand_safety: ['G11'],
      objects:      ['Microphone', 'Camera', 'Map', 'Newspaper'],
      locations:    ['Loc80', 'Loc88'],
      logos:        [],
      iab:          [297, 298, 299],
      faces:        ['Celeb50', 'Celeb51']
    }
  },
  {
    moment_id: 'MOM013',
    moment_name: 'Kids Birthday Celebration',
    moment_type: 'VoD',
    moment_score: 73,
    est_impressions: 1650000,
    est_cpm: 7.50,
    get est_dollar_value() { return Math.round(this.est_impressions * this.est_cpm / 1000); },
    pods: 115,
    channels: ['Disney Channel', 'Nickelodeon', 'Cartoon Network', 'Freeform', 'TLC', 'Hallmark Channel'],
    taxonomies: {
      emotions:     ['E1', 'E7'],
      sentiment:    ['S1'],
      brand_safety: [],
      objects:      ['Cake', 'Balloon', 'Gift Box', 'Candle', 'Party Hat'],
      locations:    ['Loc25'],
      logos:        ['Logo150', 'Logo151'],
      iab:          [152, 153],
      faces:        []
    }
  },
  {
    moment_id: 'MOM014',
    moment_name: 'Luxury Car Commercial',
    moment_type: 'Organic Pause',
    moment_score: 84,
    est_impressions: 2900000,
    est_cpm: 21.00,
    get est_dollar_value() { return Math.round(this.est_impressions * this.est_cpm / 1000); },
    pods: 190,
    channels: ['NBC', 'ABC', 'CBS', 'FOX', 'CNN', 'MSNBC', 'ESPN', 'Golf Channel'],
    taxonomies: {
      emotions:     ['E1', 'E2'],
      sentiment:    ['S1'],
      brand_safety: [],
      objects:      ['Car', 'Road', 'Keys', 'Dashboard'],
      locations:    ['Loc3', 'Loc104'],
      logos:        ['Logo60', 'Logo61', 'Logo62'],
      iab:          [15, 16, 17],
      faces:        []
    }
  },
  {
    moment_id: 'MOM015',
    moment_name: 'Nature Documentary Sunrise',
    moment_type: 'VoD',
    moment_score: 62,
    est_impressions: 980000,
    est_cpm: 11.00,
    get est_dollar_value() { return Math.round(this.est_impressions * this.est_cpm / 1000); },
    pods: 100,
    channels: ['National Geographic', 'Discovery', 'Animal Planet', 'BBC America', 'PBS'],
    taxonomies: {
      emotions:     ['E8', 'E4', 'E3'],
      sentiment:    ['S1'],
      brand_safety: [],
      objects:      ['Bird', 'Tree', 'Waterfall', 'Sunrise', 'Cloud'],
      locations:    ['Loc55', 'Loc95', 'Loc96'],
      logos:        [],
      iab:          [340, 341, 342],
      faces:        []
    }
  },
  {
    moment_id: 'MOM016',
    moment_name: 'Wedding Day Ceremony',
    moment_type: 'VoD',
    moment_score: 77,
    est_impressions: 1750000,
    est_cpm: 12.00,
    get est_dollar_value() { return Math.round(this.est_impressions * this.est_cpm / 1000); },
    pods: 135,
    channels: ['Lifetime', 'TLC', 'Hallmark Channel', 'Bravo', 'OWN', 'WE tv'],
    taxonomies: {
      emotions:     ['E2', 'E7', 'E1'],
      sentiment:    ['S1'],
      brand_safety: [],
      objects:      ['Wedding Dress', 'Ring', 'Bouquet', 'Wedding Cake', 'Church'],
      locations:    ['Loc108'],
      logos:        ['Logo370', 'Logo371'],
      iab:          [626, 627],
      faces:        []
    }
  },
  {
    moment_id: 'MOM017',
    moment_name: 'College Game Day',
    moment_type: 'Live',
    moment_score: 85,
    est_impressions: 3800000,
    est_cpm: 16.50,
    get est_dollar_value() { return Math.round(this.est_impressions * this.est_cpm / 1000); },
    pods: 260,
    channels: ['ESPN', 'ESPN2', 'ABC', 'CBS Sports', 'Fox Sports 1', 'NBC Sports'],
    taxonomies: {
      emotions:     ['E6', 'E1', 'E5'],
      sentiment:    ['S1', 'S4'],
      brand_safety: [],
      objects:      ['Football', 'Helmet', 'Jersey', 'Scoreboard', 'Stadium'],
      locations:    ['Loc14'],
      logos:        ['Logo420', 'Logo90', 'Logo91'],
      iab:          [484, 487, 488],
      faces:        ['Celeb120', 'Celeb122']
    }
  },
  {
    moment_id: 'MOM018',
    moment_name: 'Real Estate House Tour',
    moment_type: 'VoD',
    moment_score: 65,
    est_impressions: 1300000,
    est_cpm: 10.50,
    get est_dollar_value() { return Math.round(this.est_impressions * this.est_cpm / 1000); },
    pods: 115,
    channels: ['HGTV', 'TLC', 'Bravo', 'A&E', 'Lifetime', 'Discovery'],
    taxonomies: {
      emotions:     ['E3', 'E1'],
      sentiment:    ['S1', 'S2'],
      brand_safety: [],
      objects:      ['House', 'Kitchen', 'Bathroom', 'Garden', 'Pool'],
      locations:    ['Loc25', 'Loc26'],
      logos:        ['Logo230', 'Logo231'],
      iab:          [264, 265, 266],
      faces:        []
    }
  },
  {
    moment_id: 'MOM019',
    moment_name: 'Music Award Show',
    moment_type: 'Live',
    moment_score: 93,
    est_impressions: 7200000,
    est_cpm: 28.00,
    get est_dollar_value() { return Math.round(this.est_impressions * this.est_cpm / 1000); },
    pods: 295,
    channels: ['CBS', 'NBC', 'ABC', 'MTV', 'VH1', 'BET', 'E!'],
    taxonomies: {
      emotions:     ['E1', 'E7', 'E6'],
      sentiment:    ['S1'],
      brand_safety: [],
      objects:      ['Microphone', 'Trophy', 'Stage', 'Red Carpet', 'Camera'],
      locations:    ['Loc80', 'Loc81'],
      logos:        ['Logo200', 'Logo201', 'Logo202'],
      iab:          [305, 306, 307],
      faces:        ['Celeb1', 'Celeb3', 'Celeb6', 'Celeb8']
    }
  },
  {
    moment_id: 'MOM020',
    moment_name: 'Beach Summer Vacation',
    moment_type: 'VoD',
    moment_score: 74,
    est_impressions: 2200000,
    est_cpm: 11.00,
    get est_dollar_value() { return Math.round(this.est_impressions * this.est_cpm / 1000); },
    pods: 155,
    channels: ['TLC', 'Travel Channel', 'Bravo', 'E!', 'Discovery', 'National Geographic'],
    taxonomies: {
      emotions:     ['E1', 'E2'],
      sentiment:    ['S1'],
      brand_safety: [],
      objects:      ['Sunglasses', 'Surfboard', 'Towel', 'Umbrella', 'Sunscreen'],
      locations:    ['Loc11', 'Loc12'],
      logos:        ['Logo330', 'Logo331', 'Logo332'],
      iab:          [578, 579, 580],
      faces:        []
    }
  },
  {
    moment_id: 'MOM021',
    moment_name: 'Hospital Drama Cliffhanger',
    moment_type: 'Organic Pause',
    moment_score: 38,
    est_impressions: 3500000,
    est_cpm: 14.20,
    get est_dollar_value() { return Math.round(this.est_impressions * this.est_cpm / 1000); },
    pods: 225,
    channels: ['ABC', 'NBC', 'CBS', 'FOX', 'Lifetime', 'A&E', 'TNT'],
    taxonomies: {
      emotions:     ['E9', 'E7', 'E8'],
      sentiment:    ['S4', 'S5'],
      brand_safety: ['G4-2'],
      objects:      ['Stethoscope', 'Hospital Bed', 'Syringe', 'X-Ray', 'Scrubs'],
      locations:    ['Loc43'],
      logos:        [],
      iab:          [243, 244, 245],
      faces:        ['Celeb30', 'Celeb31']
    }
  },
  {
    moment_id: 'MOM022',
    moment_name: 'Grocery Store Discovery',
    moment_type: 'Organic Pause',
    moment_score: 70,
    est_impressions: 4100000,
    est_cpm: 8.80,
    get est_dollar_value() { return Math.round(this.est_impressions * this.est_cpm / 1000); },
    pods: 250,
    channels: ['Food Network', 'TLC', 'Bravo', 'HGTV', 'Lifetime', 'Hallmark Channel', 'CBS'],
    taxonomies: {
      emotions:     ['E3', 'E1'],
      sentiment:    ['S2'],
      brand_safety: [],
      objects:      ['Shopping Cart', 'Fruit', 'Vegetable', 'Bread', 'Milk'],
      locations:    ['Loc37'],
      logos:        ['Logo99', 'Logo100', 'Logo101', 'Logo102'],
      iab:          [198, 203, 204],
      faces:        []
    }
  },
  {
    moment_id: 'MOM023',
    moment_name: 'Travel Airport Departure',
    moment_type: 'VoD',
    moment_score: 67,
    est_impressions: 1600000,
    est_cpm: 13.50,
    get est_dollar_value() { return Math.round(this.est_impressions * this.est_cpm / 1000); },
    pods: 130,
    channels: ['Travel Channel', 'Discovery', 'CNN', 'MSNBC', 'National Geographic', 'BBC America'],
    taxonomies: {
      emotions:     ['E3', 'E1', 'E4'],
      sentiment:    ['S2', 'S4'],
      brand_safety: [],
      objects:      ['Suitcase', 'Passport', 'Airplane', 'Boarding Pass', 'Luggage'],
      locations:    ['Loc1'],
      logos:        ['Logo240', 'Logo241', 'Logo242'],
      iab:          [578, 581, 582],
      faces:        []
    }
  },
  {
    moment_id: 'MOM024',
    moment_name: 'Political Debate Showdown',
    moment_type: 'Live',
    moment_score: 29,
    est_impressions: 5500000,
    est_cpm: 30.00,
    get est_dollar_value() { return Math.round(this.est_impressions * this.est_cpm / 1000); },
    pods: 285,
    channels: ['CNN', 'MSNBC', 'Fox News', 'NBC', 'ABC', 'CBS', 'PBS'],
    taxonomies: {
      emotions:     ['E9', 'E5', 'E3'],
      sentiment:    ['S4', 'S5'],
      brand_safety: ['G11'],
      objects:      ['Podium', 'Microphone', 'Flag', 'Camera'],
      locations:    ['Loc80'],
      logos:        [],
      iab:          [374, 375, 376],
      faces:        ['Celeb50', 'Celeb51', 'Celeb52']
    }
  },
  {
    moment_id: 'MOM025',
    moment_name: 'Wine & Dining Experience',
    moment_type: 'Organic Pause',
    moment_score: 78,
    est_impressions: 1050000,
    est_cpm: 19.00,
    get est_dollar_value() { return Math.round(this.est_impressions * this.est_cpm / 1000); },
    pods: 105,
    channels: ['Bravo', 'Food Network', 'Travel Channel', 'E!', 'Lifetime', 'OWN'],
    taxonomies: {
      emotions:     ['E2', 'E1'],
      sentiment:    ['S1'],
      brand_safety: ['G8-3'],
      objects:      ['Wine Glass', 'Bottle', 'Candle', 'Plate', 'Restaurant Table'],
      locations:    ['Loc92'],
      logos:        ['Logo45', 'Logo440', 'Logo441'],
      iab:          [198, 205, 206],
      faces:        []
    }
  },
  {
    moment_id: 'MOM026',
    moment_name: 'Newborn Baby Arrival',
    moment_type: 'VoD',
    moment_score: 71,
    est_impressions: 1400000,
    est_cpm: 9.50,
    get est_dollar_value() { return Math.round(this.est_impressions * this.est_cpm / 1000); },
    pods: 120,
    channels: ['TLC', 'Lifetime', 'Hallmark Channel', 'OWN', 'A&E', 'Bravo'],
    taxonomies: {
      emotions:     ['E7', 'E1', 'E2'],
      sentiment:    ['S1'],
      brand_safety: [],
      objects:      ['Baby', 'Crib', 'Diaper', 'Pacifier', 'Stroller'],
      locations:    ['Loc25', 'Loc43'],
      logos:        ['Logo160', 'Logo161'],
      iab:          [312, 313, 314],
      faces:        []
    }
  },
  {
    moment_id: 'MOM027',
    moment_name: 'Superhero Action Sequence',
    moment_type: 'Organic Pause',
    moment_score: 58,
    est_impressions: 4800000,
    est_cpm: 16.00,
    get est_dollar_value() { return Math.round(this.est_impressions * this.est_cpm / 1000); },
    pods: 270,
    channels: ['FX', 'FXX', 'TNT', 'TBS', 'Syfy', 'AMC', 'USA Network'],
    taxonomies: {
      emotions:     ['E6', 'E1', 'E5'],
      sentiment:    ['S1', 'S2'],
      brand_safety: ['G14'],
      objects:      ['Cape', 'Mask', 'City Skyline', 'Explosion'],
      locations:    ['Loc88', 'Loc89'],
      logos:        ['Logo220', 'Logo221'],
      iab:          [152, 156, 157],
      faces:        ['Celeb10', 'Celeb11', 'Celeb12']
    }
  },
  {
    moment_id: 'MOM028',
    moment_name: 'Back to School Season',
    moment_type: 'VoD',
    moment_score: 73,
    est_impressions: 3300000,
    est_cpm: 10.00,
    get est_dollar_value() { return Math.round(this.est_impressions * this.est_cpm / 1000); },
    pods: 220,
    channels: ['Disney Channel', 'Nickelodeon', 'Cartoon Network', 'ABC', 'NBC', 'CBS', 'Freeform'],
    taxonomies: {
      emotions:     ['E3', 'E5', 'E9'],
      sentiment:    ['S2', 'S4'],
      brand_safety: [],
      objects:      ['Backpack', 'Pencil', 'Notebook', 'School Bus', 'Locker'],
      locations:    ['Loc99'],
      logos:        ['Logo150', 'Logo170', 'Logo171'],
      iab:          [147, 148, 149],
      faces:        []
    }
  },
  {
    moment_id: 'MOM029',
    moment_name: 'Crime Investigation Reveal',
    moment_type: 'VoD',
    moment_score: 34,
    est_impressions: 2800000,
    est_cpm: 13.80,
    get est_dollar_value() { return Math.round(this.est_impressions * this.est_cpm / 1000); },
    pods: 195,
    channels: ['ID', 'A&E', 'Oxygen', 'NBC', 'CBS', 'AMC', 'TNT'],
    taxonomies: {
      emotions:     ['E8', 'E9', 'E3'],
      sentiment:    ['S5', 'S4'],
      brand_safety: ['G3', 'G14'],
      objects:      ['Handcuffs', 'Badge', 'Evidence Bag', 'Crime Scene Tape', 'Fingerprint'],
      locations:    ['Loc88', 'Loc43'],
      logos:        [],
      iab:          [297, 300, 301],
      faces:        []
    }
  },
  {
    moment_id: 'MOM030',
    moment_name: 'Graduation Day Celebration',
    moment_type: 'VoD',
    moment_score: 75,
    est_impressions: 1200000,
    est_cpm: 11.80,
    get est_dollar_value() { return Math.round(this.est_impressions * this.est_cpm / 1000); },
    pods: 110,
    channels: ['NBC', 'ABC', 'CBS', 'Hallmark Channel', 'OWN', 'Lifetime', 'TLC'],
    taxonomies: {
      emotions:     ['E1', 'E7', 'E5'],
      sentiment:    ['S1'],
      brand_safety: [],
      objects:      ['Graduation Cap', 'Diploma', 'Confetti', 'Robe', 'Flowers'],
      locations:    ['Loc100', 'Loc101'],
      logos:        [],
      iab:          [147, 150, 151],
      faces:        []
    }
  }
];

// Helper: get moment by ID
function momentById(id) {
  var m = MOCK_MOMENTS_API.find(function(m) { return m.moment_id === id; });
  if (!m) return null;
  return Object.assign({}, m, {
    est_dollar_value: Math.round(m.est_impressions * m.est_cpm / 1000)
  });
}

// Helper: moment_score → badge label
function momentScoreBadge(score) {
  if (score == null) return 'Standard';
  return score >= 75 ? 'High' : 'Standard';
}

// Helper: format impressions  2100000 → "2.1M"
function fmtMomentImpr(n) {
  if (!n) return '—';
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000)    return Math.round(n / 1000) + 'K';
  return String(n);
}

// Helper: format CPM  18.50 → "$18.50"
function fmtMomentCpm(n) {
  if (!n && n !== 0) return '—';
  return '$' + n.toFixed(2);
}

// Helper: format dollar value  154700 → "$154.7K"
function fmtMomentDollar(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000)    return '$' + (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return '$' + n.toFixed(0);
}
