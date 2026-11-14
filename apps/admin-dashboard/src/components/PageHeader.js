import React, { createContext, useContext } from 'react';

// The page being shown (its entry in pages.js). App provides it, so a page's heading comes from the registry.
export const CurrentPage = createContext({ title: '' });

// A page's heading row: the registry title, a one-line description, and the page's own actions on the right.
export default function PageHeader({ subtitle, children }) {
  const { title } = useContext(CurrentPage);
  return (
    <div className="section-header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
