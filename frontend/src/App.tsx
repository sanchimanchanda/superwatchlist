import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  TrendingUp,
  Layers,
  Sparkles,
  Bell,
  Check,
  ChevronRight,
  ShieldAlert,
  Flame,
  Activity,
  Edit2,
  Trash2
} from 'lucide-react';
import { Quote, Watchlist, SearchResult, CatchUpSummary, MeaningfulAnomaly } from './types';
import {
  fetchWatchlists,
  createWatchlist,
  addSymbolToWatchlist,
  removeSymbolFromWatchlist,
  searchSymbols,
  fetchQuotesSnapshot,
  fetchCatchUpSummary,
  triggerManualSync,
  renameWatchlist,
  deleteWatchlist
} from './services/api';
import { wsClient } from './services/websocket';
import { saveSessionSnapshot } from './services/sessionTracker';
import { SyncStatusWidget } from './components/SyncStatusWidget';
import { CatchUpBanner } from './components/CatchUpBanner';
import { WatchlistTable } from './components/WatchlistTable';
import { MarketDepthModal } from './components/MarketDepthModal';
import { QuickOrderModal } from './components/QuickOrderModal';
import { ChartDrawer } from './components/ChartDrawer';

export const App: React.FC = () => {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('wl_nifty_core');
  const [quotesMap, setQuotesMap] = useState<Record<string, Quote>>({});
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [catchUpSummary, setCatchUpSummary] = useState<CatchUpSummary | null>(null);
  const [isFilterActiveMovers, setIsFilterActiveMovers] = useState<boolean>(false);

  // Search & Autocomplete
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Active Modals
  const [depthQuote, setDepthQuote] = useState<Quote | null>(null);
  const [chartQuote, setChartQuote] = useState<Quote | null>(null);
  const [orderState, setOrderState] = useState<{ quote: Quote; side: 'BUY' | 'SELL' } | null>(null);
  const [isNewWatchlistModal, setIsNewWatchlistModal] = useState(false);

  // Rename & Delete Watchlist Modals
  const [isRenameModal, setIsRenameModal] = useState(false);
  const [watchlistToRename, setWatchlistToRename] = useState<Watchlist | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [isDeleteModal, setIsDeleteModal] = useState(false);
  const [watchlistToDelete, setWatchlistToDelete] = useState<Watchlist | null>(null);

  const [newWatchlistTitle, setNewWatchlistTitle] = useState('');

  // Live anomaly alerts
  const [recentAnomaly, setRecentAnomaly] = useState<MeaningfulAnomaly | null>(null);

  // 1. Initial Data Fetch & WebSocket Setup
  useEffect(() => {
    async function init() {
      const [lists, quotes, summary] = await Promise.all([
        fetchWatchlists(),
        fetchQuotesSnapshot(),
        fetchCatchUpSummary()
      ]);

      setWatchlists(lists);
      if (lists.length > 0) setActiveTabId(lists[0].id);

      const map: Record<string, Quote> = {};
      quotes.forEach((q) => {
        map[q.symbol] = q;
      });
      setQuotesMap(map);
      setCatchUpSummary(summary);
    }

    init();
    wsClient.connect();

    const unsubTicks = wsClient.onTick((updatedQuotes) => {
      setQuotesMap((prev) => {
        const next = { ...prev };
        updatedQuotes.forEach((q) => {
          next[q.symbol] = q;
        });
        return next;
      });
      setLastUpdated(Date.now());
    });

    const unsubAnomalies = wsClient.onAnomaly((anomaly) => {
      setRecentAnomaly(anomaly);
      setTimeout(() => setRecentAnomaly(null), 6000);
    });

    // Save session snapshot on page blur/unload
    const handleUnload = () => {
      saveSessionSnapshot(Object.values(quotesMap));
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      unsubTicks();
      unsubAnomalies();
      wsClient.disconnect();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  // 2. Search Autocomplete Debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const res = await searchSymbols(searchQuery);
      setSearchResults(res);
      setIsSearching(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 3. Resolve Current Watchlist Quotes
  const activeWatchlist = useMemo(() => {
    return watchlists.find((w) => w.id === activeTabId);
  }, [watchlists, activeTabId]);

  const displayedQuotes = useMemo(() => {
    const allQuotes = Object.values(quotesMap);

    // Special Smart Tab: Most Active Now
    if (activeTabId === 'wl_smart_active') {
      const sorted = [...allQuotes].sort((a, b) => b.volume - a.volume).slice(0, 10);
      if (sorted.length > 0) return sorted;
      if (activeWatchlist && activeWatchlist.items.length > 0) {
        return activeWatchlist.items.map((i) => quotesMap[i.symbol.toUpperCase()] || quotesMap[i.symbol]).filter(Boolean);
      }
      return [];
    }

    // Special Smart Tab: 52W Breakouts
    if (activeTabId === 'wl_smart_breakout') {
      // Stocks trading within 5% of 52W High
      const breakouts = allQuotes.filter((q) => q.ltp >= q.week52High * 0.95);
      if (breakouts.length > 0) return breakouts;
      // Fallback to explicit seed items for 52W breakouts
      if (activeWatchlist && activeWatchlist.items.length > 0) {
        const seedItems = activeWatchlist.items.map((i) => quotesMap[i.symbol.toUpperCase()] || quotesMap[i.symbol]).filter(Boolean);
        if (seedItems.length > 0) return seedItems;
      }
      // Proximity sort fallback
      return [...allQuotes].sort((a, b) => (b.ltp / b.week52High) - (a.ltp / a.week52High)).slice(0, 5);
    }

    // Special Smart Tab: All Equities
    if (activeTabId === 'wl_all') {
      return allQuotes;
    }

    // Standard User Watchlist
    if (!activeWatchlist) return [];
    let list = activeWatchlist.items
      .map((item) => quotesMap[item.symbol.toUpperCase()] || quotesMap[item.symbol])
      .filter(Boolean);

    // Filter movers only if toggle is active
    if (isFilterActiveMovers) {
      const filtered = list.filter((q) => Math.abs(q.changePct) >= 1.5 || q.ltp >= q.week52High * 0.95);
      if (filtered.length > 0) return filtered;
    }

    return list;
  }, [quotesMap, activeWatchlist, activeTabId, isFilterActiveMovers]);

  // Actions
  const handleManualSync = async () => {
    setIsSyncing(true);
    await triggerManualSync();
    setTimeout(() => setIsSyncing(false), 800);
  };

  const handleAddSymbol = async (symbol: string) => {
    if (!activeWatchlist || activeWatchlist.isSystem) {
      alert('Please select a custom watchlist to add symbols.');
      return;
    }
    const ok = await addSymbolToWatchlist(activeWatchlist.id, symbol);
    if (ok) {
      const updated = await fetchWatchlists();
      setWatchlists(updated);
      setSearchQuery('');
    }
  };

  const handleRemoveSymbol = async (symbol: string) => {
    if (!activeWatchlist || activeWatchlist.isSystem) return;
    const ok = await removeSymbolFromWatchlist(activeWatchlist.id, symbol);
    if (ok) {
      const updated = await fetchWatchlists();
      setWatchlists(updated);
    }
  };


  const handleRenameWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!watchlistToRename || !renameTitle.trim()) return;
    const ok = await renameWatchlist(watchlistToRename.id, renameTitle.trim());
    if (ok) {
      const updated = await fetchWatchlists();
      setWatchlists(updated);
      setIsRenameModal(false);
      setWatchlistToRename(null);
      setRenameTitle('');
    }
  };

  const handleDeleteWatchlist = async () => {
    if (!watchlistToDelete) return;
    const ok = await deleteWatchlist(watchlistToDelete.id);
    if (ok) {
      const updated = await fetchWatchlists();
      setWatchlists(updated);
      if (activeTabId === watchlistToDelete.id) {
        setActiveTabId(updated.length > 0 ? updated[0].id : 'wl_nifty_core');
      }
      setIsDeleteModal(false);
      setWatchlistToDelete(null);
    }
  };

  const openRenameModal = (wl: Watchlist, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setWatchlistToRename(wl);
    setRenameTitle(wl.title);
    setIsRenameModal(true);
  };

  const openDeleteModal = (wl: Watchlist, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setWatchlistToDelete(wl);
    setIsDeleteModal(true);
  };

  const handleCreateWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWatchlistTitle.trim()) return;
    const created = await createWatchlist(newWatchlistTitle.trim());
    if (created) {
      const updated = await fetchWatchlists();
      setWatchlists(updated);
      setActiveTabId(created.id);
      setIsNewWatchlistModal(false);
      setNewWatchlistTitle('');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '24px 32px' }}>
      {/* Top Header Bar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        paddingBottom: '18px',
        borderBottom: '1px solid var(--border-color)',
        gap: '20px',
        flexWrap: 'wrap'
      }}>
        {/* Logo & Product Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #00c087 0%, #387ed1 100%)',
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(0, 192, 135, 0.3)'
          }}>
            <Activity size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Growly
              </h1>
              <span className="badge badge-purple">Groww Code 2026</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              1-Minute Real-Time Intelligence & Meaningful Change Engine
            </p>
          </div>
        </div>

        {/* Global Search Autocomplete Bar */}
        <div style={{ position: 'relative', width: '380px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            gap: '8px'
          }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search ticker, company or sector (e.g. RELIANCE, TCS)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                outline: 'none',
                width: '100%',
                fontSize: '13px'
              }}
            />
            {isSearching && <span className="num-tabular" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>...</span>}
          </div>

          {/* Search Dropdown Results */}
          {searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '6px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              zIndex: 50,
              maxHeight: '280px',
              overflowY: 'auto'
            }}>
              {searchResults.map((res) => (
                <div
                  key={res.symbol}
                  onClick={() => handleAddSymbol(res.symbol)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px' }}>{res.symbol}</span>
                      <span className="badge badge-blue" style={{ fontSize: '10px' }}>{res.exchange}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {res.name} • {res.sector}
                    </div>
                  </div>

                  <button
                    type="button"
                    style={{
                      background: 'var(--color-green-bg)',
                      color: 'var(--color-green)',
                      border: '1px solid rgba(0, 192, 135, 0.3)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Plus size={12} /> Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 1-Minute Live Sync Widget */}
        <SyncStatusWidget
          lastUpdated={lastUpdated}
          onManualSync={handleManualSync}
          isSyncing={isSyncing}
        />
      </header>

      {/* Real-time Anomaly Toast Notification */}
      {recentAnomaly && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(235, 91, 60, 0.2) 0%, var(--bg-card) 100%)',
          border: '1px solid var(--color-red)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="badge badge-red">
              <Flame size={13} /> {recentAnomaly.type}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{recentAnomaly.headline}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>— {recentAnomaly.description}</span>
          </div>
          <span className="badge badge-purple">Attention Score: {recentAnomaly.attentionScore}</span>
        </div>
      )}

      {/* "Since You Were Away" Catch-Up Intelligence Banner */}
      <CatchUpBanner
        summary={catchUpSummary}
        onFilterChangedOnly={() => setIsFilterActiveMovers(!isFilterActiveMovers)}
        isFilterActive={isFilterActiveMovers}
      />

      {/* Multi-Watchlist Tab Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '8px',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }}>
          {watchlists.map((wl) => {
            const isActive = wl.id === activeTabId;
            return (
              <div
                key={wl.id}
                onClick={() => {
                  setActiveTabId(wl.id);
                  setIsFilterActiveMovers(false);
                }}
                style={{
                  background: isActive ? 'var(--bg-card)' : 'transparent',
                  color: isActive ? 'var(--color-green)' : 'var(--text-secondary)',
                  border: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
                  borderBottom: isActive ? '2px solid var(--color-green)' : 'none',
                  borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                  padding: '8px 14px',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s'
                }}
              >
                <span>{wl.title}</span>
                <span style={{
                  fontSize: '11px',
                  background: 'var(--bg-secondary)' ,
                  color: 'var(--text-muted)' ,
                  padding: '1px 6px',
                  borderRadius: '10px'
                }} className="num-tabular">
                  {wl.id === 'wl_smart_breakout'
                    ? (Object.values(quotesMap).filter((q) => q.ltp >= q.week52High * 0.95).length || (wl.items ? wl.items.length : 2))
                    : wl.id === 'wl_smart_active'
                    ? (Object.values(quotesMap).length > 0 ? Math.min(Object.values(quotesMap).length, 10) : (wl.items ? wl.items.length : 3))
                    : (wl.items ? wl.items.length : 0)}
                </span>

                {/* Inline Quick Action for Custom Watchlists */}
                {!wl.isSystem && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', marginLeft: '4px' }}>
                    <span
                      onClick={(e) => openRenameModal(wl, e)}
                      title="Rename Watchlist"
                      style={{
                        padding: '2px 4px',
                        borderRadius: '3px',
                        color: 'var(--text-muted)',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-primary)')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
                    >
                      <Edit2 size={11} />
                    </span>
                    <span
                      onClick={(e) => openDeleteModal(wl, e)}
                      title="Delete Watchlist"
                      style={{
                        padding: '2px 4px',
                        borderRadius: '3px',
                        color: 'var(--text-muted)',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--color-red)')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}
                    >
                      <Trash2 size={11} />
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {/* New Watchlist Button */}
          <button
            onClick={() => setIsNewWatchlistModal(true)}
            style={{
              background: 'transparent',
              border: '1px dashed var(--border-color)',
              color: 'var(--text-muted)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginLeft: '6px'
            }}
          >
            <Plus size={13} /> New Watchlist
          </button>
        </div>

        {/* Action Controls for Active Custom Watchlist */}
        {activeWatchlist && !activeWatchlist.isSystem && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => openRenameModal(activeWatchlist)}
              title="Rename active watchlist"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                padding: '5px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Edit2 size={12} /> Rename
            </button>
            <button
              onClick={() => openDeleteModal(activeWatchlist)}
              title="Delete active watchlist"
              style={{
                background: 'rgba(235, 91, 60, 0.1)',
                border: '1px solid rgba(235, 91, 60, 0.3)',
                color: 'var(--color-red)',
                padding: '5px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Main Watchlist Grid Table */}
      <main>
        <WatchlistTable
          quotes={displayedQuotes}
          onOpenDepth={(q) => setDepthQuote(q)}
          onOpenChart={(q) => setChartQuote(q)}
          onOpenOrder={(q, side) => setOrderState({ quote: q, side })}
          onRemoveSymbol={activeWatchlist && !activeWatchlist.isSystem ? handleRemoveSymbol : undefined}
        />
      </main>

      {/* Modals */}
      {depthQuote && (
        <MarketDepthModal quote={depthQuote} onClose={() => setDepthQuote(null)} />
      )}

      {chartQuote && (
        <ChartDrawer quote={chartQuote} onClose={() => setChartQuote(null)} />
      )}

      {orderState && (
        <QuickOrderModal
          quote={orderState.quote}
          initialSide={orderState.side}
          onClose={() => setOrderState(null)}
        />
      )}

      
      {/* Rename Watchlist Modal */}
      {isRenameModal && watchlistToRename && (
        <div className="modal-overlay" onClick={() => setIsRenameModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '380px', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>Rename Watchlist</h3>
            <form onSubmit={handleRenameWatchlist}>
              <input
                type="text"
                placeholder="New Watchlist Name..."
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '14px',
                  marginBottom: '16px'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsRenameModal(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'var(--color-green)',
                    border: 'none',
                    color: '#fff',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Watchlist Confirmation Modal */}
      {isDeleteModal && watchlistToDelete && (
        <div className="modal-overlay" onClick={() => setIsDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '400px', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: 'var(--color-red)' }}>
              Delete Watchlist
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Are you sure you want to delete <strong>"{watchlistToDelete.title}"</strong>? All symbols tracked in this watchlist will be removed.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsDeleteModal(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteWatchlist}
                style={{
                  background: 'var(--color-red)',
                  border: 'none',
                  color: '#fff',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Delete Watchlist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Watchlist Modal */}
      {isNewWatchlistModal && (
        <div className="modal-overlay" onClick={() => setIsNewWatchlistModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '380px', padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>Create New Watchlist</h3>
            <form onSubmit={handleCreateWatchlist}>
              <input
                type="text"
                placeholder="e.g. Dividend Yielders, EV Momentum..."
                value={newWatchlistTitle}
                onChange={(e) => setNewWatchlistTitle(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '14px',
                  marginBottom: '16px'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsNewWatchlistModal(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'var(--color-green)',
                    border: 'none',
                    color: '#fff',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default App;
