// Navigation icons for the whole system: chunky filled two-tone glyphs on a 24 grid, as in the reference's bar.
// One data source rendered by native (react-native-svg) and web (admin sidebar). Each part is [path, role, strokeWidth?]:
// role 'main' takes the item colour, 'accent' takes the second tone; a strokeWidth makes it a round-capped line.
export const NAV_ICONS = {
  home: [
    ['M4 11.3a1.6 1.6 0 0 1 .6-1.2l6.4-5.5a1.6 1.6 0 0 1 2 0l6.4 5.5a1.6 1.6 0 0 1 .6 1.2V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z', 'main'],
    ['M9.6 21v-4.6a1.4 1.4 0 0 1 1.4-1.4h2a1.4 1.4 0 0 1 1.4 1.4V21z', 'accent'],
  ],
  arrow: [
    ['M12 2.9l7.8 17.1a1 1 0 0 1-1.4 1.2L12 18z', 'main'],
    ['M12 2.9v15.1l-6.4 3.2A1 1 0 0 1 4.2 20z', 'accent'],
  ],
  route: [
    ['M6.5 21a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM17.5 9a3 3 0 1 1 0-6 3 3 0 0 1 0 6z', 'main'],
    ['M9.7 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h5.3', 'accent', 2.4],
  ],
  user: [
    ['M4 20.2c0-3.6 3.6-6 8-6s8 2.4 8 6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z', 'main'],
    ['M12 12.2a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4z', 'accent'],
  ],
  gauge: [
    ['M12 4a10 10 0 0 0-10 10c0 1.7.4 3.3 1.2 4.7.3.5.9.8 1.5.8h14.6c.6 0 1.2-.3 1.5-.8A9.9 9.9 0 0 0 22 14 10 10 0 0 0 12 4z', 'main'],
    ['M12 14.5l4-4', 'accent', 2.6],
  ],
  people: [
    ['M9 11.6a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2zM2.5 20c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1z', 'main'],
    ['M16.5 4.6a3.6 3.6 0 0 1 0 6.9 3.6 3.6 0 0 0 0-6.9zM17.6 14.7c2.6.4 4.9 2 4.9 4.8a1 1 0 0 1-1 1.5h-3.4c.2-.5.3-1 .3-1.5 0-1.7-.3-3.2-.8-4.8z', 'accent'],
  ],
  bus: [
    ['M5 7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v10.5H5zM6 17h4.2a1 1 0 0 1 1 1v1.6a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zM13.8 17H18v2.6a1 1 0 0 1-1 1h-3.2a1 1 0 0 1-1-1V18a1 1 0 0 1 1-1z', 'main'],
    ['M7.4 7.2h9.2a.8.8 0 0 1 .8.8v3.2a.8.8 0 0 1-.8.8H7.4a.8.8 0 0 1-.8-.8V8a.8.8 0 0 1 .8-.8z', 'accent'],
  ],
  pulse: [
    ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'main'],
    ['M6.2 12h3l1.9-4.2 2.6 8.2 1.9-4H17.8', 'accent', 2.2],
  ],
  chart: [
    ['M4 13.5A1.5 1.5 0 0 1 5.5 12h1A1.5 1.5 0 0 1 8 13.5V19a1.5 1.5 0 0 1-1.5 1.5h-1A1.5 1.5 0 0 1 4 19zM16 9.5a1.5 1.5 0 0 1 1.5-1.5h1A1.5 1.5 0 0 1 20 9.5V19a1.5 1.5 0 0 1-1.5 1.5h-1A1.5 1.5 0 0 1 16 19z', 'main'],
    ['M10 5.5A1.5 1.5 0 0 1 11.5 4h1A1.5 1.5 0 0 1 14 5.5V19a1.5 1.5 0 0 1-1.5 1.5h-1A1.5 1.5 0 0 1 10 19z', 'accent'],
  ],
};

// Item colours: inactive items are two greys, the current item is lilac with the orange accent.
export const NAV_TONES = { idle: ['#9A9CA6', '#5E626C'], active: ['#AFB6FA', '#FFA265'] };
