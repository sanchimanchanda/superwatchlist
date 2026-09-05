package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
	"smart-market-gateway/db"
	"smart-market-gateway/server"
	"smart-market-gateway/store"
	"smart-market-gateway/trie"
)

func seedTrie(t *trie.PrefixTrie) {
	seedTickers := []*trie.SearchItem{
		{Symbol: "RELIANCE", Name: "Reliance Industries Ltd", Exchange: "NSE", Sector: "Energy", MarketCap: 2018500000000},
		{Symbol: "TCS", Name: "Tata Consultancy Services Ltd", Exchange: "NSE", Sector: "Information Technology", MarketCap: 1612400000000},
		{Symbol: "HDFCBANK", Name: "HDFC Bank Ltd", Exchange: "NSE", Sector: "Banking & Financials", MarketCap: 1254300000000},
		{Symbol: "INFY", Name: "Infosys Ltd", Exchange: "NSE", Sector: "Information Technology", MarketCap: 789200000000},
		{Symbol: "ICICIBANK", Name: "ICICI Bank Ltd", Exchange: "NSE", Sector: "Banking & Financials", MarketCap: 872100000000},
		{Symbol: "BHARTIARTL", Name: "Bharti Airtel Ltd", Exchange: "NSE", Sector: "Telecommunications", MarketCap: 894500000000},
		{Symbol: "SBIN", Name: "State Bank of India", Exchange: "NSE", Sector: "Banking & Financials", MarketCap: 742100000000},
		{Symbol: "TATAMOTORS", Name: "Tata Motors Ltd", Exchange: "NSE", Sector: "Automobiles", MarketCap: 398500000000},
		{Symbol: "ITC", Name: "ITC Ltd", Exchange: "NSE", Sector: "FMCG & Consumer", MarketCap: 612400000000},
		{Symbol: "LT", Name: "Larsen & Toubro Ltd", Exchange: "NSE", Sector: "Engineering & Capital Goods", MarketCap: 518400000000},
		{Symbol: "ZOMATO", Name: "Zomato Ltd", Exchange: "NSE", Sector: "Internet & E-Commerce", MarketCap: 245100000000},
		{Symbol: "NVDA", Name: "NVIDIA Corporation", Exchange: "NASDAQ", Sector: "Semiconductors & AI", MarketCap: 3120000000000},
		{Symbol: "AAPL", Name: "Apple Inc", Exchange: "NASDAQ", Sector: "Technology & Consumer Electronics", MarketCap: 3450000000000},
		{Symbol: "GOOGL", Name: "Alphabet Inc", Exchange: "NASDAQ", Sector: "Internet & AI", MarketCap: 2150000000000},
		{Symbol: "MSFT", Name: "Microsoft Corporation", Exchange: "NASDAQ", Sector: "Software & Cloud", MarketCap: 3200000000000},
		{Symbol: "TSLA", Name: "Tesla Inc", Exchange: "NASDAQ", Sector: "Automotive & Clean Tech", MarketCap: 780000000000},
	}

	for _, item := range seedTickers {
		t.Insert(item)
	}
	log.Printf("Seeded %d tickers into in-memory Trie index", len(seedTickers))
}

func startRedisSubscriber(rdb *redis.Client, hub *server.Hub, quoteStore *store.QuoteStore) {
	ctx := context.Background()
	pubsub := rdb.Subscribe(ctx, "market:ticks", "market:anomalies")

	ch := pubsub.Channel()
	log.Println("Subscribed to Redis channels: market:ticks, market:anomalies")

	for msg := range ch {
		// Broadcast message to all WebSocket clients
		hub.Broadcast([]byte(msg.Payload))

		// If it's a TICK_BATCH, update in-memory quote store
		if msg.Channel == "market:ticks" {
			var envelope struct {
				Type string `json:"type"`
				Data struct {
					Symbols []*store.Quote `json:"symbols"`
				} `json:"data"`
			}
			if err := json.Unmarshal([]byte(msg.Payload), &envelope); err == nil {
				quoteStore.SetBatch(envelope.Data.Symbols)
			}
		}
	}
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "4000"
	}

	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "localhost:6379"
	}

	// 1. Initialize Trie & Stores
	prefixTrie := trie.NewPrefixTrie()
	seedTrie(prefixTrie)

	quoteStore := store.NewQuoteStore()
	dbStore := db.NewStore()

	// 2. Initialize WebSocket Hub
	hub := server.NewHub()
	go hub.Run()

	// 3. Connect to Redis Pub/Sub
	rdb := redis.NewClient(&redis.Options{
		Addr: redisURL,
	})

	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		if err := rdb.Ping(ctx).Err(); err == nil {
			log.Println("Connected to Redis Pub/Sub successfully")
			startRedisSubscriber(rdb, hub, quoteStore)
		} else {
			log.Printf("Redis not available (%v). Operating in standalone mode.", err)
		}
	}()

	// 4. Register HTTP & WS Routes
	srv := server.NewServer(hub, prefixTrie, quoteStore, dbStore)
	mux := http.NewServeMux()
	srv.RegisterRoutes(mux)

	addr := fmt.Sprintf("0.0.0.0:%s", port)
	log.Printf("Golang Streaming Gateway listening on http://%s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
