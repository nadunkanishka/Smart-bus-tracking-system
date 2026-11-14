import React from 'react';
import Icon from './Icon';

// The panel a data table sits in.
export default function TableShell({ children }) {
  return <div className="panel table-shell">{children}</div>;
}

// The single row a table shows when it has no rows: an optional illustration and a line of text.
export function EmptyRow({ colSpan, art, children }) {
  return (
    <tr>
      <td colSpan={colSpan} className="cell-empty">
        <div className="empty-state">{art}{children}</div>
      </td>
    </tr>
  );
}

// Edit / Delete buttons at the end of a row. Leave out onEdit for a row that cannot be edited.
export function RowActions({ onEdit, onDelete, deleteDisabled = false, deleteTitle }) {
  return (
    <div className="table-actions">
      {onEdit && <button type="button" className="btn btn-edit" onClick={onEdit}><Icon type="edit" />Edit</button>}
      <button type="button" className="btn btn-danger" disabled={deleteDisabled} title={deleteTitle} onClick={onDelete}><Icon type="trash" />Delete</button>
    </div>
  );
}
