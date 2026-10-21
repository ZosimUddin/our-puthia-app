import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import {
  FootballTournament,
  FootballClub,
  FootballTeam,
  FootballPlayer,
  FootballMatch,
  MatchEvent,
  FootballStandings,
  FootballStandingRow,
  FootballPosterConfig,
  FootballVenue,
  FootballSponsor,
  FootballActivityLog,
  FootballSettings
} from '../types/football';
import { logAuditActivity } from './auditLogger';

// Collection references
export const TOURNAMENTS_COL = 'footballTournaments';
export const CLUBS_COL = 'footballClubs';
export const TEAMS_COL = 'footballTeams';
export const PLAYERS_COL = 'footballPlayers';
export const MATCHES_COL = 'footballMatches';
export const MATCH_EVENTS_COL = 'footballMatchEvents';
export const STANDINGS_COL = 'footballStandings';
export const VENUES_COL = 'footballVenues';
export const SPONSORS_COL = 'footballSponsors';
export const POSTERS_COL = 'footballPosters';
export const ACTIVITY_LOGS_COL = 'footballActivityLogs';
export const SETTINGS_COL = 'footballSettings';

// Helper to log football administrative actions
export async function logFootballActivity(
  action: string,
  entityType: FootballActivityLog['entityType'],
  entityId: string,
  entityName: string,
  details: string,
  changesSummary?: string
) {
  try {
    const user = auth.currentUser;
    const logDoc: FootballActivityLog = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      actorUid: user?.uid || 'system',
      actorEmail: user?.email || 'system@ourputhia.com',
      actorName: user?.displayName || user?.email?.split('@')[0] || 'অ্যাডমিন',
      actorRole: 'admin',
      action,
      entityType,
      entityId,
      entityName,
      details,
      changesSummary,
      createdAt: serverTimestamp()
    };
    await setDoc(doc(db, ACTIVITY_LOGS_COL, logDoc.id), logDoc);

    // Also sync to global audit trail for compliance
    await logAuditActivity({
      action: `FOOTBALL_${action.toUpperCase()}`,
      details: `${entityName}: ${details}`,
      category: 'system',
      severity: 'info',
      targetType: entityType,
      targetId: entityId,
      targetName: entityName
    });
  } catch (err) {
    console.warn('Could not record football activity log:', err);
  }
}

// ==========================================
// 1. TOURNAMENT MANAGEMENT
// ==========================================

export async function getTournaments(): Promise<FootballTournament[]> {
  try {
    const q = query(collection(db, TOURNAMENTS_COL), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FootballTournament));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, TOURNAMENTS_COL);
    return [];
  }
}

export function subscribeTournaments(onData: (data: FootballTournament[]) => void) {
  const q = query(collection(db, TOURNAMENTS_COL), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map(d => ({ id: d.id, ...d.data() } as FootballTournament)));
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, TOURNAMENTS_COL);
    }
  );
}

export async function getTournamentById(id: string): Promise<FootballTournament | null> {
  try {
    const snap = await getDoc(doc(db, TOURNAMENTS_COL, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as FootballTournament;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `${TOURNAMENTS_COL}/${id}`);
    return null;
  }
}

export async function saveTournament(data: Partial<FootballTournament>): Promise<string> {
  try {
    const id = data.id || `trn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const isNew = !data.id;
    const payload = {
      ...data,
      id,
      updatedAt: serverTimestamp(),
      ...(isNew ? { createdAt: serverTimestamp(), createdBy: auth.currentUser?.uid || 'admin' } : {})
    };
    await setDoc(doc(db, TOURNAMENTS_COL, id), payload, { merge: true });

    await logFootballActivity(
      isNew ? 'CREATE_TOURNAMENT' : 'UPDATE_TOURNAMENT',
      'tournament',
      id,
      data.name || 'ফুটবল টুর্নামেন্ট',
      isNew ? 'নতুন টুর্নামেন্ট তৈরি করা হয়েছে' : 'টুর্নামেন্টের তথ্য হালনাগাদ করা হয়েছে'
    );
    return id;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, TOURNAMENTS_COL);
    throw err;
  }
}

export async function deleteTournament(id: string, tournamentName: string): Promise<void> {
  try {
    await deleteDoc(doc(db, TOURNAMENTS_COL, id));
    await logFootballActivity(
      'DELETE_TOURNAMENT',
      'tournament',
      id,
      tournamentName,
      'টুর্নামেন্ট মুছে ফেলা হয়েছে'
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${TOURNAMENTS_COL}/${id}`);
    throw err;
  }
}

// ==========================================
// 2. CLUB AND TEAM MANAGEMENT
// ==========================================

export async function getClubs(): Promise<FootballClub[]> {
  try {
    const q = query(collection(db, CLUBS_COL), orderBy('name', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FootballClub));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, CLUBS_COL);
    return [];
  }
}

export function subscribeClubs(onData: (data: FootballClub[]) => void) {
  const q = query(collection(db, CLUBS_COL), orderBy('name', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map(d => ({ id: d.id, ...d.data() } as FootballClub)));
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, CLUBS_COL);
    }
  );
}

export async function saveClub(data: Partial<FootballClub>): Promise<string> {
  try {
    const id = data.id || `club_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const isNew = !data.id;
    const payload = {
      ...data,
      id,
      updatedAt: serverTimestamp(),
      ...(isNew ? { createdAt: serverTimestamp(), createdBy: auth.currentUser?.uid || 'admin' } : {})
    };
    await setDoc(doc(db, CLUBS_COL, id), payload, { merge: true });
    await logFootballActivity(
      isNew ? 'CREATE_CLUB' : 'UPDATE_CLUB',
      'club',
      id,
      data.name || 'ফুটবল ক্লাব',
      isNew ? 'নতুন ক্লাব নিবন্ধিত হয়েছে' : 'ক্লাবের বিবরণ পরিবর্তন করা হয়েছে'
    );
    return id;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, CLUBS_COL);
    throw err;
  }
}

export async function getTeamsByTournament(tournamentId: string): Promise<FootballTeam[]> {
  try {
    const q = query(collection(db, TEAMS_COL), where('tournamentId', '==', tournamentId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FootballTeam));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, TEAMS_COL);
    return [];
  }
}

export function subscribeTeams(onData: (data: FootballTeam[]) => void, tournamentId?: string) {
  const q = tournamentId 
    ? query(collection(db, TEAMS_COL), where('tournamentId', '==', tournamentId))
    : query(collection(db, TEAMS_COL), orderBy('createdAt', 'desc'));
    
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map(d => ({ id: d.id, ...d.data() } as FootballTeam)));
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, TEAMS_COL);
    }
  );
}

export async function saveTeam(data: Partial<FootballTeam>): Promise<string> {
  try {
    const id = data.id || `team_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const isNew = !data.id;
    const payload = {
      ...data,
      id,
      squadPlayerIds: data.squadPlayerIds || [],
      updatedAt: serverTimestamp(),
      ...(isNew ? { createdAt: serverTimestamp(), createdBy: auth.currentUser?.uid || 'admin' } : {})
    };
    await setDoc(doc(db, TEAMS_COL, id), payload, { merge: true });
    await logFootballActivity(
      isNew ? 'CREATE_TEAM' : 'UPDATE_TEAM',
      'team',
      id,
      data.name || 'দল',
      isNew ? 'নতুন টুর্নামেন্ট টিম যুক্ত করা হয়েছে' : 'টিমের তথ্য আপডেট করা হয়েছে'
    );
    return id;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, TEAMS_COL);
    throw err;
  }
}

// ==========================================
// 3. PLAYER MANAGEMENT & ELIGIBILITY
// ==========================================

export async function getPlayers(): Promise<FootballPlayer[]> {
  try {
    const q = query(collection(db, PLAYERS_COL), orderBy('name', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FootballPlayer));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, PLAYERS_COL);
    return [];
  }
}

export function subscribePlayers(onData: (data: FootballPlayer[]) => void) {
  const q = query(collection(db, PLAYERS_COL), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map(d => ({ id: d.id, ...d.data() } as FootballPlayer)));
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, PLAYERS_COL);
    }
  );
}

export async function savePlayer(data: Partial<FootballPlayer>): Promise<string> {
  try {
    const id = data.id || `plr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const isNew = !data.id;
    const payload = {
      ...data,
      id,
      isActive: data.isActive !== undefined ? data.isActive : true,
      updatedAt: serverTimestamp(),
      ...(isNew ? { createdAt: serverTimestamp(), createdBy: auth.currentUser?.uid || 'admin' } : {})
    };
    await setDoc(doc(db, PLAYERS_COL, id), payload, { merge: true });
    await logFootballActivity(
      isNew ? 'CREATE_PLAYER' : 'UPDATE_PLAYER',
      'player',
      id,
      data.name || 'খেলোয়াড়',
      isNew ? 'নতুন খেলোয়াড় নিবন্ধিত হয়েছে' : 'খেলোয়াড়ের তথ্য পরিবর্তন করা হয়েছে'
    );
    return id;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, PLAYERS_COL);
    throw err;
  }
}

// ==========================================
// 4. MATCH SCHEDULING & CONFLICT DETECTION
// ==========================================

export interface MatchConflict {
  type: 'SAME_TEAM' | 'TEAM_OVERLAP' | 'VENUE_OVERLAP';
  message: string;
}

export async function checkMatchConflicts(
  matchDate: string,
  kickoffTime: string,
  homeTeamId: string,
  awayTeamId: string,
  venueId?: string,
  excludeMatchId?: string
): Promise<MatchConflict[]> {
  const conflicts: MatchConflict[] = [];

  // 1. Same team selected on both sides
  if (homeTeamId && awayTeamId && homeTeamId === awayTeamId) {
    conflicts.push({
      type: 'SAME_TEAM',
      message: 'একই দলকে একই ম্যাচের উভয় পক্ষে (Home ও Away) নির্বাচন করা যাবে না।'
    });
  }

  try {
    // 2. Fetch matches on that same date to detect overlap
    const q = query(collection(db, MATCHES_COL), where('matchDate', '==', matchDate));
    const snap = await getDocs(q);
    const existingMatches = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as FootballMatch))
      .filter(m => m.id !== excludeMatchId && m.status !== 'cancelled');

    for (const em of existingMatches) {
      // Check time overlap (e.g. matches within 90 minutes of kickoff)
      const isSameTime = em.kickoffTime === kickoffTime;

      // Team overlap
      if (isSameTime && (
        em.homeTeamId === homeTeamId || 
        em.awayTeamId === homeTeamId || 
        em.homeTeamId === awayTeamId || 
        em.awayTeamId === awayTeamId
      )) {
        conflicts.push({
          type: 'TEAM_OVERLAP',
          message: `সতর্কতা: ${em.homeTeamName} বনাম ${em.awayTeamName} ম্যাচটি ইতিমধ্যে ${matchDate} তারিখে ${em.kickoffTime} সময়ে নির্ধারিত আছে। একই দলের সময় সংঘর্ষ পাওয়া গেছে।`
        });
      }

      // Venue overlap
      if (venueId && em.venueId === venueId && isSameTime) {
        conflicts.push({
          type: 'VENUE_OVERLAP',
          message: `মাঠ/ভেন্যু সংঘর্ষ: '${em.venueName}' মাঠে ${matchDate} তারিখে ${em.kickoffTime} সময়ে ইতিমধ্যে অন্য ম্যাচ রয়েছে।`
        });
      }
    }
  } catch (err) {
    console.warn('Conflict detection lookup warning:', err);
  }

  return conflicts;
}

export async function getMatches(tournamentId?: string): Promise<FootballMatch[]> {
  try {
    const q = tournamentId 
      ? query(collection(db, MATCHES_COL), where('tournamentId', '==', tournamentId), orderBy('matchDate', 'asc'))
      : query(collection(db, MATCHES_COL), orderBy('matchDate', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FootballMatch));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, MATCHES_COL);
    return [];
  }
}

export function subscribeMatches(onData: (data: FootballMatch[]) => void, tournamentId?: string) {
  const q = tournamentId 
    ? query(collection(db, MATCHES_COL), where('tournamentId', '==', tournamentId))
    : query(collection(db, MATCHES_COL), orderBy('matchDate', 'desc'));

  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map(d => ({ id: d.id, ...d.data() } as FootballMatch)));
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, MATCHES_COL);
    }
  );
}

export async function saveMatch(data: Partial<FootballMatch>): Promise<string> {
  try {
    const id = data.id || `match_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const isNew = !data.id;
    const payload = {
      ...data,
      id,
      homeScore: data.homeScore || 0,
      awayScore: data.awayScore || 0,
      currentMinute: data.currentMinute || 0,
      status: data.status || 'scheduled',
      period: data.period || 'scheduled',
      resultApproved: data.resultApproved !== undefined ? data.resultApproved : false,
      updatedAt: serverTimestamp(),
      ...(isNew ? { createdAt: serverTimestamp(), createdBy: auth.currentUser?.uid || 'admin' } : {})
    };
    await setDoc(doc(db, MATCHES_COL, id), payload, { merge: true });

    await logFootballActivity(
      isNew ? 'CREATE_MATCH' : 'UPDATE_MATCH',
      'match',
      id,
      `${data.homeTeamName || 'দল ১'} বনাম ${data.awayTeamName || 'দল ২'}`,
      isNew ? 'ম্যাচ শিডিউল তৈরি করা হয়েছে' : 'ম্যাচের সময়সূচি বা তথ্য হালনাগাদ করা হয়েছে'
    );
    return id;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, MATCHES_COL);
    throw err;
  }
}

// ==========================================
// 5. AUTOMATED FIXTURE GENERATORS
// ==========================================

export interface GeneratedFixtureDraft {
  matchNumber: number;
  matchNumberText: string;
  roundOrGroup: string;
  homeTeamId: string;
  homeTeamName: string;
  homeTeamLogo?: string;
  awayTeamId: string;
  awayTeamName: string;
  awayTeamLogo?: string;
  matchDate: string;
  kickoffTime: string;
  venueName: string;
}

/**
 * Generate Round-Robin League Fixtures for a set of teams
 */
export function generateRoundRobinFixtures(
  teams: FootballTeam[],
  startDate: string,
  kickoffTime: string,
  venueName: string,
  daysInterval: number = 2
): GeneratedFixtureDraft[] {
  if (teams.length < 2) return [];

  const teamList = [...teams];
  // If odd number of teams, add dummy team
  const hasDummy = teamList.length % 2 !== 0;
  if (hasDummy) {
    teamList.push({ id: 'BYE', name: 'বাই (BYE)', tournamentId: '' } as FootballTeam);
  }

  const numTeams = teamList.length;
  const numRounds = numTeams - 1;
  const matchesPerRound = numTeams / 2;
  const fixtures: GeneratedFixtureDraft[] = [];

  let matchCounter = 1;
  const baseDate = new Date(startDate);

  for (let r = 0; r < numRounds; r++) {
    const roundDate = new Date(baseDate);
    roundDate.setDate(roundDate.getDate() + (r * daysInterval));
    const dateStr = roundDate.toISOString().split('T')[0];

    for (let m = 0; m < matchesPerRound; m++) {
      const homeIdx = (r + m) % (numTeams - 1);
      let awayIdx = (numTeams - 1 - m + r) % (numTeams - 1);

      if (m === 0) {
        awayIdx = numTeams - 1;
      }

      const homeTeam = teamList[homeIdx];
      const awayTeam = teamList[awayIdx];

      // Skip dummy team matches
      if (homeTeam.id === 'BYE' || awayTeam.id === 'BYE') continue;

      const bengaliNumbers = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      const toBengali = (num: number) => num.toString().split('').map(d => bengaliNumbers[parseInt(d)] || d).join('');

      fixtures.push({
        matchNumber: matchCounter,
        matchNumberText: `${toBengali(matchCounter)}ম ম্যাচ`,
        roundOrGroup: `রাউন্ড ${toBengali(r + 1)}`,
        homeTeamId: homeTeam.id,
        homeTeamName: homeTeam.name,
        homeTeamLogo: homeTeam.logoUrl,
        awayTeamId: awayTeam.id,
        awayTeamName: awayTeam.name,
        awayTeamLogo: awayTeam.logoUrl,
        matchDate: dateStr,
        kickoffTime,
        venueName
      });
      matchCounter++;
    }
  }

  return fixtures;
}

/**
 * Generate Knockout Tournament Bracket Fixtures
 */
export function generateKnockoutFixtures(
  teams: FootballTeam[],
  startDate: string,
  kickoffTime: string,
  venueName: string
): GeneratedFixtureDraft[] {
  if (teams.length < 2) return [];

  const fixtures: GeneratedFixtureDraft[] = [];
  const bengaliNumbers = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const toBengali = (num: number) => num.toString().split('').map(d => bengaliNumbers[parseInt(d)] || d).join('');

  let roundName = 'কোয়ার্টার ফাইনাল';
  if (teams.length <= 4) roundName = 'সেমিফাইনাল';
  if (teams.length <= 2) roundName = 'ফাইনাল';

  let matchCounter = 1;
  const baseDate = new Date(startDate);

  for (let i = 0; i < teams.length - 1; i += 2) {
    const homeTeam = teams[i];
    const awayTeam = teams[i + 1];

    const matchDateObj = new Date(baseDate);
    matchDateObj.setDate(matchDateObj.getDate() + (Math.floor(i / 2) * 2));
    const dateStr = matchDateObj.toISOString().split('T')[0];

    fixtures.push({
      matchNumber: matchCounter,
      matchNumberText: `${toBengali(matchCounter)}ম ম্যাচ`,
      roundOrGroup: roundName,
      homeTeamId: homeTeam.id,
      homeTeamName: homeTeam.name,
      homeTeamLogo: homeTeam.logoUrl,
      awayTeamId: awayTeam.id,
      awayTeamName: awayTeam.name,
      awayTeamLogo: awayTeam.logoUrl,
      matchDate: dateStr,
      kickoffTime,
      venueName
    });
    matchCounter++;
  }

  return fixtures;
}

// ==========================================
// 6. LIVE MATCH EVENTS & TIMELINE
// ==========================================

export async function addMatchEvent(
  matchId: string,
  tournamentId: string,
  eventData: Omit<MatchEvent, 'id' | 'createdAt' | 'createdBy'>
): Promise<string> {
  try {
    const eventId = `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const fullEvent: MatchEvent = {
      ...eventData,
      id: eventId,
      matchId,
      tournamentId,
      createdAt: serverTimestamp(),
      createdBy: auth.currentUser?.uid || 'admin'
    };

    // Save event
    await setDoc(doc(db, MATCH_EVENTS_COL, eventId), fullEvent);

    // Update match score synchronously if it's a goal
    const matchRef = doc(db, MATCHES_COL, matchId);
    const matchSnap = await getDoc(matchRef);
    if (matchSnap.exists()) {
      const match = matchSnap.data() as FootballMatch;
      let newHomeScore = match.homeScore;
      let newAwayScore = match.awayScore;

      if (eventData.type === 'goal' || eventData.type === 'penalty_goal') {
        if (eventData.teamId === match.homeTeamId) {
          newHomeScore++;
        } else if (eventData.teamId === match.awayTeamId) {
          newAwayScore++;
        }
      } else if (eventData.type === 'own_goal') {
        // Own goal scores for opponent
        if (eventData.teamId === match.homeTeamId) {
          newAwayScore++;
        } else {
          newHomeScore++;
        }
      }

      await updateDoc(matchRef, {
        homeScore: newHomeScore,
        awayScore: newAwayScore,
        currentMinute: eventData.minute,
        updatedAt: serverTimestamp()
      });
    }

    await logFootballActivity(
      'ADD_MATCH_EVENT',
      'event',
      eventId,
      `${eventData.type} (${eventData.minute}')`,
      `ম্যাচ #${matchId}: ${eventData.description}`
    );

    return eventId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, MATCH_EVENTS_COL);
    throw err;
  }
}

export function subscribeMatchEvents(matchId: string, onData: (data: MatchEvent[]) => void) {
  const q = query(
    collection(db, MATCH_EVENTS_COL),
    where('matchId', '==', matchId),
    orderBy('minute', 'asc')
  );
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map(d => ({ id: d.id, ...d.data() } as MatchEvent)));
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, MATCH_EVENTS_COL);
    }
  );
}

export async function deleteMatchEvent(eventId: string, matchId: string): Promise<void> {
  try {
    const evRef = doc(db, MATCH_EVENTS_COL, eventId);
    const evSnap = await getDoc(evRef);
    if (!evSnap.exists()) return;

    const event = evSnap.data() as MatchEvent;
    await deleteDoc(evRef);

    // Re-adjust score if goal was deleted
    if (event.type === 'goal' || event.type === 'penalty_goal' || event.type === 'own_goal') {
      const matchRef = doc(db, MATCHES_COL, matchId);
      const matchSnap = await getDoc(matchRef);
      if (matchSnap.exists()) {
        const match = matchSnap.data() as FootballMatch;
        let newHomeScore = match.homeScore;
        let newAwayScore = match.awayScore;

        if (event.type === 'goal' || event.type === 'penalty_goal') {
          if (event.teamId === match.homeTeamId) newHomeScore = Math.max(0, newHomeScore - 1);
          if (event.teamId === match.awayTeamId) newAwayScore = Math.max(0, newAwayScore - 1);
        } else if (event.type === 'own_goal') {
          if (event.teamId === match.homeTeamId) newAwayScore = Math.max(0, newAwayScore - 1);
          if (event.teamId === match.awayTeamId) newHomeScore = Math.max(0, newHomeScore - 1);
        }

        await updateDoc(matchRef, {
          homeScore: newHomeScore,
          awayScore: newAwayScore,
          updatedAt: serverTimestamp()
        });
      }
    }

    await logFootballActivity(
      'DELETE_MATCH_EVENT',
      'event',
      eventId,
      event.type,
      `ইভেন্ট মুছে ফেলা হয়েছে এবং স্কোর সংশোধন করা হয়েছে`
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${MATCH_EVENTS_COL}/${eventId}`);
    throw err;
  }
}

// ==========================================
// 7. RESULTS & STANDINGS CALCULATION (IDEMPOTENT)
// ==========================================

export async function recalculateStandings(tournamentId: string): Promise<FootballStandings> {
  try {
    // 1. Fetch tournament config
    const trnSnap = await getDoc(doc(db, TOURNAMENTS_COL, tournamentId));
    if (!trnSnap.exists()) throw new Error('Tournament not found');
    const trn = trnSnap.data() as FootballTournament;

    // 2. Fetch all teams in tournament
    const teamsSnap = await getDocs(query(collection(db, TEAMS_COL), where('tournamentId', '==', tournamentId)));
    const teams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() } as FootballTeam));

    // 3. Fetch all finished/approved matches
    const matchesSnap = await getDocs(
      query(collection(db, MATCHES_COL), where('tournamentId', '==', tournamentId))
    );
    const allMatches = matchesSnap.docs.map(d => ({ id: d.id, ...d.data() } as FootballMatch));
    const completedMatches = allMatches.filter(m => m.status === 'full_time' || m.resultApproved);

    // Initialize row map
    const rowMap: Record<string, FootballStandingRow> = {};
    for (const team of teams) {
      rowMap[team.id] = {
        teamId: team.id,
        teamName: team.name,
        teamLogo: team.logoUrl,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        form: []
      };
    }

    const ptsWin = trn.pointsForWin ?? 3;
    const ptsDraw = trn.pointsForDraw ?? 1;
    const ptsLoss = trn.pointsForLoss ?? 0;

    // Accumulate results
    for (const m of completedMatches) {
      if (!rowMap[m.homeTeamId] || !rowMap[m.awayTeamId]) continue;

      const homeRow = rowMap[m.homeTeamId];
      const awayRow = rowMap[m.awayTeamId];

      homeRow.played++;
      awayRow.played++;

      homeRow.goalsFor += m.homeScore;
      homeRow.goalsAgainst += m.awayScore;
      homeRow.goalDifference = homeRow.goalsFor - homeRow.goalsAgainst;

      awayRow.goalsFor += m.awayScore;
      awayRow.goalsAgainst += m.homeScore;
      awayRow.goalDifference = awayRow.goalsFor - awayRow.goalsAgainst;

      if (m.homeScore > m.awayScore) {
        homeRow.won++;
        homeRow.points += ptsWin;
        homeRow.form = [...(homeRow.form || []), 'W' as const].slice(-5);

        awayRow.lost++;
        awayRow.points += ptsLoss;
        awayRow.form = [...(awayRow.form || []), 'L' as const].slice(-5);
      } else if (m.homeScore < m.awayScore) {
        awayRow.won++;
        awayRow.points += ptsWin;
        awayRow.form = [...(awayRow.form || []), 'W' as const].slice(-5);

        homeRow.lost++;
        homeRow.points += ptsLoss;
        homeRow.form = [...(homeRow.form || []), 'L' as const].slice(-5);
      } else {
        homeRow.drawn++;
        homeRow.points += ptsDraw;
        homeRow.form = [...(homeRow.form || []), 'D' as const].slice(-5);

        awayRow.drawn++;
        awayRow.points += ptsDraw;
        awayRow.form = [...(awayRow.form || []), 'D' as const].slice(-5);
      }
    }

    // Sort according to tie-break criteria (Points -> GD -> GF)
    const sortedRows = Object.values(rowMap).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.teamName.localeCompare(b.teamName);
    });

    // Assign rank
    sortedRows.forEach((r, idx) => {
      r.rank = idx + 1;
    });

    const standingsDoc: FootballStandings = {
      id: tournamentId,
      tournamentId,
      tournamentName: trn.name,
      rows: sortedRows,
      lastCalculatedAt: serverTimestamp(),
      updatedBy: auth.currentUser?.uid || 'system'
    };

    await setDoc(doc(db, STANDINGS_COL, tournamentId), standingsDoc);
    return standingsDoc;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${STANDINGS_COL}/${tournamentId}`);
    throw err;
  }
}

export function subscribeStandings(tournamentId: string, onData: (data: FootballStandings | null) => void) {
  return onSnapshot(
    doc(db, STANDINGS_COL, tournamentId),
    (snap) => {
      if (snap.exists()) {
        onData({ id: snap.id, ...snap.data() } as FootballStandings);
      } else {
        onData(null);
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, `${STANDINGS_COL}/${tournamentId}`);
    }
  );
}

// ==========================================
// 8. BANNER / POSTER DESIGNER & STORAGE
// ==========================================

export async function getPosters(): Promise<FootballPosterConfig[]> {
  try {
    const q = query(collection(db, POSTERS_COL), orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FootballPosterConfig));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, POSTERS_COL);
    return [];
  }
}

export function subscribePosters(onData: (data: FootballPosterConfig[]) => void) {
  const q = query(collection(db, POSTERS_COL), orderBy('updatedAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map(d => ({ id: d.id, ...d.data() } as FootballPosterConfig)));
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, POSTERS_COL);
    }
  );
}

export async function savePoster(data: Partial<FootballPosterConfig>): Promise<string> {
  try {
    const id = data.id || `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const isNew = !data.id;
    const payload = {
      ...data,
      id,
      version: (data.version || 1) + (isNew ? 0 : 1),
      updatedAt: serverTimestamp(),
      ...(isNew ? { createdAt: serverTimestamp(), createdBy: auth.currentUser?.uid || 'admin' } : {})
    };
    await setDoc(doc(db, POSTERS_COL, id), payload, { merge: true });

    // If linked to match, update match poster ref
    if (data.matchId && data.status === 'published') {
      try {
        await updateDoc(doc(db, MATCHES_COL, data.matchId), {
          posterId: id,
          posterPublishedUrl: data.publishedImageUrl || ''
        });
      } catch (_) {}
    }

    await logFootballActivity(
      isNew ? 'CREATE_POSTER' : 'UPDATE_POSTER',
      'poster',
      id,
      `${data.mainTitleText || 'ব্যানার'} (${data.matchRibbonText || ''})`,
      isNew ? 'নতুন টুর্নামেন্ট ব্যানার ড্রাফট তৈরি করা হয়েছে' : 'পোস্টার ডিজাইন আপডেট ও সংরক্ষণ করা হয়েছে'
    );
    return id;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, POSTERS_COL);
    throw err;
  }
}

// ==========================================
// 9. VENUES & SPONSORS
// ==========================================

export async function getVenues(): Promise<FootballVenue[]> {
  try {
    const q = query(collection(db, VENUES_COL), orderBy('name', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FootballVenue));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, VENUES_COL);
    return [];
  }
}

export async function saveVenue(data: Partial<FootballVenue>): Promise<string> {
  try {
    const id = data.id || `ven_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const payload = {
      ...data,
      id,
      updatedAt: serverTimestamp(),
      createdAt: data.createdAt || serverTimestamp()
    };
    await setDoc(doc(db, VENUES_COL, id), payload, { merge: true });
    return id;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, VENUES_COL);
    throw err;
  }
}

export async function getSponsors(): Promise<FootballSponsor[]> {
  try {
    const q = query(collection(db, SPONSORS_COL), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FootballSponsor));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, SPONSORS_COL);
    return [];
  }
}

export async function saveSponsor(data: Partial<FootballSponsor>): Promise<string> {
  try {
    const id = data.id || `spn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const payload = {
      ...data,
      id,
      createdAt: data.createdAt || serverTimestamp()
    };
    await setDoc(doc(db, SPONSORS_COL, id), payload, { merge: true });
    return id;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, SPONSORS_COL);
    throw err;
  }
}

// ==========================================
// 10. SYSTEM SETTINGS & INITIAL SEEDING
// ==========================================

export const DEFAULT_FOOTBALL_SETTINGS: FootballSettings = {
  id: 'general',
  defaultMatchDuration: 90,
  pointsWin: 3,
  pointsDraw: 1,
  pointsLoss: 0,
  tieBreakerRules: ['gd', 'gf', 'h2h'],
  allowClubAdminScoreSubmission: true,
  enableLiveScoreNotifications: true,
  enableFixtureConflictGuard: true,
  contactEmergencyPhone: '০১৭১১-২২৩৩৪৪',
  updatedAt: null,
  updatedBy: 'system'
};

export async function getFootballSettings(): Promise<FootballSettings> {
  try {
    const snap = await getDoc(doc(db, SETTINGS_COL, 'general'));
    if (snap.exists()) {
      return snap.data() as FootballSettings;
    }
    return DEFAULT_FOOTBALL_SETTINGS;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `${SETTINGS_COL}/general`);
    return DEFAULT_FOOTBALL_SETTINGS;
  }
}

export async function updateFootballSettings(data: Partial<FootballSettings>): Promise<void> {
  try {
    await setDoc(
      doc(db, SETTINGS_COL, 'general'),
      {
        ...data,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.uid || 'admin'
      },
      { merge: true }
    );
    await logFootballActivity(
      'UPDATE_SETTINGS',
      'settings',
      'general',
      'ফুটবল সিস্টেম সেটিংস',
      'সাধারণ সিস্টেম কনফিগারেশন আপডেট করা হয়েছে'
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${SETTINGS_COL}/general`);
    throw err;
  }
}

/**
 * Seed initial sample tournament and clubs matching the user's reference poster if collections are empty!
 */
export async function seedInitialFootballDataIfEmpty(): Promise<void> {
  try {
    const trnSnap = await getDocs(query(collection(db, TOURNAMENTS_COL), limit(1)));
    if (!trnSnap.empty) return;

    console.log('Seeding initial tournament data matching user poster...');

    // 1. Create Venue
    const venueId = 'ven_mohipada_field';
    await setDoc(doc(db, VENUES_COL, venueId), {
      id: venueId,
      name: 'মহিপাড়া উচ্চ বিদ্যালয় মাঠ',
      location: 'দুর্গাপুর, রাজশাহী',
      capacity: 5000,
      hasFloodlights: true,
      status: 'active',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // 2. Create Tournament
    const tournamentId = 'trn_mohipada_2026';
    const trnData: FootballTournament = {
      id: tournamentId,
      name: 'আদর্শ ও ঐতিহ্যবাহী প্রাইজ মানি ফুটবল টুর্নামেন্ট মহিপাড়া ২০২৬',
      nameEn: 'Mohipada Prize Money Football Tournament 2026',
      season: '2026',
      year: 2026,
      description: 'খেলাধুলা সুস্থ দেহ, সুন্দর মন, গড়ে তোলে আগামীর স্বপ্ন। পুঠিয়া-দুর্গাপুর অঞ্চলের সেরা ক্লাব ও দলসমূহের অংশগ্রহণে আয়োজিত আকর্ষণীয় ফুটবল টুর্নামেন্ট।',
      organizer: 'মহিপাড়া যুব সমাজ ও আদর্শ ক্রীড়া কল্যাণ সংসদ',
      startDate: '2026-10-20',
      endDate: '2026-11-15',
      venueId,
      venueName: 'মহিপাড়া উচ্চ বিদ্যালয় মাঠ',
      venueAddress: 'দুর্গাপুর, রাজশাহী',
      format: 'knockout',
      matchDurationMinutes: 90,
      pointsForWin: 3,
      pointsForDraw: 1,
      pointsForLoss: 0,
      tieBreakOrder: ['gd', 'gf', 'h2h'],
      rulesAndRegulations: 'ফিফা অফিসিয়াল নিয়মে ম্যাচ অনুষ্ঠিত হবে। প্রতিটি দলে ৩ জন অতিরিক্ত খেলোয়াড় পরিবর্তন করার অনুমতি থাকবে। রেফারির সিদ্ধান্তই চূড়ান্ত।',
      contactPhone: '০১৭০০-০০০০০০',
      status: 'ongoing',
      participatingTeamIds: ['team_new_eagle', 'team_kishor_koli'],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: 'system'
    };
    await setDoc(doc(db, TOURNAMENTS_COL, tournamentId), trnData);

    // 3. Create Clubs & Teams matching poster
    // Team A: নিউ ঈগল ফুটবল একাডেমি
    const clubAId = 'club_new_eagle';
    await setDoc(doc(db, CLUBS_COL, clubAId), {
      id: clubAId,
      name: 'নিউ ঈগল ফুটবল একাডেমি',
      nameEn: 'New Eagle Football Academy',
      address: 'হাট গোদাগাড়ী, রাজশাহী',
      contactPhone: '০১৭০০-১১২২৩৩',
      status: 'approved',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: 'system'
    });

    await setDoc(doc(db, TEAMS_COL, 'team_new_eagle'), {
      id: 'team_new_eagle',
      clubId: clubAId,
      tournamentId,
      name: 'নিউ ঈগল ফুটবল একাডেমি',
      shortName: 'নিউ ঈগল (হাট গোদাগাড়ী)',
      badgeColor: '#1E40AF',
      coachName: 'মো: রফিকুল ইসলাম',
      captainName: 'হাসান মাহমুদ (১০)',
      squadPlayerIds: [],
      registrationStatus: 'approved',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: 'system'
    });

    // Team B: কিশোর কেলি ফুটবল একাডেমি
    const clubBId = 'club_kishor_koli';
    await setDoc(doc(db, CLUBS_COL, clubBId), {
      id: clubBId,
      name: 'কিশোর কেলি ফুটবল একাডেমি',
      nameEn: 'Kishor Koli Football Academy',
      address: 'মোহনপুর, রাজশাহী',
      contactPhone: '০১৭০০-৪৫৬৭৮৯',
      status: 'approved',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: 'system'
    });

    await setDoc(doc(db, TEAMS_COL, 'team_kishor_koli'), {
      id: 'team_kishor_koli',
      clubId: clubBId,
      tournamentId,
      name: 'কিশোর কেলি ফুটবল একাডেমি',
      shortName: 'কিশোর কেলি (মোহনপুর)',
      badgeColor: '#DC2626',
      coachName: 'মো: জামিল আহমেদ',
      captainName: 'শাকিল হোসেন (৯)',
      squadPlayerIds: [],
      registrationStatus: 'approved',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: 'system'
    });

    // 4. Create Initial Match (Matching the reference poster!)
    const matchId = 'match_mohipada_2';
    await setDoc(doc(db, MATCHES_COL, matchId), {
      id: matchId,
      tournamentId,
      tournamentName: trnData.name,
      groupOrRound: 'প্রথম পর্ব',
      matchNumberText: 'দ্বিতীয় ম্যাচ',
      matchNumber: 2,
      homeTeamId: 'team_new_eagle',
      homeTeamName: 'নিউ ঈগল ফুটবল একাডেমি, হাট গোদাগাড়ী',
      awayTeamId: 'team_kishor_koli',
      awayTeamName: 'কিশোর কেলি ফুটবল একাডেমি, মোহনপুর',
      matchDate: '2026-10-22',
      kickoffTime: '15:00',
      dayOfWeekBangla: 'বৃহস্পতিবার',
      venueId,
      venueName: 'মহিপাড়া উচ্চ বিদ্যালয় মাঠ',
      venueAddress: 'দুর্গাপুর, রাজশাহী',
      refereeName: 'জাতীয় রেফারি এস এম জাহাঙ্গীর',
      durationMinutes: 90,
      homeScore: 0,
      awayScore: 0,
      currentMinute: 0,
      period: 'scheduled',
      status: 'scheduled',
      notes: 'টুর্নামেন্টের জমজমাট দ্বিতীয় ম্যাচ। স্টেডিয়ামে দর্শকদের উপস্থিতি আকর্ষণীয় হবে।',
      resultApproved: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: 'system'
    });

    // 5. Create Default Poster matching the user's reference image
    const posterId = 'post_mohipada_match_2';
    await setDoc(doc(db, POSTERS_COL, posterId), {
      id: posterId,
      tournamentId,
      matchId,
      size: 'banner_16_9',
      mottoText: '“খেলাধুলা সুস্থ দেহ, সুন্দর মন, গড়ে তোলে আগামীর স্বপ্ন”',
      curvedHeaderBanner: 'আদর্শ ও ঐতিহ্যবাহী',
      mainTitleText: 'প্রাইজ মানি ফুটবল টুর্নামেন্ট',
      subTitleText: 'মহিপাড়া ২০২৬ এর',
      matchRibbonText: 'দ্বিতীয় ম্যাচ',
      teamAName: 'নিউ ঈগল ফুটবল একাডেমি',
      teamALocation: 'হাট গোদাগাড়ী',
      teamBName: 'কিশোর কেলি ফুটবল একাডেমি',
      teamBLocation: 'মোহনপুর',
      dateText: '২২/১০/২০২৬',
      timeText: '৩ ঘটিকা',
      dayText: 'বৃহস্পতিবার',
      venueText: 'মহিপাড়া উচ্চ বিদ্যালয় মাঠ',
      venueSubText: 'দুর্গাপুর, রাজশাহী',
      organizerText: 'আয়োজনে: মহিপাড়া যুব সমাজ ও ক্রীড়া কল্যাণ সংসদ',
      themeColor: 'emerald',
      backgroundStyle: 'stadium_night',
      status: 'published',
      version: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: 'system'
    });

    console.log('Initial football data seeded successfully.');
  } catch (err) {
    console.warn('Initial football data seeding notice:', err);
  }
}
