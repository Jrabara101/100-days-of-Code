import { useState, useEffect, useMemo } from 'react';
import { TrainingGoal, EquipmentTier, DayWorkout, FourWeekBlueprint } from '../types';

const STORAGE_KEY = 'pulsefit_blueprint_session';

function generateRandomToken(length = 8): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function useBlueprintArchitect() {
  const [goal, setGoal] = useState<TrainingGoal>('hypertrophy');
  const [daysPerWeek, setDaysPerWeek] = useState<number>(4);
  const [equipment, setEquipment] = useState<EquipmentTier>('dumbbells');
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [token, setToken] = useState<string>('8xK9mP2q');
  const [isSavedLocally, setIsSavedLocally] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.goal) setGoal(parsed.goal);
        if (parsed.daysPerWeek) setDaysPerWeek(parsed.daysPerWeek);
        if (parsed.equipment) setEquipment(parsed.equipment);
        if (parsed.token) setToken(parsed.token);
        setIsSavedLocally(true);
      } else {
        const newToken = generateRandomToken();
        setToken(newToken);
      }
    } catch {
      // Fallback
    }
  }, []);

  // Compute 7-day schedule based on goal, days, and equipment
  const schedule: DayWorkout[] = useMemo(() => {
    // Generate tailored days
    const days: DayWorkout[] = [];

    if (goal === 'hypertrophy') {
      if (daysPerWeek === 3) {
        days.push(
          { dayName: 'MON', dayLabel: 'Day 1', title: 'Upper Body Heavy Push/Pull', focus: 'Chest, Lats & Shoulders', duration: 40, category: 'strength', zone: 'Zone 3–4', colorScheme: 'emerald' },
          { dayName: 'TUE', dayLabel: 'Day 2', title: 'Rest & Neuromuscular Recovery', focus: 'Active Walk / Foam Rolling', duration: 0, category: 'mobility', zone: 'Zone 1', colorScheme: 'slate', isRest: true },
          { dayName: 'WED', dayLabel: 'Day 3', title: 'Lower Body Posterior & Quads', focus: 'Trap Bar / Goblet Squats', duration: 45, category: 'strength', zone: 'Zone 4', colorScheme: 'emerald' },
          { dayName: 'THU', dayLabel: 'Day 4', title: 'Rest & Parasympathetic Reset', focus: 'Sleep Recovery', duration: 0, category: 'mobility', zone: 'Zone 1', colorScheme: 'slate', isRest: true },
          { dayName: 'FRI', dayLabel: 'Day 5', title: 'Full Body Density & Arms', focus: 'Shoulders, Arms & Core', duration: 35, category: 'strength', zone: 'Zone 3', colorScheme: 'volt' },
          { dayName: 'SAT', dayLabel: 'Day 6', title: 'Zone 2 Base Aerobic Flush', focus: 'Outdoor Light Jog / Rower', duration: 30, category: 'endurance', zone: 'Zone 2', colorScheme: 'sky' },
          { dayName: 'SUN', dayLabel: 'Day 7', title: 'Full Nervous System Reset', focus: 'Rest & Nutrition Prep', duration: 0, category: 'mobility', zone: 'Zone 1', colorScheme: 'slate', isRest: true }
        );
      } else if (daysPerWeek === 4) {
        days.push(
          { dayName: 'MON', dayLabel: 'Day 1', title: 'Upper Push & Core Stabilizers', focus: 'Incline Press, Delts, Triceps', duration: 40, category: 'strength', zone: 'Zone 3–4', colorScheme: 'emerald' },
          { dayName: 'TUE', dayLabel: 'Day 2', title: 'Lower Posterior Chain & Glutes', focus: 'Deadlifts, Hip Thrusts', duration: 45, category: 'strength', zone: 'Zone 4', colorScheme: 'emerald' },
          { dayName: 'WED', dayLabel: 'Day 3', title: 'Spinal Mobility & Thoracic Reset', focus: 'Hip Flexors, Scapular Flow', duration: 20, category: 'mobility', zone: 'Zone 1', colorScheme: 'sky' },
          { dayName: 'THU', dayLabel: 'Day 4', title: 'Upper Pull & Lat Power', focus: 'Heavy Rows, Biceps, Core', duration: 40, category: 'strength', zone: 'Zone 3–4', colorScheme: 'emerald' },
          { dayName: 'FRI', dayLabel: 'Day 5', title: 'Lower Quad Drive & Glutes Metcon', focus: 'Bulgarian Split Squats, Swings', duration: 35, category: 'kettlebell', zone: 'Zone 4–5', colorScheme: 'crimson' },
          { dayName: 'SAT', dayLabel: 'Day 6', title: 'Zone 2 Recovery Aerobic Flush', focus: 'Outdoor Walk, Mobility', duration: 25, category: 'endurance', zone: 'Zone 2', colorScheme: 'sky' },
          { dayName: 'SUN', dayLabel: 'Day 7', title: 'Complete Rest & Growth Sleep', focus: 'Anabolic Repair', duration: 0, category: 'mobility', zone: 'Zone 1', colorScheme: 'slate', isRest: true }
        );
      } else if (daysPerWeek === 5) {
        days.push(
          { dayName: 'MON', dayLabel: 'Day 1', title: 'Chest, Delts & Triceps Push', focus: 'Dumbbell Incline & Dips', duration: 42, category: 'strength', zone: 'Zone 3–4', colorScheme: 'emerald' },
          { dayName: 'TUE', dayLabel: 'Day 2', title: 'Back, Lats & Biceps Pull', focus: 'Chest-Supported Rows', duration: 42, category: 'strength', zone: 'Zone 3–4', colorScheme: 'emerald' },
          { dayName: 'WED', dayLabel: 'Day 3', title: 'Quad Drive & Anterior Core', focus: 'Front Squats & Hollow Holds', duration: 40, category: 'strength', zone: 'Zone 4', colorScheme: 'volt' },
          { dayName: 'THU', dayLabel: 'Day 4', title: 'Hamstrings, Glutes & Calves', focus: 'RDLs, Glute Ham Raises', duration: 40, category: 'strength', zone: 'Zone 4', colorScheme: 'emerald' },
          { dayName: 'FRI', dayLabel: 'Day 5', title: 'Shoulders, Arms & Core Finisher', focus: 'Lateral Raises & Farmers Walk', duration: 35, category: 'strength', zone: 'Zone 3–4', colorScheme: 'volt' },
          { dayName: 'SAT', dayLabel: 'Day 6', title: 'Active Recovery Flow', focus: 'Joint Mobility & Low Impact', duration: 25, category: 'mobility', zone: 'Zone 1', colorScheme: 'sky' },
          { dayName: 'SUN', dayLabel: 'Day 7', title: 'Rest & Recharge', focus: 'Sleep & Hydration', duration: 0, category: 'mobility', zone: 'Zone 1', colorScheme: 'slate', isRest: true }
        );
      } else {
        // 6 days
        days.push(
          { dayName: 'MON', dayLabel: 'Day 1', title: 'Push Hypertrophy: Heavy', focus: 'Chest & Delts', duration: 45, category: 'strength', zone: 'Zone 4', colorScheme: 'emerald' },
          { dayName: 'TUE', dayLabel: 'Day 2', title: 'Pull Hypertrophy: Heavy', focus: 'Lats & Rhomboids', duration: 45, category: 'strength', zone: 'Zone 4', colorScheme: 'emerald' },
          { dayName: 'WED', dayLabel: 'Day 3', title: 'Legs: Posterior Chain', focus: 'RDLs & Split Squats', duration: 45, category: 'strength', zone: 'Zone 4', colorScheme: 'emerald' },
          { dayName: 'THU', dayLabel: 'Day 4', title: 'Push Hypertrophy: Volume', focus: 'Dumbbell Flys & Lateral Delts', duration: 40, category: 'strength', zone: 'Zone 3', colorScheme: 'volt' },
          { dayName: 'FRI', dayLabel: 'Day 5', title: 'Pull Hypertrophy: Volume', focus: 'Cable Rows & Rear Delts', duration: 40, category: 'strength', zone: 'Zone 3', colorScheme: 'volt' },
          { dayName: 'SAT', dayLabel: 'Day 6', title: 'Legs: Quad Dominant + Core', focus: 'Goblet Squats & Lunges', duration: 40, category: 'strength', zone: 'Zone 4', colorScheme: 'crimson' },
          { dayName: 'SUN', dayLabel: 'Day 7', title: 'Total System Reset', focus: 'Sleep, Sauna & Walk', duration: 0, category: 'mobility', zone: 'Zone 1', colorScheme: 'slate', isRest: true }
        );
      }
    } else if (goal === 'conditioning') {
      days.push(
        { dayName: 'MON', dayLabel: 'Day 1', title: 'Kettlebell MetCon Savage Engine', focus: '300 Swings & Snatches', duration: 30, category: 'kettlebell', zone: 'Zone 5', colorScheme: 'crimson' },
        { dayName: 'TUE', dayLabel: 'Day 2', title: 'Apartment Heavy HIIT (Zero-Jump)', focus: 'High Cadence Dumbbell Thrusters', duration: 25, category: 'hiit', zone: 'Zone 4', colorScheme: 'emerald' },
        { dayName: 'WED', dayLabel: 'Day 3', title: 'Zone 2 Base Aerobic Threshold', focus: 'Consistent Low Heart Rate Engine', duration: 35, category: 'endurance', zone: 'Zone 2', colorScheme: 'sky' },
        { dayName: 'THU', dayLabel: 'Day 4', title: 'Full Body Functional Strength', focus: 'Unilateral Carries & Complexes', duration: 35, category: 'strength', zone: 'Zone 3–4', colorScheme: 'volt' },
        { dayName: 'FRI', dayLabel: 'Day 5', title: 'Anaerobic Sprint Interval Flush', focus: 'Tabata 20s/10s Max Output', duration: 20, category: 'hiit', zone: 'Zone 5', colorScheme: 'crimson' },
        { dayName: 'SAT', dayLabel: 'Day 6', title: 'Joint Decompression & Hip Torque', focus: 'Thoracic Mobility & FRC Flow', duration: 20, category: 'mobility', zone: 'Zone 1', colorScheme: 'sky' },
        { dayName: 'SUN', dayLabel: 'Day 7', title: 'System Rest', focus: 'Cellular Recovery', duration: 0, category: 'mobility', zone: 'Zone 1', colorScheme: 'slate', isRest: true }
      );
    } else {
      // Longevity & VO2 Max
      days.push(
        { dayName: 'MON', dayLabel: 'Day 1', title: 'Zone 2 Cardiovascular Base', focus: 'Mitochondrial Density Building', duration: 45, category: 'endurance', zone: 'Zone 2', colorScheme: 'sky' },
        { dayName: 'TUE', dayLabel: 'Day 2', title: 'Functional Joint Longevity & Core', focus: 'Rotational Spinal Stability', duration: 30, category: 'mobility', zone: 'Zone 1–2', colorScheme: 'emerald' },
        { dayName: 'WED', dayLabel: 'Day 3', title: 'Full Body Bone Density Loading', focus: 'Multi-Joint Resistance', duration: 35, category: 'strength', zone: 'Zone 3', colorScheme: 'volt' },
        { dayName: 'THU', dayLabel: 'Day 4', title: 'Active Recovery Walk & Breathwork', focus: 'Parasympathetic Regulation', duration: 25, category: 'mobility', zone: 'Zone 1', colorScheme: 'sky' },
        { dayName: 'FRI', dayLabel: 'Day 5', title: 'VO2 Max 4x4 Norwegians', focus: 'Peak Stroke Volume Training', duration: 24, category: 'hiit', zone: 'Zone 5', colorScheme: 'crimson' },
        { dayName: 'SAT', dayLabel: 'Day 6', title: 'Posterior Hip & Knee Pre-Hab', focus: 'Single-Leg Balance & Foot Strength', duration: 25, category: 'mobility', zone: 'Zone 2', colorScheme: 'emerald' },
        { dayName: 'SUN', dayLabel: 'Day 7', title: 'Restorative Sleep Cycle', focus: 'Nervous System Recovery', duration: 0, category: 'mobility', zone: 'Zone 1', colorScheme: 'slate', isRest: true }
      );
    }

    return days;
  }, [goal, daysPerWeek, equipment]);

  // Derived metrics
  const estimatedWeeklyCalories = useMemo(() => {
    const base = daysPerWeek * (goal === 'conditioning' ? 440 : goal === 'hypertrophy' ? 390 : 340);
    return equipment === 'full_gym' ? base + 180 : equipment === 'dumbbells' ? base + 60 : base;
  }, [daysPerWeek, goal, equipment]);

  const projectedLeanMassDeltaLbs = useMemo(() => {
    if (goal === 'hypertrophy') return Number((daysPerWeek * 0.75 + 1.2).toFixed(1));
    if (goal === 'conditioning') return Number((daysPerWeek * 0.4 + 0.8).toFixed(1));
    return Number((daysPerWeek * 0.3 + 0.5).toFixed(1));
  }, [goal, daysPerWeek]);

  const projectedVo2MaxDelta = useMemo(() => {
    if (goal === 'conditioning') return '+4.8 ml/kg/min';
    if (goal === 'longevity') return '+5.2 ml/kg/min';
    return '+2.6 ml/kg/min';
  }, [goal]);

  const goalTitle = useMemo(() => {
    if (goal === 'hypertrophy') return 'Lean Hypertrophy & Density';
    if (goal === 'conditioning') return 'Metabolic Conditioning & Power';
    return 'Longevity, Core & VO2 Max';
  }, [goal]);

  const equipmentTitle = useMemo(() => {
    if (equipment === 'bodyweight') return 'Bodyweight Travel';
    if (equipment === 'dumbbells') return 'Home Dumbbells & Mat';
    return 'Full Commercial Gym';
  }, [equipment]);

  // Save to localStorage when changed
  useEffect(() => {
    setIsSyncing(true);
    const newToken = generateRandomToken();
    setToken(newToken);

    const payload: FourWeekBlueprint = {
      token: newToken,
      goal,
      goalTitle,
      daysPerWeek,
      equipment,
      equipmentTitle,
      estimatedWeeklyCalories,
      projectedLeanMassDeltaLbs,
      projectedVo2MaxDelta,
      schedule,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setIsSavedLocally(true);
    } catch {
      // Ignore
    }

    const timer = setTimeout(() => {
      setIsSyncing(false);
    }, 280);

    return () => clearTimeout(timer);
  }, [goal, daysPerWeek, equipment]);

  const deepLinkUrl = `https://get.pulsefit.app/b/${token}`;

  return {
    goal,
    setGoal,
    daysPerWeek,
    setDaysPerWeek,
    equipment,
    setEquipment,
    selectedWeek,
    setSelectedWeek,
    schedule,
    estimatedWeeklyCalories,
    projectedLeanMassDeltaLbs,
    projectedVo2MaxDelta,
    goalTitle,
    equipmentTitle,
    token,
    deepLinkUrl,
    isSavedLocally,
    isSyncing,
  };
}
