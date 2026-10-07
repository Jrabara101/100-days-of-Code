import {
  FighterEntity,
  ActionCommitPayload,
  CombatRoundResolution,
  TurnEvent,
  AbilityDefinition,
  StatusEffect,
} from './types.js';

interface FighterActionPlan {
  fighter: FighterEntity;
  target: FighterEntity;
  commit: ActionCommitPayload;
  ability: AbilityDefinition;
  effectiveSpeed: number;
}

export function resolveCombatRound(
  roundNumber: number,
  fighterA: FighterEntity,
  commitA: ActionCommitPayload,
  fighterB: FighterEntity,
  commitB: ActionCommitPayload
): {
  resolution: CombatRoundResolution;
  updatedFighterA: FighterEntity;
  updatedFighterB: FighterEntity;
  winnerId?: string;
} {
  // Apply Stance updates
  fighterA.stance = commitA.stanceModifier;
  fighterB.stance = commitB.stanceModifier;

  // Retrieve abilities chosen
  const abilityA =
    fighterA.abilities.find((a) => a.id === commitA.actionId) || fighterA.abilities[0];
  const abilityB =
    fighterB.abilities.find((a) => a.id === commitB.actionId) || fighterB.abilities[0];

  // Calculate speed with stance modifier & PRNG variance
  const getSpeed = (fighter: FighterEntity): number => {
    let spd = fighter.speed;
    if (fighter.stance === 'AGGRESSIVE') spd += 15;
    if (fighter.stance === 'DEFENSIVE') spd -= 10;
    const variance = (Math.random() - 0.5) * 8; // +/- 4 PRNG
    return spd + variance;
  };

  const planA: FighterActionPlan = {
    fighter: fighterA,
    target: fighterB,
    commit: commitA,
    ability: abilityA,
    effectiveSpeed: getSpeed(fighterA),
  };

  const planB: FighterActionPlan = {
    fighter: fighterB,
    target: fighterA,
    commit: commitB,
    ability: abilityB,
    effectiveSpeed: getSpeed(fighterB),
  };

  // Sort plans by Priority tier:
  // Priority 3: Defense / Parry
  // Priority 2: Fast Abilities
  // Priority 1: Standard Attacks
  // Priority 0: Heavy Break / Channeling
  const actionPlans: FighterActionPlan[] = [planA, planB].sort((x, y) => {
    if (x.ability.priority !== y.ability.priority) {
      return y.ability.priority - x.ability.priority; // Higher priority first
    }
    return y.effectiveSpeed - x.effectiveSpeed; // Higher speed first
  });

  const turnEvents: TurnEvent[] = [];

  // Track state during round
  const stateMap: Record<string, FighterEntity> = {
    [fighterA.id]: { ...fighterA },
    [fighterB.id]: { ...fighterB },
  };

  // Deduct energy costs & set cooldowns
  [planA, planB].forEach((plan) => {
    const f = stateMap[plan.fighter.id];
    f.currentEnergy = Math.max(0, f.currentEnergy - plan.ability.energyCost);
    if (plan.ability.cooldownTurns > 0) {
      const liveAbility = f.abilities.find((a) => a.id === plan.ability.id);
      if (liveAbility) {
        liveAbility.currentCooldown = plan.ability.cooldownTurns + 1; // +1 to account for end-of-round tick
      }
    }
  });

  // Track if a fighter was already staggered at start of turn or broken during turn
  const interruptedFighters = new Set<string>();

  // Process Actions in Priority & Speed Order
  for (const plan of actionPlans) {
    const actor = stateMap[plan.fighter.id];
    const target = stateMap[plan.target.id];

    // If actor died or was interrupted by a guard break, skip attack
    if (actor.currentHp <= 0) continue;
    if (interruptedFighters.has(actor.id)) {
      turnEvents.push({
        actingFighterId: actor.id,
        targetFighterId: target.id,
        actionId: plan.ability.id,
        actionName: plan.ability.name,
        actionType: plan.ability.type,
        elementType: plan.ability.element,
        damageDealt: 0,
        wasCritical: false,
        wasBlocked: false,
        wasParried: false,
        staggerInflicted: 0,
        resultantHp: target.currentHp,
        resultantStagger: target.staggerMeter,
        staggerBreakOccurred: false,
        logText: `${actor.name}'s [${plan.ability.name}] was INTERRUPTED by Stagger Break!`,
      });
      continue;
    }

    const isDefenderGuarding =
      plan.target.id === planA.fighter.id
        ? planA.ability.type === 'DEFEND'
        : planB.ability.type === 'DEFEND';

    // DEFENSIVE ACTION
    if (plan.ability.type === 'DEFEND') {
      const energyRefund = 25;
      actor.currentEnergy = Math.min(actor.maxEnergy, actor.currentEnergy + energyRefund);

      turnEvents.push({
        actingFighterId: actor.id,
        targetFighterId: actor.id,
        actionId: plan.ability.id,
        actionName: plan.ability.name,
        actionType: 'DEFEND',
        elementType: plan.ability.element,
        damageDealt: 0,
        wasCritical: false,
        wasBlocked: false,
        wasParried: false,
        staggerInflicted: 0,
        resultantHp: actor.currentHp,
        resultantStagger: actor.staggerMeter,
        staggerBreakOccurred: false,
        logText: `${actor.name} deployed [${plan.ability.name}], reinforcing defenses and gaining +${energyRefund} Energy!`,
        energyRefunded: energyRefund,
      });
      continue;
    }

    // OFFENSIVE / SKILL / ULTIMATE ACTION
    let baseDmg = plan.ability.baseDamage;
    let staggerInflicted = plan.ability.staggerDamage;
    let wasBlocked = false;
    let wasParried = false;
    let wasCritical = false;
    let staggerBreakOccurred = false;

    // Stance damage scaling
    if (actor.stance === 'AGGRESSIVE') baseDmg *= 1.25;
    if (target.stance === 'AGGRESSIVE') baseDmg *= 1.2;
    if (target.stance === 'DEFENSIVE') baseDmg *= 0.75;

    // Rock-Paper-Scissors Checks
    // 1. PARRY COUNTER: Defender is Guarding and Attacker uses Fast Ability (Priority 2) or standard attack in Defensive stance
    const canParry =
      isDefenderGuarding &&
      (plan.ability.priority === 2 || (target.stance === 'DEFENSIVE' && Math.random() < 0.65));

    if (canParry && plan.ability.type !== 'ULTIMATE' && plan.ability.priority !== 0) {
      wasParried = true;
      baseDmg = 0;
      staggerInflicted = 0;

      // Attacker takes counter stagger!
      const counterStagger = 40;
      actor.staggerMeter = Math.min(100, actor.staggerMeter + counterStagger);
      target.currentEnergy = Math.min(target.maxEnergy, target.currentEnergy + 30);

      let log = `${target.name} executed a PERFECT PARRY on ${actor.name}'s [${plan.ability.name}]! Rebounded +${counterStagger} Stagger!`;

      if (actor.staggerMeter >= 100) {
        actor.isStaggered = true;
        interruptedFighters.add(actor.id);
        staggerBreakOccurred = true;
        log += ` [GUARD BREAK ON ${actor.name}!]`;
      }

      turnEvents.push({
        actingFighterId: actor.id,
        targetFighterId: target.id,
        actionId: plan.ability.id,
        actionName: plan.ability.name,
        actionType: plan.ability.type,
        elementType: plan.ability.element,
        damageDealt: 0,
        wasCritical: false,
        wasBlocked: false,
        wasParried: true,
        staggerInflicted: 0,
        resultantHp: target.currentHp,
        resultantStagger: target.staggerMeter,
        staggerBreakOccurred,
        logText: log,
      });
      continue;
    }

    // 2. GUARD SHATTER: Attacker uses Heavy Break (Priority 0) against Guarding defender
    if (isDefenderGuarding && plan.ability.priority === 0) {
      wasBlocked = false; // Guard is shattered!
      staggerInflicted *= 1.6; // Massive stagger amplification
      baseDmg *= 0.85; // Bypasses most mitigation

      target.staggerMeter = Math.min(100, target.staggerMeter + staggerInflicted);
      if (target.staggerMeter >= 100) {
        target.isStaggered = true;
        interruptedFighters.add(target.id);
        staggerBreakOccurred = true;
      }

      const finalDmg = Math.round(baseDmg);
      target.currentHp = Math.max(0, target.currentHp - finalDmg);

      turnEvents.push({
        actingFighterId: actor.id,
        targetFighterId: target.id,
        actionId: plan.ability.id,
        actionName: plan.ability.name,
        actionType: plan.ability.type,
        elementType: plan.ability.element,
        damageDealt: finalDmg,
        wasCritical: true,
        wasBlocked: false,
        wasParried: false,
        staggerInflicted: Math.round(staggerInflicted),
        resultantHp: target.currentHp,
        resultantStagger: target.staggerMeter,
        staggerBreakOccurred: true,
        logText: `💥 GUARD SHATTER! ${actor.name}'s [${plan.ability.name}] shattered ${target.name}'s shield for ${finalDmg} DMG and +${Math.round(staggerInflicted)} Stagger!`,
      });
      continue;
    }

    // 3. NORMAL GUARD MITIGATION
    if (isDefenderGuarding) {
      wasBlocked = true;
      baseDmg *= 0.3; // 70% damage reduction
      staggerInflicted *= 0.35; // 65% stagger reduction
    }

    // 4. CRITICAL STRIKES: Target is staggered OR Ultimate used OR random crit chance
    const isTargetStaggered = target.isStaggered || target.staggerMeter >= 100;
    const isUlt = plan.ability.type === 'ULTIMATE';
    const randCrit = Math.random() < (actor.stance === 'AGGRESSIVE' ? 0.25 : 0.12);

    if (isTargetStaggered || isUlt || randCrit) {
      wasCritical = true;
      baseDmg *= 1.65;
    }

    // Apply Magma Lance status effect (Burn)
    if (plan.ability.id === 'lance') {
      const burnStatus: StatusEffect = {
        id: 'burn-' + Date.now(),
        name: 'Plasma Burn',
        type: 'DEBUFF',
        durationTurns: 2,
        damagePerTurn: 65,
        icon: 'flame',
        description: 'Superheated plasma burns target for 65 damage each turn.',
      };
      target.activeStatuses.push(burnStatus);
    }

    // Apply Stagger build-up
    target.staggerMeter = Math.min(100, target.staggerMeter + staggerInflicted);
    if (target.staggerMeter >= 100 && !target.isStaggered) {
      target.isStaggered = true;
      interruptedFighters.add(target.id);
      staggerBreakOccurred = true;
    }

    // Reward actor with energy on offensive hit
    actor.currentEnergy = Math.min(actor.maxEnergy, actor.currentEnergy + 15);

    const finalDamage = Math.round(baseDmg);
    target.currentHp = Math.max(0, target.currentHp - finalDamage);

    let logMessage = `${actor.name} unleashed [${plan.ability.name}] dealing ${finalDamage} damage`;
    if (wasCritical) logMessage += ' (CRITICAL STRIKE!)';
    if (wasBlocked) logMessage += ' (BLOCKED -70%)';
    if (staggerBreakOccurred) logMessage += ` ⚡ STAGGER BREAK TRIGGERED ON ${target.name}!`;

    turnEvents.push({
      actingFighterId: actor.id,
      targetFighterId: target.id,
      actionId: plan.ability.id,
      actionName: plan.ability.name,
      actionType: plan.ability.type,
      elementType: plan.ability.element,
      damageDealt: finalDamage,
      wasCritical,
      wasBlocked,
      wasParried,
      staggerInflicted: Math.round(staggerInflicted),
      resultantHp: target.currentHp,
      resultantStagger: target.staggerMeter,
      staggerBreakOccurred,
      logText: logMessage,
    });
  }

  // End of Round: Apply Status Effects (DoTs) & Cooldown Ticks
  [fighterA.id, fighterB.id].forEach((fighterId) => {
    const f = stateMap[fighterId];
    if (f.currentHp <= 0) return;

    // DoT ticks
    f.activeStatuses = f.activeStatuses.filter((status) => {
      if (status.damagePerTurn && status.damagePerTurn > 0) {
        f.currentHp = Math.max(0, f.currentHp - status.damagePerTurn);
        turnEvents.push({
          actingFighterId: 'STATUS_EFFECT',
          targetFighterId: f.id,
          actionId: status.id,
          actionName: status.name,
          actionType: 'SKILL',
          elementType: 'FIRE',
          damageDealt: status.damagePerTurn,
          wasCritical: false,
          wasBlocked: false,
          wasParried: false,
          staggerInflicted: 0,
          resultantHp: f.currentHp,
          resultantStagger: f.staggerMeter,
          staggerBreakOccurred: false,
          logText: `${f.name} took ${status.damagePerTurn} DoT damage from [${status.name}]`,
        });
      }
      status.durationTurns -= 1;
      return status.durationTurns > 0;
    });

    // Reset stagger if broken this round (they recover for next round)
    if (f.isStaggered) {
      f.staggerMeter = 0;
      f.isStaggered = false;
    }

    // Cooldown decrements
    f.abilities.forEach((ab) => {
      if (ab.currentCooldown > 0) {
        ab.currentCooldown = Math.max(0, ab.currentCooldown - 1);
      }
    });

    // Reset commitment
    f.isActionCommitted = false;
    f.selectedActionId = null;
  });

  const updatedA = stateMap[fighterA.id];
  const updatedB = stateMap[fighterB.id];

  let winnerId: string | undefined;
  if (updatedA.currentHp <= 0 && updatedB.currentHp <= 0) {
    winnerId = 'DRAW';
  } else if (updatedA.currentHp <= 0) {
    winnerId = updatedB.id;
  } else if (updatedB.currentHp <= 0) {
    winnerId = updatedA.id;
  }

  return {
    resolution: {
      roundNumber,
      turnEvents,
    },
    updatedFighterA: updatedA,
    updatedFighterB: updatedB,
    winnerId,
  };
}
