// frontend/src/components/network/StationList.jsx
import React, { useState } from 'react';
import { useMetro } from '../../context/MetroContext';
import { PUNE_METRO_STATIONS, PUNE_METRO_LINES } from '../../constants/puneMetroData';
import { Search, MapPin, Radio, ArrowRight } from 'lucide-react';

export function StationList() {
  const { selectedStationId, setSelectedStationId, setActiveTab } = useMetro();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLine, setFilterLine] = useState('all');

  const filteredStations = PUNE_METRO_STATIONS.filter((station) => {
    const matchesSearch =
      station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.marathiName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLine =
      filterLine === 'all' ||
      station.line === filterLine ||
      (station.isInterchange && (filterLine === 'purple-line' || filterLine === 'aqua-line'));

    return matchesSearch && matchesLine;
  });

  return (
    <div className="card station-list-card">
      <div className="list-search-header">
        <h3 className="card-heading">Station Directory</h3>
        <div className="search-input-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search station in English or Marathi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="station-search-field"
          />
        </div>
      </div>

      <div className="stations-scroll-list">
        {filteredStations.map((station) => {
          const isSelected = selectedStationId === station.id;
          const isPurple = station.line === 'purple-line';
          const isAqua = station.line === 'aqua-line';
          const isInterchange = station.isInterchange;

          return (
            <div
              key={station.id}
              onClick={() => setSelectedStationId(station.id)}
              className={`station-item-row ${isSelected ? 'selected-row' : ''}`}
            >
              <div className="station-row-left">
                <div
                  className="station-line-badge-dot"
                  style={{
                    backgroundColor: isInterchange ? '#FF6B00' : isPurple ? '#7C3AED' : '#0284C7',
                  }}
                />
                <div className="station-row-titles">
                  <div className="station-main-name">
                    <span>{station.name}</span>
                    <span className="station-code">[{station.code}]</span>
                    {station.hasCameraStream && (
                      <span className="live-stream-tag">LIVE EDGE CV</span>
                    )}
                  </div>
                  <div className="station-sub-name">{station.marathiName} · {station.type}</div>
                </div>
              </div>

              <div className="station-row-right">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStationId(station.id);
                    setActiveTab('station');
                  }}
                  className="inspect-btn"
                  title="View detailed station analytics"
                >
                  Inspect <ArrowRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

