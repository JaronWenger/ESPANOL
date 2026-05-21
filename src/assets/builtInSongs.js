// eslint-disable-next-line import/no-webpack-loader-syntax
import hawaiiAudio from './MUSIC/LO QUE LE PASÓ A HAWAii.mp3';
// eslint-disable-next-line import/no-webpack-loader-syntax
import meJaloAudio from './MUSIC/ME JALO.mp3';
// eslint-disable-next-line import/no-webpack-loader-syntax
import baileAudio from './MUSIC/BAILE INoLVIDABLE.mp3';
// eslint-disable-next-line import/no-webpack-loader-syntax
import monacoAudio from './MUSIC/MONACO.mp3';
// eslint-disable-next-line import/no-webpack-loader-syntax
import vivirAudio from './MUSIC/Vivir Mi Vida.mp3';
import { DEFAULT_LYRICS } from './defaultSongData';
import { ME_JALO_LYRICS } from './meJaloData';
import { BAILE_LYRICS } from './baileData';
import { MONACO_LYRICS } from './monacoData';
import { VIVIR_LYRICS } from './vivirData';

export const BUILT_IN_SONGS = [
  {
    title: 'Vivir Mi Vida',
    artist: 'Marc Anthony',
    audioUrl: vivirAudio,
    lyrics: VIVIR_LYRICS,
    albumArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/f7/24/ce/f724ce48-4d0d-0cbc-3493-3d935142e5e6/886443947238.jpg/500x500bb.jpg',
  },
  {
    title: 'Lo Que Le Pasó a Hawaii',
    artist: 'Bad Bunny',
    audioUrl: hawaiiAudio,
    lyrics: DEFAULT_LYRICS,
    albumArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/90/5e/7e/905e7ed5-a8fa-a8f3-cd06-0028fdf3afaa/199066342442.jpg/500x500bb.jpg',
  },
  {
    title: 'Me Jalo',
    artist: 'Fuerza Regida & Grupo Frontera',
    audioUrl: meJaloAudio,
    lyrics: ME_JALO_LYRICS,
    albumArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/ba/96/9e/ba969e5d-857d-bbda-08e2-edc08642d188/196872772869.jpg/500x500bb.jpg',
  },
  {
    title: 'BAILE INoLVIDABLE',
    artist: 'Bad Bunny',
    audioUrl: baileAudio,
    lyrics: BAILE_LYRICS,
    albumArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/90/5e/7e/905e7ed5-a8fa-a8f3-cd06-0028fdf3afaa/199066342442.jpg/500x500bb.jpg',
  },
  {
    title: 'MONACO',
    artist: 'Bad Bunny',
    audioUrl: monacoAudio,
    lyrics: MONACO_LYRICS,
    albumArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/00/e0/31/00e0311e-9dab-fd0c-fc37-ee3d36aafbf3/197190137897.jpg/500x500bb.jpg',
  },
];
