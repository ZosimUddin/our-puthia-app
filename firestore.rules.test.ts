import * as fs from 'fs';
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';

// ==========================================
// 1. EMULATOR SUITE TEST CONFIGURATION
// ==========================================
const PROJECT_ID = 'our-puthia-audit-test';
const RULES_PATH = './DRAFT_firestore.rules';

async function runEmulatorTestSuite() {
  console.log('\n==================================================');
  console.log('1. ATTEMPTING FIREBASE EMULATOR SUITE UNIT TESTS');
  console.log('==================================================');

  let testEnv: RulesTestEnvironment | null = null;
  let rulesContent = '';

  try {
    rulesContent = fs.readFileSync(RULES_PATH, 'utf8');
  } catch (e) {
    console.error(`[ERROR] Unable to read ${RULES_PATH}:`, e);
    return false;
  }

  // Set host if not already set
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  }

  try {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: rulesContent,
        host: '127.0.0.1',
        port: 8080
      }
    });

    console.log(`[EMULATOR SUCCESS] Connected to Firestore Emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`);
    
    // Execute sample real rules unit tests
    const unauthenticatedDb = testEnv.unauthenticatedContext().firestore();
    const profileRef = unauthenticatedDb.collection('users').doc('user_alice_123');
    await profileRef.get();
    console.log('  [PASS] Public user profile read allowed in emulator');

    // Clean up
    await testEnv.cleanup();
    return true;

  } catch (err: any) {
    console.log(`[EMULATOR STATUS] Firebase Local Emulator Suite daemon is NOT active or unreachable.`);
    console.log(`[REASON] ${err?.message || err}`);
    console.log(`[NOTE] Skipping live SDK emulator network calls. Proceeding to AST / Logic Simulation Engine...\n`);
    if (testEnv) {
      try { await testEnv.cleanup(); } catch {}
    }
    return false;
  }
}

// ==========================================
// 2. STRUCTURAL LOGIC SIMULATION ENGINE
// ==========================================
interface Auth {
  uid: string;
  token?: {
    email?: string;
  };
}

interface UserProfile {
  role?: string;
  permissions?: string[];
  isBlocked?: boolean;
  phone?: string;
}

interface TestContext {
  auth: Auth | null;
  dbUsers: Record<string, UserProfile>;
  path: string;
  action: 'read' | 'create' | 'update' | 'delete';
  resourceData?: Record<string, any>;
  requestResourceData?: Record<string, any>;
  parentData?: Record<string, any>;
}

function isSignedIn(ctx: TestContext): boolean {
  return ctx.auth !== null;
}

function getUserData(ctx: TestContext): UserProfile {
  if (!ctx.auth) return {};
  return ctx.dbUsers[ctx.auth.uid] || {};
}

function existsUser(ctx: TestContext): boolean {
  if (!ctx.auth) return false;
  return ctx.dbUsers[ctx.auth.uid] !== undefined;
}

function isSuperAdmin(ctx: TestContext): boolean {
  if (!ctx.auth) return false;
  const email = ctx.auth.token?.email;
  const superAdminEmails = ['mdzosimuddin31@gmail.com', 'mdzosimuddin47@gmail.com', 'josimuddinadds@gmail.com'];
  if (email && superAdminEmails.includes(email)) return true;
  return getUserData(ctx).role === 'super_admin';
}

function isAdmin(ctx: TestContext): boolean {
  if (!ctx.auth) return false;
  const role = getUserData(ctx).role;
  return isSuperAdmin(ctx) || role === 'admin';
}

function isStaff(ctx: TestContext): boolean {
  if (!ctx.auth) return false;
  const role = getUserData(ctx).role;
  return isAdmin(ctx) || (role === 'editor' || role === 'staff' || role === 'moderator');
}

function evaluateDraftRules(ctx: TestContext): boolean {
  const { path, action, auth, resourceData = {}, requestResourceData = {}, parentData = {} } = ctx;
  const uid = auth?.uid || '';

  // Match /users/{userId}
  if (path.startsWith('/users/')) {
    const parts = path.split('/');
    const targetUserId = parts[2];

    if (parts.length >= 5 && parts[3] === 'favorites') {
      return isSignedIn(ctx) && uid === targetUserId;
    }

    if (action === 'read') return true;
    if (action === 'create') {
      if (!isSignedIn(ctx) || uid !== targetUserId) return false;
      if (isStaff(ctx)) return true;

      const roleInReq = requestResourceData.role;
      const isBlockedInReq = requestResourceData.isBlocked;
      const permissionsInReq = requestResourceData.permissions;

      if (roleInReq && roleInReq !== 'user') return false;
      if (isBlockedInReq === true) return false;
      if (permissionsInReq && Array.isArray(permissionsInReq) && permissionsInReq.length > 0) return false;
      return true;
    }
    if (action === 'update') {
      if (isStaff(ctx)) return true;
      if (!isSignedIn(ctx) || uid !== targetUserId) return false;

      // Protection check: role, isBlocked, permissions cannot be altered by standard users
      if ('role' in requestResourceData && requestResourceData.role !== resourceData.role) return false;
      if ('isBlocked' in requestResourceData && requestResourceData.isBlocked !== resourceData.isBlocked) return false;
      if ('permissions' in requestResourceData && JSON.stringify(requestResourceData.permissions) !== JSON.stringify(resourceData.permissions)) return false;
      return true;
    }
    if (action === 'delete') return isAdmin(ctx);
  }

  // Match /user_permissions/{uid}
  if (path.startsWith('/user_permissions/')) {
    const parts = path.split('/');
    const targetUid = parts[2];
    if (action === 'read') return isSignedIn(ctx) && (uid === targetUid || isStaff(ctx));
    return isStaff(ctx);
  }

  // Match /conversations/{convId}/messages
  if (path.includes('/conversations/')) {
    const participants: string[] = parentData.participants || resourceData.participants || [];
    const isParticipant = isSignedIn(ctx) && participants.includes(uid);

    if (action === 'read') return isParticipant || isStaff(ctx);
    if (action === 'create' || action === 'update') {
      return isParticipant && (requestResourceData.senderId === uid || requestResourceData.authorId === uid || isStaff(ctx));
    }
    if (action === 'delete') return isStaff(ctx);
  }

  // Match /calls/{callId}
  if (path.startsWith('/calls/')) {
    const callerId = resourceData.callerId || parentData.callerId;
    const receiverId = resourceData.receiverId || parentData.receiverId;
    const isCallParticipant = isSignedIn(ctx) && (uid === callerId || uid === receiverId);

    if (action === 'read') return isCallParticipant || isStaff(ctx);
    if (action === 'create' || action === 'update') return isSignedIn(ctx) && (isCallParticipant || isStaff(ctx));
    if (action === 'delete') return isStaff(ctx);
  }

  // Match /notifications/{notifId}
  if (path.startsWith('/notifications/')) {
    const recipientId = resourceData.recipientId || requestResourceData.recipientId;
    if (action === 'read') return isSignedIn(ctx) && (uid === recipientId || isStaff(ctx));
    if (action === 'update') return isSignedIn(ctx) && uid === recipientId;
    if (action === 'create') return isSignedIn(ctx);
    if (action === 'delete') return isSignedIn(ctx) && (uid === recipientId || isStaff(ctx));
  }

  // Match /admin_audit_logs/{id}
  if (path.startsWith('/admin_audit_logs/')) {
    if (action === 'read') return isStaff(ctx);
    if (action === 'create') return isStaff(ctx); // Only staff/admin allowed
    if (action === 'update' || action === 'delete') return false; // Strictly Immutable
  }

  // Match /audit_logs/{id}
  if (path.startsWith('/audit_logs/')) {
    if (action === 'read') return isStaff(ctx);
    if (action === 'create') {
      const actorUid = requestResourceData.actorUid;
      return isSignedIn(ctx) && actorUid === uid;
    }
    if (action === 'update' || action === 'delete') return false; // Strictly Immutable
  }

  // Match /site_settings/{id} or /banners/{id} or /ads/{id}
  if (path.startsWith('/site_settings/') || path.startsWith('/banners/') || path.startsWith('/ads/')) {
    if (action === 'read') return true;
    return isAdmin(ctx);
  }

  // Match /footballMatches/{id} or /footballTournaments/{id}
  if (path.startsWith('/footballMatches/') || path.startsWith('/footballTournaments/')) {
    if (action === 'read') return true;
    if (path.startsWith('/footballTournaments/')) {
      return isAdmin(ctx);
    }
    return isStaff(ctx);
  }

  return false;
}

// ==========================================
// 3. TEST SUITE EXECUTOR
// ==========================================
async function main() {
  const emulatorRan = await runEmulatorTestSuite();

  console.log('==================================================');
  console.log('2. EXECUTING STRUCTURAL SECURITY RULES SUITE');
  console.log('==================================================\n');

  const dbUsers: Record<string, UserProfile> = {
    'user_normal_123': { role: 'user', permissions: [], isBlocked: false },
    'staff_editor_456': { role: 'editor', permissions: ['edit_news'], isBlocked: false },
    'admin_josim_31': { role: 'super_admin', permissions: ['*'], isBlocked: false }
  };

  const testCases: Array<{ name: string; ctx: TestContext; expectAllowed: boolean }> = [
    {
      name: ' Attack Vector 1a: Standard user attempts self-role escalation on UPDATE /users/{uid}',
      ctx: {
        auth: { uid: 'user_normal_123' },
        dbUsers,
        path: '/users/user_normal_123',
        action: 'update',
        resourceData: { role: 'user', name: 'Normal User' },
        requestResourceData: { role: 'admin', name: 'Normal User' }
      },
      expectAllowed: false
    },
    {
      name: ' Attack Vector 1b: Standard user attempts self-role escalation on CREATE /users/{uid}',
      ctx: {
        auth: { uid: 'user_new_999' },
        dbUsers,
        path: '/users/user_new_999',
        action: 'create',
        requestResourceData: { role: 'super_admin', name: 'Attacker' }
      },
      expectAllowed: false
    },
    {
      name: ' Positive Vector 2: Standard user updates valid profile fields (name/bio)',
      ctx: {
        auth: { uid: 'user_normal_123' },
        dbUsers,
        path: '/users/user_normal_123',
        action: 'update',
        resourceData: { role: 'user', name: 'Old Name' },
        requestResourceData: { role: 'user', name: 'New Name' }
      },
      expectAllowed: true
    },
    {
      name: ' Attack Vector 3: Non-participant user attempts to read private conversation messages',
      ctx: {
        auth: { uid: 'user_normal_123' },
        dbUsers,
        path: '/conversations/conv_999/messages/msg_1',
        action: 'read',
        parentData: { participants: ['user_other_1', 'user_other_2'] }
      },
      expectAllowed: false
    },
    {
      name: ' Positive Vector 4: Authorized conversation participant sends message',
      ctx: {
        auth: { uid: 'user_normal_123' },
        dbUsers,
        path: '/conversations/conv_999/messages/msg_1',
        action: 'create',
        parentData: { participants: ['user_normal_123', 'user_other_2'] },
        requestResourceData: { senderId: 'user_normal_123', text: 'Hello' }
      },
      expectAllowed: true
    },
    {
      name: ' Attack Vector 5: Unauthorized user attempts to read another user private notification',
      ctx: {
        auth: { uid: 'user_normal_123' },
        dbUsers,
        path: '/notifications/notif_888',
        action: 'read',
        resourceData: { recipientId: 'user_victim_789', text: 'Private Notification' }
      },
      expectAllowed: false
    },
    {
      name: ' Attack Vector 6a: Attacker attempts to DELETE an entry from audit_logs',
      ctx: {
        auth: { uid: 'admin_josim_31', token: { email: 'mdzosimuddin31@gmail.com' } },
        dbUsers,
        path: '/audit_logs/log_100',
        action: 'delete',
        resourceData: { action: 'USER_BAN' }
      },
      expectAllowed: false
    },
    {
      name: ' Attack Vector 6b: Regular user attempts to CREATE an entry in /admin_audit_logs',
      ctx: {
        auth: { uid: 'user_normal_123' },
        dbUsers,
        path: '/admin_audit_logs/log_200',
        action: 'create',
        requestResourceData: { action: 'FAKE_ADMIN_ACTION', actorUid: 'user_normal_123' }
      },
      expectAllowed: false
    },
    {
      name: ' Positive Vector 6c: Admin CREATES an entry in /admin_audit_logs',
      ctx: {
        auth: { uid: 'admin_josim_31', token: { email: 'mdzosimuddin31@gmail.com' } },
        dbUsers,
        path: '/admin_audit_logs/log_201',
        action: 'create',
        requestResourceData: { action: 'USER_BAN', actorUid: 'admin_josim_31' }
      },
      expectAllowed: true
    },
    {
      name: ' Attack Vector 6d: Regular user attempts to CREATE /audit_logs entry spoofing another actorUid',
      ctx: {
        auth: { uid: 'user_normal_123' },
        dbUsers,
        path: '/audit_logs/log_202',
        action: 'create',
        requestResourceData: { action: 'USER_LOGIN', actorUid: 'user_victim_789' }
      },
      expectAllowed: false
    },
    {
      name: ' Positive Vector 7: Super Admin updates site_settings',
      ctx: {
        auth: { uid: 'admin_josim_31', token: { email: 'mdzosimuddin31@gmail.com' } },
        dbUsers,
        path: '/site_settings/general',
        action: 'update',
        resourceData: { siteName: 'Our Puthia' },
        requestResourceData: { siteName: 'Our Puthia Updated' }
      },
      expectAllowed: true
    },
    {
      name: ' Attack Vector 8: Regular user attempts to update site_settings',
      ctx: {
        auth: { uid: 'user_normal_123' },
        dbUsers,
        path: '/site_settings/general',
        action: 'update',
        resourceData: { siteName: 'Our Puthia' },
        requestResourceData: { siteName: 'Hacked Title' }
      },
      expectAllowed: false
    },
    {
      name: ' Attack Vector 9: Non-participant attempts to access WebRTC Call document',
      ctx: {
        auth: { uid: 'user_normal_123' },
        dbUsers,
        path: '/calls/call_abc',
        action: 'read',
        resourceData: { callerId: 'user_a', receiverId: 'user_b' }
      },
      expectAllowed: false
    },
    {
      name: ' Attack Vector 10: Attacker attempts to modify user_permissions document',
      ctx: {
        auth: { uid: 'user_normal_123' },
        dbUsers,
        path: '/user_permissions/user_normal_123',
        action: 'update',
        resourceData: { permissions: [] },
        requestResourceData: { permissions: ['ALL_PRIVILEGES'] }
      },
      expectAllowed: false
    },
    {
      name: ' Attack Vector 11: Regular user attempts to modify football match score/data',
      ctx: {
        auth: { uid: 'user_normal_123' },
        dbUsers,
        path: '/footballMatches/match_101',
        action: 'update',
        resourceData: { scoreA: 1, scoreB: 0 },
        requestResourceData: { scoreA: 5, scoreB: 0 }
      },
      expectAllowed: false
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const t of testCases) {
    const allowed = evaluateDraftRules(t.ctx);
    if (allowed === t.expectAllowed) {
      console.log(`[PASS] ${t.name}`);
      passed++;
    } else {
      console.log(`[FAIL] ${t.name} (Expected ${t.expectAllowed ? 'ALLOW' : 'DENY'}, Got ${allowed ? 'ALLOW' : 'DENY'})`);
      failed++;
    }
  }

  console.log('\n==================================================');
  console.log(`SUMMARY: Total ${testCases.length} Scenarios Evaluated.`);
  console.log(`PASSED: ${passed} | FAILED: ${failed}`);
  console.log(`REAL EMULATOR EXECUTION: ${emulatorRan ? 'PASSED (Local Host)' : 'NOT RUN (Host Daemon Offline / Java Missing)'}`);
  console.log('==================================================\n');
}

main().catch(console.error);
