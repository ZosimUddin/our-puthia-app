import { ReelAudio } from '../types';

export const INITIAL_AUDIO_TRACKS: ReelAudio[] = [
  {
    id: 'audio-puthia-flute',
    title: 'শান্ত বাঁশির সুর (Puthia Flute)',
    artist: 'আড্ডা মিউজিক',
    audioUrl: 'https://cdn.freesound.org/previews/573/573617_11861866-lq.mp3',
    duration: 30,
    category: 'folk',
    coverUrl: '/logo.svg', 
    useCount: 1420,
    isTrending: true,
    createdAt: Date.now() - 10000000
  },
  {
    id: 'audio-bengali-folk-beat',
    title: 'মাটির গান ও দোতারা (Bangla Dotara Rhythm)',
    artist: 'গ্রামের সুর',
    audioUrl: 'https://cdn.freesound.org/previews/415/415804_5121236-lq.mp3',
    duration: 45,
    category: 'popular',
    coverUrl: '/logo.svg', 
    useCount: 3890,
    isTrending: true,
    createdAt: Date.now() - 20000000
  },
  {
    id: 'audio-rajshahi-breeze',
    title: 'পদ্মার মৃদু ঢেউ ও বাতাস (Acoustic Nature)',
    artist: 'প্রকৃতি আড্ডা',
    audioUrl: 'https://cdn.freesound.org/previews/567/567083_9497060-lq.mp3',
    duration: 25,
    category: 'ambient',
    coverUrl: '/logo.svg', 
    useCount: 920,
    isTrending: false,
    createdAt: Date.now() - 5000000
  },
  {
    id: 'audio-happy-vlog-beat',
    title: 'আনন্দঘন আড্ডা বিট (Upbeat Vibes)',
    artist: 'আড্ডা বিটস',
    audioUrl: 'https://cdn.freesound.org/previews/612/612660_11861866-lq.mp3',
    duration: 35,
    category: 'trending',
    coverUrl: '/logo.svg', 
    useCount: 2560,
    isTrending: true,
    createdAt: Date.now() - 8000000
  },
  {
    id: 'audio-spiritual-harmony',
    title: 'পবিত্র আধ্যাত্মিক সুর (Spiritual Peace)',
    artist: 'শান্তি ধাম',
    audioUrl: 'https://cdn.freesound.org/previews/387/387232_1474204-lq.mp3',
    duration: 40,
    category: 'islamic',
    coverUrl: '/logo.svg', 
    useCount: 1840,
    isTrending: false,
    createdAt: Date.now() - 15000000
  }
];

export const DEFAULT_REEL_RULES: {
  maxDuration: number;
  maxFileSizeMB: number;
  allowedFormats: string[];
  allowOriginalAudio: boolean;
  allowComments: boolean;
  allowDownloads: boolean;
} = {
  maxDuration: 90, // 90 seconds max
  maxFileSizeMB: 60, // 60 MB max
  allowedFormats: ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg', 'video/x-matroska'],
  allowOriginalAudio: true,
  allowComments: true,
  allowDownloads: true
};
