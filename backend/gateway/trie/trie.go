package trie

import (
	"strings"
	"sync"
)

// SearchItem represents an indexable asset
type SearchItem struct {
	Symbol    string `json:"symbol"`
	Name      string `json:"name"`
	Exchange  string `json:"exchange"`
	Sector    string `json:"sector"`
	MarketCap int64  `json:"marketCap"`
}

type Node struct {
	children map[rune]*Node
	items    []*SearchItem
	isEnd    bool
}

type PrefixTrie struct {
	root *Node
	mu   sync.RWMutex
}

func NewPrefixTrie() *PrefixTrie {
	return &PrefixTrie{
		root: &Node{children: make(map[rune]*Node)},
	}
}

// Insert adds a search item indexed across symbol, company name, and sector keywords
func (t *PrefixTrie) Insert(item *SearchItem) {
	t.mu.Lock()
	defer t.mu.Unlock()

	// Index full symbol
	t.insertTerm(strings.ToLower(item.Symbol), item)

	// Index words in company name
	words := strings.Fields(strings.ToLower(item.Name))
	for _, word := range words {
		t.insertTerm(word, item)
	}

	// Index sector words
	sectorWords := strings.Fields(strings.ToLower(item.Sector))
	for _, sw := range sectorWords {
		t.insertTerm(sw, swItem(item))
	}
}

func swItem(item *SearchItem) *SearchItem {
	return item
}

func (t *PrefixTrie) insertTerm(term string, item *SearchItem) {
	current := t.root
	for _, ch := range term {
		if _, exists := current.children[ch]; !exists {
			current.children[ch] = &Node{children: make(map[rune]*Node)}
		}
		current = current.children[ch]
		// Append item to path if not already present in slice
		if !containsItem(current.items, item.Symbol) {
			current.items = append(current.items, item)
		}
	}
	current.isEnd = true
}

func containsItem(slice []*SearchItem, symbol string) bool {
	for _, it := range slice {
		if it.Symbol == symbol {
			return true
		}
	}
	return false
}

// Search returns all matching items for a given prefix in <2ms
func (t *PrefixTrie) Search(query string, limit int) []*SearchItem {
	t.mu.RLock()
	defer t.mu.RUnlock()

	q := strings.ToLower(strings.TrimSpace(query))
	if q == "" {
		return []*SearchItem{}
	}

	current := t.root
	for _, ch := range q {
		if next, exists := current.children[ch]; exists {
			current = next
		} else {
			return []*SearchItem{}
		}
	}

	// Collect items up to limit
	result := current.items
	if limit > 0 && len(result) > limit {
		result = result[:limit]
	}
	return result
}
