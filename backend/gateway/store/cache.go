package store

import (
	"sync"
)

type Quote struct {
	Symbol               string    `json:"symbol"`
	Name                 string    `json:"name"`
	Exchange             string    `json:"exchange"`
	Sector               string    `json:"sector"`
	LTP                  float64   `json:"ltp"`
	Open                 float64   `json:"open"`
	High                 float64   `json:"high"`
	Low                  float64   `json:"low"`
	PrevClose            float64   `json:"prevClose"`
	Change               float64   `json:"change"`
	ChangePct            float64   `json:"changePct"`
	Volume               int64     `json:"volume"`
	VWAP                 float64   `json:"vwap"`
	Week52High           float64   `json:"week52High"`
	Week52Low            float64   `json:"week52Low"`
	MarketCap            int64     `json:"marketCap"`
	TickDirection        int       `json:"tickDirection"`
	IsUpperCircuit       bool      `json:"isUpperCircuit"`
	IsLowerCircuit       bool      `json:"isLowerCircuit"`
	IsStale              bool      `json:"isStale"`
	Sparkline            []float64 `json:"sparkline"`
	LastUpdated          int64     `json:"lastUpdated"`
	NextRefreshInSeconds int       `json:"nextRefreshInSeconds"`
}

type QuoteStore struct {
	mu     sync.RWMutex
	quotes map[string]*Quote
}

func NewQuoteStore() *QuoteStore {
	return &QuoteStore{
		quotes: make(map[string]*Quote),
	}
}

func (s *QuoteStore) Set(q *Quote) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.quotes[q.Symbol] = q
}

func (s *QuoteStore) SetBatch(quotes []*Quote) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, q := range quotes {
		s.quotes[q.Symbol] = q
	}
}

func (s *QuoteStore) Get(symbol string) (*Quote, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	q, exists := s.quotes[symbol]
	return q, exists
}

func (s *QuoteStore) GetAll() []*Quote {
	s.mu.RLock()
	defer s.mu.RUnlock()
	list := make([]*Quote, 0, len(s.quotes))
	for _, q := range s.quotes {
		list = append(list, q)
	}
	return list
}
