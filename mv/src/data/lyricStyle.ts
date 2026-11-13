export type Layout =
  | 'bottom'
  | 'bottom-l'
  | 'top-r'
  | 'top-l'
  | 'v-right'
  | 'v-left'
  | 'center'
  | 'center-big'
  | 'dialog-l'
  | 'dialog-r'
  | 'soft';

/** Per-line placement chosen to stay clear of faces in the matching shot. */
export const LAYOUT: Layout[] = [
  // Verse 1
  'v-right', 'bottom-l', 'top-l', 'bottom', 'v-left', 'bottom', 'v-right', 'bottom',
  // Pre-Chorus
  'v-left', 'bottom', 'top-r', 'center',
  // Chorus
  'center-big', 'bottom', 'top-l', 'bottom', 'v-right', 'center', 'bottom', 'center',
  // Verse 2
  'top-r', 'bottom-l', 'v-right', 'bottom', 'bottom-l', 'bottom', 'top-l', 'center',
  // Bridge
  'dialog-l', 'dialog-r', 'v-right', 'top-r',
  // Final Chorus
  'center-big', 'bottom', 'v-left', 'bottom', 'top-l', 'bottom', 'bottom', 'center-big',
  // Outro
  'soft', 'soft',
];

export const EN: string[] = [
  'The clock on the windowsill stopped on the day the rain fell',
  'Little fish is still painting a sunny sky that has not yet dried',
  'With clumsy strokes she paints over her longing',
  'Saying that when the wind dies down, you will push open the door',
  'She has thumbed her diary to who knows which page',
  'Every "good night" written so earnestly, so neatly',
  'She lifts her head and asks me why winter nights are so long',
  'I blow out the last of the candle and wrap her in moonlight',
  'The firewood in the hearth will burn for only three nights',
  'The warmth you left behind is cooling, inch by inch',
  'Since the merciful god has already closed his eyes',
  'Then I will guard this little roof in your place',
  'Look — everything, everything I shaped for you',
  'Are the seasons you once promised us with a smile',
  'Now you sleep in a long, long silence',
  'Who will kiss the longing at the corner of her eyes for you?',
  'Quietly I open the letters you locked in the drawer',
  'And gather the twenty-four lost embers, one by one',
  'Not because I crave this hollow forever',
  'Only afraid that if we go out too, no one will remember you',
  'She sets a folded paper boat upon the shallow water',
  'Believing the stream will carry it to your pillow',
  'She blinks and asks me why the fire flickers',
  'I hide my frozen fingertips — "only the wind through the curtains"',
  'Her part is to live, innocent, in a yesterday that still has you',
  'Mine is to stay awake, and fulfil your final wish',
  'With the faint light you left, I mend the broken time',
  'And turn this long vigil into ordinary years',
  '"Hey… when is Master coming home?"',
  '"Soon. When the paint is dry, when spring\'s first flower blooms…"',
  'If, on the other shore, you ever look back upon this world',
  'Please listen to this poem I sing for you with the rest of my life',
  'Listen — everything, everything I shaped for you',
  'Was once your last farewell to the world',
  'Now I wear your old tenderness, and your devotion',
  'And write your unfinished promise, line by line',
  'Trading the little you left behind for long, long years',
  'Each morning, right on time, I light her days and nights',
  'Until the hearth turns to ash, until memory withers',
  'We are still alive, loving this world in your place',
  'Good night, my dear creator',
  'Tomorrow will be sunny too, won\'t it?',
];

/** Glow colour per section (rgb). */
export const GLOW: Record<string, string> = {
  'Verse 1': '170,200,255',
  'Pre-Chorus': '255,190,130',
  Chorus: '255,205,140',
  'Verse 2': '185,210,255',
  Bridge: '210,220,240',
  'Final Chorus': '255,214,150',
  Outro: '255,236,200',
};
