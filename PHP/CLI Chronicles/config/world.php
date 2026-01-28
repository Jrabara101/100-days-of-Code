<?php
/**
 * World Configuration
 * Defines all locations, connections, items, and NPCs
 */

$WORLD_MAP = [
    'forest_entrance' => [
        'name' => 'Forest Entrance',
        'description' => 'You stand at the edge of a dense forest. Tall oak trees tower above you, 
their branches casting dark shadows on the overgrown path. You hear the distant 
sound of running water to the east, and an ancient stone structure is faintly 
visible to the north.',
        'exits' => [
            'north' => 'abandoned_temple',
            'east' => 'forest_stream',
            'south' => 'village'
        ],
        'items' => ['stick', 'berry'],
        'npcs' => []
    ],
    
    'forest_stream' => [
        'name' => 'Forest Stream',
        'description' => 'You arrive at a crystal-clear stream that cuts through the forest. 
Smooth rocks are scattered across the shallow water. You notice a locked wooden 
chest partially submerged near the bank. The forest path continues west.',
        'exits' => [
            'west' => 'forest_entrance'
        ],
        'items' => ['iron_key'],
        'npcs' => [],
        'special_items' => [
            'chest' => [
                'locked' => true,
                'key_needed' => 'iron_key',
                'contents' => ['gold_coin', 'ancient_map']
            ]
        ]
    ],
    
    'abandoned_temple' => [
        'name' => 'Abandoned Temple',
        'description' => 'The ruins of an ancient temple stand before you. Crumbling stone walls 
are covered in moss and ivy. The air is cold and still. You notice a glowing 
crystal on a pedestal in the center, surrounded by strange symbols. A path leads 
back to the south.',
        'exits' => [
            'south' => 'forest_entrance',
            'up' => 'temple_tower'
        ],
        'items' => [],
        'npcs' => ['wise_guardian'],
        'special_items' => [
            'crystal' => [
                'takeable' => true,
                'description' => 'A glowing crystal that hums with ancient energy',
                'magical' => true
            ]
        ]
    ],
    
    'temple_tower' => [
        'name' => 'Temple Tower',
        'description' => 'You climb the crumbling stone stairs to the top of the temple tower. 
From here, you can see for miles across the forest. An old journal sits on a 
stone desk. The stairs lead back down.',
        'exits' => [
            'down' => 'abandoned_temple'
        ],
        'items' => ['old_journal'],
        'npcs' => []
    ],
    
    'village' => [
        'name' => 'Peaceful Village',
        'description' => 'A small, quiet village with thatched-roof cottages and a small marketplace. 
Smoke rises from chimneys. A friendly merchant stands near the well. The forest 
path leads north, and a bridge crosses the river to the east.',
        'exits' => [
            'north' => 'forest_entrance',
            'east' => 'riverside_camp',
            'west' => 'merchant_shop'
        ],
        'items' => [],
        'npcs' => ['merchant']
    ],
    
    'merchant_shop' => [
        'name' => 'Merchant\'s Shop',
        'description' => 'A cozy shop filled with shelves of curious items. The walls are lined 
with bottles, scrolls, and mysterious artifacts. The shopkeeper is nowhere to be seen, 
but a note on the counter reads: "Come back with the golden coin - I have what you seek."',
        'exits' => [
            'east' => 'village'
        ],
        'items' => [],
        'npcs' => ['merchant']
    ],
    
    'riverside_camp' => [
        'name' => 'Riverside Camp',
        'description' => 'An old campsite near the river with the remains of a fire pit. 
A worn leather backpack lies near some rocks. You feel watched, as if something 
is lurking in the shadows of the nearby trees.',
        'exits' => [
            'west' => 'village',
            'north' => 'dangerous_cave'
        ],
        'items' => ['leather_backpack', 'torch'],
        'npcs' => [],
        'danger_level' => 2
    ],
    
    'dangerous_cave' => [
        'name' => 'The Forgotten Cave',
        'description' => 'A dark cave entrance yawns before you. Water drips from the ceiling. 
The air smells of damp stone and something... organic. You cannot see very far into 
the darkness. A faint glow emanates from deeper within.',
        'exits' => [
            'south' => 'riverside_camp'
        ],
        'items' => [],
        'npcs' => [],
        'danger_level' => 5,
        'special_condition' => 'torch_needed'
    ]
];

// NPC Data
$NPCS = [
    'wise_guardian' => [
        'name' => 'The Wise Guardian',
        'dialogue' => 'A shimmering figure materializes before you. It speaks in ancient tones:
        
"Greetings, traveler. I have been waiting for someone brave enough to seek the 
forgotten knowledge. The temple holds secrets that could change your fate. 
Take what you need, but beware - the crystal responds only to the pure of heart."',
        'hint' => 'The guardian whispers: "Seek the golden coin in the stream\'s chest. You will need it."'
    ],
    'merchant' => [
        'name' => 'The Merchant',
        'dialogue' => 'The merchant eyes you with interest:
        
"Ah, an adventurer! I have rare items for those with the right currency. 
Do you have a golden coin? I can offer you knowledge, supplies, or even 
a map to hidden treasures."',
        'hint' => 'The merchant leans in: "Many seek the cave. Few return. The torch is your friend."'
    ]
];

// Item Data
$ITEMS = [
    'stick' => [
        'name' => 'Wooden Stick',
        'description' => 'A sturdy wooden stick',
        'value' => 0,
        'usable' => false
    ],
    'berry' => [
        'name' => 'Forest Berry',
        'description' => 'A wild forest berry, edible and mildly medicinal',
        'value' => 1,
        'usable' => true,
        'effect' => ['health' => 10]
    ],
    'iron_key' => [
        'name' => 'Iron Key',
        'description' => 'An old iron key, heavy and ornate',
        'value' => 5,
        'usable' => false
    ],
    'gold_coin' => [
        'name' => 'Golden Coin',
        'description' => 'A coin of pure gold, glinting in the light',
        'value' => 50,
        'usable' => false
    ],
    'ancient_map' => [
        'name' => 'Ancient Map',
        'description' => 'A crumpled map of the region, showing unknown locations',
        'value' => 30,
        'usable' => false
    ],
    'old_journal' => [
        'name' => 'Old Journal',
        'description' => 'A journal filled with mysterious entries and sketches',
        'value' => 20,
        'usable' => true,
        'effect' => ['xp' => 25]
    ],
    'leather_backpack' => [
        'name' => 'Leather Backpack',
        'description' => 'A well-worn leather backpack that increases carrying capacity',
        'value' => 10,
        'usable' => false,
        'effect' => ['capacity' => 5]
    ],
    'torch' => [
        'name' => 'Torch',
        'description' => 'A torch that provides light in darkness',
        'value' => 5,
        'usable' => true
    ],
    'crystal' => [
        'name' => 'Glowing Crystal',
        'description' => 'An ancient magical crystal from the temple',
        'value' => 100,
        'usable' => false,
        'magical' => true
    ]
];

return [
    'world' => $WORLD_MAP,
    'npcs' => $NPCS,
    'items' => $ITEMS
];
?>
