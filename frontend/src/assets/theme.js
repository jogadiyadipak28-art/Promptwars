// Light blue + green palette with pink & red accents
export const theme = {
  blue:       '#7DD3FC',
  blueDeep:   '#38BDF8',
  blueDark:   '#0EA5E9',
  green:      '#4ADE80',
  greenDeep:  '#34D399',
  greenDark:  '#10B981',
  pink:       '#F472B6',
  pinkDeep:   '#EC4899',
  red:        '#F87171',
  redDeep:    '#EF4444',
  bg:         '#F8FAFC',
  bgDeep:     '#FFFFFF',
  white:      '#FFFFFF',
};

export const gradients = {
  primary:   'linear-gradient(135deg, #38BDF8, #4ADE80)',
  hero:      'linear-gradient(135deg, #7DD3FC, #34D399, #F472B6)',
  button:    'linear-gradient(135deg, #7DD3FC, #4ADE80)',
  shimmer:   'linear-gradient(90deg, #7DD3FC 25%, #4ADE80 45%, #F472B6 55%, #7DD3FC 75%)',
  tab:       'linear-gradient(135deg, #38BDF8, #34D399)',
};

// Tab accent colors for the app section
export const TAB_COLORS = {
  chatbot:        theme.blue,
  assistant:      theme.blueDeep,
  navigation:     theme.green,
  crowd:          theme.red,
  translate:      theme.greenDeep,
  transport:      theme.blue,
  sustainability: theme.green,
  alerts:         theme.pink,
  volunteer:      theme.pinkDeep,
};
