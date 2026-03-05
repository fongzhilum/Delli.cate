// Mock data for Delli.cate - Social Worker Dashboard
// This system monitors Instagram and TikTok for distress signals

export const mockPersons = [
  {
    id: '1',
    name: 'Marcus Johnson',
    age: 17,
    location: 'Brooklyn, NY',
    caseId: 'SW-2024-001',
    assignedWorker: 'Sarah Chen',
    riskLevel: 'high',
    distressScore: 72,
    lastContact: new Date('2026-03-01'),
    status: 'active',
    notes: [
      'Recent changes in online behavior detected',
      'Increased activity during late night hours (2-4am)',
      'Follow-up scheduled for next week',
      'Parents notified of concerning patterns'
    ],
    aiSummary: 'User shows signs of increased emotional distress with recurring themes of isolation and hopelessness. Recent posts indicate sleep disturbance patterns. Recommend immediate check-in with support network.',
    socialMediaAccounts: [
      { platform: 'instagram', username: '@marcusj_17', url: 'https://instagram.com/marcusj_17', lastChecked: new Date('2026-03-02') },
      { platform: 'tiktok', username: '@mjreal', url: 'https://tiktok.com/@mjreal', lastChecked: new Date('2026-03-02') }
    ],
    distressPosts: [
      {
        id: 'p1-1',
        platform: 'instagram',
        extractedText: "can't sleep again... nobody gets it. feels like i'm drowning and everyone just keeps walking by",
        distressScore: 72,
        emotionalIntensity: 85,
        persistence: 68,
        timestamp: new Date('2026-03-02T03:15:00'),
        isConcerning: true
      },
      {
        id: 'p1-2',
        platform: 'instagram',
        extractedText: "everything feels pointless lately. just going through the motions",
        distressScore: 68,
        emotionalIntensity: 75,
        persistence: 72,
        timestamp: new Date('2026-03-01T23:45:00'),
        isConcerning: true
      },
      {
        id: 'p1-3',
        platform: 'tiktok',
        extractedText: "when u smile all day but dying inside lol",
        distressScore: 55,
        emotionalIntensity: 60,
        persistence: 50,
        timestamp: new Date('2026-02-29T18:30:00'),
        isConcerning: true
      },
      {
        id: 'p1-4',
        platform: 'instagram',
        extractedText: "another sleepless night staring at the ceiling",
        distressScore: 65,
        emotionalIntensity: 70,
        persistence: 62,
        timestamp: new Date('2026-02-28T02:20:00'),
        isConcerning: true
      },
      {
        id: 'p1-5',
        platform: 'tiktok',
        extractedText: "fake smiles all day every day",
        distressScore: 58,
        emotionalIntensity: 62,
        persistence: 55,
        timestamp: new Date('2026-02-26T16:45:00'),
        isConcerning: true
      },
      {
        id: 'p1-6',
        platform: 'instagram',
        extractedText: "feeling alone in a crowded room",
        distressScore: 62,
        emotionalIntensity: 68,
        persistence: 60,
        timestamp: new Date('2026-02-24T21:30:00'),
        isConcerning: true
      },
      {
        id: 'p1-7',
        platform: 'instagram',
        extractedText: "why even bother anymore",
        distressScore: 70,
        emotionalIntensity: 78,
        persistence: 68,
        timestamp: new Date('2026-02-22T03:00:00'),
        isConcerning: true
      },
      {
        id: 'p1-8',
        platform: 'tiktok',
        extractedText: "good vibes only right? wrong",
        distressScore: 52,
        emotionalIntensity: 58,
        persistence: 48,
        timestamp: new Date('2026-02-20T19:15:00'),
        isConcerning: true
      },
      {
        id: 'p1-9',
        platform: 'instagram',
        extractedText: "tired of pretending everything is okay",
        distressScore: 64,
        emotionalIntensity: 72,
        persistence: 62,
        timestamp: new Date('2026-02-18T22:40:00'),
        isConcerning: true
      },
      {
        id: 'p1-10',
        platform: 'instagram',
        extractedText: "nobody really cares though",
        distressScore: 60,
        emotionalIntensity: 65,
        persistence: 58,
        timestamp: new Date('2026-02-15T01:50:00'),
        isConcerning: true
      }
    ]
  },
  {
    id: '2',
    name: 'Emma Rodriguez',
    age: 15,
    location: 'Los Angeles, CA',
    caseId: 'SW-2024-002',
    assignedWorker: 'James Patterson',
    riskLevel: 'low',
    distressScore: 12,
    lastContact: new Date('2026-02-28'),
    status: 'resolved',
    resolvedDate: new Date('2026-02-28'),
    resolvedNotes: 'Successfully completed program. Strong support system in place. No further intervention needed at this time.',
    notes: [
      'Stable situation with consistent progress',
      'Regular check-ins maintained weekly',
      'Positive engagement with community programs',
      'Strong family support system present',
      '🔒 Case resolved: Successfully completed program. Strong support system in place. No further intervention needed at this time.'
    ],
    aiSummary: 'Overall positive outlook with healthy social connections. Posts show engagement with creative hobbies and peer support. No immediate concerns detected.',
    socialMediaAccounts: [
      { platform: 'instagram', username: '@emma.rod', url: 'https://instagram.com/emma.rod', lastChecked: new Date('2026-03-03') },
      { platform: 'tiktok', username: '@emmacreates', url: 'https://tiktok.com/@emmacreates', lastChecked: new Date('2026-03-02') }
    ],
    distressPosts: [
      {
        id: 'p2-1',
        platform: 'instagram',
        extractedText: "had an amazing day with friends! feeling grateful",
        distressScore: 12,
        emotionalIntensity: 15,
        persistence: 10,
        timestamp: new Date('2026-03-02T16:20:00'),
        isConcerning: false
      },
      {
        id: 'p2-2',
        platform: 'tiktok',
        extractedText: "art therapy is literally saving my life",
        distressScore: 18,
        emotionalIntensity: 20,
        persistence: 15,
        timestamp: new Date('2026-02-28T14:30:00'),
        isConcerning: false
      },
      {
        id: 'p2-3',
        platform: 'instagram',
        extractedText: "feeling blessed today",
        distressScore: 10,
        emotionalIntensity: 12,
        persistence: 8,
        timestamp: new Date('2026-02-25T11:15:00'),
        isConcerning: false
      }
    ]
  },
  {
    id: '3',
    name: 'Tyler Washington',
    age: 16,
    location: 'Chicago, IL',
    caseId: 'SW-2024-003',
    assignedWorker: 'Sarah Chen',
    riskLevel: 'critical',
    distressScore: 95,
    lastContact: new Date('2026-03-03'),
    status: 'active',
    notes: [
      'URGENT: Concerning posts detected overnight',
      'Immediate intervention protocol activated',
      'Family contacted and meeting scheduled',
      'Crisis support resources provided',
      'Daily monitoring required'
    ],
    aiSummary: 'CRITICAL ALERT: Multiple high-distress posts with themes of self-harm and suicidal ideation. User expressing feelings of worthlessness and detailed plans. Immediate intervention required. Contact emergency services if unable to reach.',
    socialMediaAccounts: [
      { platform: 'instagram', username: '@t.wash16', url: 'https://instagram.com/t.wash16', lastChecked: new Date('2026-03-03') },
      { platform: 'tiktok', username: '@tylerwash', url: 'https://tiktok.com/@tylerwash', lastChecked: new Date('2026-03-03') }
    ],
    distressPosts: [
      {
        id: 'p3-1',
        platform: 'instagram',
        extractedText: "i don't think i can do this anymore. everyone would be better off without me here",
        distressScore: 95,
        emotionalIntensity: 98,
        persistence: 92,
        timestamp: new Date('2026-03-03T02:30:00'),
        isConcerning: true
      },
      {
        id: 'p3-2',
        platform: 'tiktok',
        extractedText: "tired of being a burden to everyone. maybe it's time to just end it all",
        distressScore: 92,
        emotionalIntensity: 95,
        persistence: 88,
        timestamp: new Date('2026-03-03T01:15:00'),
        isConcerning: true
      },
      {
        id: 'p3-3',
        platform: 'instagram',
        extractedText: "nobody cares anyway. i'm invisible to everyone",
        distressScore: 78,
        emotionalIntensity: 80,
        persistence: 75,
        timestamp: new Date('2026-03-02T22:45:00'),
        isConcerning: true
      },
      {
        id: 'p3-4',
        platform: 'instagram',
        extractedText: "what's the point of waking up tomorrow",
        distressScore: 88,
        emotionalIntensity: 90,
        persistence: 85,
        timestamp: new Date('2026-03-01T03:20:00'),
        isConcerning: true
      },
      {
        id: 'p3-5',
        platform: 'tiktok',
        extractedText: "feeling like a mistake that never should have happened",
        distressScore: 85,
        emotionalIntensity: 88,
        persistence: 82,
        timestamp: new Date('2026-02-29T23:50:00'),
        isConcerning: true
      },
      {
        id: 'p3-6',
        platform: 'instagram',
        extractedText: "pain is all i know anymore",
        distressScore: 90,
        emotionalIntensity: 92,
        persistence: 88,
        timestamp: new Date('2026-02-28T02:10:00'),
        isConcerning: true
      },
      {
        id: 'p3-7',
        platform: 'instagram',
        extractedText: "disappearing sounds peaceful",
        distressScore: 93,
        emotionalIntensity: 96,
        persistence: 90,
        timestamp: new Date('2026-02-26T04:30:00'),
        isConcerning: true
      },
      {
        id: 'p3-8',
        platform: 'tiktok',
        extractedText: "just want the hurt to stop",
        distressScore: 87,
        emotionalIntensity: 89,
        persistence: 84,
        timestamp: new Date('2026-02-24T01:45:00'),
        isConcerning: true
      }
    ]
  },
  {
    id: '4',
    name: 'Aisha Patel',
    age: 14,
    location: 'Houston, TX',
    caseId: 'SW-2024-004',
    assignedWorker: 'Michael Torres',
    riskLevel: 'medium',
    distressScore: 48,
    lastContact: new Date('2026-02-25'),
    status: 'active',
    notes: [
      'Some concerning interactions detected online',
      'Monitoring friend connections and influences',
      'Parents informed of social media activity',
      'Cyberbullying indicators present',
      'School counselor notified'
    ],
    aiSummary: 'Moderate concern level. Posts indicate social stress and peer conflict. Some negative self-talk emerging. Recommend increased check-ins and discussion about online interactions.',
    socialMediaAccounts: [
      { platform: 'instagram', username: '@aisha.p', url: 'https://instagram.com/aisha.p', lastChecked: new Date('2026-03-01') },
      { platform: 'tiktok', username: '@aishap14', url: 'https://tiktok.com/@aishap14', lastChecked: new Date('2026-03-01') }
    ],
    distressPosts: [
      {
        id: 'p4-1',
        platform: 'instagram',
        extractedText: "why do they always exclude me from everything? am i really that annoying?",
        distressScore: 48,
        emotionalIntensity: 55,
        persistence: 45,
        timestamp: new Date('2026-03-01T15:20:00'),
        isConcerning: true
      },
      {
        id: 'p4-2',
        platform: 'tiktok',
        extractedText: "when ur supposed best friend starts ignoring u for no reason",
        distressScore: 42,
        emotionalIntensity: 50,
        persistence: 38,
        timestamp: new Date('2026-02-28T19:10:00'),
        isConcerning: true
      },
      {
        id: 'p4-3',
        platform: 'instagram',
        extractedText: "sitting alone at lunch again",
        distressScore: 45,
        emotionalIntensity: 52,
        persistence: 42,
        timestamp: new Date('2026-02-26T12:30:00'),
        isConcerning: true
      },
      {
        id: 'p4-4',
        platform: 'tiktok',
        extractedText: "being left on read hurts different",
        distressScore: 38,
        emotionalIntensity: 45,
        persistence: 35,
        timestamp: new Date('2026-02-24T20:15:00'),
        isConcerning: true
      },
      {
        id: 'p4-5',
        platform: 'instagram',
        extractedText: "maybe i'm just meant to be alone",
        distressScore: 50,
        emotionalIntensity: 58,
        persistence: 48,
        timestamp: new Date('2026-02-22T16:45:00'),
        isConcerning: true
      },
      {
        id: 'p4-6',
        platform: 'instagram',
        extractedText: "watching everyone hang out without me",
        distressScore: 44,
        emotionalIntensity: 48,
        persistence: 40,
        timestamp: new Date('2026-02-20T18:20:00'),
        isConcerning: true
      }
    ]
  },
  {
    id: '5',
    name: 'Jordan Lee',
    age: 18,
    location: 'Seattle, WA',
    caseId: 'SW-2024-005',
    assignedWorker: 'James Patterson',
    riskLevel: 'low',
    distressScore: 8,
    lastContact: new Date('2026-03-02'),
    status: 'active',
    notes: [
      'Transitioning successfully to adult services',
      'Showing good progress and independence',
      'Secured part-time employment',
      'Active in community support groups'
    ],
    aiSummary: 'Positive trajectory with healthy coping mechanisms. Posts reflect optimism about future and engagement with support systems. Continue routine monitoring.',
    socialMediaAccounts: [
      { platform: 'instagram', username: '@jordan.lee', url: 'https://instagram.com/jordan.lee', lastChecked: new Date('2026-03-02') },
      { platform: 'tiktok', username: '@jordanlee', url: 'https://tiktok.com/@jordanlee', lastChecked: new Date('2026-03-01') }
    ],
    distressPosts: [
      {
        id: 'p5-1',
        platform: 'tiktok',
        extractedText: "excited about starting my new job next week! things are looking up",
        distressScore: 8,
        emotionalIntensity: 10,
        persistence: 5,
        timestamp: new Date('2026-03-01T12:30:00'),
        isConcerning: false
      },
      {
        id: 'p5-2',
        platform: 'instagram',
        extractedText: "grateful for my support system",
        distressScore: 10,
        emotionalIntensity: 12,
        persistence: 8,
        timestamp: new Date('2026-02-27T16:45:00'),
        isConcerning: false
      },
      {
        id: 'p5-3',
        platform: 'tiktok',
        extractedText: "life is good when you surround yourself with the right people",
        distressScore: 5,
        emotionalIntensity: 8,
        persistence: 5,
        timestamp: new Date('2026-02-24T11:20:00'),
        isConcerning: false
      }
    ]
  },
  {
    id: '6',
    name: 'Sophia Martinez',
    age: 16,
    location: 'Miami, FL',
    caseId: 'SW-2024-006',
    assignedWorker: 'Sarah Chen',
    riskLevel: 'medium',
    distressScore: 52,
    lastContact: new Date('2026-02-29'),
    status: 'active',
    notes: [
      'Recent changes in friend group dynamics',
      'Monitoring for cyberbullying indicators',
      'Increased anxiety-related posts',
      'Parent-teen communication sessions recommended'
    ],
    aiSummary: 'Moderate distress related to peer relationships and social acceptance. Some anxiety patterns emerging. Recommend support group participation and continued monitoring.',
    socialMediaAccounts: [
      { platform: 'instagram', username: '@sophiam', url: 'https://instagram.com/sophiam', lastChecked: new Date('2026-03-02') },
      { platform: 'tiktok', username: '@sophia.m', url: 'https://tiktok.com/@sophia.m', lastChecked: new Date('2026-03-02') }
    ],
    distressPosts: [
      {
        id: 'p6-1',
        platform: 'instagram',
        extractedText: "anxiety is getting worse. can't stop overthinking everything i say and do",
        distressScore: 52,
        emotionalIntensity: 58,
        persistence: 48,
        timestamp: new Date('2026-03-02T20:15:00'),
        isConcerning: true
      },
      {
        id: 'p6-2',
        platform: 'tiktok',
        extractedText: "that feeling when u realize ur friends are fake",
        distressScore: 45,
        emotionalIntensity: 50,
        persistence: 42,
        timestamp: new Date('2026-03-01T17:30:00'),
        isConcerning: true
      },
      {
        id: 'p6-3',
        platform: 'instagram',
        extractedText: "my heart races before every social interaction",
        distressScore: 48,
        emotionalIntensity: 54,
        persistence: 45,
        timestamp: new Date('2026-02-29T14:20:00'),
        isConcerning: true
      },
      {
        id: 'p6-4',
        platform: 'tiktok',
        extractedText: "trust issues loading...",
        distressScore: 42,
        emotionalIntensity: 46,
        persistence: 40,
        timestamp: new Date('2026-02-27T19:45:00'),
        isConcerning: true
      },
      {
        id: 'p6-5',
        platform: 'instagram',
        extractedText: "scared of saying the wrong thing constantly",
        distressScore: 50,
        emotionalIntensity: 56,
        persistence: 47,
        timestamp: new Date('2026-02-25T21:10:00'),
        isConcerning: true
      },
      {
        id: 'p6-6',
        platform: 'instagram',
        extractedText: "replaying every conversation in my head",
        distressScore: 46,
        emotionalIntensity: 52,
        persistence: 44,
        timestamp: new Date('2026-02-23T23:30:00'),
        isConcerning: true
      },
      {
        id: 'p6-7',
        platform: 'tiktok',
        extractedText: "social anxiety hitting different lately",
        distressScore: 54,
        emotionalIntensity: 60,
        persistence: 50,
        timestamp: new Date('2026-02-21T16:50:00'),
        isConcerning: true
      }
    ]
  },
  {
    id: '7',
    name: 'Kai Thompson',
    age: 15,
    location: 'Portland, OR',
    caseId: 'SW-2024-007',
    assignedWorker: 'Lisa Anderson',
    riskLevel: 'critical',
    distressScore: 88,
    lastContact: new Date('2026-03-04'),
    status: 'active',
    notes: [
      'Escalating self-harm references detected',
      'Emergency contact made with guardians',
      'Therapist appointment scheduled for tomorrow',
      'School administration notified',
      'Implementing 24/7 crisis line access'
    ],
    aiSummary: 'URGENT: Severe distress signals with explicit mentions of self-harm. Recent family conflict appears to be major trigger. Immediate professional intervention essential. Monitor all platforms hourly.',
    socialMediaAccounts: [
      { platform: 'instagram', username: '@kai.t', url: 'https://instagram.com/kai.t', lastChecked: new Date('2026-03-04') },
      { platform: 'tiktok', username: '@kaithompson', url: 'https://tiktok.com/@kaithompson', lastChecked: new Date('2026-03-04') }
    ],
    distressPosts: [
      {
        id: 'p7-1',
        platform: 'instagram',
        extractedText: "the pain is the only thing that makes me feel real anymore",
        distressScore: 88,
        emotionalIntensity: 92,
        persistence: 85,
        timestamp: new Date('2026-03-04T01:20:00'),
        isConcerning: true
      },
      {
        id: 'p7-2',
        platform: 'tiktok',
        extractedText: "nobody would even notice if i disappeared",
        distressScore: 85,
        emotionalIntensity: 88,
        persistence: 82,
        timestamp: new Date('2026-03-03T23:45:00'),
        isConcerning: true
      },
      {
        id: 'p7-3',
        platform: 'instagram',
        extractedText: "cutting feels like the only control i have left",
        distressScore: 90,
        emotionalIntensity: 94,
        persistence: 88,
        timestamp: new Date('2026-03-02T02:30:00'),
        isConcerning: true
      },
      {
        id: 'p7-4',
        platform: 'instagram',
        extractedText: "numb inside and out",
        distressScore: 82,
        emotionalIntensity: 86,
        persistence: 80,
        timestamp: new Date('2026-03-01T04:15:00'),
        isConcerning: true
      },
      {
        id: 'p7-5',
        platform: 'tiktok',
        extractedText: "scars tell stories i can't speak out loud",
        distressScore: 86,
        emotionalIntensity: 90,
        persistence: 84,
        timestamp: new Date('2026-02-28T22:50:00'),
        isConcerning: true
      },
      {
        id: 'p7-6',
        platform: 'instagram',
        extractedText: "physical pain is easier than emotional",
        distressScore: 84,
        emotionalIntensity: 87,
        persistence: 81,
        timestamp: new Date('2026-02-26T03:40:00'),
        isConcerning: true
      }
    ]
  },
  {
    id: '8',
    name: 'Maya Chen',
    age: 17,
    location: 'San Francisco, CA',
    caseId: 'SW-2024-008',
    assignedWorker: 'Michael Torres',
    riskLevel: 'high',
    distressScore: 68,
    lastContact: new Date('2026-03-02'),
    status: 'active',
    notes: [
      'Academic pressure and family expectations causing stress',
      'Signs of perfectionism and burnout',
      'Connected with school counselor',
      'Exploring healthy coping strategies',
      'Weekly check-ins established'
    ],
    aiSummary: 'High stress levels related to academic performance and family pressure. Showing signs of anxiety and depression. Requires support in managing expectations and developing self-compassion.',
    socialMediaAccounts: [
      { platform: 'instagram', username: '@mayac_17', url: 'https://instagram.com/mayac_17', lastChecked: new Date('2026-03-02') },
      { platform: 'tiktok', username: '@mayachen', url: 'https://tiktok.com/@mayachen', lastChecked: new Date('2026-03-02') }
    ],
    distressPosts: [
      {
        id: 'p8-1',
        platform: 'instagram',
        extractedText: "failed another test. i'm never going to be good enough for them",
        distressScore: 68,
        emotionalIntensity: 72,
        persistence: 65,
        timestamp: new Date('2026-03-02T16:30:00'),
        isConcerning: true
      },
      {
        id: 'p8-2',
        platform: 'tiktok',
        extractedText: "exhausted from pretending everything is fine. when does it get easier?",
        distressScore: 64,
        emotionalIntensity: 68,
        persistence: 60,
        timestamp: new Date('2026-03-01T22:15:00'),
        isConcerning: true
      },
      {
        id: 'p8-3',
        platform: 'instagram',
        extractedText: "straight A's still not enough for my parents",
        distressScore: 62,
        emotionalIntensity: 66,
        persistence: 58,
        timestamp: new Date('2026-02-29T19:45:00'),
        isConcerning: true
      },
      {
        id: 'p8-4',
        platform: 'tiktok',
        extractedText: "burnout is real and i'm living it",
        distressScore: 60,
        emotionalIntensity: 64,
        persistence: 56,
        timestamp: new Date('2026-02-27T15:20:00'),
        isConcerning: true
      },
      {
        id: 'p8-5',
        platform: 'instagram',
        extractedText: "can't remember the last time i felt proud of myself",
        distressScore: 66,
        emotionalIntensity: 70,
        persistence: 63,
        timestamp: new Date('2026-02-25T21:30:00'),
        isConcerning: true
      },
      {
        id: 'p8-6',
        platform: 'instagram',
        extractedText: "perfection is exhausting",
        distressScore: 58,
        emotionalIntensity: 62,
        persistence: 54,
        timestamp: new Date('2026-02-23T18:10:00'),
        isConcerning: true
      },
      {
        id: 'p8-7',
        platform: 'tiktok',
        extractedText: "disappointing my family is my biggest fear",
        distressScore: 70,
        emotionalIntensity: 74,
        persistence: 68,
        timestamp: new Date('2026-02-21T23:50:00'),
        isConcerning: true
      },
      {
        id: 'p8-8',
        platform: 'instagram',
        extractedText: "studying until 3am every night is my normal now",
        distressScore: 56,
        emotionalIntensity: 60,
        persistence: 52,
        timestamp: new Date('2026-02-19T03:15:00'),
        isConcerning: true
      }
    ]
  },
  {
    id: '9',
    name: 'Darius Williams',
    age: 16,
    location: 'Atlanta, GA',
    caseId: 'SW-2024-009',
    assignedWorker: 'Sarah Chen',
    riskLevel: 'medium',
    distressScore: 45,
    lastContact: new Date('2026-02-28'),
    status: 'active',
    notes: [
      'Navigating identity and peer acceptance issues',
      'Positive response to LGBTQ+ support group',
      'Family therapy sessions ongoing',
      'Improved communication with parents',
      'Continue monthly monitoring'
    ],
    aiSummary: 'Moderate stress related to identity exploration and social acceptance. Showing positive progress with support systems. Family relationships improving. Encourage continued engagement with peer support.',
    socialMediaAccounts: [
      { platform: 'instagram', username: '@darius_w', url: 'https://instagram.com/darius_w', lastChecked: new Date('2026-02-28') },
      { platform: 'tiktok', username: '@dariusw', url: 'https://tiktok.com/@dariusw', lastChecked: new Date('2026-02-28') }
    ],
    distressPosts: [
      {
        id: 'p9-1',
        platform: 'instagram',
        extractedText: "sometimes i wonder if it would be easier to just be who they want me to be",
        distressScore: 45,
        emotionalIntensity: 52,
        persistence: 42,
        timestamp: new Date('2026-02-28T19:45:00'),
        isConcerning: true
      },
      {
        id: 'p9-2',
        platform: 'tiktok',
        extractedText: "found my people today at the support group. feeling less alone",
        distressScore: 25,
        emotionalIntensity: 30,
        persistence: 22,
        timestamp: new Date('2026-02-27T17:30:00'),
        isConcerning: false
      },
      {
        id: 'p9-3',
        platform: 'instagram',
        extractedText: "coming out was scary but worth it",
        distressScore: 30,
        emotionalIntensity: 35,
        persistence: 28,
        timestamp: new Date('2026-02-25T20:15:00'),
        isConcerning: false
      },
      {
        id: 'p9-4',
        platform: 'tiktok',
        extractedText: "tired of hiding who i really am",
        distressScore: 48,
        emotionalIntensity: 54,
        persistence: 45,
        timestamp: new Date('2026-02-23T22:40:00'),
        isConcerning: true
      },
      {
        id: 'p9-5',
        platform: 'instagram',
        extractedText: "my authentic self is finally showing",
        distressScore: 20,
        emotionalIntensity: 25,
        persistence: 18,
        timestamp: new Date('2026-02-21T16:20:00'),
        isConcerning: false
      }
    ]
  },
  {
    id: '10',
    name: 'Isabella Santos',
    age: 14,
    location: 'Phoenix, AZ',
    caseId: 'SW-2024-010',
    assignedWorker: 'Lisa Anderson',
    riskLevel: 'low',
    distressScore: 18,
    lastContact: new Date('2026-03-01'),
    status: 'active',
    notes: [
      'Adjustment to new school going well',
      'Making positive friendships',
      'Participating in art club and drama',
      'Healthy emotional expression through creativity',
      'Routine monitoring sufficient'
    ],
    aiSummary: 'Low risk profile with positive adjustment. Healthy social connections forming. Creative outlets providing good emotional regulation. Continue standard monitoring schedule.',
    socialMediaAccounts: [
      { platform: 'instagram', username: '@bella.art', url: 'https://instagram.com/bella.art', lastChecked: new Date('2026-03-01') },
      { platform: 'tiktok', username: '@isabellasantos', url: 'https://tiktok.com/@isabellasantos', lastChecked: new Date('2026-03-01') }
    ],
    distressPosts: [
      {
        id: 'p10-1',
        platform: 'instagram',
        extractedText: "loving my new art class! finally found where i belong",
        distressScore: 18,
        emotionalIntensity: 20,
        persistence: 15,
        timestamp: new Date('2026-03-01T15:20:00'),
        isConcerning: false
      },
      {
        id: 'p10-2',
        platform: 'tiktok',
        extractedText: "made some awesome friends today",
        distressScore: 12,
        emotionalIntensity: 15,
        persistence: 10,
        timestamp: new Date('2026-02-27T13:45:00'),
        isConcerning: false
      },
      {
        id: 'p10-3',
        platform: 'instagram',
        extractedText: "creating art makes everything better",
        distressScore: 15,
        emotionalIntensity: 18,
        persistence: 12,
        timestamp: new Date('2026-02-24T19:30:00'),
        isConcerning: false
      }
    ]
  }
];
