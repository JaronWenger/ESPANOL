// eslint-disable-next-line import/no-webpack-loader-syntax
import hawaiiAudio from './MUSIC/LO QUE LE PASÓ A HAWAii.mp3';
// eslint-disable-next-line import/no-webpack-loader-syntax
import hawaiiKaraoke from './MUSIC/LO QUE LE PASÓ A HAWAii Instrumental.mp3';
// eslint-disable-next-line import/no-webpack-loader-syntax
import meJaloAudio from './MUSIC/ME JALO.mp3';
// eslint-disable-next-line import/no-webpack-loader-syntax
import meJaloKaraoke from './MUSIC/ME JALO Instrumental.mp3';
// eslint-disable-next-line import/no-webpack-loader-syntax
import baileAudio from './MUSIC/BAILE INoLVIDABLE.mp3';
// eslint-disable-next-line import/no-webpack-loader-syntax
import baileKaraoke from './MUSIC/BAILE INoLVIDABLE Instrumental.mp3';
// eslint-disable-next-line import/no-webpack-loader-syntax
import monacoAudio from './MUSIC/MONACO.mp3';
// eslint-disable-next-line import/no-webpack-loader-syntax
import monacoKaraoke from './MUSIC/MONACO Instrumental.mp3';
// eslint-disable-next-line import/no-webpack-loader-syntax
import vivirAudio from './MUSIC/Vivir Mi Vida.mp3';
// eslint-disable-next-line import/no-webpack-loader-syntax
import vivirKaraoke from './MUSIC/Vivir Mi Vida Instrumental.mp3';
// eslint-disable-next-line import/no-webpack-loader-syntax
import mariachAudio from './MUSIC/Cancion del mariachi.mp3';
// eslint-disable-next-line import/no-webpack-loader-syntax
import mariachKaraoke from './MUSIC/Cancion del mariachi Instrumental.mp3';
// eslint-disable-next-line import/no-webpack-loader-syntax
import quePasariaAudio from './MUSIC/Que Pasaria.mp3';
// eslint-disable-next-line import/no-webpack-loader-syntax
import quePasariaKaraoke from './MUSIC/Que Pasaria Instrumental.mp3';
// eslint-disable-next-line import/no-webpack-loader-syntax
import mananaAudio from './MUSIC/mañana.mp3';
// eslint-disable-next-line import/no-webpack-loader-syntax
import mananaKaraoke from './MUSIC/mañana Instrumental.mp3';
// eslint-disable-next-line import/no-webpack-loader-syntax
import callaitaAudio from './MUSIC/CALLAÍTA.mp3';
// eslint-disable-next-line import/no-webpack-loader-syntax
import callaitaKaraoke from './MUSIC/CALLAÍTA Instrumental.mp3';
// eslint-disable-next-line import/no-webpack-loader-syntax
import dakitiAudio from './MUSIC/DÁKITI.mp3';
// eslint-disable-next-line import/no-webpack-loader-syntax
import dakitiKaraoke from './MUSIC/DÁKITI Instrumental.mp3';
// eslint-disable-next-line import/no-webpack-loader-syntax
import dtmfAudio from './MUSIC/DtMF.mp3';
// eslint-disable-next-line import/no-webpack-loader-syntax
import dtmfKaraoke from './MUSIC/DtMF Instrumental.mp3';
// eslint-disable-next-line import/no-webpack-loader-syntax
import meGustasTuAudio from './MUSIC/Me Gustas Tu.mp3';
// eslint-disable-next-line import/no-webpack-loader-syntax
import meGustasTuKaraoke from './MUSIC/Me Gustas Tu Instrumental.mp3';
import { DEFAULT_LYRICS } from './defaultSongData';
import { ME_JALO_LYRICS } from './meJaloData';
import { BAILE_LYRICS } from './baileData';
import { MONACO_LYRICS } from './monacoData';
import { VIVIR_LYRICS } from './vivirData';
import { CANCION_MARIACHI_LYRICS } from './cancionMariachiData';
import { QUE_PASARIA_LYRICS } from './quePasariaData';
import { MANANA_LYRICS } from './mananaData';
import { CALLAITA_LYRICS } from './callaitaData';
import { DAKITI_LYRICS } from './dakitiData';
import { DTMF_LYRICS } from './dtmfData';
import { ME_GUSTAS_TU_LYRICS } from './meGustasTuData';

export const BUILT_IN_SONGS = [
  {
    title: 'Vivir Mi Vida',
    artist: 'Marc Anthony',
    audioUrl: vivirAudio,
    karaokeUrl: vivirKaraoke,
    lyrics: VIVIR_LYRICS,
    albumArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/f7/24/ce/f724ce48-4d0d-0cbc-3493-3d935142e5e6/886443947238.jpg/500x500bb.jpg',
  },
  {
    title: 'Lo Que Le Pasó a Hawaii',
    artist: 'Bad Bunny',
    audioUrl: hawaiiAudio,
    karaokeUrl: hawaiiKaraoke,
    lyrics: DEFAULT_LYRICS,
    albumArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/90/5e/7e/905e7ed5-a8fa-a8f3-cd06-0028fdf3afaa/199066342442.jpg/500x500bb.jpg',
  },
  {
    title: 'Me Jalo',
    artist: 'Fuerza Regida & Grupo Frontera',
    audioUrl: meJaloAudio,
    karaokeUrl: meJaloKaraoke,
    lyrics: ME_JALO_LYRICS,
    albumArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/ba/96/9e/ba969e5d-857d-bbda-08e2-edc08642d188/196872772869.jpg/500x500bb.jpg',
  },
  {
    title: 'BAILE INoLVIDABLE',
    artist: 'Bad Bunny',
    audioUrl: baileAudio,
    karaokeUrl: baileKaraoke,
    lyrics: BAILE_LYRICS,
    albumArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/90/5e/7e/905e7ed5-a8fa-a8f3-cd06-0028fdf3afaa/199066342442.jpg/500x500bb.jpg',
  },
  {
    title: 'MONACO',
    artist: 'Bad Bunny',
    audioUrl: monacoAudio,
    karaokeUrl: monacoKaraoke,
    lyrics: MONACO_LYRICS,
    albumArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/00/e0/31/00e0311e-9dab-fd0c-fc37-ee3d36aafbf3/197190137897.jpg/500x500bb.jpg',
  },
  {
    title: 'Canción del Mariachi',
    artist: 'Los Lobos & Antonio Banderas',
    audioUrl: mariachAudio,
    karaokeUrl: mariachKaraoke,
    lyrics: CANCION_MARIACHI_LYRICS,
    albumArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/78/9a/79/789a7928-5f4a-5f08-611c-518b5908906a/859712676412_cover.jpg/500x500bb.jpg',
  },
  {
    title: 'Mañana',
    artist: 'Tainy, Young Miko & The Marías',
    audioUrl: mananaAudio,
    karaokeUrl: mananaKaraoke,
    lyrics: MANANA_LYRICS,
    albumArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/ad/da/1f/adda1f4a-f2d3-fe31-c965-e0753d2990ad/196922654572_Cover.jpg/500x500bb.jpg',
  },
  {
    title: 'Qué Pasaría...',
    artist: 'Rauw Alejandro & Bad Bunny',
    audioUrl: quePasariaAudio,
    karaokeUrl: quePasariaKaraoke,
    lyrics: QUE_PASARIA_LYRICS,
    albumArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/ab/e8/09/abe8092d-ef44-61b9-6b50-ab7efb78ca51/196872401516.jpg/500x500bb.jpg',
  },
  {
    title: 'CALLAÍTA',
    artist: 'Bad Bunny & Tainy',
    audioUrl: callaitaAudio,
    karaokeUrl: callaitaKaraoke,
    lyrics: CALLAITA_LYRICS,
    albumArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/a8/5d/7c/a85d7c43-777a-f2b7-5abc-1e4d59d8fe7c/193483903545.jpg/500x500bb.jpg',
  },
  {
    title: 'DÁKITI',
    artist: 'Bad Bunny & JHAYCO',
    audioUrl: dakitiAudio,
    karaokeUrl: dakitiKaraoke,
    lyrics: DAKITI_LYRICS,
    albumArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/64/70/1c/64701cff-71ed-912f-ce62-71d409f5e6ad/195497640560.jpg/500x500bb.jpg',
  },
  {
    title: 'DtMF',
    artist: 'Bad Bunny',
    audioUrl: dtmfAudio,
    karaokeUrl: dtmfKaraoke,
    lyrics: DTMF_LYRICS,
    albumArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/90/5e/7e/905e7ed5-a8fa-a8f3-cd06-0028fdf3afaa/199066342442.jpg/500x500bb.jpg',
  },
  {
    title: 'Me Gustas Tú',
    artist: 'Manu Chao',
    audioUrl: meGustasTuAudio,
    karaokeUrl: meGustasTuKaraoke,
    lyrics: ME_GUSTAS_TU_LYRICS,
    albumArt: 'https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/7d/e2/d5/7de2d508-8bb1-4fc6-90aa-f63484c5d6a3/5060281616944_cover.jpg/500x500bb.jpg',
  },
];
