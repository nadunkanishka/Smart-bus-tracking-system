import React from 'react';
import { Vehicle } from '../design/Vehicle';
import Icon from './Icon';
import PageHeader from './PageHeader';
import TableShell, { EmptyRow, RowActions } from './TableShell';
import { ENTITIES } from '../entities';

// The list page of drivers, buses or routes: heading and add button, the table, an empty or loading row, and
// edit / delete on each row. `columns` is [{ header, className?, cell(record) }]; the labels come from entities.js.
export default function EntityList({ entity, page, art, records, columns, loading, openModal, openConfirm }) {
  const { labels } = ENTITIES[entity];
  return (
    <section className="page-section" data-page={page}>
      <PageHeader subtitle={labels.subtitle}>
        <button type="button" className="btn btn-primary" onClick={() => openModal(entity)}>
          <Icon type="plus" />
          {labels.addButton}
        </button>
      </PageHeader>
      <TableShell>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((c) => <th key={c.header}>{c.header}</th>)}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <EmptyRow colSpan={columns.length + 1} art={<Vehicle name={art.name} width={art.width} label="Nothing here yet" />}>
                {loading ? labels.loading : labels.empty}
              </EmptyRow>
            ) : (
              records.map((record) => (
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
