// Seconds as m:ss, or a dash when there is no value.
export const mmss = (sec) => (sec == null ? '—' : `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`);
