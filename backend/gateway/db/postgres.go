package db

import (
	"fmt"
	"sort"
	"sync"
	"time"
)

type WatchlistItem struct {
	ID          string `json:"id"`
	WatchlistID string `json:"watchlistId"`
	Symbol      string `json:"symbol"`
	OrderRank   string `json:"orderRank"`
	AddedAt     int64  `json:"addedAt"`
}

type Watchlist struct {
	ID        string          `json:"id"`
	UserID    string          `json:"userId"`
	Title     string          `json:"title"`
	IsSystem  bool            `json:"isSystem"`
	Items     []WatchlistItem `json:"items"`
	CreatedAt int64           `json:"createdAt"`
	UpdatedAt int64           `json:"updatedAt"`
}

type Store struct {
	mu         sync.RWMutex
	watchlists map[string]*Watchlist
}

func NewStore() *Store {
	s := &Store{
		watchlists: make(map[string]*Watchlist),
	}
	s.seedDefaultWatchlists()
	return s
}

func (s *Store) seedDefaultWatchlists() {
	now := time.Now().UnixMilli()

	wl1 := &Watchlist{
		ID:        "wl_nifty_core",
		UserID:    "default_user",
		Title:     "Nifty 50 Core",
		IsSystem:  false,
		CreatedAt: now,
		UpdatedAt: now,
		Items: []WatchlistItem{
			{ID: "item_1", WatchlistID: "wl_nifty_core", Symbol: "RELIANCE", OrderRank: "0|hzzzzz:", AddedAt: now},
			{ID: "item_2", WatchlistID: "wl_nifty_core", Symbol: "TCS", OrderRank: "0|i00000:", AddedAt: now},
			{ID: "item_3", WatchlistID: "wl_nifty_core", Symbol: "HDFCBANK", OrderRank: "0|i00001:", AddedAt: now},
			{ID: "item_4", WatchlistID: "wl_nifty_core", Symbol: "INFY", OrderRank: "0|i00002:", AddedAt: now},
			{ID: "item_5", WatchlistID: "wl_nifty_core", Symbol: "ICICIBANK", OrderRank: "0|i00003:", AddedAt: now},
			{ID: "item_6", WatchlistID: "wl_nifty_core", Symbol: "TATAMOTORS", OrderRank: "0|i00004:", AddedAt: now},
			{ID: "item_7", WatchlistID: "wl_nifty_core", Symbol: "BHARTIARTL", OrderRank: "0|i00005:", AddedAt: now},
			{ID: "item_8", WatchlistID: "wl_nifty_core", Symbol: "ZOMATO", OrderRank: "0|i00006:", AddedAt: now},
		},
	}

	wl2 := &Watchlist{
		ID:        "wl_tech_growth",
		UserID:    "default_user",
		Title:     "Tech & AI Growth",
		IsSystem:  false,
		CreatedAt: now,
		UpdatedAt: now,
		Items: []WatchlistItem{
			{ID: "item_9", WatchlistID: "wl_tech_growth", Symbol: "TCS", OrderRank: "0|hzzzzz:", AddedAt: now},
			{ID: "item_10", WatchlistID: "wl_tech_growth", Symbol: "INFY", OrderRank: "0|i00000:", AddedAt: now},
			{ID: "item_11", WatchlistID: "wl_tech_growth", Symbol: "NVDA", OrderRank: "0|i00001:", AddedAt: now},
			{ID: "item_12", WatchlistID: "wl_tech_growth", Symbol: "GOOGL", OrderRank: "0|i00002:", AddedAt: now},
			{ID: "item_13", WatchlistID: "wl_tech_growth", Symbol: "MSFT", OrderRank: "0|i00003:", AddedAt: now},
			{ID: "item_14", WatchlistID: "wl_tech_growth", Symbol: "AAPL", OrderRank: "0|i00004:", AddedAt: now},
		},
	}

	wl3 := &Watchlist{
		ID:        "wl_smart_active",
		UserID:    "default_user",
		Title:     "🔥 Most Active Now",
		IsSystem:  true,
		CreatedAt: now,
		UpdatedAt: now,
		Items: []WatchlistItem{
			{ID: "item_15", WatchlistID: "wl_smart_active", Symbol: "ZOMATO", OrderRank: "0|hzzzzz:", AddedAt: now},
			{ID: "item_16", WatchlistID: "wl_smart_active", Symbol: "TATAMOTORS", OrderRank: "0|i00000:", AddedAt: now},
			{ID: "item_17", WatchlistID: "wl_smart_active", Symbol: "RELIANCE", OrderRank: "0|i00001:", AddedAt: now},
			{ID: "item_18", WatchlistID: "wl_smart_active", Symbol: "NVDA", OrderRank: "0|i00002:", AddedAt: now},
		},
	}

	s.watchlists[wl1.ID] = wl1
	s.watchlists[wl2.ID] = wl2
	s.watchlists[wl3.ID] = wl3
}

func (s *Store) GetWatchlists(userID string) []*Watchlist {
	s.mu.RLock()
	defer s.mu.RUnlock()

	res := make([]*Watchlist, 0)
	for _, wl := range s.watchlists {
		if wl.UserID == userID || wl.IsSystem {
			// Sort items by OrderRank ascending
			sortedItems := make([]WatchlistItem, len(wl.Items))
			copy(sortedItems, wl.Items)
			sort.Slice(sortedItems, func(i, j int) bool {
				return sortedItems[i].OrderRank < sortedItems[j].OrderRank
			})

			wlCopy := *wl
			wlCopy.Items = sortedItems
			res = append(res, &wlCopy)
		}
	}
	return res
}

func (s *Store) CreateWatchlist(userID, title string) *Watchlist {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now().UnixMilli()
	id := fmt.Sprintf("wl_%d", now)
	wl := &Watchlist{
		ID:        id,
		UserID:    userID,
		Title:     title,
		IsSystem:  false,
		Items:     []WatchlistItem{},
		CreatedAt: now,
		UpdatedAt: now,
	}
	s.watchlists[id] = wl
	return wl
}

func (s *Store) AddItem(watchlistID, symbol string) (*WatchlistItem, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	wl, exists := s.watchlists[watchlistID]
	if !exists {
		return nil, fmt.Errorf("watchlist not found")
	}

	for _, it := range wl.Items {
		if it.Symbol == symbol {
			return &it, nil // Already in watchlist
		}
	}

	now := time.Now().UnixMilli()
	orderRank := fmt.Sprintf("0|i%05d:", len(wl.Items))
	item := WatchlistItem{
		ID:          fmt.Sprintf("item_%d", now),
		WatchlistID: watchlistID,
		Symbol:      symbol,
		OrderRank:   orderRank,
		AddedAt:     now,
	}
	wl.Items = append(wl.Items, item)
	wl.UpdatedAt = now
	return &item, nil
}

func (s *Store) RemoveItem(watchlistID, symbol string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	wl, exists := s.watchlists[watchlistID]
	if !exists {
		return fmt.Errorf("watchlist not found")
	}

	idx := -1
	for i, it := range wl.Items {
		if it.Symbol == symbol {
			idx = i
			break
		}
	}

	if idx != -1 {
		wl.Items = append(wl.Items[:idx], wl.Items[idx+1:]...)
		wl.UpdatedAt = time.Now().UnixMilli()
	}
	return nil
}

func (s *Store) ReorderItems(watchlistID string, symbolOrder []string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	wl, exists := s.watchlists[watchlistID]
	if !exists {
		return fmt.Errorf("watchlist not found")
	}

	newItems := make([]WatchlistItem, 0)
	for i, sym := range symbolOrder {
		for _, it := range wl.Items {
			if it.Symbol == sym {
				it.OrderRank = fmt.Sprintf("0|i%05d:", i)
				newItems = append(newItems, it)
				break
			}
		}
	}
	wl.Items = newItems
	wl.UpdatedAt = time.Now().UnixMilli()
	return nil
}
