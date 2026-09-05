"""
FastAPI Analytics & Google API Ingestion Service
Runs the 1-minute Google Finance Ingestion Loop and Publishes to Redis.
"""

import asyncio
import json
import logging
import os
import time
from typing import List, Optional
from fastapi import FastAPI, BackgroundTasks, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import redis.asyncio as aioredis
from pydantic import BaseModel

from google_ingest import GoogleFinanceIngestor
from anomaly_engine import AnomalyEngine
from session_diff import SessionDiffEngine

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("analytics_service")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

from contextlib import asynccontextmanager

active_websockets: List[WebSocket] = []

async def broadcast_ws(message: dict):
    if not active_websockets:
        return
    disconnected = []
    text_data = json.dumps(message)
    for ws in active_websockets:
        try:
            await ws.send_text(text_data)
        except Exception:
            disconnected.append(ws)
    for ws in disconnected:
        if ws in active_websockets:
            active_websockets.remove(ws)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await get_redis()
    task = asyncio.create_task(market_ingestion_background_loop())
    yield
    # Shutdown
    global is_running_loop, redis_client
    is_running_loop = False
    task.cancel()
    if redis_client:
        await redis_client.close()

app = FastAPI(
    title="Smart Market Watchlist Analytics & Ingestion Service",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ingestor = GoogleFinanceIngestor()
anomaly_engine = AnomalyEngine()
redis_client: Optional[aioredis.Redis] = None
is_running_loop = False

async def get_redis():
    global redis_client
    if redis_client is None:
        try:
            redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)
            await redis_client.ping()
            logger.info("Connected to Redis")
        except Exception as e:
            logger.warning(f"Redis connection failed ({e}). Operating in memory standalone mode.")
            redis_client = None
    return redis_client

async def market_ingestion_background_loop():
    """
    1-Minute background polling loop for Google Finance market data.
    """
    global is_running_loop
    is_running_loop = True
    logger.info("Starting Google Finance 1-minute ingestion background loop...")
    
    while is_running_loop:
        try:
            # 1. Ingest 1-minute market batch
            quotes = await ingestor.fetch_realtime_batch()
            
            # 2. Run quant anomaly engine
            anomalies = anomaly_engine.analyze_batch(quotes)
            
            # Tick payload
            batch_payload = {
                "type": "TICK_BATCH",
                "data": {"symbols": quotes, "count": len(quotes)},
                "timestamp": int(time.time() * 1000)
            }
            batch_msg = json.dumps(batch_payload)
            
            # Direct WebSocket broadcast
            await broadcast_ws(batch_payload)
            
            # 3. Publish to Redis if connected
            r = await get_redis()
            if r:
                quote_payload = {q["symbol"]: json.dumps(q) for q in quotes}
                await r.hset("quotes:latest", mapping=quote_payload)
                await r.publish("market:ticks", batch_msg)
                
                # Publish anomalies if any
                for ano in anomalies:
                    ano_payload = {
                        "type": "ANOMALY_ALERT",
                        "data": ano,
                        "timestamp": int(time.time() * 1000)
                    }
                    await broadcast_ws(ano_payload)
                    await r.publish("market:anomalies", json.dumps(ano_payload))
                
                logger.info(f"Published 1-min batch ({len(quotes)} quotes, {len(anomalies)} anomalies) to Redis & {len(active_websockets)} WS clients")
            else:
                for ano in anomalies:
                    await broadcast_ws({
                        "type": "ANOMALY_ALERT",
                        "data": ano,
                        "timestamp": int(time.time() * 1000)
                    })
                logger.info(f"Broadcast 1-min batch to {len(active_websockets)} WS clients (in-memory mode)")

        except Exception as e:
            logger.error(f"Error in market ingestion loop: {e}", exc_info=True)

        # Sleep for 60 seconds (1 minute interval)
        await asyncio.sleep(60)

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "analytics_and_google_ingest",
        "timestamp": int(time.time() * 1000),
        "totalTickers": len(ingestor.get_all_quotes()),
        "refreshCadence": "1 minute (60s)"
    }

@app.get("/api/v1/quotes/snapshot")
async def get_quotes_snapshot():
    return {"quotes": ingestor.get_all_quotes(), "timestamp": int(time.time() * 1000)}

@app.get("/api/v1/quotes/{symbol}")
async def get_quote_by_symbol(symbol: str):
    q = ingestor.get_quote(symbol.upper())
    if not q:
        return {"error": "Symbol not found"}
    return q

@app.get("/api/v1/anomalies/active")
async def get_active_anomalies():
    quotes = ingestor.get_all_quotes()
    anomalies = anomaly_engine.analyze_batch(quotes)
    return {"anomalies": anomalies, "timestamp": int(time.time() * 1000)}

@app.get("/api/v1/catchup")
async def get_catchup_summary(userId: str = Query("default_user")):
    quotes = ingestor.get_all_quotes()
    summary = SessionDiffEngine.generate_catchup_summary(user_id=userId, current_quotes=quotes)
    return summary

# In-memory watchlists store for standalone dev mode
mock_watchlists = {
    "wl_nifty_core": {
        "id": "wl_nifty_core",
        "userId": "default_user",
        "title": "Nifty 50 Core",
        "isSystem": False,
        "items": [
            {"id": "item_1", "watchlistId": "wl_nifty_core", "symbol": "RELIANCE", "orderRank": "0|hzzzzz:", "addedAt": 1725510000000},
            {"id": "item_2", "watchlistId": "wl_nifty_core", "symbol": "TCS", "orderRank": "0|i00000:", "addedAt": 1725510000000},
            {"id": "item_3", "watchlistId": "wl_nifty_core", "symbol": "HDFCBANK", "orderRank": "0|i00001:", "addedAt": 1725510000000},
            {"id": "item_4", "watchlistId": "wl_nifty_core", "symbol": "INFY", "orderRank": "0|i00002:", "addedAt": 1725510000000},
            {"id": "item_5", "watchlistId": "wl_nifty_core", "symbol": "ICICIBANK", "orderRank": "0|i00003:", "addedAt": 1725510000000},
            {"id": "item_6", "watchlistId": "wl_nifty_core", "symbol": "TATAMOTORS", "orderRank": "0|i00004:", "addedAt": 1725510000000},
            {"id": "item_7", "watchlistId": "wl_nifty_core", "symbol": "BHARTIARTL", "orderRank": "0|i00005:", "addedAt": 1725510000000},
            {"id": "item_8", "watchlistId": "wl_nifty_core", "symbol": "ZOMATO", "orderRank": "0|i00006:", "addedAt": 1725510000000}
        ],
        "createdAt": 1725510000000,
        "updatedAt": 1725510000000
    },
    "wl_tech_growth": {
        "id": "wl_tech_growth",
        "userId": "default_user",
        "title": "Tech & AI Growth",
        "isSystem": False,
        "items": [
            {"id": "item_9", "watchlistId": "wl_tech_growth", "symbol": "TCS", "orderRank": "0|hzzzzz:", "addedAt": 1725510000000},
            {"id": "item_10", "watchlistId": "wl_tech_growth", "symbol": "INFY", "orderRank": "0|i00000:", "addedAt": 1725510000000},
            {"id": "item_11", "watchlistId": "wl_tech_growth", "symbol": "NVDA", "orderRank": "0|i00001:", "addedAt": 1725510000000},
            {"id": "item_12", "watchlistId": "wl_tech_growth", "symbol": "GOOGL", "orderRank": "0|i00002:", "addedAt": 1725510000000},
            {"id": "item_13", "watchlistId": "wl_tech_growth", "symbol": "MSFT", "orderRank": "0|i00003:", "addedAt": 1725510000000},
            {"id": "item_14", "watchlistId": "wl_tech_growth", "symbol": "AAPL", "orderRank": "0|i00004:", "addedAt": 1725510000000}
        ],
        "createdAt": 1725510000000,
        "updatedAt": 1725510000000
    },
    "wl_smart_active": {
        "id": "wl_smart_active",
        "userId": "default_user",
        "title": "🔥 Most Active Now",
        "isSystem": True,
        "items": [
            {"id": "item_15", "watchlistId": "wl_smart_active", "symbol": "ZOMATO", "orderRank": "0|hzzzzz:", "addedAt": 1725510000000},
            {"id": "item_16", "watchlistId": "wl_smart_active", "symbol": "TATAMOTORS", "orderRank": "0|i00000:", "addedAt": 1725510000000},
            {"id": "item_17", "watchlistId": "wl_smart_active", "symbol": "RELIANCE", "orderRank": "0|i00001:", "addedAt": 1725510000000}
        ],
        "createdAt": 1725510000000,
        "updatedAt": 1725510000000
    },
    "wl_smart_breakout": {
        "id": "wl_smart_breakout",
        "userId": "default_user",
        "title": "🚀 52W Breakouts",
        "isSystem": True,
        "items": [
            {"id": "item_18", "watchlistId": "wl_smart_breakout", "symbol": "TCS", "orderRank": "0|hzzzzz:", "addedAt": 1725510000000},
            {"id": "item_19", "watchlistId": "wl_smart_breakout", "symbol": "BHARTIARTL", "orderRank": "0|i00000:", "addedAt": 1725510000000}
        ],
        "createdAt": 1725510000000,
        "updatedAt": 1725510000000
    }
}

@app.get("/api/v1/search")
async def search_symbols(q: str = Query("")):
    query = q.lower().strip()
    if not query:
        return {"query": q, "results": [], "count": 0}
    
    matches = []
    for s in ingestor.get_all_quotes():
        if query in s["symbol"].lower() or query in s["name"].lower() or query in s["sector"].lower():
            matches.append({
                "symbol": s["symbol"],
                "name": s["name"],
                "exchange": s["exchange"],
                "sector": s["sector"],
                "marketCap": s["marketCap"]
            })
            if len(matches) >= 12:
                break
    return {"query": q, "results": matches, "count": len(matches), "timestamp": int(time.time() * 1000)}

@app.get("/api/v1/watchlists")
async def get_watchlists(userId: str = Query("default_user")):
    lists = list(mock_watchlists.values())
    return {"watchlists": lists, "timestamp": int(time.time() * 1000)}

class CreateWatchlistRequest(BaseModel):
    title: str

@app.post("/api/v1/watchlists")
async def create_watchlist_endpoint(req: CreateWatchlistRequest, userId: str = Query("default_user")):
    now = int(time.time() * 1000)
    wl_id = f"wl_{now}"
    wl = {
        "id": wl_id,
        "userId": userId,
        "title": req.title,
        "isSystem": False,
        "items": [],
        "createdAt": now,
        "updatedAt": now
    }
    mock_watchlists[wl_id] = wl
    return wl

class AddSymbolRequest(BaseModel):
    symbol: str

@app.post("/api/v1/watchlists/{watchlist_id}/symbols")
async def add_symbol_to_watchlist_endpoint(watchlist_id: str, req: AddSymbolRequest):
    wl = mock_watchlists.get(watchlist_id)
    if not wl:
        return {"error": "Watchlist not found"}
    
    sym = req.symbol.upper()
    for it in wl["items"]:
        if it["symbol"] == sym:
            return it
    
    now = int(time.time() * 1000)
    item = {
        "id": f"item_{now}",
        "watchlistId": watchlist_id,
        "symbol": sym,
        "orderRank": f"0|i{len(wl['items']):05d}:",
        "addedAt": now
    }
    wl["items"].append(item)
    wl["updatedAt"] = now
    return item

@app.delete("/api/v1/watchlists/{watchlist_id}/symbols/{symbol}")
async def remove_symbol_from_watchlist_endpoint(watchlist_id: str, symbol: str):
    wl = mock_watchlists.get(watchlist_id)
    if not wl:
        return {"error": "Watchlist not found"}
    
    sym = symbol.upper()
    wl["items"] = [it for it in wl["items"] if it["symbol"] != sym]
    wl["updatedAt"] = int(time.time() * 1000)
    return {"status": "removed", "symbol": sym}

@app.post("/api/v1/admin/trigger-sync")
async def trigger_manual_sync():
    """Manual sync trigger for testing and validation."""
    quotes = await ingestor.fetch_realtime_batch()
    anomalies = anomaly_engine.analyze_batch(quotes)
    
    batch_payload = {
        "type": "TICK_BATCH",
        "data": {"symbols": quotes, "count": len(quotes)},
        "timestamp": int(time.time() * 1000)
    }
    await broadcast_ws(batch_payload)
    
    for ano in anomalies:
        await broadcast_ws({
            "type": "ANOMALY_ALERT",
            "data": ano,
            "timestamp": int(time.time() * 1000)
        })

    r = await get_redis()
    if r:
        quote_payload = {q["symbol"]: json.dumps(q) for q in quotes}
        await r.hset("quotes:latest", mapping=quote_payload)
        batch_msg = json.dumps(batch_payload)
        await r.publish("market:ticks", batch_msg)
        for ano in anomalies:
            await r.publish("market:anomalies", json.dumps({
                "type": "ANOMALY_ALERT",
                "data": ano,
                "timestamp": int(time.time() * 1000)
            }))
            
    return {"status": "synced", "quotesCount": len(quotes), "anomaliesCount": len(anomalies)}

@app.websocket("/ws")
@app.websocket("/ws/quotes")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_websockets.append(websocket)
    logger.info(f"WebSocket client connected. Total active: {len(active_websockets)}")
    
    # Send immediate initial snapshot
    try:
        quotes = ingestor.get_all_quotes()
        if quotes:
            await websocket.send_text(json.dumps({
                "type": "TICK_BATCH",
                "data": {"symbols": quotes, "count": len(quotes)},
                "timestamp": int(time.time() * 1000)
            }))
            
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "PING":
                    await websocket.send_text(json.dumps({"type": "PONG", "timestamp": int(time.time() * 1000)}))
            except Exception:
                pass
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected normally")
    except Exception as e:
        logger.warning(f"WebSocket client error/disconnect: {e}")
    finally:
        if websocket in active_websockets:
            active_websockets.remove(websocket)
        logger.info(f"Cleaned up WS client. Total active: {len(active_websockets)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

