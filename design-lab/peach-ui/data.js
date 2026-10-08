// All content lives here: change text, numbers, people and chart values without touching components.
// HOOK: replace this object with data from your API; the components only read these shapes.
window.PEACH_DATA = {
  user: { name: 'Jacob', progress: 76, hasNotifications: true, person: 0 },
  people: [
    { name: 'Jacob', skin: '#F2C9A5', hair: '#6B4A32', bg: '#DDD8FA', glasses: true },
    { name: 'Amara', skin: '#F5D3B0', hair: '#3A2A22', bg: '#FBE3A6' },
    { name: 'Leo', skin: '#E8B48C', hair: '#8A5A3C', bg: '#CFC9F7', glasses: true },
    { name: 'Nisha', skin: '#C98F6B', hair: '#2B1F1B', bg: '#BFE8CF' },
  ],
  nav: [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'tasks', label: 'Tasks', icon: 'list' },
    { id: 'progress', label: 'Progress', icon: 'award' },
    { id: 'courses', label: 'My courses', icon: 'book' },
    { id: 'settings', label: 'Settings', icon: 'gear' },
  ],
  hero: { title: 'A series of Olympiads', before: 'A series of', highlight: 'Olympiads', after: 'for erudite people from all over the world', progress: 68 },
  stats: [
    { label: 'Lessons', value: 78, tone: 'orange', icon: 'list' },
    { label: 'Hours', value: 43, tone: 'purple', icon: 'clock' },
  ],
  performance: {
    title: 'Progress performance',
    months: [{ name: 'June', lessons: 23, tone: 'orange' }, { name: 'July', lessons: 43, tone: 'purple' }, { name: 'August', lessons: 12, tone: 'grey' }],
  },
  courses: {
    title: 'My courses',
    chips: [{ label: '12 Subjects', icon: 'book', tone: 'dark' }, { label: '43 Lessons', icon: 'layers', tone: 'tint' }],
    subjects: [{ name: 'Literature', art: 'books' }, { name: 'Math', art: 'abacus' }, { name: 'Biology', art: 'dna' }, { name: 'History', art: 'books' }],
    cards: [
      { tone: 'dark', eyebrow: 'Geometry in action', title: 'Creative approaches to plane shapes', icon: 'spiral', people: [0, 1, 2], more: 43, progress: 72 },
      { tone: 'lilac', eyebrow: 'The microcosm around us', title: 'Discoveries in cell biology', icon: 'helix', people: [1, 2, 3], more: 12, progress: 40 },
    ],
  },
  progress: {
    title: 'Progress',
    filters: ['All subjects', 'Literature', 'Math', 'Biology'],
    periods: {
      Weekly: { lessons: 48, hours: 12, bars: [['Mon', 39], ['Tue', 14], ['Wed', 48], ['Thr', 24], ['Fri', 22]] },
      Month: { lessons: 186, hours: 51, bars: [['W1', 41], ['W2', 52], ['W3', 38], ['W4', 55]] },
    },
    slides: 3,
    rating: { title: 'Rating of students', sub: '10 best students', people: [1, 2, 3] },
  },
};
