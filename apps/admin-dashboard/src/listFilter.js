// Search and status filter for the drivers, buses and routes lists. They filter the records already loaded in the page.

// Records whose `status` matches (ALL matches every status), whose searchable fields contain every word typed, and that
// pass the optional extra test. Words are matched in any order, ignoring case and extra spaces.
export const ALL = 'All';

const haystack = (record, keys) => keys.map((k) => (Array.isArray(record[k]) ? record[k].join(' ') : String(record[k] ?? ''))).join(' ').toLowerCase();

export function filterRecords(records, { text = '', status = ALL, extra = null } = {}, searchKeys = []) {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  return records.filter((record) => {
    if (status !== ALL && record.status !== status) return false;
    if (extra && !extra(record)) return false;
    if (!words.length) return true;
    const hay = haystack(record, searchKeys);
    return words.every((w) => hay.includes(w));
  });
}

// How many records each status has (for the pill labels), ignoring the status filter itself but not the search text.
export function statusCounts(records, statuses) {
  const counts = { [ALL]: records.length };
  statuses.forEach((s) => { counts[s] = records.filter((r) => r.status === s).length; });
  return counts;
}
