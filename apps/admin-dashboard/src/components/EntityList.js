import React, { useMemo, useState } from 'react';
import { Vehicle } from '../design/Vehicle';
import Icon from './Icon';
import PageHeader from './PageHeader';
import TableShell, { EmptyRow, RowActions } from './TableShell';
import { ENTITIES } from '../entities';
import { ALL, filterRecords, statusCounts } from '../listFilter';

// The list page of drivers, buses or routes: heading and add button, the table, an empty or loading row, and
// edit / delete on each row. `columns` is [{ header, className?, cell(record) }]; the labels come from entities.js.
// Above the table: a search box, a pill per status (with how many records have it) and an optional extra filter
// `extraFilter` = { label, options: [{ value, label }], test(record, value) }, a second dropdown a page can add.
export default function EntityList({ entity, page, art, records, columns, loading, openModal, openConfirm, extraFilter }) {
  const { labels, noun, collection, statuses, searchKeys } = ENTITIES[entity];
  const [text, setText] = useState('');
  const [status, setStatus] = useState(ALL);
  const [extra, setExtra] = useState(ALL);
  const counts = useMemo(() => statusCounts(records, statuses), [records, statuses]);
  const shown = useMemo(
    () => filterRecords(records, { text, status, extra: extraFilter && extra !== ALL ? (r) => extraFilter.test(r, extra) : null }, searchKeys),
    [records, text, status, extra, extraFilter, searchKeys],
  );
  const filtering = text.trim() !== '' || status !== ALL || extra !== ALL;
  const clear = () => { setText(''); setStatus(ALL); setExtra(ALL); };
  return (
    <section className="page-section" data-page={page}>
      <PageHeader subtitle={labels.subtitle}>
        <button type="button" className="btn btn-primary" onClick={() => openModal(entity)}>
          <Icon type="plus" />
          {labels.addButton}
        </button>
      </PageHeader>
      {records.length > 0 && (
        <div className="list-toolbar">
          <div className="input-wrap list-search">
            <Icon type="search" className="lead" />
            <input className="form-input" type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder={`Search ${collection}`} aria-label={`Search ${collection}`} />
          </div>
          {extraFilter && (
            <select className="form-input list-extra" value={extra} onChange={(e) => setExtra(e.target.value)} aria-label={extraFilter.label}>
              <option value={ALL}>{extraFilter.label}: all</option>
              {extraFilter.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          )}
          <div className="pills" role="group" aria-label={`${noun} status`}>
            {[ALL, ...statuses].map((s) => (
              <button key={s} type="button" className={`pill-toggle ${status === s ? 'on' : ''}`} aria-pressed={status === s} onClick={() => setStatus(s)}>
                {s} <span className="pill-count">{counts[s]}</span>
              </button>
            ))}
          </div>
          {filtering && <span className="list-count">{shown.length} of {records.length} <button type="button" className="btn-link" onClick={clear}>Clear</button></span>}
        </div>
      )}
      <TableShell>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((c) => <th key={c.header}>{c.header}</th>)}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <EmptyRow colSpan={columns.length + 1} art={<Vehicle name={art.name} width={art.width} label="Nothing here yet" />}>
                {loading ? labels.loading : records.length === 0 ? labels.empty : 'No matches. Change the search or the filters.'}
              </EmptyRow>
            ) : (
              shown.map((record) => (
                <tr key={record.id}>
                  {columns.map((c) => <td key={c.header} className={c.className}>{c.cell(record)}</td>)}
                  <td>
                    <RowActions onEdit={() => openModal(entity, 'edit', record)} onDelete={() => openConfirm(entity, record)} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableShell>
    </section>
  );
}
