# Design System Specification: Multi-User Auth & Access Governance Suite (Stitch.md)

An enterprise-grade UI design specification and component library for high-trust Multi-User Authentication, Granular Role-Based Access Control (RBAC/PBAC), and Account Recovery.

---

## 1. Visual Identity & Aesthetic Principles

* **Design Language:** High-trust security minimalism (combining the architectural clarity of 1Password and Clerk with the speed and utility of Linear). Crisp borders, tactile form elements, and high-contrast status feedback.
* **Psychological Safety & Reassurance:** Visual chrome reinforces protection. Use subdued surface tones, unambiguous error messages, and immediate affirmative feedback on credential submission.
* **Density & Hierarchy:** Generous white space for authentication and recovery forms to prevent input errors; dense, information-rich tables for team permissions and active session monitoring.

---

## 2. Design Tokens

### Color Palette
* **Canvas Primary:** `#FFFFFF` (Pristine Light) / `#0A0B0D` (Vault Dark)
* **Surface Secondary (Sidebar/Cards):** `#F8FAFC` (Light) / `#121418` (Dark)
* **Surface Elevated (Modals/Popovers):** `#FFFFFF` (Light) / `#1A1D23` (Dark)
* **Border / Dividers:** `#E2E8F0` (Light) / `#252932` (Dark)
* **Text Primary:** `#0F172A` (Light) / `#F8FAFC` (Dark)
* **Text Muted:** `#64748B` (Light) / `#8F97A6` (Dark)
* **Brand Focus / Action:** `#2563EB` (Cobalt Trust) / `#3B82F6` (Electric Blue Dark)

### Role Accent Badges
* **Owner:** Border `#7C3AED`, Text `#7C3AED`, Fill `rgba(124, 58, 237, 0.08)` (Royal Violet)
* **Admin:** Border `#2563EB`, Text `#2563EB`, Fill `rgba(37, 99, 235, 0.08)` (Cobalt Primary)
* **Manager:** Border `#0D9488`, Text `#0D9488`, Fill `rgba(13, 148, 136, 0.08)` (Teal Focus)
* **Member:** Border `#10B981`, Text `#10B981`, Fill `rgba(16, 185, 129, 0.08)` (Emerald Pure)
* **Viewer / Auditor:** Border `#64748B`, Text `#64748B`, Fill `rgba(100, 116, 139, 0.08)` (Neutral Slate)

### Security States & Feedback
* **Critical / Revoked / Danger:** `#EF4444` (Crimson Hazard) / `rgba(239, 68, 68, 0.1)`
* **Warning / Expiring / Cooldown:** `#F59E0B` (Amber Warning) / `rgba(245, 158, 11, 0.1)`
* **Active / Verified / Strong:** `#10B981` (Emerald Check) / `rgba(16, 185, 129, 0.1)`

### Typography
* **UI Labels & Headers:** `Inter`, `-apple-system`, sans-serif (13px to 15px, tracking `-0.01em`).
* **Display Titles:** `Plus Jakarta Sans` or `Inter Display`, 24px to 32px, Semi-Bold (`font-semibold`).
* **Security Codes, Tokens & IPs:** `JetBrains Mono` or tabular `Inter` (12px to 13px, fixed-width figures for IP addresses, dates, and verification codes).

---

## 3. Core Screen Blueprints

### A. Split-Screen Authentication Canvas (`/login`, `/register`)
* **Left Presentation Rail (45% width, Desktop):**
  * Deep atmospheric slate background (`#0B0F19`) with a subtle cryptographic grid overlay (`crypto-grid`).
  * Wordmark with an animated security shield glyph (`AegisIAM`).
  * Customer trust card: Quote, avatar, and security compliance pills (`SOC-2 Type II Certified`, `End-to-End Encrypted`).
* **Right Interactive Stage (55% width, Centered `max-w-md`):**
  * Header: Contextual headline (`"Welcome back"` / `"Create your workspace account"`).
  * Form Deck:
    * Work email input with auto-trimming and instant format verification.
    * Password field with an interactive reveal toggle and capslock warning indicator.
    * Utility row: "Remember this device for 30 days" checkbox + "Forgot password?" link.
    * Primary CTA: Full-width button (`bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-all`).
  * SSO Divider: Subdued text `"Or continue with"` followed by GitHub and Google OAuth button grid.

### B. Self-Service Password Recovery Tunnel (`/forgot-password`, `/reset-password`)
* **Step 1: Recovery Request Form:**
  * Clean, distraction-free centered card (`max-w-md mx-auto mt-20 p-8 rounded-2xl border border-divider shadow-lg`).
  * Headline: *"Reset your password"*, followed by explanatory subtext.
  * Email input with instant submit trigger.
  * Anti-enumeration guarantee notice.
* **Step 2: Check Your Inbox Interstitial:**
  * Centered confirmation icon (animated envelope with checkmark badge).
  * Clarifying subtext: *"We sent a recovery link to user@domain.com if an account exists."*
  * Mailbox shortcuts: Dual action pills: `[ Open Gmail ↗ ]` and `[ Open Outlook ↗ ]`.
  * Resend Section: Circular timer pill showing cooldown (`"Resend available in 48s"`).
  * In-App Simulated Mailbox Drawer for rapid local testing without leaving context.
* **Step 3: New Password Creation Stage:**
  * Token-validated view showing target email badge.
  * New password input with real-time **4-Segment Entropy Bar**:
    * Segment 1 (Weak): Red fill (`#EF4444`).
    * Segment 2 (Fair): Orange fill (`#F97316`).
    * Segment 3 (Good): Amber fill (`#F59E0B`).
    * Segment 4 (Strong): Emerald fill (`#10B981`) + *"Vault-grade passphrase"*.
  * Dynamic requirements checklist (length, case, digits, symbols, zero dictionary leaks).
  * Confirm password field with instant match/mismatch indicator icon.
  * Submit action: `"Update Password and Sign In"`.
* **Step 4: Success Celebration:**
  * Animated confirmation glyph with instant redirect to workspace authentication.

### C. Granular Roles & Permissions Governance Matrix (`/settings/access`)
* **Header Ribbon:**
  * Title: `"Team Roles & Capability Matrix"` with an "Invite New Member" primary action button.
  * Role Selector Tabs: Horizontal pills for `Owner`, `Admin`, `Manager`, `Member`, `Auditor`, and any custom roles.
* **Permissions Matrix Table:**
  * Grouped by Domain: `Workspaces & Projects`, `Team & Access Management`, `Billing & Invoicing`, `Audit & Security Logs`.
  * Table Columns:
    * Column 1: Permission capability name + plain-language explanation (e.g., `"Delete Projects: Permanently erase workspaces and data"`).
    * Column 2 to 6: Toggle switches corresponding to each role, indicating enabled or disabled states.
    * Tooltip on locked system permissions: *"Owner permissions cannot be revoked"*.
* **Custom Role Drawer:**
  * Slide-over sheet to create custom roles, specify role name, select parent template to inherit from, and pick specific scopes.

### D. Active Sessions & Security Audit Cockpit (`/settings/security`)
* **Active Devices & Sessions Module:**
  * List of active sessions grouped by "Current Session" vs. "Other Connected Devices".
  * Session Card Anatomy:
    * Left: Device icon (Laptop, Smartphone, Tablet) with an active green pulse dot.
    * Center: Browser name and OS (e.g., `"Chrome 128 on macOS Sonoma"`), IP address badge (`192.0.2.14`), and location (`"San Francisco, US • Active right now"`).
    * Right: Action button (`"Revoke Session"`).
  * Global Kill Switch: Destructive secondary button at the top right: `"Sign Out of All Other Devices"`.
* **Security Event Timeline:**
  * Compact audit stream: Event name (`"Password Reset Completed"`, `"New Login from Berlin, DE"`), actor tag, IP address, and relative timestamp (`"12m ago"`).
  * Filter chips: `ALL`, `LOGINS`, `SECURITY`, `REVOCATIONS`.
  * One-click export to SIEM JSON format.

---

## 4. Micro-Interactions & States

1. **Password Entropy Progression:** As the user types into the new password field, the 4-segment meter smoothly animates horizontally (`transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1)`) while the dynamic requirement badges update from muted grey to emerald checkmarks.
2. **Privilege Escalation Warning:** Toggling a critical permission (e.g., `Billing: Erase Payment Method` or `Projects: Delete`) triggers an inline amber caution callout requiring explicit confirmation before committing the mutation, protected by contextual Sudo challenge.
3. **Session Revocation Ejection:** Clicking "Revoke Session" immediately fades the card to 40% opacity with a miniature spinner, slides the element out to the right, and displays an undoable toast confirmation ("Session for Firefox on Windows terminated").
4. **Enumeration Shield Transition:** Submitting the password reset form shows an immediate 300ms button pulse before transitioning into the "Check your inbox" screen without revealing database lookup latency.
5. **Contextual Re-Authentication Challenges (Sudo Mode):** High-risk actions trigger an inline master password prompt that unlocks an elevated token with a 10-minute sliding TTL, without losing dirty form state or navigating away.
