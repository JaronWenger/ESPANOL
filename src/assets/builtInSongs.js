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
  },
  {
    title: 'Lo Que Le Pasó a Hawaii',
    artist: 'Bad Bunny',
    audioUrl: hawaiiAudio,
    lyrics: DEFAULT_LYRICS,
  },
  {
    title: 'Me Jalo',
    artist: 'Fuerza Regida',
    audioUrl: meJaloAudio,
    lyrics: ME_JALO_LYRICS,
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
