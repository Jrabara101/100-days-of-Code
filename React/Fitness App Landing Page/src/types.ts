export type CoachingStyle = 'technical' | 'high_energy' | 'mindful';

export type WorkoutCategory = 'strength' | 'hiit' | 'mobility' | 'pilates' | 'endurance' | 'kettlebell';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export type HeartRateZone = 'Zone 1 (Recovery)' | 'Zone 2 (Aerobic Base)' | 'Zone 3 (Tempo/Pacing)' | 'Zone 4 (Anaerobic Threshold)' | 'Zone 5 (Peak/VO2 Max)';

export interface Coach {
  id: string;
  name: string;
  handle: string;
  title: string;
  coachingStyle: CoachingStyle;
  styleLabel: string;
  avatarUrl: string;
  quote: string;
  credentials: string[];
  samplePlaylist: {
    title: string;
    curator: string;
    tracks: number;
    bpmRange: string;
  };
  audioCuePreview: string; // Simulated transcript or voice cue
}

export interface Workout {
  id: string;
  slug: string;
  title: string;
  category: WorkoutCategory;
  difficulty: DifficultyLevel;
  durationMinutes: number;
  equipmentTags: string[];
  primaryMuscles: string[];
  isApartmentFriendly: boolean;
  avgCaloriesBurned: number;
  heartRateZone: HeartRateZone;
  zoneNumber: number;
  coachId: string;
  coachName: string;
  coachAvatar: string;
  description: string;
  circuitsCount: number;
  previewVideoUrl?: string;
  posterGradient: string;
  accentColor: string;
}

export type TrainingGoal = 'hypertrophy' | 'conditioning' | 'longevity';

export type EquipmentTier = 'bodyweight' | 'dumbbells' | 'full_gym';

export interface DayWorkout {
  dayName: string; // 'MON', 'TUE', etc.
  dayLabel: string; // 'Day 1', 'Day 2'
  title: string;
  focus: string;
  duration: number;
  category: WorkoutCategory;
  zone: string;
  colorScheme: 'emerald' | 'volt' | 'sky' | 'crimson' | 'slate';
  isRest?: boolean;
}

export interface FourWeekBlueprint {
  token: string;
  goal: TrainingGoal;
  goalTitle: string;
  daysPerWeek: number;
  equipment: EquipmentTier;
  equipmentTitle: string;
  estimatedWeeklyCalories: number;
  projectedLeanMassDeltaLbs: number;
  projectedVo2MaxDelta: string;
  schedule: DayWorkout[];
  createdAt: string;
  expiresAt: string;
}

export interface MembershipPlan {
  id: string;
  code: 'monthly' | 'annual_flagship' | 'household_duo';
  name: string;
  billingInterval: 'month' | 'year';
  priceCents: number;
  monthlyEquivalentCents: number;
  trialDays: number;
  maxProfiles: number;
  hsaFsaEligible: boolean;
  savingsPercentage?: number;
  badge?: string;
  features: string[];
}

export interface MemberReview {
  id: string;
  author: string;
  ageBracket: string;
  tagline: string;
  avatar: string;
  workoutsCompleted: number;
  verifiedBadges: string[];
  beforeMetric: string;
  afterMetric: string;
  highlightCategory: 'Apartment-friendly' | 'Apple Watch integration' | 'Zero knee pain' | 'Busy schedule' | 'All';
  rating: number;
  quote: string;
}

export interface WearableDevice {
  id: 'apple_watch' | 'whoop' | 'garmin' | 'oura' | 'apple_tv';
  name: string;
  headline: string;
  tag: string;
  metrics: {
    label: string;
    value: string;
    trend: string;
  }[];
  description: string;
}
