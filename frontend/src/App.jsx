```jsx
import { useState, useEffect } from 'react'
import './App.css'

const BACKEND = 'http://localhost:8000'
const POLL_MS = 2000
const COACH_ID = 'COACH-A1'

export default function App() {
  const [data, setData] = useState(null)
  const [history, setHistory] = useState([])
  const [err, setErr] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  async function fetchAll() {
    try {
      const [latestRes, histRes] = await Promise.all([
        fetch(BACKEND + '/occupancy/latest?coach_id=' + COACH_ID),
        fetch(BACKEND + '/occupancy/history?coach_id=' + COACH_ID + '&limit=30'),
      ])

      if (!latestRes.ok) {
        throw new Error('HTTP ' + latestRes.status)
      }

      const latest = await latestRes.json()
      const hist = histRes.ok ? await histRes.json() : []

      setData(latest)
      setHistory(hist)
      setErr(null)
      setLastUpdate(new Date())
    } catch (e) {
      setErr(e.message)
    }
  }

  useEffect(() => {
    fetchAll()

    const id = setInterval(fetchAll, POLL_MS)

    return () => clearInterval(id)
  }, [])

  const capacity = data?.capacity ?? 50
  const people = data?.people_in_frame ?? 0
  const vacancy = data?.vacancy ?? capacity

  const pct = data
    ? Math.min(Math.round((people / capacity) * 100), 100)
    : 0

  const statusColor =
    pct >= 90
      ? '#ef4444'
      : pct >= 70
        ? '#f59e0b'
        : '#22c55e'

  const statusLabel =
    pct >= 90
      ? 'FULL'
      : pct >= 70
        ? 'BUSY'
        : 'AVAILABLE'

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <div className="logo-dot" />

          <div>
            <h1 className="header-title">
              Metro Occupancy
            </h1>

            <p className="header-sub">
              {data
                ? data.train_id + ' · ' + data.coach_id
                : 'Connecting…'}
            </p>
          </div>
        </div>

        <div className="header-right">
          <span
            className="status-badge"
            style={{
              color: statusColor,
              borderColor: statusColor,
            }}
          >
            <span
              className="status-dot"
              style={{
                background: statusColor,
              }}
            />

            {statusLabel}
          </span>

          {lastUpdate && (
            <span className="update-time">
              Updated {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </header>

      {err && (
        <div className="error-banner">
          ⚠ Backend offline — {err}
        </div>
      )}

      <main className="main">
        <section className="hero-section">
          <div className="big-stat">
            <div
              className="big-num"
              style={{ color: statusColor }}
            >
              {people}
            </div>

            <div className="big-label">
              people in frame
            </div>
          </div>

          <div className="divider-arrow">→</div>

          <div className="big-stat">
            <div
              className="big-num"
              style={{ color: '#22c55e' }}
            >
              {vacancy}
            </div>

            <div className="big-label">
              vacancy ({capacity} max)
            </div>
          </div>

          <div className="divider-arrow">·</div>

          <div className="big-stat">
            <div
              className="big-num"
              style={{ color: statusColor }}
            >
              {pct}%
            </div>

            <div className="big-label">
              filled
            </div>
          </div>
        </section>

        <section className="cards-section">
          <div className="card" id="card-frame">
            <div className="card-label">
              In Frame
            </div>

            <div
              className="card-val"
              style={{ color: '#818cf8' }}
            >
              {people}
            </div>

            <div className="card-sub">
              {pct}% of {capacity} max
            </div>

            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: pct + '%',
                  background: statusColor,
                }}
              />
            </div>
          </div>

          <div className="card" id="card-vacancy">
            <div className="card-label">
              Vacancy
            </div>

            <div
              className="card-val"
              style={{ color: '#4ade80' }}
            >
              {vacancy}
            </div>

            <div className="card-sub">
              of {capacity} spots free
            </div>

            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: (vacancy / capacity * 100) + '%',
                  background: '#22c55e',
                }}
              />
            </div>
          </div>

          <div className="card" id="card-cumul">
            <div className="card-label">
              Cumul. Count
            </div>

            <div
              className="card-val"
              style={{ color: '#fb923c' }}
            >
              {data ? data.passenger_count : '–'}
            </div>

            <div className="card-sub">
              entries − exits
            </div>
          </div>

          <div className="card" id="card-status">
            <div className="card-label">
              Status
            </div>

            <div
              className="card-val"
              style={{
                color: statusColor,
                fontSize: '1.6rem',
              }}
            >
              {statusLabel}
            </div>

            <div className="card-sub">
              {data ? data.device_status : '–'}
            </div>
          </div>
        </section>

        <section className="table-section">
          <h2 className="section-title">
            Recent Readings
          </h2>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>In Frame</th>
                  <th>Vacancy</th>
                  <th>Cumul.</th>
                  <th>Fill %</th>
                </tr>
              </thead>

              <tbody>
                {[...history]
                  .reverse()
                  .slice(0, 10)
                  .map((row, i) => {
                    const rp = Math.round(
                      (row.people_in_frame / capacity) * 100
                    )

                    const rc =
                      rp >= 90
                        ? '#ef4444'
                        : rp >= 70
                          ? '#f59e0b'
                          : '#22c55e'

                    return (
                      <tr
                        key={i}
                        className={
                          i === 0
                            ? 'row-latest'
                            : ''
                        }
                      >
                        <td className="td-time">
                          {new Date(
                            row.timestamp
                          ).toLocaleTimeString()}
                        </td>

                        <td>
                          <strong>
                            {row.people_in_frame}
                          </strong>
                        </td>

                        <td>
                          {row.vacancy}
                        </td>

                        <td>
                          {row.passenger_count}
                        </td>

                        <td>
                          <span
                            className="pill"
                            style={{
                              color: rc,
                              borderColor: rc,
                            }}
                          >
                            {rp}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}

                {history.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="no-data"
                    >
                      No data yet — start the edge camera
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}
```