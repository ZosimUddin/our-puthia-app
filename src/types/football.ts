/**
 * Football Tournament Automation System - TypeScript Type Definitions
 * Designed for "আমাদের পুঠিয়া" Web Platform
 */

export type TournamentFormat = 'league' | 'knockout' | 'group_knockout';

export type TournamentStatus = 
  | 'draft' 
  | 'registration_open' 
  | 'upcoming' 
  | 'ongoing' 
  | 'completed' 
  | 'cancelled' 
  | 'archived';

export type MatchStatus = 
  | 'scheduled' 
  | 'live' 
  | 'half_time' 
  | 'second_half' 
  | 'extra_time' 
  | 'penalties' 
  | 'full_time' 
  | 'postponed' 
  | 'cancelled' 
  | 'abandoned';

export type MatchEventType = 
  | 'goal' 
  | 'own_goal' 
  | 'penalty_goal' 
  | 'penalty_miss' 
  | 'yellow_card' 
  | 'red_card' 
  | 'substitution' 
  | 'period_start' 
  | 'period_end';

export type PlayerPosition = 
  | 'goalkeeper' 
  | 'defender' 
  | 'midfielder' 
  | 'forward';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type PosterTemplateSize = 
  | 'banner_16_9'        // 16:9 Website Banner (1920x1080)
  | 'social_landscape'   // 1200x630 Social Landscape
  | 'social_square'      // 1080x1080 Square Post
  | 'social_portrait';   // 1080x1350 Portrait Post

export interface FootballTournament {
  id: string;
  name: string; // Bengali name (e.g. "আদর্শ ও ঐতিহ্যবাহী প্রাইজ মানি ফুটবল টুর্নামেন্ট মহিপাড়া ২০২৬")
  nameEn?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  season: string; // e.g. "2026"
  year: number;
  description: string;
  organizer: string; // e.g. "মহিপাড়া যুব সমাজ ও ক্রীড়া কল্যাণ পরিষদ"
  sponsors?: string[];
  startDate: string; // ISO date
  endDate: string; // ISO date
  registrationOpenDate?: string;
  registrationCloseDate?: string;
  venueId?: string;
  venueName: string;
  venueAddress?: string;
  format: TournamentFormat;
  matchDurationMinutes: number; // default 90 or 60
  pointsForWin: number; // default 3
  pointsForDraw: number; // default 1
  pointsForLoss: number; // default 0
  tieBreakOrder: ('gd' | 'gf' | 'h2h' | 'fair_play')[];
  rulesAndRegulations?: string;
  contactPhone?: string;
  contactEmail?: string;
  status: TournamentStatus;
  participatingTeamIds: string[];
  createdAt: any;
  updatedAt: any;
  createdBy: string;
}

export interface FootballClub {
  id: string;
  name: string; // Bengali name (e.g. "নিউ ঈগল ফুটবল একাডেমি")
  nameEn?: string;
  logoUrl?: string;
  coverUrl?: string;
  establishedYear?: number;
  contactPhone: string;
  contactEmail?: string;
  address: string; // e.g. "হাট গোদাগাড়ী, পুঠিয়া, রাজশাহী"
  clubAdminUid?: string;
  clubAdminEmail?: string;
  status: ApprovalStatus;
  createdAt: any;
  updatedAt: any;
  createdBy: string;
}

export interface FootballTeam {
  id: string;
  clubId?: string;
  tournamentId: string;
  name: string; // e.g. "নিউ ঈগল ফুটবল একাডেমি"
  shortName?: string;
  logoUrl?: string;
  badgeColor?: string; // primary color for poster
  coachName?: string;
  captainName?: string;
  squadPlayerIds: string[];
  registrationStatus: ApprovalStatus;
  createdAt: any;
  updatedAt: any;
  createdBy: string;
}

export interface FootballPlayer {
  id: string;
  name: string; // Bengali name
  nameEn?: string;
  photoUrl?: string;
  jerseyNumber: number;
  position: PlayerPosition;
  currentTeamId?: string;
  clubId?: string;
  dateOfBirth?: string;
  contactPhone?: string;
  isActive: boolean;
  totalGoals?: number;
  totalAssists?: number;
  yellowCards?: number;
  redCards?: number;
  createdAt: any;
  updatedAt: any;
  createdBy: string;
}

export interface FootballVenue {
  id: string;
  name: string; // e.g. "মহিপাড়া উচ্চ বিদ্যালয় মাঠ"
  location: string; // e.g. "দুর্গাপুর, রাজশাহী"
  capacity?: number;
  hasFloodlights: boolean;
  mapUrl?: string;
  status: 'active' | 'maintenance' | 'inactive';
  createdAt: any;
  updatedAt: any;
}

export interface FootballSponsor {
  id: string;
  name: string;
  logoUrl: string;
  tier: 'title' | 'platinum' | 'gold' | 'silver' | 'associate';
  websiteUrl?: string;
  status: 'active' | 'inactive';
  createdAt: any;
}

export interface FootballMatch {
  id: string;
  tournamentId: string;
  tournamentName: string;
  groupOrRound: string; // e.g. "গ্রুপ পর্ব", "কোয়ার্টার ফাইনাল", "সেমিফাইনাল", "ফাইনাল"
  matchNumberText: string; // e.g. "১ম ম্যাচ", "২য় ম্যাচ", "দ্বিতীয় ম্যাচ", "ফাইনাল ম্যাচ"
  matchNumber: number;
  homeTeamId: string;
  homeTeamName: string;
  homeTeamLogo?: string;
  awayTeamId: string;
  awayTeamName: string;
  awayTeamLogo?: string;
  matchDate: string; // YYYY-MM-DD
  kickoffTime: string; // HH:mm
  dayOfWeekBangla?: string; // e.g. "বৃহস্পতিবার"
  venueId?: string;
  venueName: string;
  venueAddress?: string;
  refereeName?: string;
  durationMinutes: number;
  homeScore: number;
  awayScore: number;
  currentMinute: number;
  addedTimeMinutes?: number;
  period: 'first_half' | 'half_time' | 'second_half' | 'extra_time' | 'penalties' | 'finished' | 'scheduled';
  status: MatchStatus;
  notes?: string;
  posterId?: string;
  posterPublishedUrl?: string;
  resultApproved: boolean;
  resultApprovedBy?: string;
  resultApprovedAt?: any;
  createdAt: any;
  updatedAt: any;
  createdBy: string;
}

export interface MatchEvent {
  id: string;
  matchId: string;
  tournamentId: string;
  type: MatchEventType;
  teamId: string;
  teamName: string;
  playerId?: string;
  playerName?: string;
  assistPlayerId?: string;
  assistPlayerName?: string;
  minute: number;
  addedTime?: number;
  description: string;
  isCorrection?: boolean;
  correctedEventId?: string;
  createdAt: any;
  createdBy: string;
}

export interface FootballStandingRow {
  teamId: string;
  teamName: string;
  teamLogo?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form?: ('W' | 'D' | 'L')[];
  rank?: number;
}

export interface FootballStandings {
  id: string; // tournamentId
  tournamentId: string;
  tournamentName: string;
  rows: FootballStandingRow[];
  lastCalculatedAt: any;
  updatedBy: string;
}

export interface FootballPosterConfig {
  id: string;
  tournamentId: string;
  matchId?: string;
  size: PosterTemplateSize;
  mottoText: string; // e.g. “খেলাধুলা সুস্থ দেহ, সুন্দর মন, গড়ে তোলে আগামীর স্বপ্ন”
  curvedHeaderBanner: string; // e.g. "আদর্শ ও ঐতিহ্যবাহী"
  mainTitleText: string; // e.g. "প্রাইজ মানি ফুটবল টুর্নামেন্ট"
  subTitleText: string; // e.g. "মহিপাড়া ২০২৬ এর"
  matchRibbonText: string; // e.g. "দ্বিতীয় ম্যাচ"
  teamAName: string;
  teamALocation?: string;
  teamALogoUrl?: string;
  teamBName: string;
  teamBLocation?: string;
  teamBLogoUrl?: string;
  dateText: string; // e.g. "২২/১০/২০২৬"
  timeText: string; // e.g. "৩ ঘটিকা"
  dayText: string; // e.g. "বৃহস্পতিবার"
  venueText: string; // e.g. "মহিপাড়া উচ্চ বিদ্যালয় মাঠ"
  venueSubText?: string; // e.g. "দুর্গাপুর, রাজশাহী"
  organizerText?: string;
  sponsorLogos?: string[];
  themeColor: 'emerald' | 'crimson' | 'royal_blue' | 'gold' | 'custom';
  backgroundStyle: 'stadium_night' | 'floodlight_classic' | 'modern_dark' | 'gradient_vector';
  customBackgroundUrl?: string;
  vsStyle?: 'fiery' | 'neon' | 'golden' | 'comic';
  showTrophies?: boolean;
  showBallAndPlayer?: boolean;
  showMotto?: boolean;
  status: 'draft' | 'approved' | 'published';
  version: number;
  publishedImageUrl?: string;
  createdAt: any;
  updatedAt: any;
  createdBy: string;
}

export interface FootballActivityLog {
  id: string;
  actorUid: string;
  actorEmail: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: 'tournament' | 'club' | 'team' | 'player' | 'match' | 'event' | 'result' | 'poster' | 'venue' | 'settings';
  entityId: string;
  entityName?: string;
  details: string;
  changesSummary?: string;
  createdAt: any;
}

export interface FootballSettings {
  id: string;
  defaultMatchDuration: number; // e.g. 90
  pointsWin: number; // 3
  pointsDraw: number; // 1
  pointsLoss: number; // 0
  tieBreakerRules: ('gd' | 'gf' | 'h2h' | 'fair_play')[];
  allowClubAdminScoreSubmission: boolean;
  enableLiveScoreNotifications: boolean;
  enableFixtureConflictGuard: boolean;
  contactEmergencyPhone: string;
  updatedAt: any;
  updatedBy: string;
}
