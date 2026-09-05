package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"smart-market-gateway/db"
	"smart-market-gateway/store"
	"smart-market-gateway/trie"
)

type Server struct {
	hub        *Hub
	trie       *trie.PrefixTrie
	quoteStore *store.QuoteStore
	dbStore    *db.Store
}

func NewServer(hub *Hub, t *trie.PrefixTrie, qs *store.QuoteStore, ds *db.Store) *Server {
	return &Server{
		hub:        hub,
		trie:       t,
		quoteStore: qs,
		dbStore:    ds,
	}
}

func enableCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
}

func (s *Server) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/health", s.handleHealth)
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		ServeWS(s.hub, w, r)
	})

	mux.HandleFunc("/api/v1/search", s.handleSearch)
	mux.HandleFunc("/api/v1/quotes/snapshot", s.handleQuotesSnapshot)
	mux.HandleFunc("/api/v1/watchlists", s.handleWatchlists)
	mux.HandleFunc("/api/v1/watchlists/", s.handleWatchlistActions)
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":      "healthy",
		"service":     "golang_streaming_gateway",
		"timestamp":   time.Now().UnixMilli(),
		"activeItems": len(s.quoteStore.GetAll()),
	})
}

func (s *Server) handleSearch(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		return
	}

	query := r.URL.Query().Get("q")
	matches := s.trie.Search(query, 15)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"query":     query,
		"results":   matches,
		"count":     len(matches),
		"timestamp": time.Now().UnixMilli(),
	})
}

func (s *Server) handleQuotesSnapshot(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		return
	}

	quotes := s.quoteStore.GetAll()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"quotes":    quotes,
		"count":     len(quotes),
		"timestamp": time.Now().UnixMilli(),
	})
}

func (s *Server) handleWatchlists(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		return
	}

	userID := r.URL.Query().Get("userId")
	if userID == "" {
		userID = "default_user"
	}

	switch r.Method {
	case "GET":
		lists := s.dbStore.GetWatchlists(userID)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"watchlists": lists,
			"timestamp":  time.Now().UnixMilli(),
		})

	case "POST":
		var req struct {
			Title string `json:"title"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Title) == "" {
			http.Error(w, "Invalid title", http.StatusBadRequest)
			return
		}
		wl := s.dbStore.CreateWatchlist(userID, req.Title)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(wl)

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Server) handleWatchlistActions(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == "OPTIONS" {
		return
	}

	path := strings.TrimPrefix(r.URL.Path, "/api/v1/watchlists/")
	parts := strings.Split(path, "/")

	if len(parts) < 1 || parts[0] == "" {
		http.Error(w, "Invalid watchlist ID", http.StatusBadRequest)
		return
	}
	watchlistID := parts[0]

	// Handle /api/v1/watchlists/:id/reorder
	if len(parts) == 2 && parts[1] == "reorder" && r.Method == "PUT" {
		var req struct {
			SymbolOrder []string `json:"symbolOrder"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		if err := s.dbStore.ReorderItems(watchlistID, req.SymbolOrder); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"status": "reordered"})
		return
	}

	// Handle /api/v1/watchlists/:id/symbols
	if len(parts) >= 2 && parts[1] == "symbols" {
		switch r.Method {
		case "POST":
			var req struct {
				Symbol string `json:"symbol"`
			}
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Symbol == "" {
				http.Error(w, "Invalid symbol", http.StatusBadRequest)
				return
			}
			item, err := s.dbStore.AddItem(watchlistID, strings.ToUpper(req.Symbol))
			if err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(item)

		case "DELETE":
			if len(parts) != 3 {
				http.Error(w, "Symbol required", http.StatusBadRequest)
				return
			}
			sym := strings.ToUpper(parts[2])
			if err := s.dbStore.RemoveItem(watchlistID, sym); err != nil {
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{"status": "removed", "symbol": sym})

		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
		return
	}

	http.Error(w, fmt.Sprintf("Route not found: %s", r.URL.Path), http.StatusNotFound)
}
