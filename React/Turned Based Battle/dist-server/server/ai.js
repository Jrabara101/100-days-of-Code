export function decideAiAction(aiFighter, playerFighter) {
    // Stance Decision
    let stanceModifier = 'BALANCED';
    if (aiFighter.currentHp < aiFighter.maxHp * 0.35 || aiFighter.staggerMeter >= 70) {
        stanceModifier = 'DEFENSIVE';
    }
    else if (playerFighter.isStaggered || aiFighter.currentEnergy >= 100) {
        stanceModifier = 'AGGRESSIVE';
    }
    else {
        const roll = Math.random();
        if (roll < 0.25)
            stanceModifier = 'AGGRESSIVE';
        else if (roll < 0.5)
            stanceModifier = 'DEFENSIVE';
        else
            stanceModifier = 'BALANCED';
    }
    // Filter available abilities
    const readyAbilities = aiFighter.abilities.filter((a) => a.currentCooldown === 0 && a.energyCost <= aiFighter.currentEnergy);
    let chosenAbilityId = 'slash';
    // 1. Ultimate if fully charged
    const ult = readyAbilities.find((a) => a.type === 'ULTIMATE');
    if (ult && aiFighter.currentEnergy >= 100) {
        chosenAbilityId = ult.id;
    }
    // 2. Punish staggered player with heavy quake
    else if (playerFighter.isStaggered) {
        const heavy = readyAbilities.find((a) => a.id === 'quake');
        if (heavy) {
            chosenAbilityId = heavy.id;
        }
        else {
            const strike = readyAbilities.find((a) => a.id === 'slash');
            chosenAbilityId = strike?.id || 'slash';
        }
    }
    // 3. Player has full energy (anticipating player's ultimate) -> Guard!
    else if (playerFighter.currentEnergy >= 100 && Math.random() < 0.75) {
        const guard = readyAbilities.find((a) => a.type === 'DEFEND');
        chosenAbilityId = guard ? guard.id : 'slash';
    }
    // 4. AI in danger of being guard broken -> Guard
    else if (aiFighter.staggerMeter >= 75 && Math.random() < 0.7) {
        const guard = readyAbilities.find((a) => a.type === 'DEFEND');
        chosenAbilityId = guard ? guard.id : 'slash';
    }
    // 5. Use Magma Lance for Burn damage if available
    else if (readyAbilities.some((a) => a.id === 'lance') && Math.random() < 0.6) {
        chosenAbilityId = 'lance';
    }
    // 6. Use Quake for heavy break pressure
    else if (readyAbilities.some((a) => a.id === 'quake') && Math.random() < 0.5) {
        chosenAbilityId = 'quake';
    }
    // 7. Standard Slash or Guard
    else {
        const pool = readyAbilities.filter((a) => a.id === 'slash' || a.id === 'guard');
        if (pool.length > 0) {
            const selected = pool[Math.floor(Math.random() * pool.length)];
            chosenAbilityId = selected.id;
        }
        else {
            chosenAbilityId = 'slash';
        }
    }
    return {
        actionId: chosenAbilityId,
        targetId: playerFighter.id,
        stanceModifier,
    };
}
