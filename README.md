# 🎬 Hybrid P2P CDN Video Streaming

> A hybrid P2P + CDN video streaming system designed to reduce server load and eliminate buffering/crashes during high-traffic live events — inspired by real-world problems on platforms like Exxen during major sports broadcasts.

🔗 **[Live Demo](https://p2p-project.netlify.app/)**

---

## 🚀 The Problem

Platforms like Exxen experience crashes and severe buffering during high-concurrency events (e.g., football matches) because thousands of users simultaneously pull video data from a central CDN server. The server becomes a single point of failure.

## 💡 The Solution

We built a **hybrid streaming architecture** where:
- Users act as both **consumers and servers** simultaneously
- Video chunks are shared **peer-to-peer between browsers** using WebRTC
- The central CDN serves as a **fallback** when P2P connectivity fails
- **No custom backend is required** — peer discovery is handled by public WebTorrent trackers

This significantly reduces the load on the origin server while maintaining stream reliability.

---

## 🏗️ Architecture

```
         ┌─────────────┐
         │  CDN Server │  ← Origin (fallback only)
         └──────┬──────┘
                │
     ┌──────────▼──────────┐
     │   Public WebTorrent │  ← tracker.novage.com.ua
     │   Tracker (WSS)     │     tracker.openwebtorrent.com
     └──────────┬──────────┘
                │ (peer discovery via WebSocket)
    ┌───────────┼───────────┐
    │           │           │
 [User A] ←→ [User B] ←→ [User C]
    │           │           │
    └───────────┴───────────┘
         P2P Mesh Network
         (WebRTC Data Channels)
```

### How it works:
1. Each browser connects to a **public WebTorrent tracker** (WSS) to discover other viewers watching the same stream (identified by a shared `swarmId`)
2. Once peers are discovered, video segments are exchanged **directly browser-to-browser** over WebRTC Data Channels
3. If no peer has the required segment or a peer connection fails → the player **automatically falls back to CDN**
4. Real-time stats show how much data came from P2P vs CDN

### Why no custom signaling server?

Public WebTorrent trackers handle peer discovery out of the box. Building a custom signaling server would add infrastructure cost and a new point of failure with no functional benefit for this architecture.

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| P2P Communication | WebRTC Data Channels |
| Peer Discovery | Public WebTorrent Trackers (WSS) |
| HLS Playback | Hls.js |
| P2P-HLS Bridge | p2p-media-loader |
| Frontend | HTML, CSS, Vanilla JS |
| Deployment | Netlify (static, no server) |

---

## 📊 Features

- ✅ Real-time P2P ↔ CDN bandwidth statistics
- ✅ Automatic CDN fallback when P2P connection drops
- ✅ Hybrid mesh — users contribute bandwidth while watching
- ✅ Simulated network failure test (crash button)
- ✅ iOS/Safari native HLS fallback
- ✅ Fully serverless — zero backend to maintain

---

## 🧪 Try It Yourself

1. Open the [live demo](https://p2p-project.netlify.app/) in **two different browser tabs or devices**
2. Watch the P2P stats increase as peers discover each other via the public tracker
3. Click **"P2P Ağını Çökert"** to simulate a peer failure
4. Observe the automatic fallback to CDN with live stat updates

---

## 👥 Team

Built by **Furkan Can Karakuş** and **Yiğit Aksoy** as a self-initiated project to explore distributed systems and real-world streaming infrastructure challenges.

---

## 📚 What We Learned

- WebRTC peer connection lifecycle and ICE/STUN/TURN negotiation
- How public WebTorrent trackers enable serverless peer discovery
- HLS segment-level interception via custom Hls.js loader
- Hybrid fallback architecture patterns
- How major CDN providers reduce origin load at scale
- Real-world tradeoffs between P2P reliability and CDN consistency.
