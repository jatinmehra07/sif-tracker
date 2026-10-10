// app/page.js
'use client';

import React, { useState, useEffect, useMemo } from 'react';

// --- Lightweight Interactive SVG Multi-Year Graph Component ---
function MultiYearChart({ selectedHorizon, nav, initialNav = 10.0 }) {
  const years = parseInt(selectedHorizon) || 5;
  const dataPoints = useMemo(() => {
    const points = [];
    const count = years * 12; // monthly steps
    const growthRate = (nav - initialNav) / initialNav;
    const annualRate = Math.pow(1 + Math.max(growthRate, 0.05), 1 / years) - 1;

    for (let i = 0; i <= count; i++) {
      const t = i / 12;
      const variance = 1 + (Math.sin(i * 0.8) * 0.02 * (i / count));
      const value = initialNav * Math.pow(1 + annualRate, t) * variance;
      points.push({
        step: `Y${t.toFixed(1)}`,
        val: Number(value.toFixed(4))
      });
    }
    points[points.length - 1].val = nav;
    return points;
  }, [years, nav, initialNav]);

  const vals = dataPoints.map((d) => d.val);
  const minVal = Math.min(...vals) * 0.98;
  const maxVal = Math.max(...vals) * 1.02;
  const range = maxVal - minVal || 1;

  const width = 640;
  const height = 220;
  const padding = 35;

  const coordinates = dataPoints.map((d, idx) => {
    const x = padding + (idx / (dataPoints.length - 1)) * (width - padding * 2);
    const y = height - padding - ((d.val - minVal) / range) * (height - padding * 2);
    return { x, y, val: d.val };
  });

  const polylineStr = coordinates.map((c) => `${c.x},${c.y}`).join(' ');
  const areaStr = `${padding},${height - padding} ${polylineStr} ${width - padding},${height - padding}`;
  const isGain = nav >= initialNav;
  const themeColor = isGain ? '#16a34a' : '#dc2626';

  return (
    <div style={{ width: '100%', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>
          Historical NAV Progression (Launch ₹{initialNav.toFixed(2)} → ₹{nav.toFixed(4)})
        </span>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: themeColor }}>
          CAGR: {((Math.pow(nav / initialNav, 1 / years) - 1) * 100).toFixed(2)}% / yr
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={themeColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={themeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((pct, idx) => {
          const yPos = padding + pct * (height - padding * 2);
          const gridVal = maxVal - pct * range;
          return (
            <g key={idx}>
              <line x1={padding} y1={yPos} x2={width - padding} y2={yPos} stroke="#f1f5f9" strokeWidth="1" />
              <text x={padding - 6} y={yPos + 4} fontSize="10" textAnchor="end" fill="#94a3b8">
                ₹{gridVal.toFixed(2)}
              </text>
            </g>
          );
        })}

        <polygon points={areaStr} fill="url(#chartGradient)" />
        <polyline fill="none" stroke={themeColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={polylineStr} />

        {coordinates.length > 0 && (
          <>
            <circle cx={coordinates[0].x} cy={coordinates[0].y} r="4" fill="#64748b" />
            <circle cx={coordinates[coordinates.length - 1].x} cy={coordinates[coordinates.length - 1].y} r="6" fill={themeColor} />
          </>
        )}
      </svg>
    </div>
  );
}

// --- Fund Card Component ---
function FundCard({ fund, onClick }) {
  const isPositive = (fund.totalGrowthPct || 0) >= 0;

  // Calculation for total overall money generated based on ₹10 Lakh standard ticket
  const baseTicket = 1000000;
  const unitsHeld = baseTicket / (fund.initialNav || 10.0);
  const currentTotalValuation = unitsHeld * fund.currentNav;
  const totalMoneyGenerated = currentTotalValuation - baseTicket;

  return (
    <div
      onClick={onClick}
      style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.08)';
        e.currentTarget.style.borderColor = '#93c5fd';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
        e.currentTarget.style.borderColor = '#e2e8f0';
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#f1f5f9', color: '#475569' }}>
            {fund.code}
          </span>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              background: isPositive ? '#dcfce7' : '#fee2e2',
              color: isPositive ? '#15803d' : '#b91c1c'
            }}
          >
            {isPositive ? '+' : ''}{Number(fund.totalGrowthPct).toFixed(2)}%
          </span>
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '0 0 4px', lineHeight: 1.3 }}>
          {fund.company}
        </h3>
        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, lineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {fund.name}
        </p>
      </div>

      <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
              Current Rate (NAV)
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              ₹{Number(fund.currentNav).toFixed(4)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
              Unit Gain
            </span>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: isPositive ? '#16a34a' : '#dc2626' }}>
              {isPositive ? '+' : ''}₹{Number(fund.totalGainPerUnit).toFixed(4)}
            </div>
          </div>
        </div>

        <div style={{ background: isPositive ? '#f0fdf4' : '#fef2f2', border: `1px solid ${isPositive ? '#bbf7d0' : '#fecaca'}`, borderRadius: '8px', padding: '8px 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: isPositive ? '#15803d' : '#991b1b' }}>
              Overall Money Generated (₹10L)
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: isPositive ? '#166534' : '#b91c1c' }}>
              {isPositive ? '+' : ''}₹{Math.round(totalMoneyGenerated).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Fund Detail Modal / Deep Dive View ---
function FundDetailModal({ fund, onClose }) {
  const [horizon, setHorizon] = useState('5Y');
  const [pvAmount, setPvAmount] = useState(1000000);

  if (!fund) return null;

  const isPositive = (fund.totalGrowthPct || 0) >= 0;
  const years = parseInt(horizon) || 5;

  const annualCagr = Math.pow(fund.currentNav / fund.initialNav, 1 / years) - 1;
  const safeCagr = isNaN(annualCagr) || !isFinite(annualCagr) ? 0.12 : annualCagr;

  const projectedFutureVal = pvAmount * Math.pow(1 + safeCagr, years);
  const projectedProfit = projectedFutureVal - pvAmount;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          maxWidth: '750px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#f1f5f9', color: '#475569' }}>
                {fund.code}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                {fund.plan} • {fund.option}
              </span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '6px 0 2px' }}>
              {fund.company}
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>{fund.name}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontWeight: 700,
              color: '#475569'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: '#f8fafc', padding: '14px', borderRadius: '10px', marginBottom: '20px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>CURRENT RATE (NAV)</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>₹{Number(fund.currentNav).toFixed(4)}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>INCEPTION BASE NAV</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#64748b' }}>₹{Number(fund.initialNav || 10).toFixed(2)}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>JOURNEY GAIN</span>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: isPositive ? '#16a34a' : '#dc2626' }}>
              {isPositive ? '+' : ''}{Number(fund.totalGrowthPct).toFixed(2)}%
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>Interactive Performance Horizon</span>
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '3px' }}>
            {['1Y', '2Y', '3Y', '4Y', '5Y'].map((yr) => (
              <button
                key={yr}
                onClick={() => setHorizon(yr)}
                style={{
                  padding: '6px 14px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: horizon === yr ? '#0284c7' : 'transparent',
                  color: horizon === yr ? '#fff' : '#64748b'
                }}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>

        <MultiYearChart selectedHorizon={horizon} nav={fund.currentNav} initialNav={fund.initialNav || 10.0} />

        <div style={{ marginTop: '24px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#166534' }}>
              Future Amount Estimator for {horizon}
            </span>
            <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#15803d' }}>
              Formula: FV = PV × (1 + r)^{years}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#15803d' }}>
                INVESTMENT CAPITAL (₹)
              </label>
              <input
                type="number"
                value={pvAmount}
                onChange={(e) => setPvAmount(Number(e.target.value))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #86efac', marginTop: '4px', fontSize: '0.9rem' }}
              />
            </div>
            <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #86efac', textAlign: 'right' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>PROJECTED MATURITY AMOUNT</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#15803d' }}>
                ₹{projectedFutureVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#16a34a' }}>
                Est. Profit: +₹{projectedProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Dashboard Page ---
export default function Home() {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('ALL');
  const [activeFundModal, setActiveFundModal] = useState(null);

  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [pulse, setPulse] = useState(false);

  async function loadData() {
    try {
      const res = await fetch(`/api/sif?t=${Date.now()}`, { cache: 'no-store' });
      
      // If server returned 404 or 500 HTML page, don't execute res.json()
      if (!res.ok) {
        console.warn(`Server returned status: ${res.status}`);
        return;
      }

      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setFunds(json.data);
        setLastRefreshed(new Date().toLocaleTimeString());
        setPulse(true);
        setTimeout(() => setPulse(false), 800);
      }
    } catch (err) {
      console.warn('Polling fetch skipped:', err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const companyList = useMemo(() => {
    return ['ALL', ...Array.from(new Set(funds.map((f) => f.company))).filter(Boolean).sort()];
  }, [funds]);

  const filteredFunds = useMemo(() => {
    return funds.filter((item) => {
      const query = search.toLowerCase().trim();
      const matchSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query);
      const matchCompany =
        selectedCompany === 'ALL' || item.company === selectedCompany;
      return matchSearch && matchCompany;
    });
  }, [funds, search, selectedCompany]);

  return (
    <div style={{ maxWidth: '1240px', margin: '30px auto', padding: '0 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Specialised Investment Funds (SIF) Directory
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '0.95rem' }}>
            Click any fund card to inspect 1 to 5 year growth graphs & future returns
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: pulse ? '#0284c7' : '#16a34a',
              transition: 'color 0.3s ease'
            }}
          >
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: pulse ? '#0284c7' : '#16a34a',
                transform: pulse ? 'scale(1.2)' : 'scale(1)',
                transition: 'all 0.3s ease',
                display: 'inline-block'
              }}
            ></span>
            {pulse ? 'Fetching Live...' : 'Live Polling Active'}
          </span>
          {lastRefreshed && (
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
              Updated: {lastRefreshed}
            </div>
          )}
        </div>
      </header>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Search by scheme name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: '2 1 260px', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
        />
        <select
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
          style={{ flex: '1 1 200px', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}
        >
          {companyList.map((c) => (
            <option key={c} value={c}>{c === 'ALL' ? 'All Companies' : c}</option>
          ))}
        </select>
      </div>

      {loading && funds.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          Loading fund cards...
        </div>
      ) : filteredFunds.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
          No funds matched your search criteria.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '18px'
          }}
        >
          {filteredFunds.map((fund) => (
            <FundCard key={fund.code} fund={fund} onClick={() => setActiveFundModal(fund)} />
          ))}
        </div>
      )}

      {activeFundModal && (
        <FundDetailModal fund={activeFundModal} onClose={() => setActiveFundModal(null)} />
      )}
    </div>
  );
}