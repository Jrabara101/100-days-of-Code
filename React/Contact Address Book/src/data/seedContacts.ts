import { Contact, ClusterInfo } from '../types/contact';

export const CLUSTERS: ClusterInfo[] = [
  { id: 'Engineering Core', name: 'Engineering Core', color: 'text-primary', dotColor: 'bg-primary-container', count: 0 },
  { id: 'Active Sessions', name: 'Active Sessions', color: 'text-tertiary', dotColor: 'bg-tertiary-container', count: 0 },
  { id: 'High Priority Nodes', name: 'High Priority Nodes', color: 'text-secondary', dotColor: 'bg-secondary-container', count: 0 },
  { id: 'Design Studio', name: 'Design Studio', color: 'text-amber-400', dotColor: 'bg-amber-400', count: 0 },
  { id: 'Growth & Ops', name: 'Growth & Ops', color: 'text-rose-400', dotColor: 'bg-rose-400', count: 0 },
  { id: 'Distributed Kernel', name: 'Distributed Kernel', color: 'text-purple-400', dotColor: 'bg-purple-400', count: 0 },
];

const FIRST_NAMES = [
  'Elena', 'Marcus', 'Aria', 'Soren', 'Kaelen', 'Devon', 'Nadia', 'Cyrus',
  'Leila', 'Vance', 'Zane', 'Lyra', 'Tariq', 'Ronan', 'Mira', 'Xavier',
  'Cassian', 'Freja', 'Dante', 'Astrid', 'Jaxon', 'Seraphina', 'Corin', 'Orion',
  'Thorne', 'Althea', 'Sylas', 'Rowan', 'Kira', 'Bram', 'Dorian', 'Valerie',
  'Harlan', 'Elora', 'Kai', 'Nova', 'Sterling', 'Talia', 'Malik', 'Gemma'
];

const LAST_NAMES = [
  'Vance', 'Kovacs', 'Mercer', 'Cross', 'Holloway', 'Sloan', 'Castillo', 'Vaughn',
  'Blackwood', 'Chen', 'Okoro', 'Sterling', 'Reyes', 'Sinclair', 'Morozov', 'Winter',
  'Adler', 'Stark', 'Hawthorne', 'Lindqvist', 'Nakamura', 'Moreau', 'Vega', 'Ashford',
  'Kallio', 'Delacroix', 'Navarro', 'O\'Connor', 'Holt', 'Pryce', 'Solomon', 'Fletcher'
];

const ROLES = [
  'Systems Architect', 'Kernel Engineer', 'Distributed Lead', 'Compiler Specialist',
  'Graphics Programmer', 'Zero-Copy Architect', 'Security Researcher', 'Protocol Designer',
  'UI/UX Director', 'Design Systems Engineer', 'Full-Stack Developer', 'Infrastructure Lead',
  'Data Pipeline Architect', 'DevOps Specialist', 'Product strategist', 'Cryptographic Researcher'
];

const COMPANIES = [
  'Kinetic Engine Systems', 'Apex Dynamics', 'Hyperion Labs', 'Vector Foundry',
  'Synthetix Core', 'NovaGrid Protocols', 'ChronoLogic Labs', 'Paragon Systems',
  'Spectral Computing', 'OmniScale Robotics', 'Aetherium Network', 'CipherStream'
];

const LOCATIONS = [
  'San Francisco, CA', 'Stockholm, SE', 'Tokyo, JP', 'Berlin, DE',
  'London, UK', 'Austin, TX', 'Zurich, CH', 'Singapore, SG',
  'Toronto, CA', 'Seattle, WA', 'Amsterdam, NL', 'Remote, Node 0'
];

const TAG_POOL = [
  '#Kernel', '#ZeroAlloc', '#VIP', '#Distributed', '#Rust', '#WebAssembly',
  '#HighPriority', '#DesignSys', '#GPU', '#LatencySensitive', '#Infra', '#Security',
  '#Protocol', '#Network', '#Storage', '#MemoryCache', '#Async', '#Microservices'
];

const AVATAR_SEEDS = [
  'Felix', 'Aneka', 'Zack', 'Midnight', 'Milo', 'Caleb', 'Bandit', 'Abby',
  'Missy', 'Garfield', 'Whiskers', 'Coco', 'Socks', 'Toby', 'Peanut', 'Lucky',
  'Jasper', 'Oliver', 'Chloe', 'Simba', 'Lola', 'Shadow', 'Luna', 'Cleo'
];

export function generateContacts(count: number = 1500): Contact[] {
  const contacts: Contact[] = [];
  const clusterIds = CLUSTERS.map(c => c.id);

  for (let i = 0; i < count; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(i * 3 + Math.floor(i / FIRST_NAMES.length)) % LAST_NAMES.length];
    const name = `${firstName} ${lastName}`;
    const role = ROLES[(i * 7) % ROLES.length];
    const company = COMPANIES[(i * 5) % COMPANIES.length];
    const location = LOCATIONS[(i * 11) % LOCATIONS.length];
    const cluster = clusterIds[i % clusterIds.length];
    const id = `NODE-${1000 + i}`;
    const hexIdx = (0x1000 + i).toString(16).toUpperCase();
    const idx = `IDX::0x${hexIdx}`;
    
    // Select 2-4 tags deterministically
    const tagCount = 2 + (i % 3);
    const tags: string[] = [];
    for (let t = 0; t < tagCount; t++) {
      const tag = TAG_POOL[(i * 3 + t * 5) % TAG_POOL.length];
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    }

    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/[^a-z]/g, '')}@${company.toLowerCase().replace(/[^a-z]/g, '')}.io`;
    const cleanPhoneSuffix = (1000 + (i % 9000)).toString();
    const phone = `+1 555 ${cleanPhoneSuffix.slice(0, 3)} ${cleanPhoneSuffix.slice(1)}`;
    const matrix = `@${firstName.toLowerCase()}${lastName.toLowerCase()}:kinetic.internal`;
    const latency = 4 + (i % 42);

    const statuses: ('online' | 'busy' | 'offline' | 'away')[] = ['online', 'busy', 'online', 'away', 'offline'];
    const status = statuses[i % statuses.length];

    const avatarSeed = AVATAR_SEEDS[i % AVATAR_SEEDS.length];
    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}_${i}&backgroundColor=1c1b1d,2a2a2c`;

    contacts.push({
      id,
      idx,
      name,
      role,
      company,
      location,
      email,
      phone,
      matrix,
      latency,
      status,
      cluster,
      groupId: cluster,
      tags,
      avatarUrl,
      notes: [
        `Provisioned via kinetic spatial ledger node [${idx}].`,
        `Assigned primary cluster: ${cluster}.`,
        `Last telemetry check ping: ${latency}ms.`
      ],
      relationships: [
        {
          targetId: `NODE-${1000 + ((i + 1) % count)}`,
          name: `${FIRST_NAMES[(i + 1) % FIRST_NAMES.length]} ${LAST_NAMES[(i + 1) % LAST_NAMES.length]}`,
          relation: 'peer'
        },
        {
          targetId: `NODE-${1000 + ((i + 7) % count)}`,
          name: `${FIRST_NAMES[(i + 7) % FIRST_NAMES.length]} ${LAST_NAMES[(i + 7) % LAST_NAMES.length]}`,
          relation: 'lead'
        }
      ],
      updatedAt: Date.now() - (i * 36000),
    });
  }

  return contacts;
}
