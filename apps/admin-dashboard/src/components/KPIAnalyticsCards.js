import React from 'react';

export default function KPIAnalyticsCards() {
  const kpis = [
    {
      label: 'ACTIVE FLEET ONLINE',
      value: '42 / 45',
      subtext: '● 93.3% Operational Rate',
    },
    {
      label: 'AVG SYSTEM LATENCY',
      value: '18 ms',
      subtext: '⚡ Optimal Socket Health',
    },
    {
      label: 'DWELL TIME VARIANCE',
      value: '± 1.2 min',
      subtext: '↓ 14% vs Historical Avg',
    },
    {
      label: 'PREDICTION ACCURACY',
      value: '96.4%',
      subtext: '↑ XGBoost Model Accuracy',
    },
  ];

  return (
    <section className="kpi-section">
      {kpis.map((kpi, index) => (
        <div key={index} className="kpi-card">
          <div className="kpi-label">{kpi.label}</div>
          <div className="kpi-value">{kpi.value}</div>
          <div className="kpi-subtext">{kpi.subtext}</div>
        </div>
      ))}
    </section>
  );
}
