import { 
  Department, 
  Role, 
  Employee, 
  EmployeeSensitiveData, 
  EmploymentHistoryMilestone, 
  AttendancePunchLog, 
  LeaveRequest, 
  ActingDelegation, 
  AuditLogEntry, 
  EmployeeDocument,
  BurnoutRiskSignal
} from '../types';

export const initialDepartments: Department[] = [
  {
    id: 'dept-exec',
    name: 'Executive Leadership',
    code: 'EXEC',
    leadEmployeeId: 'emp-001',
    budgetHeadcount: 4,
    colorHex: '#7C3AED'
  },
  {
    id: 'dept-eng',
    name: 'Core Platform & Engineering',
    code: 'ENG',
    leadEmployeeId: 'emp-002',
    budgetHeadcount: 65,
    colorHex: '#2563EB'
  },
  {
    id: 'dept-des',
    name: 'Product Design & Ergonomics',
    code: 'DES',
    leadEmployeeId: 'emp-004',
    budgetHeadcount: 18,
    colorHex: '#EC4899'
  },
  {
    id: 'dept-prod',
    name: 'Product Management',
    code: 'PROD',
    leadEmployeeId: 'emp-005',
    budgetHeadcount: 14,
    colorHex: '#0D9488'
  },
  {
    id: 'dept-peop',
    name: 'People Operations & Culture',
    code: 'PEOP',
    leadEmployeeId: 'emp-003',
    budgetHeadcount: 12,
    colorHex: '#F59E0B'
  },
  {
    id: 'dept-fin',
    name: 'Finance & Compliance',
    code: 'FIN',
    leadEmployeeId: 'emp-006',
    budgetHeadcount: 10,
    colorHex: '#10B981'
  }
];

export const initialRoles: Role[] = [
  {
    id: 'role-superadmin',
    name: 'Super Admin / Executive',
    code: 'SUPER_ADMIN',
    hierarchyLevel: 1,
    description: 'Unrestricted global operational and administrative authority across all entities.',
    badgeColor: '#7C3AED',
    permissions: {
      employeeCrud: 'all',
      compensationRead: 'all',
      compensationWrite: 'all',
      attendanceManage: 'all',
      leaveApprove: 'all',
      systemAdmin: 'all'
    }
  },
  {
    id: 'role-hrpartner',
    name: 'HR People Partner',
    code: 'HR_PARTNER',
    hierarchyLevel: 2,
    description: 'Company-wide people lifecycle, compliance management, compensation triage, and employee care.',
    badgeColor: '#EC4899',
    permissions: {
      employeeCrud: 'all',
      compensationRead: 'all',
      compensationWrite: 'all',
      attendanceManage: 'all',
      leaveApprove: 'all',
      systemAdmin: 'department'
    }
  },
  {
    id: 'role-depthead',
    name: 'Department Head',
    code: 'DEPT_HEAD',
    hierarchyLevel: 3,
    description: 'Operational lead governing departmental headcount, shift schedules, and direct/indirect subordinates.',
    badgeColor: '#2563EB',
    permissions: {
      employeeCrud: 'department',
      compensationRead: 'department',
      compensationWrite: 'none',
      attendanceManage: 'department',
      leaveApprove: 'department',
      systemAdmin: 'none'
    }
  },
  {
    id: 'role-manager',
    name: 'Team Manager',
    code: 'TEAM_MANAGER',
    hierarchyLevel: 4,
    description: 'Frontline leadership managing direct report attendance, timesheet sign-offs, and leave requests.',
    badgeColor: '#0D9488',
    permissions: {
      employeeCrud: 'direct_reports',
      compensationRead: 'none',
      compensationWrite: 'none',
      attendanceManage: 'direct_reports',
      leaveApprove: 'direct_reports',
      systemAdmin: 'none'
    }
  },
  {
    id: 'role-employee',
    name: 'Standard Employee',
    code: 'EMPLOYEE',
    hierarchyLevel: 5,
    description: 'Standard team member with self-service profile management and personal punch/leave access.',
    badgeColor: '#64748B',
    permissions: {
      employeeCrud: 'own',
      compensationRead: 'own',
      compensationWrite: 'none',
      attendanceManage: 'own',
      leaveApprove: 'none',
      systemAdmin: 'none'
    }
  },
  {
    id: 'role-contractor',
    name: 'External Contractor',
    code: 'CONTRACTOR',
    hierarchyLevel: 6,
    description: 'Time-and-materials specialist restricted to work order logging and personal timesheets.',
    badgeColor: '#D97706',
    permissions: {
      employeeCrud: 'own',
      compensationRead: 'none',
      compensationWrite: 'none',
      attendanceManage: 'own',
      leaveApprove: 'none',
      systemAdmin: 'none'
    }
  }
];

export const initialEmployees: Employee[] = [
  {
    id: 'emp-001',
    employeeCode: 'EMP-0001',
    firstName: 'Devon',
    lastName: 'Kaufman',
    preferredName: 'Dev',
    email: 'devon.kaufman@aura-os.internal',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    pronouns: 'they/them',
    departmentId: 'dept-exec',
    roleId: 'role-superadmin',
    managerId: null,
    jobTitle: 'Chief Executive Officer & Founder',
    employmentType: 'full_time',
    workMode: 'hybrid',
    status: 'active',
    timezone: 'Europe/London (UTC+1)',
    hireDate: '2021-03-15',
    attendanceStatus: 'clocked_in_office',
    skills: ['Capital Allocation', 'System Architecture', 'Org Strategy'],
    bio: 'Pioneering human-centric workplace velocity. Architecting transparent workforce infrastructure.'
  },
  {
    id: 'emp-002',
    employeeCode: 'EMP-0014',
    firstName: 'Marcus',
    lastName: 'Vance',
    email: 'marcus.vance@aura-os.internal',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    pronouns: 'he/him',
    departmentId: 'dept-eng',
    roleId: 'role-depthead',
    managerId: 'emp-001',
    jobTitle: 'VP of Platform Engineering',
    employmentType: 'full_time',
    workMode: 'hybrid',
    status: 'active',
    timezone: 'Europe/Berlin (UTC+2)',
    hireDate: '2021-09-01',
    attendanceStatus: 'clocked_in_office',
    skills: ['Distributed Systems', 'PostgreSQL', 'Kubernetes', 'High-Trust Leadership'],
    bio: 'Passionate about engineering ergonomics, clean API boundaries, and low-latency systems.'
  },
  {
    id: 'emp-003',
    employeeCode: 'EMP-0022',
    firstName: 'Sarah',
    lastName: 'Chen',
    email: 'sarah.chen@aura-os.internal',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    pronouns: 'she/her',
    departmentId: 'dept-peop',
    roleId: 'role-hrpartner',
    managerId: 'emp-001',
    jobTitle: 'Head of People Operations & Talent',
    employmentType: 'full_time',
    workMode: 'remote',
    status: 'active',
    timezone: 'America/New_York (UTC-4)',
    hireDate: '2022-01-10',
    attendanceStatus: 'clocked_in_remote',
    skills: ['Compensation Calibration', 'Global Mobility', 'Culture Scaling'],
    bio: 'Dedicated to empathetic onboarding, zero-bias compensation, and mental health advocacy.'
  },
  {
    id: 'emp-004',
    employeeCode: 'EMP-0035',
    firstName: 'Aaliyah',
    lastName: 'Nasser',
    email: 'aaliyah.nasser@aura-os.internal',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    pronouns: 'she/her',
    departmentId: 'dept-des',
    roleId: 'role-depthead',
    managerId: 'emp-001',
    jobTitle: 'Head of Product Design & Ergonomics',
    employmentType: 'full_time',
    workMode: 'hybrid',
    status: 'active',
    timezone: 'Europe/London (UTC+1)',
    hireDate: '2022-04-18',
    attendanceStatus: 'clocked_in_office',
    skills: ['Design Systems', 'Micro-Interactions', 'Ergonomic Interfaces'],
    bio: 'Crafting high-density desktop software that feels as tactile and responsive as physical instruments.'
  },
  {
    id: 'emp-005',
    employeeCode: 'EMP-0048',
    firstName: 'Mateo',
    lastName: 'Silva',
    email: 'mateo.silva@aura-os.internal',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    pronouns: 'he/him',
    departmentId: 'dept-prod',
    roleId: 'role-depthead',
    managerId: 'emp-001',
    jobTitle: 'Director of Product Velocity',
    employmentType: 'full_time',
    workMode: 'remote',
    status: 'active',
    timezone: 'America/Los_Angeles (UTC-7)',
    hireDate: '2022-06-01',
    attendanceStatus: 'clocked_in_remote',
    skills: ['Product Roadmapping', 'User Research', 'Metric Synthesis'],
    bio: 'Transforming complex administrative friction into intuitive, 1-click team workflows.'
  },
  {
    id: 'emp-006',
    employeeCode: 'EMP-0052',
    firstName: 'Helena',
    lastName: 'Lindqvist',
    email: 'helena.lindqvist@aura-os.internal',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    pronouns: 'she/her',
    departmentId: 'dept-fin',
    roleId: 'role-depthead',
    managerId: 'emp-001',
    jobTitle: 'VP Finance & Controller',
    employmentType: 'full_time',
    workMode: 'onsite',
    status: 'active',
    timezone: 'Europe/Stockholm (UTC+2)',
    hireDate: '2022-08-15',
    attendanceStatus: 'clocked_in_office',
    skills: ['Audit Governance', 'Headcount Financial Modeling', 'Tax Optimization'],
    bio: 'Overseeing fiscal resilience, enterprise compliance, and transparent equity architectures.'
  },
  {
    id: 'emp-007',
    employeeCode: 'EMP-0142',
    firstName: 'Elena',
    lastName: 'Rostova',
    preferredName: 'Lena',
    email: 'elena.rostova@aura-os.internal',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    pronouns: 'she/her',
    departmentId: 'dept-eng',
    roleId: 'role-manager',
    managerId: 'emp-002',
    jobTitle: 'Staff Infrastructure Lead (DevOps)',
    employmentType: 'full_time',
    workMode: 'hybrid',
    status: 'active',
    timezone: 'Europe/Berlin (UTC+2)',
    hireDate: '2023-02-14',
    attendanceStatus: 'clocked_in_office',
    skills: ['Terraform', 'PostgreSQL CTEs', 'Chaos Engineering', 'Zero-Downtime Deploys'],
    bio: 'Scaling high-concurrency database pipelines and recursive org tree topologies.'
  },
  {
    id: 'emp-008',
    employeeCode: 'EMP-0143',
    firstName: 'Alex',
    lastName: 'Rivera',
    email: 'alex.rivera@aura-os.internal',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    pronouns: 'he/they',
    departmentId: 'dept-eng',
    roleId: 'role-employee',
    managerId: 'emp-007',
    jobTitle: 'Senior Site Reliability Engineer',
    employmentType: 'full_time',
    workMode: 'remote',
    status: 'active',
    timezone: 'America/New_York (UTC-4)',
    hireDate: '2023-06-01',
    attendanceStatus: 'missing_punch',
    skills: ['Kubernetes', 'Prometheus', 'Incident Command', 'Golang'],
    bio: 'Keeping the latency low and uptime at 99.999%.'
  },
  {
    id: 'emp-009',
    employeeCode: 'EMP-0155',
    firstName: 'Siddharth',
    lastName: 'Patel',
    preferredName: 'Sid',
    email: 'sid.patel@aura-os.internal',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    pronouns: 'he/him',
    departmentId: 'dept-eng',
    roleId: 'role-employee',
    managerId: 'emp-007',
    jobTitle: 'Senior Backend Engineer',
    employmentType: 'full_time',
    workMode: 'remote',
    status: 'active',
    timezone: 'Asia/Kolkata (UTC+5:30)',
    hireDate: '2023-08-10',
    attendanceStatus: 'clocked_in_remote',
    skills: ['PostgreSQL RLS', 'Node.js', 'Distributed Caching', 'Event Sinks'],
    bio: 'Building enterprise authorization layers and recursive CTE query planners.'
  },
  {
    id: 'emp-010',
    employeeCode: 'EMP-0160',
    firstName: 'Chloe',
    lastName: 'Dupont',
    email: 'chloe.dupont@aura-os.internal',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    pronouns: 'she/her',
    departmentId: 'dept-des',
    roleId: 'role-employee',
    managerId: 'emp-004',
    jobTitle: 'Senior UI/UX Ergonomist',
    employmentType: 'full_time',
    workMode: 'onsite',
    status: 'active',
    timezone: 'Europe/Paris (UTC+2)',
    hireDate: '2023-09-01',
    attendanceStatus: 'on_break',
    skills: ['Figma Tokens', 'Micro-Interactions', 'CSS Virtualization'],
    bio: 'Obsessed with fluid animation curves and keyboard-first accessibility.'
  },
  {
    id: 'emp-011',
    employeeCode: 'EMP-0178',
    firstName: 'Kaito',
    lastName: 'Tanaka',
    email: 'kaito.tanaka@aura-os.internal',
    avatarUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80',
    pronouns: 'he/him',
    departmentId: 'dept-eng',
    roleId: 'role-employee',
    managerId: 'emp-002',
    jobTitle: 'Principal Frontend Architect',
    employmentType: 'full_time',
    workMode: 'remote',
    status: 'active',
    timezone: 'Asia/Tokyo (UTC+9)',
    hireDate: '2023-11-15',
    attendanceStatus: 'clocked_in_remote',
    skills: ['React 18 Concurrent', 'TanStack Table', 'Canvas Rendering', 'Web Workers'],
    bio: 'Optimizing web applications for guaranteed 60fps rendering under heavy data volumes.'
  },
  {
    id: 'emp-012',
    employeeCode: 'EMP-0182',
    firstName: 'Jordan',
    lastName: 'Taylor',
    email: 'jordan.taylor@aura-os.internal',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    pronouns: 'they/them',
    departmentId: 'dept-peop',
    roleId: 'role-employee',
    managerId: 'emp-003',
    jobTitle: 'People Operations Specialist',
    employmentType: 'full_time',
    workMode: 'hybrid',
    status: 'active',
    timezone: 'America/New_York (UTC-4)',
    hireDate: '2024-01-08',
    attendanceStatus: 'clocked_in_office',
    skills: ['Onboarding Experience', 'Immigration Compliance', 'Culture Programs'],
    bio: 'Making every newcomer feel like an indispensable partner from Day 0.'
  },
  {
    id: 'emp-013',
    employeeCode: 'EMP-0195',
    firstName: 'Lucas',
    lastName: 'Moreau',
    email: 'lucas.moreau@aura-os.internal',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    pronouns: 'he/him',
    departmentId: 'dept-eng',
    roleId: 'role-employee',
    managerId: 'emp-007',
    jobTitle: 'DevOps & Cloud Engineer',
    employmentType: 'full_time',
    workMode: 'remote',
    status: 'on_leave',
    timezone: 'Europe/Paris (UTC+2)',
    hireDate: '2024-03-01',
    attendanceStatus: 'on_leave',
    skills: ['Docker', 'AWS CDK', 'GitHub Actions', 'Security Hardening'],
    bio: 'Currently on scheduled PTO. Recharging for Q4 infrastructure milestones.'
  },
  {
    id: 'emp-014',
    employeeCode: 'EMP-0210',
    firstName: 'Priya',
    lastName: 'Sharma',
    email: 'priya.sharma@aura-os.internal',
    avatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
    pronouns: 'she/her',
    departmentId: 'dept-prod',
    roleId: 'role-employee',
    managerId: 'emp-005',
    jobTitle: 'Senior Product Manager (Workforce)',
    employmentType: 'full_time',
    workMode: 'hybrid',
    status: 'pre_boarding',
    timezone: 'Europe/London (UTC+1)',
    hireDate: '2026-11-01',
    attendanceStatus: 'off_duty',
    skills: ['User Journey Mapping', 'Enterprise B2B', 'Analytics Telemetry'],
    bio: 'Joining on Nov 1! Preparing workspace, IT provisioning, and onboarding roadmap.',
    transitionChecklist: [
      { id: 'chk-1', title: 'Provision Corporate Google Workspace & Slack', category: 'it', completed: true, dueDate: '2026-10-25', assigneeRole: 'IT Admin' },
      { id: 'chk-2', title: 'Ship Apple MacBook Pro M3 Max & Security YubiKey', category: 'it', completed: true, dueDate: '2026-10-26', assigneeRole: 'IT Admin' },
      { id: 'chk-3', title: 'Schedule Day 1 Buddy Welcome Session with Mateo Silva', category: 'manager', completed: false, dueDate: '2026-10-31', assigneeRole: 'Manager' },
      { id: 'chk-4', title: 'Execute Confidentiality & IP Assignment Agreement', category: 'compliance', completed: true, dueDate: '2026-10-20', assigneeRole: 'Legal' },
      { id: 'chk-5', title: 'Enroll in Global Health & Pension Benefits Portal', category: 'hr', completed: false, dueDate: '2026-11-05', assigneeRole: 'HR Partner' }
    ]
  },
  {
    id: 'emp-015',
    employeeCode: 'EMP-0215',
    firstName: 'Liam',
    lastName: 'O\'Connor',
    email: 'liam.oconnor@contractors.aura-os.internal',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    pronouns: 'he/him',
    departmentId: 'dept-eng',
    roleId: 'role-contractor',
    managerId: 'emp-007',
    jobTitle: 'Database Performance Specialist',
    employmentType: 'contractor',
    workMode: 'remote',
    status: 'active',
    timezone: 'Europe/Dublin (UTC+1)',
    hireDate: '2024-05-15',
    attendanceStatus: 'clocked_in_remote',
    skills: ['Query Optimization', 'PostgreSQL Internals', 'Index Tuning'],
    bio: 'Contract specialist auditing high-volume audit logs and timesheet partition schemes.'
  },
  {
    id: 'emp-016',
    employeeCode: 'EMP-0099',
    firstName: 'Zoe',
    lastName: 'Vandenberg',
    email: 'zoe.vandenberg@aura-os.internal',
    avatarUrl: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=150&auto=format&fit=crop&q=80',
    pronouns: 'she/her',
    departmentId: 'dept-peop',
    roleId: 'role-employee',
    managerId: 'emp-003',
    jobTitle: 'Former Talent Lead',
    employmentType: 'full_time',
    workMode: 'remote',
    status: 'alumni',
    timezone: 'Europe/Amsterdam (UTC+2)',
    hireDate: '2022-03-01',
    terminatedAt: '2024-08-31',
    attendanceStatus: 'off_duty',
    skills: ['Talent Sourcing', 'Employer Brand', 'Executive Search'],
    bio: 'Alumna. Transitioned to founding a talent advisory studio. Continues as an active community mentor.'
  }
];

export const initialSensitiveData: Record<string, EmployeeSensitiveData> = {
  'emp-001': {
    employeeId: 'emp-001',
    baseSalary: 285000,
    currency: 'USD',
    payFrequency: 'monthly',
    bonusTargetPercent: 30,
    equityGrantUnits: 1250000,
    taxIdEncrypted: 'US-SSN-***-**-8491',
    bankAccountLast4: '4192',
    homeAddress: '142 Berkeley Square, Mayfair, London W1J 6BQ, UK',
    emergencyContact: {
      name: 'Julian Kaufman',
      relationship: 'Partner',
      phone: '+44 7700 900142',
      email: 'julian.k@private.com'
    }
  },
  'emp-002': {
    employeeId: 'emp-002',
    baseSalary: 215000,
    currency: 'EUR',
    payFrequency: 'monthly',
    bonusTargetPercent: 25,
    equityGrantUnits: 420000,
    taxIdEncrypted: 'DE-STEUER-***-**-3390',
    bankAccountLast4: '8814',
    homeAddress: 'Kastanienallee 44, 10119 Berlin, Germany',
    emergencyContact: {
      name: 'Katja Vance',
      relationship: 'Spouse',
      phone: '+49 151 2345678',
      email: 'katja.vance@inbox.de'
    }
  },
  'emp-003': {
    employeeId: 'emp-003',
    baseSalary: 185000,
    currency: 'USD',
    payFrequency: 'bi-weekly',
    bonusTargetPercent: 20,
    equityGrantUnits: 280000,
    taxIdEncrypted: 'US-SSN-***-**-6214',
    bankAccountLast4: '9021',
    homeAddress: '78 Franklin St, New York, NY 10013, USA',
    emergencyContact: {
      name: 'David Chen',
      relationship: 'Brother',
      phone: '+1 212 555 0199',
      email: 'dchen@domain.org'
    }
  },
  'emp-007': {
    employeeId: 'emp-007',
    baseSalary: 172000,
    currency: 'EUR',
    payFrequency: 'monthly',
    bonusTargetPercent: 18,
    equityGrantUnits: 165000,
    taxIdEncrypted: 'DE-STEUER-***-**-7712',
    bankAccountLast4: '3049',
    homeAddress: 'Oranienstraße 185, 10999 Berlin, Germany',
    emergencyContact: {
      name: 'Oleg Rostov',
      relationship: 'Father',
      phone: '+49 160 9988776',
      email: 'oleg.rostov@familymail.de'
    }
  },
  'emp-008': {
    employeeId: 'emp-008',
    baseSalary: 148000,
    currency: 'USD',
    payFrequency: 'bi-weekly',
    bonusTargetPercent: 15,
    equityGrantUnits: 95000,
    taxIdEncrypted: 'US-SSN-***-**-4458',
    bankAccountLast4: '1182',
    homeAddress: '345 Flatbush Ave, Brooklyn, NY 11217, USA',
    emergencyContact: {
      name: 'Carmen Rivera',
      relationship: 'Mother',
      phone: '+1 718 555 3829',
      email: 'carmen.rivera@brooklyn.net'
    }
  }
};

export const initialEmploymentHistory: EmploymentHistoryMilestone[] = [
  {
    id: 'hist-001',
    employeeId: 'emp-007',
    changeType: 'promotion',
    title: 'Promoted to Staff Infrastructure Lead',
    description: 'Promoted from Senior SRE in recognition of architecting zero-downtime multi-region database failover.',
    changedBy: 'Marcus Vance',
    previousValue: 'Senior SRE (€145,000)',
    newValue: 'Staff Infrastructure Lead (€172,000, +18.6% Base)',
    effectiveDate: '2026-03-01',
    createdAt: '2026-02-20T14:32:00Z'
  },
  {
    id: 'hist-002',
    employeeId: 'emp-007',
    changeType: 'transfer',
    title: 'Transferred to Core Platform Squad',
    description: 'Transitioned reporting line from Dev-Ops Foundation into Core Platform under Marcus Vance.',
    changedBy: 'Sarah Chen',
    previousValue: 'Infrastructure Foundation',
    newValue: 'Core Platform & Engineering',
    effectiveDate: '2025-01-15',
    createdAt: '2025-01-10T09:15:00Z'
  },
  {
    id: 'hist-003',
    employeeId: 'emp-008',
    changeType: 'compensation',
    title: 'Annual Market Merit Adjustment',
    description: 'Merit calibration for top quartile on-call reliability and incident containment.',
    changedBy: 'Elena Rostova',
    previousValue: '$135,000',
    newValue: '$148,000 (+9.6%)',
    effectiveDate: '2026-01-01',
    createdAt: '2025-12-18T11:00:00Z'
  },
  {
    id: 'hist-004',
    employeeId: 'emp-002',
    changeType: 'promotion',
    title: 'Promoted to VP of Platform Engineering',
    description: 'Appointed to executive team leading 65+ engineers across global hubs.',
    changedBy: 'Devon Kaufman',
    previousValue: 'Director of Engineering',
    newValue: 'VP of Platform Engineering',
    effectiveDate: '2024-04-01',
    createdAt: '2024-03-20T16:00:00Z'
  }
];

export const initialAttendanceLogs: AttendancePunchLog[] = [
  // Elena Rostova (EMP-0142)
  {
    id: 'punch-001',
    employeeId: 'emp-007',
    date: '2026-10-19', // Monday
    clockIn: '2026-10-19T08:58:00Z',
    clockOut: '2026-10-19T17:15:00Z',
    breakMinutes: 45,
    workLocation: 'office',
    status: 'completed',
    totalHours: 7.5,
    notes: 'Completed sprint capacity planning and architecture review.'
  },
  {
    id: 'punch-002',
    employeeId: 'emp-007',
    date: '2026-10-20', // Tuesday
    clockIn: '2026-10-20T09:04:00Z',
    clockOut: '2026-10-20T17:45:00Z',
    breakMinutes: 30,
    workLocation: 'office',
    status: 'completed',
    totalHours: 8.2,
    notes: 'Onsite pairing on recursive CTE query optimizations.'
  },
  {
    id: 'punch-003',
    employeeId: 'emp-007',
    date: '2026-10-21', // Wednesday (Today)
    clockIn: '2026-10-21T08:52:00Z',
    clockOut: null,
    breakMinutes: 0,
    workLocation: 'office',
    status: 'active',
    totalHours: 4.8,
    notes: 'Currently in office'
  },
  // Alex Rivera (EMP-0143) - Missing out punch yesterday anomaly!
  {
    id: 'punch-004',
    employeeId: 'emp-008',
    date: '2026-10-19',
    clockIn: '2026-10-19T13:00:00Z',
    clockOut: '2026-10-19T21:30:00Z',
    breakMinutes: 45,
    workLocation: 'remote',
    status: 'completed',
    totalHours: 7.75
  },
  {
    id: 'punch-005',
    employeeId: 'emp-008',
    date: '2026-10-20', // Missing punch anomaly overnight!
    clockIn: '2026-10-20T13:05:00Z',
    clockOut: null,
    breakMinutes: 0,
    workLocation: 'remote',
    status: 'missing_out_punch',
    totalHours: 19.5, // Flags overnight > 14h open shift
    notes: 'Shift exceeded 14h without clock-out.',
    disputeReason: 'Forgot to punch out after late-night client deployment — actual end time was 18:15 EST.',
    suggestedClockOut: '2026-10-20T22:15:00Z'
  },
  // Devon Kaufman (CEO)
  {
    id: 'punch-006',
    employeeId: 'emp-001',
    date: '2026-10-21',
    clockIn: '2026-10-21T08:00:00Z',
    clockOut: null,
    breakMinutes: 15,
    workLocation: 'office',
    status: 'active',
    totalHours: 5.2
  },
  // Sarah Chen
  {
    id: 'punch-007',
    employeeId: 'emp-003',
    date: '2026-10-21',
    clockIn: '2026-10-21T12:30:00Z',
    clockOut: null,
    breakMinutes: 0,
    workLocation: 'remote',
    status: 'active',
    totalHours: 3.5
  }
];

export const initialLeaveRequests: LeaveRequest[] = [
  {
    id: 'leave-001',
    employeeId: 'emp-007', // Elena Rostova (Staff Lead)
    approverId: 'emp-002', // Marcus Vance
    leaveType: 'pto',
    startDate: '2026-10-22',
    endDate: '2026-10-24',
    daysCount: 3,
    status: 'pending',
    reason: 'Attending European Cloud Architecture Summit + 1 personal recharge day.',
    reviewerNotes: 'Checking squad coverage.'
  },
  {
    id: 'leave-002',
    employeeId: 'emp-008', // Alex Rivera (DevOps / SRE) -> CLASH with Elena in same squad!
    approverId: 'emp-007', // Elena Rostova
    leaveType: 'pto',
    startDate: '2026-10-22',
    endDate: '2026-10-25',
    daysCount: 4,
    status: 'pending',
    reason: 'Family wedding and travel in upstate NY.',
    reviewerNotes: 'Overlaps with Elena Rostova summit absence.'
  },
  {
    id: 'leave-003',
    employeeId: 'emp-013', // Lucas Moreau (DevOps) - Already on approved leave!
    approverId: 'emp-007',
    leaveType: 'pto',
    startDate: '2026-10-18',
    endDate: '2026-10-26',
    daysCount: 7,
    status: 'approved',
    reason: 'Pre-scheduled annual family vacation.',
    reviewedAt: '2026-10-05T10:00:00Z'
  },
  {
    id: 'leave-004',
    employeeId: 'emp-010', // Chloe Dupont
    approverId: 'emp-004',
    leaveType: 'sick',
    startDate: '2026-10-21',
    endDate: '2026-10-21',
    daysCount: 1,
    status: 'approved',
    reason: 'Migraine recovery.',
    reviewedAt: '2026-10-21T07:30:00Z'
  }
];

export const initialDelegations: ActingDelegation[] = [
  {
    id: 'del-001',
    managerId: 'emp-002', // Marcus Vance
    actingManagerId: 'emp-007', // Elena Rostova
    startDate: '2026-11-10',
    endDate: '2026-11-20',
    reason: 'Annual silent meditation retreat in Norway.',
    isActive: false,
    delegatedScopes: ['leave:approve', 'timesheet:signoff', 'acting:manager_authority']
  }
];

export const initialDocuments: Record<string, EmployeeDocument[]> = {
  'emp-007': [
    {
      id: 'doc-001',
      name: 'German Blue Card EU Residence Permit.pdf',
      type: 'visa',
      uploadDate: '2024-02-10',
      expiryDate: '2026-11-30', // Expiring in ~40 days alert!
      fileSize: '2.4 MB',
      status: 'expiring_soon'
    },
    {
      id: 'doc-002',
      name: 'Employment Contract & Confidentiality Deed.pdf',
      type: 'contract',
      uploadDate: '2023-02-14',
      fileSize: '1.8 MB',
      status: 'valid'
    },
    {
      id: 'doc-003',
      name: 'AWS Certified Solutions Architect Professional.pdf',
      type: 'certification',
      uploadDate: '2025-06-18',
      expiryDate: '2028-06-18',
      fileSize: '840 KB',
      status: 'valid'
    }
  ],
  'emp-008': [
    {
      id: 'doc-004',
      name: 'US W-4 Tax Withholding Certificate 2026.pdf',
      type: 'tax',
      uploadDate: '2026-01-05',
      fileSize: '410 KB',
      status: 'valid'
    },
    {
      id: 'doc-005',
      name: 'Standard NDA & IP Assignment Agreement.pdf',
      type: 'nda',
      uploadDate: '2023-06-01',
      fileSize: '920 KB',
      status: 'valid'
    }
  ]
};

export const initialAuditLogs: AuditLogEntry[] = [
  {
    id: 'audit-001',
    actorId: 'emp-001',
    actorName: 'Devon Kaufman',
    action: 'PII_REVEAL',
    targetEmployeeId: 'emp-007',
    targetEmployeeName: 'Elena Rostova',
    field: 'base_salary, equity_grant',
    timestamp: '2026-10-21T07:45:12Z',
    ipAddress: '192.168.1.104',
    details: 'Viewed compensation card in 360° Profile Inspector during executive salary calibration.'
  },
  {
    id: 'audit-002',
    actorId: 'emp-003',
    actorName: 'Sarah Chen',
    action: 'ROLE_CHANGE',
    targetEmployeeId: 'emp-007',
    targetEmployeeName: 'Elena Rostova',
    field: 'role_id',
    timestamp: '2026-10-18T16:20:00Z',
    ipAddress: '10.0.4.52',
    details: 'Elevated role to Team Manager with direct reports scope.'
  },
  {
    id: 'audit-003',
    actorId: 'emp-002',
    actorName: 'Marcus Vance',
    action: 'MANAGER_REPARENT',
    targetEmployeeId: 'emp-009',
    targetEmployeeName: 'Siddharth Patel',
    field: 'manager_id',
    timestamp: '2026-10-10T11:15:30Z',
    ipAddress: '192.168.2.14',
    details: 'Reassigned manager from Marcus Vance to Elena Rostova.'
  }
];

export const initialBurnoutSignals: BurnoutRiskSignal[] = [
  {
    employeeId: 'emp-008',
    employeeName: 'Alex Rivera',
    departmentName: 'Core Platform & Engineering',
    consecutiveOvertimeWeeks: 3,
    averageWeeklyHours: 48.6,
    unutilizedPtoDays: 18,
    skippedBreaksCount: 6,
    riskLevel: 'high',
    recommendation: 'Consecutive on-call weeks with zero breaks logged. Recommend mandatory rest days.'
  },
  {
    employeeId: 'emp-011',
    employeeName: 'Kaito Tanaka',
    departmentName: 'Core Platform & Engineering',
    consecutiveOvertimeWeeks: 2,
    averageWeeklyHours: 45.2,
    unutilizedPtoDays: 22,
    skippedBreaksCount: 4,
    riskLevel: 'moderate',
    recommendation: 'High unutilized PTO balance with 10h+ shift clusters across Tokyo timezone.'
  }
];
