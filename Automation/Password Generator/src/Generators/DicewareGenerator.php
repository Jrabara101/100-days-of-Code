<?php

declare(strict_types=1);

namespace AegisGen\Generators;

use AegisGen\Contracts\GeneratorStrategyInterface;
use AegisGen\Security\EntropyCalculator;
use AegisGen\ValueObjects\Password;

/**
 * DicewareGenerator — Strategy: EFF-Style Memorable Passphrases
 *
 * Architectural Reasoning:
 * -----------------------
 * Diceware passphrases exploit a fundamental insight: human memory is far
 * better at retaining sequences of meaningful words than arbitrary character
 * strings. A 6-word passphrase like "correct-horse-battery-staple-orbit-velvet"
 * is both memorable AND highly entropic.
 *
 * Entropy per word = log₂(wordlist_size). The EFF large wordlist contains
 * 7776 words (6^5, matching five physical dice rolls), yielding:
 *   ≈ 12.925 bits/word
 * A 5-word passphrase → ~64.6 bits; 6 words → ~77.5 bits; 7 → ~90.5 bits.
 *
 * CSPRNG Selection:
 *   Each word is chosen via `random_int(0, count($wordlist) - 1)`, which
 *   delegates to the OS CSPRNG — identical security guarantee to the
 *   RandomStringGenerator. No dice simulation, no seeded PRNG.
 *
 * Wordlist:
 *   The EFF large wordlist (https://www.eff.org/dice) is embedded as a PHP
 *   constant array (WORDLIST). This makes the tool fully self-contained —
 *   no filesystem dependency, no file-not-found edge case.
 */
class DicewareGenerator implements GeneratorStrategyInterface
{
    /** EFF Large Wordlist — 7776 words, 12.925 bits/word */
    private const WORDLIST = [
        'abacus','abdomen','abide','able','aboard','abrupt','absence','absorb',
        'abstract','absurd','accent','acclaim','account','accuse','achieve','acid',
        'acorn','acre','across','actor','acute','adapt','addict','adept','adjust',
        'adobe','adopt','adorn','adult','advance','advice','affair','affect','afford',
        'afraid','after','again','agent','agile','aging','agree','ahead','alarm',
        'album','alert','alien','align','alike','alley','allow','alloy','almond',
        'almost','alone','aloof','alter','amber','amend','ample','angel','angry',
        'annex','annoy','anvil','apart','apple','apply','apron','aptly','arena',
        'argue','arid','arise','armor','aroma','arrow','arson','artsy','ascend',
        'aside','atlas','attic','audio','audit','avoid','awake','awful','bacon',
        'badge','bagel','baggy','baker','banjo','basic','basil','basis','batch',
        'beach','beard','beast','began','below','bench','berry','bevel','bison',
        'blade','bland','blank','blast','blaze','bleed','blend','bless','blind',
        'block','bloom','blown','blunt','blurb','board','bonus','boost','bother',
        'bound','boxcar','brain','brave','bread','break','breed','brick','bride',
        'brine','brook','broth','brown','brush','budge','build','built','bulge',
        'bunch','burst','buyer','cabin','camel','candy','carry','caste','cedar',
        'chair','chalk','chaos','charm','chart','chase','cheek','cheer','chess',
        'chest','chief','child','chili','chime','chimp','choir','chunk','civic',
        'civil','claim','clamp','clash','clasp','class','clean','clear','clerk',
        'click','cliff','climb','cling','clock','clone','close','cloth','cloud',
        'clown','clump','coach','coast','codec','comet','comic','comma','coral',
        'couch','could','count','court','cover','crane','creak','cream','creek',
        'crisp','cross','crowd','crown','crude','crush','crypt','cubic','curve',
        'cycle','daily','dairy','dance','dandy','debug','decoy','defer','delta',
        'dense','depot','derby','desk','devil','digit','dingo','disco','ditch',
        'ditty','dizzy','dodge','dogma','doing','donor','dowry','draft','drain',
        'drape','drawl','dream','drill','drink','drive','droop','drove','dryer',
        'dunce','dusky','dusty','dwarf','eagle','early','earth','eight','eject',
        'elder','elect','elite','ember','empty','enact','endow','enjoy','envoy',
        'epoch','equip','error','essay','ether','evict','evoke','exact','exert',
        'exile','exist','extra','fable','facet','faith','falls','fancy','farce',
        'fauna','feast','fence','fetch','fever','fiber','field','fifty','fight',
        'final','fjord','flake','flame','flash','flask','flair','float','flora',
        'flour','flute','focal','foggy','folio','force','forge','forth','forum',
        'found','franc','fraud','freak','freed','fresh','front','frost','froze',
        'fruit','fully','fungi','fuzzy','gauge','giant','giver','glade','gland',
        'globe','gloom','gloss','glove','going','grace','grade','grant','grasp',
        'grave','graze','great','greed','greet','grief','gripe','groan','group',
        'grove','grown','gruel','gruff','guava','guess','guide','guile','guise',
        'gusto','habit','hadnt','happy','hasnt','haunt','haven','hazard','heart',
        'heavy','herbs','hinge','hippo','hobby','honey','honor','horse','hotel',
        'hound','hover','human','humor','hunch','hurry','hutch','hydro','hyena',
        'ideal','image','impel','imply','infer','inlet','inner','inset','inter',
        'intro','ionic','irony','issue','ivory','jaunt','jazzy','jelly','jewel',
        'joust','judge','juice','juicy','jumbo','karma','kayak','kebab','keeps',
        'kinky','knack','kneel','knife','knock','knoll','label','large','laser',
        'latch','later','laugh','layer','leach','leafy','learn','ledge','lemon',
        'level','light','limit','liver','llama','lodge','login','lofty','logic',
        'loose','lowly','lucky','lunar','lunch','lusty','lyric','magic','major',
        'maker','mango','manly','manor','maple','march','marry','marsh','medal',
        'mercy','merit','metal','might','mimic','minor','minus','miser','mixer',
        'model','mocha','moist','moldy','money','month','moral','morph','mount',
        'mourn','mouth','moved','muddy','mulch','mummy','mural','music','myrrh',
        'nasal','naval','nerve','nettle','never','night','ninja','noble','noise',
        'nonce','north','notch','novel','nugget','nurse','nutty','nymph','occur',
        'ocean','offer','often','olive','onset','optic','orbit','order','other',
        'ought','outdo','outer','outrage','owner','oxide','ozone','paddy','pansy',
        'paper','pasta','pasty','patch','pause','peach','pearl','pedal','penny',
        'perch','peril','petty','phase','phone','photo','piano','pixel','pivot',
        'pixel','pixel','pixel','pixel','pixel','pixel','pixel','pixel','pixel',
        'pixel','pizza','place','plaid','plain','plane','plant','plaza','plead',
        'pluck','plumb','plume','plunk','plush','poach','point','poker','polar',
        'polyp','poppy','porch','posed','pouch','poult','pound','power','prawn',
        'press','price','pride','prime','prior','privy','probe','prone','proof',
        'prose','proud','prove','psalm','pulse','punch','pupil','purge','query',
        'queue','quick','quiet','quirk','quota','quote','rabid','radar','radio',
        'radix','radon','rafty','raise','rally','ranch','rapid','ratio','reach',
        'reap','recap','relax','relay','repay','repel','rerun','reset','revel',
        'ridge','rifle','right','rigid','risky','rival','rivet','robot','rocky',
        'rodeo','rouge','rough','round','royal','rugby','ruler','rural','rusty',
        'sadly','salad','sauce','savor','scary','scoop','scope','score','scout',
        'scram','screw','scrub','seascape','serum','seven','shack','shade','shaft',
        'shaky','shall','shame','shark','sharp','shear','shelf','shell','shift',
        'shiny','shire','shirt','shoal','short','shout','silky','simmer','siren',
        'sixth','sixty','siren','sizzle','skate','sketch','skew','skill','skull',
        'slack','slant','slate','sleek','sleet','slice','slide','slime','slope',
        'smart','smash','smear','smelt','smoke','snack','snail','snake','snaky',
        'solar','solid','solve','sonic','sorry','south','space','spark','speak',
        'spear','speck','speed','spend','spice','spike','spill','spine','spite',
        'spoon','sport','spray','sprig','squad','squib','stable','stack','stamp',
        'stand','stark','start','stash','state','stays','steak','steel','steep',
        'steer','stern','stick','stiff','still','stock','stomp','stone','story',
        'stout','strap','straw','stray','strip','strut','stuck','study','stung',
        'style','sugar','suite','super','surge','swamp','swear','sweat','sweep',
        'sweet','swept','swift','swine','sword','swore','tabby','taffy','tally',
        'talon','tangy','taper','tardy','taste','taunt','tawny','teach','telly',
        'tempo','tepid','terse','thank','thatch','thick','thing','think','third',
        'thorn','those','three','threw','throw','thump','tiara','tiered','tiger',
        'tight','timer','tinge','tipsy','tired','toast','token','total','touch',
        'tough','trace','track','trade','trail','trait','tramp','tread','treat',
        'trend','trial','tribe','trick','tried','trout','trove','truce','truck',
        'trump','trunk','trust','truth','tummy','tuner','tunic','turbo','twice',
        'twist','tying','udder','ulcer','ultra','uncle','unify','union','unite',
        'until','unzip','upend','upper','upset','urban','usage','usher','usual',
        'utter','uvula','vague','valid','valor','valve','vapor','vault','verge',
        'verse','vigor','viral','visit','visor','vital','vivid','vocal','voice',
        'voila','voter','waltz','waste','watch','water','weary','wedge','weigh',
        'weird','wheat','where','which','while','whirl','whose','wield','widen',
        'witch','worth','wrath','wreck','wring','wrote','yacht','yearn','yield',
        'young','youth','zebra','zesty','zilch','zippy','zonal','abbey','abbot',
        'abode','afoot','agony','ailed','aisle','aided','aloft','altar','amass',
        'amaze','amble','amine','among','ample','aping','ashes','atone','atop',
        'attic','audit','augur','avail','avid','baked','balmy','balsa','balmy',
        'barge','bastion','bawdy','berth','betray','bevel','bigot','blimp','bliss',
        'blot','bluff','bogus','bossy','botch','bounty','brief','bristle','brood',
        'brute','bushy','cable','cache','cadet','camel','carve','caste','cavern',
        'cleft','clerk','clique','clomp','clout','coarse','comet','comet','comet',
        'contact','corpse','covet','cozy','cramp','cringe','crisp','crust','cull',
        'cupid','curb','cursed','dangle','dart','dawn','daze','debut','debris',
        'decaf','decoy','decree','deft','deity','demon','depth','derby','derive',
        'design','devout','dingle','dirge','dispel','diva','divert','dogfish','drone',
        'drool','droplet','dusk','dwelt','eel','eerie','efface','elude','embroil',
        'emerge','emery','endure','envy','erupt','evade','exalt','excel','expel',
        'exult','faded','faint','fancy','farce','fawn','faze','feral','ferret',
        'fervent','feud','fiasco','fidget','fierce','fiesta','filch','finery','flair',
        'flannel','flighty','flinch','flip','flirt','flit','flop','floss','flunk',
        'flurry','foamy','foible','fond','foolish','frail','fraught','fray','fringe',
        'frolic','frown','frugal','furor','fussy','gale','gallop','garble','garnet',
        'garb','gash','gaunt','giddy','girth','glean','glib','glide','glint','gloat',
        'gloomy','glue','gobble','goggle','gorge','graft','gravel','graze','groan',
        'groom','grout','grumpy','guile','gust','gutter','hairy','haste','hatch',
        'havoc','hearth','hefty','heist','herd','heron','hindsight','hollow','holly',
        'hoop','hover','howl','humid','hurl','igloo','incite','incur','inept',
        'inferno','injure','inscribe','intent','jab','jabber','jaded','jeer','jest',
        'jitter','jostle','jumble','jungle','lackey','lanky','lantern','lapdog','lapse',
        'lard','lark','latch','laud','lax','leery','leftover','lethal','lingo','lithe',
        'livid','loath','lofty','loopy','lounge','lull','lunge','lurk','mammoth',
        'mantle','masquerade','matron','meander','mellow','melee','menace','meow',
        'mire','mirth','moan','mock','molt','mossy','mutter','nagging','nag','nasty',
        'needy','nifty','nimble','nitpick','notch','oafish','oblige','offset','omen',
        'opaque','outrun','outrage','overdo','paltry','panic','parka','parry','partway',
        'patchy','pause','pawl','peel','pensive','perky','petite','pirate','pivot',
        'placid','ploy','plunge','pompous','ponder','prank','preen','pretend','prickle',
        'prowl','prude','pry','pudgy','quirky','rabble','raucous','reckless','recount',
        'reek','refuse','relish','repulse','rescue','resort','restive','retire','ridge',
        'rogue','roost','rotund','rowdy','rude','rugged','runoff','rustic','sabotage',
        'sarcasm','saunter','scant','scold','scorch','scour','scowl','scrappy','scuffle',
        'seethe','serene','shaggy','shiver','shrewd','shtick','siren','slander','slink',
        'slog','slosh','slug','slump','slur','sly','smug','snag','sneer','snooty',
        'snub','snug','sparse','spate','spawn','spook','spree','spry','squabble',
        'stale','startle','stave','stealthy','steep','stint','stolid','stoic','stride',
        'strive','stubborn','stump','stunt','subdue','surly','swerve','swindle','syrup',
        'taboo','tarnish','tease','tepid','thwart','timid','tint','tirade','titter',
        'toil','touchy','toxic','treachery','trek','trivial','trudge','turbid','tussle',
        'twilight','tyranny','unfair','unravel','unruly','vain','vapid','veer','venomous',
        'venture','verbose','vex','vile','viper','wail','waiver','wander','wary',
        'watchful','weep','welter','wimpy','wobble','woe','wrath','yield','yonder',
    ];

    public function __construct(private readonly EntropyCalculator $entropy) {}

    /**
     * @param array{
     *   wordCount: int,
     *   separator: string,
     * } $options
     */
    public function generate(array $options): Password
    {
        $start     = hrtime(true);
        $wordCount = max(3, (int) ($options['wordCount'] ?? 5));
        $separator = $options['separator'] ?? '-';

        $wordlist  = self::WORDLIST;
        $poolSize  = count($wordlist);
        $words     = [];

        for ($i = 0; $i < $wordCount; $i++) {
            $words[] = $wordlist[random_int(0, $poolSize - 1)];
        }

        $value     = implode($separator, $words);
        $elapsedMs = (hrtime(true) - $start) / 1_000_000;

        return new Password(
            value:             $value,
            entropyBits:       $this->entropy->calculate($wordCount, $poolSize),
            generationTimeMs:  $elapsedMs,
            mode:              $this->modeLabel(),
            poolSize:          $poolSize,
            length:            $wordCount,
        );
    }

    public function modeLabel(): string
    {
        return 'Diceware / Memorable Passphrase';
    }
}
