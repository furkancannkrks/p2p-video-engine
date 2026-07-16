console.log("-> client.js initialized.");

const video = document.getElementById('video');
const statCdn = document.getElementById('stat-cdn');
const statP2pDl = document.getElementById('stat-p2p-dl');
const statP2pUl = document.getElementById('stat-p2p-ul');
const btnCrash = document.getElementById('btn-crash-p2p');
const alertCrash = document.getElementById('alert-crash');

let totalCdn = 0, totalP2pDl = 0, totalP2pUl = 0;
let isP2pCrashed = false;
let targetCdn = 0;

const VIDEO_URL = 'https://canal.mediaserver.com.co/live/buenisimatv.m3u8';

function updateDashboardUI() {
    if(statCdn) statCdn.innerText = (totalCdn / 1048576).toFixed(2);
    if(statP2pDl) statP2pDl.innerText = (totalP2pDl / 1048576).toFixed(2);
    if(statP2pUl) statP2pUl.innerText = (totalP2pUl / 1048576).toFixed(2);
}

setInterval(() => {
    if (isP2pCrashed && totalCdn < targetCdn) {
        let step = (targetCdn - totalCdn) * 0.1;
        if (step < 50000) step = 50000; 
        totalCdn += step;
        if (totalCdn > targetCdn) totalCdn = targetCdn; 
        updateDashboardUI();
    }
}, 50);
//MSE API && WebRTC Data Channel 
//P2P Engine starting
if (Hls.isSupported() && p2pml.hlsjs.Engine.isSupported()) {
    console.log("-> Hls.js is supported, initializing P2P engine...");

    window.p2pEngine = new p2pml.hlsjs.Engine({
        segments: { swarmId: 'p2p-bitirme-projesi-v1' },
        loader: {
            trackerAnnounce: [
                "wss://tracker.novage.com.ua",
                "wss://tracker.openwebtorrent.com"
            ],
            rtcConfig: { 
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' }, 
                    {
                        urls: "turn:openrelay.metered.ca:80",
                        username: "openrelayproject",
                        credential: "openrelayproject"
                    },
                    {
                        urls: "turn:openrelay.metered.ca:443",
                        username: "openrelayproject",
                        credential: "openrelayproject"
                    }
                ] 
            }
        }
    });

    window.p2pEngine.on(p2pml.core.Events.PieceBytesDownloaded, (method, size) => {
        if (method === 'http') totalCdn += size;
        else if (method === 'p2p') totalP2pDl += size;
        updateDashboardUI();
    });

    window.p2pEngine.on(p2pml.core.Events.PieceBytesUploaded, (method, size) => {
        totalP2pUl += size;
        updateDashboardUI();
    });

    window.p2pEngine.on(p2pml.core.Events.PeerConnect, (peer) => {
        console.log("%c🔥 P2P CONNECTION ESTABLISHED! Peer ID: " + peer.id, "color: lime; font-weight: bold; font-size: 14px");
    });
    
    window.p2pEngine.on(p2pml.core.Events.PeerClose, (peerId) => {
        console.warn("❌ P2P PEER DISCONNECTED: " + peerId);
    });
    //hls.js P2P connection
    const hls = new Hls({
        loader: window.p2pEngine.createLoaderClass()
    });

    p2pml.hlsjs.initHlsJsPlayer(hls);
    hls.loadSource(VIDEO_URL);
    hls.attachMedia(video);
    //Error Handling
    hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
            switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                    hls.startLoad();
                    break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                    console.error("Media error, attempting to recover...");
                    hls.recoverMediaError();
                    break;
                default:
                    hls.destroy();
                    break;
            }
        }
    });
    //Crash Button
    hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
        if (isP2pCrashed && data.payload) {
            targetCdn += data.payload.byteLength; 
        }
    });

    if(btnCrash) {
        btnCrash.addEventListener('click', () => {
            console.error('Critical: P2P engine destroyed, Fallback mechanism active');
            isP2pCrashed = true; 
            targetCdn = totalCdn; 
            window.p2pEngine.destroy();
            if(alertCrash) alertCrash.style.display = 'block'; 
            btnCrash.disabled = true;
            btnCrash.innerText = 'SYSTEM RUNNING ON CDN';
        });
    }

} else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    console.warn("🍎 Apple device detected. Native Player is used since Hls.js is blocked.");
    video.src = VIDEO_URL;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    });

    if(btnCrash) {
        btnCrash.disabled = true;
        btnCrash.innerText = 'iOS DEVICE - P2P NOT SUPPORTED';
    }

    setInterval(() => {
        if (!video.paused) {
            if (video.webkitVideoDecodedByteCount) {
                totalCdn = video.webkitVideoDecodedByteCount; 
            } else {
                totalCdn += 250000; 
            }
            updateDashboardUI();
        }
    }, 1000);

} else {
    console.error("Browser does not support WebRTC or HLS.");
}