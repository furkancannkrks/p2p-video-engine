console.log("-> client.js başlatıldı.");

// 1. DOM Elementlerini HTML ile tam uyumlu seçiyoruz
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

// UI Güncelleme Fonksiyonu
function updateDashboardUI() {
    if(statCdn) statCdn.innerText = (totalCdn / 1048576).toFixed(2);
    if(statP2pDl) statP2pDl.innerText = (totalP2pDl / 1048576).toFixed(2);
    if(statP2pUl) statP2pUl.innerText = (totalP2pUl / 1048576).toFixed(2);
}

// Görsel Enterpolasyon Döngüsü (Çöküş sonrası CDN sayacını pürüzsüz akıtır)
setInterval(() => {
    if (isP2pCrashed && totalCdn < targetCdn) {
        let step = (targetCdn - totalCdn) * 0.1;
        if (step < 50000) step = 50000; 
        totalCdn += step;
        if (totalCdn > targetCdn) totalCdn = targetCdn; 
        updateDashboardUI();
    }
}, 50);

// 2. Sistem Destek Kontrolü ve Başlatma
if (Hls.isSupported() && p2pml.hlsjs.Engine.isSupported()) {
    console.log("-> Hls.js tarayıcı tarafından destekleniyor, P2P motoru başlatılıyor...");

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
                    { urls: 'stun:stun1.l.google.com:19302' },
                    {
                        urls: "turn:relay.metered.ca:80",
                        username: "e8dd65f632c6e4e24a9b6f3e",
                        credential: "uMpOQkH3mDdMXGWZ"
                    },
                    {
                        urls: "turn:relay.metered.ca:443",
                        username: "e8dd65f632c6e4e24a9b6f3e",
                        credential: "uMpOQkH3mDdMXGWZ"
                    },
                    {
                        urls: "turn:relay.metered.ca:443?transport=tcp",
                        username: "e8dd65f632c6e4e24a9b6f3e",
                        credential: "uMpOQkH3mDdMXGWZ"
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
        console.log("%c🔥 P2P BAĞLANTISI KURULDU! Eş ID: " + peer.id, "color: lime; font-weight: bold; font-size: 14px");
    });
    
    window.p2pEngine.on(p2pml.core.Events.PeerClose, (peerId) => {
        console.warn("❌ P2P EŞ AYRILDI: " + peerId);
    });

    // 3. HLS Oynatıcıyı Başlat
    const hls = new Hls({
        loader: window.p2pEngine.createLoaderClass()
    });

    p2pml.hlsjs.initHlsJsPlayer(hls);
    hls.loadSource(VIDEO_URL);
    hls.attachMedia(video);

    // Hata Kurtarma Algoritması
    hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
            switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                    hls.startLoad();
                    break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                    console.error("Medya hatası, kurtarılmaya çalışılıyor...");
                    hls.recoverMediaError();
                    break;
                default:
                    hls.destroy();
                    break;
            }
        }
    });

    // HLS Üzerinden Doğrudan CDN Sayacı (Fallback anında çalışır)
    hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
        if (isP2pCrashed && data.payload) {
            targetCdn += data.payload.byteLength; 
        }
    });

    // 4. Şov Kısmı: Fallback Çökertme Butonu
    if(btnCrash) {
        btnCrash.addEventListener('click', () => {
            console.error('Kritik: P2P motoru imha edildi, Fallback mekanizması devrede');
            isP2pCrashed = true; 
            targetCdn = totalCdn; 
            window.p2pEngine.destroy();
            if(alertCrash) alertCrash.style.display = 'block'; 
            btnCrash.disabled = true;
            btnCrash.innerText = 'SİSTEM CDN ÜZERİNDE ÇALIŞIYOR';
        });
    }

} else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    // 5. APPLE (iOS/Safari) KURTARMA BLOĞU
    console.warn("🍎 Apple cihazı algılandı. Hls.js engellendiği için Native Player kullanılıyor.");
    video.src = VIDEO_URL;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    });

    if(btnCrash) {
        btnCrash.disabled = true;
        btnCrash.innerText = 'iOS CİHAZ - P2P DESTEKLENMİYOR';
    }

    // YENİ: Apple Cihazlar İçin SADECE Gerçek Veri Okuyucu
    setInterval(() => {
        if (!video.paused && video.webkitVideoDecodedByteCount) {
            totalCdn = video.webkitVideoDecodedByteCount;
            updateDashboardUI();
        }
    }, 1000);

} else {
    console.error("Tarayıcı WebRTC veya HLS desteklemiyor.");
}