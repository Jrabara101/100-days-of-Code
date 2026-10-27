import Decimal from 'break_infinity.js';
export const BASE_GENERATORS = {
    nanobot: { id: 'nanobot', name: 'Flux Nanobot', baseCost: '15', baseCps: '1', costExponent: 1.15 },
    plasma_extractor: { id: 'plasma_extractor', name: 'Plasma Extractor', baseCost: '100', baseCps: '8', costExponent: 1.15 },
    fusion_dynamo: { id: 'fusion_dynamo', name: 'Fusion Dynamo', baseCost: '1100', baseCps: '48', costExponent: 1.15 },
    quantum_collider: { id: 'quantum_collider', name: 'Quantum Collider', baseCost: '12000', baseCps: '260', costExponent: 1.15 },
    orbital_array: { id: 'orbital_array', name: 'Orbital Array', baseCost: '130000', baseCps: '1400', costExponent: 1.15 },
    antimatter_siphon: { id: 'antimatter_siphon', name: 'Antimatter Siphon', baseCost: '1400000', baseCps: '7800', costExponent: 1.15 },
    dyson_harvester: { id: 'dyson_harvester', name: 'Dyson Harvester', baseCost: '20000000', baseCps: '44000', costExponent: 1.15 },
    tachyon_condenser: { id: 'tachyon_condenser', name: 'Tachyon Condenser', baseCost: '330000000', baseCps: '260000', costExponent: 1.15 },
    dark_matter_forge: { id: 'dark_matter_forge', name: 'Dark Matter Forge', baseCost: '5100000000', baseCps: '1600000', costExponent: 1.15 },
    celestial_weaver: { id: 'celestial_weaver', name: 'Celestial Weaver', baseCost: '75000000000', baseCps: '10000000', costExponent: 1.15 },
    singularity_engine: { id: 'singularity_engine', name: 'Singularity Engine', baseCost: '1200000000000', baseCps: '68000000', costExponent: 1.15 },
    omega_foundry: { id: 'omega_foundry', name: 'Omega Foundry', baseCost: '25000000000000', baseCps: '480000000', costExponent: 1.15 },
};
export const BASE_UPGRADES = {
    upg_nano_1: { id: 'upg_nano_1', targetType: 'GENERATOR', targetId: 'nanobot', multiplier: 2 },
    upg_nano_2: { id: 'upg_nano_2', targetType: 'GENERATOR', targetId: 'nanobot', multiplier: 3 },
    upg_click_1: { id: 'upg_click_1', targetType: 'CLICK', multiplier: 2 },
    upg_click_2: { id: 'upg_click_2', targetType: 'CLICK', multiplier: 2.5 },
    upg_plasma_1: { id: 'upg_plasma_1', targetType: 'GENERATOR', targetId: 'plasma_extractor', multiplier: 2 },
    upg_fusion_1: { id: 'upg_fusion_1', targetType: 'GENERATOR', targetId: 'fusion_dynamo', multiplier: 2 },
    upg_quantum_1: { id: 'upg_quantum_1', targetType: 'GENERATOR', targetId: 'quantum_collider', multiplier: 2 },
    upg_global_1: { id: 'upg_global_1', targetType: 'GLOBAL', multiplier: 1.5 },
    upg_global_2: { id: 'upg_global_2', targetType: 'GLOBAL', multiplier: 2 },
    upg_orbital_1: { id: 'upg_orbital_1', targetType: 'GENERATOR', targetId: 'orbital_array', multiplier: 2 },
    upg_antimatter_1: { id: 'upg_antimatter_1', targetType: 'GENERATOR', targetId: 'antimatter_siphon', multiplier: 2 },
    upg_dyson_1: { id: 'upg_dyson_1', targetType: 'GENERATOR', targetId: 'dyson_harvester', multiplier: 2 },
    upg_global_3: { id: 'upg_global_3', targetType: 'GLOBAL', multiplier: 2.5 },
};
export class GameEngineService {
    /**
     * Calculate authoritative server CPS from verified generators, upgrades, and prestige shards
     */
    calculateServerCps(generators, purchasedUpgrades, prestigeShards = 0) {
        let globalMult = 1.0;
        // Prestige shard bonus: +2% per unspent shard
        globalMult += prestigeShards * 0.02;
        const generatorMultipliers = {};
        for (const upgId of purchasedUpgrades) {
            const upg = BASE_UPGRADES[upgId];
            if (!upg)
                continue;
            if (upg.targetType === 'GLOBAL') {
                globalMult *= upg.multiplier;
            }
            else if (upg.targetType === 'GENERATOR' && upg.targetId) {
                generatorMultipliers[upg.targetId] = (generatorMultipliers[upg.targetId] || 1) * upg.multiplier;
            }
        }
        let totalCps = new Decimal(0);
        for (const [genId, count] of Object.entries(generators)) {
            if (!count || count <= 0)
                continue;
            const def = BASE_GENERATORS[genId];
            if (!def)
                continue;
            const genMult = generatorMultipliers[genId] || 1;
            const perUnit = new Decimal(def.baseCps).times(genMult);
            const subTotal = perUnit.times(count);
            totalCps = totalCps.plus(subTotal);
        }
        return totalCps.times(globalMult);
    }
    /**
     * Computes offline gains strictly based on authoritative server CPS and clamped duration
     */
    calculateOfflineYield(serverCps, offlineSeconds, offlineEfficiency = 1.0) {
        if (offlineSeconds <= 0 || serverCps.lte(0)) {
            return new Decimal(0);
        }
        return serverCps.times(offlineSeconds).times(offlineEfficiency);
    }
    /**
     * Authoritative prestige shard calculation
     * Formula: floor( (lifetimeCurrency / 1e12)^0.2 * 10 ) or 0 if < 1e12
     */
    calculatePrestigeShards(lifetimeCurrency) {
        const threshold = new Decimal('1e11'); // 100 Billion threshold
        if (lifetimeCurrency.lt(threshold)) {
            return 0;
        }
        // shards = floor( (lifetime / 1e11)^0.22 * 5 )
        const ratio = lifetimeCurrency.div(threshold);
        // BreakInfinity power
        const shardsDec = ratio.pow(0.22).times(5).floor();
        return Math.max(1, Math.min(1000000, shardsDec.toNumber()));
    }
}
export const gameEngineService = new GameEngineService();
