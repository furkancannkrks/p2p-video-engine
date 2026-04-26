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

This significantly reduces the load on the origin server while maintaining stream reliability.

---

## 🏗️ Architecture

```
         ┌─────────────┐
         │  CDN Server │  ← Origin (fallback)
         └──────┬──────┘
                │
     ┌──────────▼──────────┐
     │   Signaling Server  │  ← Node.js + Socket.io
     │  (peer discovery)   │
     └──────────┬──────────┘
                │
    ┌───────────┼───────────┐
    │           │           │
 [User A] ←→ [User B] ←→ [User C]
    │           │           │
    └───────────┴───────────┘
         P2P Mesh Network
         (WebRTC Data Channels)
```

### How it works:
1. User connects and joins the P2P mesh via the signaling server
2. Video chunks are fetched from nearby peers first
3. If no peer is available or peer fails → **automatically falls back to CDN**
4. Real-time stats show how much data came from P2P vs CDN

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| P2P Communication | WebRTC |
| Signaling | Socket.io |
| Backend | Node.js |
| Frontend | HTML, CSS, JavaScript |
| Deployment | Netlify |

---

## 📊 Features

- ✅ Real-time P2P ↔ CDN bandwidth statistics
- ✅ Automatic CDN fallback when P2P connection drops
- ✅ Hybrid mesh — users contribute bandwidth while watching
- ✅ Simulated network failure test (stress test button)
- ✅ Live demo deployable with zero setup

---

## 🧪 Try It Yourself

1. Open the [live demo](https://p2p-project.netlify.app/) in **two different browser tabs or devices**
2. Watch the P2P stats increase as peers discover each other
3. Click **"P2P Ağını Çökert"** to simulate a peer failure
4. Observe the automatic fallback to CDN

---

## 👥 Team

Built by **Furkan Can Karakuş** and a **Yiğit Aksoy** as a self-initiated project to explore distributed systems and real-world streaming infrastructure challenges.

---

## 📚 What We Learned

- WebRTC peer connection lifecycle and ICE negotiation
- Signaling server design with Socket.io
- Hybrid fallback architecture patterns
- How major CDN providers reduce origin load at scale
- Real-world tradeoffs between P2P reliability and CDN consistency
