import { DialogueNode } from '../types/game';

export const DIALOGUE_TREE: Record<string, DialogueNode> = {
  // --- ELDER MAEL DIALOGUES ---
  mael_intro: {
    id: 'mael_intro',
    speaker: 'Elder Mael',
    speakerRole: 'Sage of the Stone Circle',
    voiceType: 'elder',
    portraitUrl: 'elder',
    text: 'Ah, young wanderer. You awaken just as the ley lines fracture. The ancient earth tremors grow violent with each dusk. Have you felt the resonance in the soil?',
    choices: [
      {
        id: 'c_mael_tremors',
        text: 'What is causing the ground to convulse, Elder?',
        nextNodeId: 'mael_tremors',
      },
      {
        id: 'c_mael_monolith',
        text: 'I felt a pull toward the ancient monolith to the north.',
        nextNodeId: 'mael_monolith',
      },
      {
        id: 'c_mael_echo',
        text: '[Memory] I touched the monolith... I witnessed the Great Sundering.',
        nextNodeId: 'mael_echo_reveal',
        requiredFlags: ['echo_viewed'],
      },
      {
        id: 'c_mael_leave',
        text: 'I will explore the grove and return shortly.',
        nextNodeId: null,
      },
    ],
  },

  mael_tremors: {
    id: 'mael_tremors',
    speaker: 'Elder Mael',
    speakerRole: 'Sage of the Stone Circle',
    voiceType: 'elder',
    portraitUrl: 'elder',
    text: 'The seal upon the Sunken Shrine is slipping. Eastward across the river, an ancient Dormant Golem bars the mountain gorge. It will only awaken if it hears the resonance of the Harmonic Flute, which was buried in the overgrown chest in our southern grove.',
    choices: [
      {
        id: 'c_mael_accept_quest',
        text: 'I will find the flute and awaken the construct.',
        nextNodeId: null,
        setFlags: ['met_elder'],
      },
      {
        id: 'c_mael_ask_more',
        text: 'Tell me more about the Sunken Shrine.',
        nextNodeId: 'mael_shrine_lore',
      },
    ],
  },

  mael_shrine_lore: {
    id: 'mael_shrine_lore',
    speaker: 'Elder Mael',
    speakerRole: 'Sage of the Stone Circle',
    voiceType: 'elder',
    portraitUrl: 'elder',
    text: 'A thousand years ago, the architects forged a crystalline reactor at the bottom of the cavern. It balances the spring waters of the entire realm. But power of that magnitude corrupts those who seek dominion.',
    choices: [
      {
        id: 'c_mael_lore_back',
        text: 'I understand. I will seek the southern chest.',
        nextNodeId: null,
        setFlags: ['met_elder'],
      },
    ],
  },

  mael_monolith: {
    id: 'mael_monolith',
    speaker: 'Elder Mael',
    speakerRole: 'Sage of the Stone Circle',
    voiceType: 'elder',
    portraitUrl: 'elder',
    text: 'The monolith is an anchor of memory. In times of crisis, the stones project "Memory Echoes"—ghostly sepia visions of those who stood here before us. Approach it and inspect its runes closely.',
    choices: [
      {
        id: 'c_mael_monolith_back',
        text: 'I will inspect the monolith with care.',
        nextNodeId: null,
      },
    ],
  },

  mael_echo_reveal: {
    id: 'mael_echo_reveal',
    speaker: 'Elder Mael',
    speakerRole: 'Sage of the Stone Circle',
    voiceType: 'elder',
    portraitUrl: 'elder',
    text: 'By the stars... you possess the sight of the Ancient Resonators! Tell me, did the architects fall by tragedy, or did they tear their own world apart in search of godhood?',
    choices: [
      {
        id: 'c_trust_mael',
        text: 'They tore the world apart in arrogance. I entrust you with the full truth.',
        nextNodeId: 'mael_trusted',
        setFlags: ['trust_elder_mael'],
      },
      {
        id: 'c_conceal_mael',
        text: 'It was indistinct... a blur of dust and sorrow. (Conceal the memory)',
        nextNodeId: 'mael_concealed',
        setFlags: ['conceal_memory'],
      },
    ],
  },

  mael_trusted: {
    id: 'mael_trusted',
    speaker: 'Elder Mael',
    speakerRole: 'Sage of the Stone Circle',
    voiceType: 'elder',
    portraitUrl: 'elder',
    text: 'Your honesty fortifies my spirit, traveler. Knowing their folly gives us wisdom. Take this blessing—may the light guide your footsteps into the Sunken Shrine.',
    choices: [
      {
        id: 'c_close',
        text: 'Thank you, Elder Mael.',
        nextNodeId: null,
      },
    ],
  },

  mael_concealed: {
    id: 'mael_concealed',
    speaker: 'Elder Mael',
    speakerRole: 'Sage of the Stone Circle',
    voiceType: 'elder',
    portraitUrl: 'elder',
    text: 'I understand. Some visions weigh too heavily on the heart. But be cautious when you step into the shrine.',
    choices: [
      {
        id: 'c_close',
        text: 'I will remain vigilant.',
        nextNodeId: null,
      },
    ],
  },

  // --- DORMANT GOLEM DIALOGUES ---
  golem_dormant: {
    id: 'golem_dormant',
    speaker: 'Dormant Golem',
    speakerRole: 'Ancient Stone Gatekeeper',
    voiceType: 'golem',
    portraitUrl: 'golem',
    text: 'A towering monolith of mossy granite stands rigid across the mountain path. Intricate spiral grooves carve into its chestplate, waiting in deep, silent slumber.',
    choices: [
      {
        id: 'c_golem_play',
        text: '[Equip Flute] Play the Harmonic Flute to resonate with the crystal core.',
        nextNodeId: 'golem_awakened',
        requiredFlags: ['has_flute'],
        action: 'awaken_golem',
      },
      {
        id: 'c_golem_examine',
        text: 'Examine the flute-shaped aperture carved into the granite.',
        nextNodeId: 'golem_hint',
      },
      {
        id: 'c_golem_leave',
        text: 'Step back quietly.',
        nextNodeId: null,
      },
    ],
  },

  golem_hint: {
    id: 'golem_hint',
    speaker: 'Ancient Inscription',
    speakerRole: 'Carved Runic Script',
    voiceType: 'spirit',
    portraitUrl: 'golem',
    text: '"Only when the breath of melody meets the heart of stone shall the passage to the Sunken Shrine yield." Search the southern grove for the chest.',
    choices: [
      {
        id: 'c_golem_back',
        text: 'I need to find the Harmonic Flute.',
        nextNodeId: null,
      },
    ],
  },

  golem_awakened: {
    id: 'golem_awakened',
    speaker: 'Harmonic Golem',
    speakerRole: 'Awakened Guardian',
    voiceType: 'golem',
    portraitUrl: 'golem',
    text: 'The harmonic melody rings true! With a thunderous tremor, the granite construct stirs. Brilliant cyan light floods its eyes. It steps aside, bowing low to reveal the open portal to the Sunken Shrine!',
    choices: [
      {
        id: 'c_enter_pass',
        text: 'Step past the golem toward the Sunken Shrine portal.',
        nextNodeId: null,
        setFlags: ['golem_awakened'],
      },
    ],
  },

  // --- LYRA THE WANDERER DIALOGUES ---
  lyra_intro: {
    id: 'lyra_intro',
    speaker: 'Lyra',
    speakerRole: 'Twilight Wanderer',
    voiceType: 'wanderer',
    portraitUrl: 'wanderer',
    text: 'Evening settles fast over Whispering Glade, stranger. When the dusk turns to deep indigo, spirit motes rise from the river grass. Have you tried raising your lantern?',
    choices: [
      {
        id: 'c_lyra_lantern',
        text: 'How does the lantern work?',
        nextNodeId: 'lyra_lantern_lore',
      },
      {
        id: 'c_lyra_advice',
        text: 'Any advice for crossing the eastern bridge?',
        nextNodeId: 'lyra_bridge_lore',
      },
      {
        id: 'c_lyra_leave',
        text: 'Safe travels, Lyra.',
        nextNodeId: null,
      },
    ],
  },

  lyra_lantern_lore: {
    id: 'lyra_lantern_lore',
    speaker: 'Lyra',
    speakerRole: 'Twilight Wanderer',
    voiceType: 'wanderer',
    portraitUrl: 'wanderer',
    text: 'Press [1] to equip and toggle your lantern. In total darkness, it carves out a radial bubble of warm light and keeps nocturnal phantoms at bay.',
    choices: [
      {
        id: 'c_lyra_back',
        text: 'Good to know. Thank you.',
        nextNodeId: null,
      },
    ],
  },

  lyra_bridge_lore: {
    id: 'lyra_bridge_lore',
    speaker: 'Lyra',
    speakerRole: 'Twilight Wanderer',
    voiceType: 'wanderer',
    portraitUrl: 'wanderer',
    text: 'The wooden bridge across the river is stable, but past it lies the dormant golem. Only melodic harmonics can convince ancient constructs to move.',
    choices: [
      {
        id: 'c_lyra_back',
        text: 'I will heed your warning.',
        nextNodeId: null,
      },
    ],
  },

  // --- GUARDIAN SENTINEL IN SUNKEN SHRINE ---
  guardian_intro: {
    id: 'guardian_intro',
    speaker: 'Sentinel of Whispers',
    speakerRole: 'Vault Protector',
    voiceType: 'golem',
    portraitUrl: 'guardian',
    text: 'Halt, mortal traveler. For ten centuries I have watched the crystalline waters of this shrine. All who sought the core arrived with greed. State your intent!',
    choices: [
      {
        id: 'c_spare_guardian',
        text: 'I seek balance, not destruction. Lower your spear and stand down in peace.',
        nextNodeId: 'guardian_spared',
        setFlags: ['spare_guardian'],
      },
      {
        id: 'c_deactivate_guardian',
        text: 'Your eternal vigil ends here. I will deactivate your core to secure the shrine.',
        nextNodeId: 'guardian_deactivated',
        setFlags: ['deactivate_guardian'],
      },
    ],
  },

  guardian_spared: {
    id: 'guardian_spared',
    speaker: 'Sentinel of Whispers',
    speakerRole: 'Vault Protector',
    voiceType: 'golem',
    portraitUrl: 'guardian',
    text: '...Compassion. A virtue long thought extinguished in the hearts of surface dwellers. The path to the altar is open. May your choice be as pure as your words.',
    choices: [
      {
        id: 'c_proceed_altar',
        text: 'Approach the Heart Altar.',
        nextNodeId: null,
      },
    ],
  },

  guardian_deactivated: {
    id: 'guardian_deactivated',
    speaker: 'Sentinel of Whispers',
    speakerRole: 'Vault Protector',
    voiceType: 'golem',
    portraitUrl: 'guardian',
    text: 'A dull hum reverberates through the vault as the sentinel’s core flickers into silence. The path to the altar clears, but the air feels hollow and cold.',
    choices: [
      {
        id: 'c_proceed_altar',
        text: 'Approach the Heart Altar.',
        nextNodeId: null,
      },
    ],
  },

  // --- SHRINE CLIMAX MORAL DILEMMA ---
  shrine_climax_choice: {
    id: 'shrine_climax_choice',
    speaker: 'The Shrine Core',
    speakerRole: 'Heart of Equilibrium',
    voiceType: 'spirit',
    portraitUrl: 'spirit',
    text: 'Before you floats the sacred sapphire core, pulsing with raw primordial vitality. Its energy sustains the fertile groves of the realm. You have reached the nexus of Chapter 1.',
    choices: [
      {
        id: 'c_restore_shrine',
        text: 'Restore the Sunken Shrine (Preserve equilibrium and heal the land)',
        nextNodeId: null,
        setFlags: ['shrine_restored'],
        action: 'climax_choice',
      },
      {
        id: 'c_harvest_core',
        text: 'Harvest the Core (Absorb its boundless power for your own journey)',
        nextNodeId: null,
        setFlags: ['shrine_harvested'],
        action: 'climax_choice',
      },
    ],
  },
};
