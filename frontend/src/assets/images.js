// Verified football imagery (Pexels CDN — reliable, no auth required)
const p = (id, w = 800) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}&fit=crop`;

const pitch = (w = 800) =>
  `https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=${w}&fit=crop`;

export const IMAGES = {
  heroBg:      p(274506, 1920),
  playerMain:  p(274422, 900),
  playerAlt:   p(3621102, 600),
  stadium:     p(399187, 900),
  match:       pitch(900),
  crowd:       p(1884574, 900),
  ball:        p(114296, 200),
  action:      p(3621154, 900),
  fans:        p(274422, 600),
  venue:       p(274506, 800),
  fallback:    pitch(800),
};

export const BANNER_IMAGES = [
  { src: p(274422, 500), alt: 'Football player' },
  { src: p(274506, 500), alt: 'Stadium aerial' },
  { src: pitch(500),      alt: 'Match day pitch' },
  { src: p(1884574, 500), alt: 'Crowd in stands' },
  { src: p(3621102, 500), alt: 'Player in action' },
  { src: p(399187, 500),  alt: 'Night stadium' },
  { src: p(3621154, 500), alt: 'Match action' },
  { src: p(114296, 500),  alt: 'Football on grass' },
];

export const STADIUM_IMAGES = {
  metlife: p(274506, 800),
  atandt:  p(399187, 800),
  sofi:    p(1884574, 800),
  azteca:  pitch(800),
  bcplace: p(274506, 800),
};

export const FLAGS = {
  USA:    'https://flagcdn.com/w40/us.png',
  Mexico: 'https://flagcdn.com/w40/mx.png',
  Canada: 'https://flagcdn.com/w40/ca.png',
};

export const FEATURE_IMAGES = {
  chatbot:        p(3621102, 600),
  navigation:     p(274506, 600),
  crowd:          p(1884574, 600),
  translate:      p(399187, 600),
  transport:      pitch(600),
  sustainability: p(114296, 600),
};

export const SHOWCASE_IMAGES = {
  venues:  p(274506, 900),
  nations: p(274422, 900),
  fans:    p(1884574, 900),
};

export const FOOTBALL_ICON = '/images/football.svg';
