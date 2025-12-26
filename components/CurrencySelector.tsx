
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Currency, SUPPORTED_CURRENCIES } from '../types';
import { Search, ChevronDown, Check, X } from 'lucide-react';

interface Props {
  selected: Currency & { rate: number };
  onSelect: (currency: Currency) => void;
}

const CurrencySelector: React.FC<Props> = ({ selected, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredCurrencies = useMemo(() => {
    const term = search.toLowerCase();
    return SUPPORTED_CURRENCIES.filter(c => 
      c.code.toLowerCase().includes(term) || 
      c.label.toLowerCase().includes(term)
    );
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center gap-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all shadow-lg active:scale-95 min-w-[130px]"
      >
        <div className="flex flex-col items-start leading-tight">
          <span className="text-[10px] text-slate-500 font-bold uppercase">Base Unit</span>
          <span className="font-bold text-blue-400">{selected.code}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b border-slate-700 flex items-center gap-2 bg-slate-900/50">
            <Search className="w-4 h-4 text-slate-500 ml-1" />
            <input 
              autoFocus
              type="text"
              placeholder="搜尋計價單位 (如 BTC, SOL...)"
              className="bg-transparent border-none outline-none text-sm w-full py-1 text-slate-200 placeholder:text-slate-600"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="p-1 hover:bg-slate-700 rounded-full">
                <X className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>
          
          <div className="max-h-72 overflow-y-auto custom-scrollbar">
            {filteredCurrencies.length > 0 ? (
              <div className="p-1">
                {filteredCurrencies.map((c) => (
                  <button
                    key={c.code}
                    role="option"
                    aria-selected={selected.code === c.code}
                    onClick={() => {
                      onSelect(c);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors text-left mb-1 last:mb-0 ${
                      selected.code === c.code ? 'bg-blue-600/20' : 'hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-100">{c.code}</span>
                        <span className="text-xs text-slate-500 font-medium">{c.symbol}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{c.label}</div>
                    </div>
                    {selected.code === c.code && (
                      <div className="bg-blue-500 p-1 rounded-full shadow-lg shadow-blue-500/20">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center">
                  <Search className="w-5 h-5 text-slate-700" />
                </div>
                <p className="text-sm text-slate-500">找不到相符的幣種</p>
              </div>
            )}
          </div>
          
          <div className="p-3 bg-slate-900/30 text-[10px] text-slate-500 text-center border-t border-slate-700/50">
            當前換算基準：1 USDT ≈ {selected.rate.toLocaleString(undefined, { maximumFractionDigits: 8 })} {selected.code}
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencySelector;
