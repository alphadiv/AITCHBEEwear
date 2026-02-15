import { useState, useRef, useEffect } from 'react';
import { countryCodes } from '../utils/countryCodes';
import './CountryCodeSelector.css';

export default function CountryCodeSelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = countryCodes.find((c) => c.code === value) || countryCodes[0];
  const filtered = countryCodes.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.code.includes(search)
  );

  return (
    <div className="country-code-selector" ref={wrapperRef}>
      <button type="button" className="country-code-trigger" onClick={() => setOpen(!open)}>
        <span className="country-code-flag">{selected.flag}</span>
        <span className="country-code-value">{selected.code}</span>
        <span className="country-code-arrow">▼</span>
      </button>
      {open && (
        <div className="country-code-dropdown">
          <input
            type="text"
            className="country-code-search"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className="country-code-list">
            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                className="country-code-option"
                onClick={() => {
                  onChange(c.code);
                  setOpen(false);
                  setSearch('');
                }}
              >
                <span className="country-code-flag">{c.flag}</span>
                <span className="country-code-name">{c.name}</span>
                <span className="country-code-code">{c.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
