package main

import (
	"fmt"
	"os"
	"strings"
	"time"

	"smart-market-gateway/trie"
)

func main() {
	fmt.Println("==================================================")
	fmt.Println("TEST: In-Memory Prefix Trie Search (<2ms Latency)")
	fmt.Println("==================================================")

	t := trie.NewPrefixTrie()

	// Seed sample tickers
	tickers := []*trie.SearchItem{
		{Symbol: "RELIANCE", Name: "Reliance Industries Ltd", Exchange: "NSE", Sector: "Energy", MarketCap: 2018500000000},
		{Symbol: "TCS", Name: "Tata Consultancy Services Ltd", Exchange: "NSE", Sector: "Information Technology", MarketCap: 1612400000000},
		{Symbol: "HDFCBANK", Name: "HDFC Bank Ltd", Exchange: "NSE", Sector: "Banking & Financials", MarketCap: 1254300000000},
		{Symbol: "INFY", Name: "Infosys Ltd", Exchange: "NSE", Sector: "Information Technology", MarketCap: 789200000000},
		{Symbol: "TATAMOTORS", Name: "Tata Motors Ltd", Exchange: "NSE", Sector: "Automobiles", MarketCap: 398500000000},
		{Symbol: "ZOMATO", Name: "Zomato Ltd", Exchange: "NSE", Sector: "Internet & E-Commerce", MarketCap: 245100000000},
		{Symbol: "NVDA", Name: "NVIDIA Corporation", Exchange: "NASDAQ", Sector: "Semiconductors & AI", MarketCap: 3120000000000},
	}

	for _, it := range tickers {
		t.Insert(it)
	}

	// Test 1: Symbol Prefix Match
	res := t.Search("rel", 10)
	if len(res) == 0 || res[0].Symbol != "RELIANCE" {
		fmt.Printf("FAILED: Expected RELIANCE for prefix 'rel', got %v\n", res)
		os.Exit(1)
	}
	fmt.Println("[PASS] Symbol Prefix Match ('rel' -> RELIANCE): PASSED")

	// Test 2: Company Name Word Match
	res2 := t.Search("consultancy", 10)
	if len(res2) == 0 || res2[0].Symbol != "TCS" {
		fmt.Printf("FAILED: Expected TCS for keyword 'consultancy', got %v\n", res2)
		os.Exit(1)
	}
	fmt.Println("[PASS] Company Name Word Match ('consultancy' -> TCS): PASSED")

	// Test 3: Multi-Result Search
	res3 := t.Search("tata", 10)
	if len(res3) < 2 {
		fmt.Printf("FAILED: Expected at least 2 results for 'tata', got %d\n", len(res3))
		os.Exit(1)
	}
	fmt.Printf("[PASS] Multi-Result Query ('tata' -> %d items found): PASSED\n", len(res3))

	// Test 4: Latency Benchmark under 10,000 queries
	iterations := 10000
	start := time.Now()
	for i := 0; i < iterations; i++ {
		t.Search("inf", 5)
	}
	elapsed := time.Since(start)
	avgLatency := float64(elapsed.Microseconds()) / float64(iterations)

	fmt.Printf("[PASS] Latency Benchmark (%d queries in %v): Avg %.3f µs/lookup (Target: <2000 µs)\n", iterations, elapsed, avgLatency)

	if avgLatency > 2000 {
		fmt.Println("FAILED: Lookup latency exceeded 2ms threshold!")
		os.Exit(1)
	}

	fmt.Println("\nAll In-Memory Prefix Trie Search tests PASSED!\n")
}
