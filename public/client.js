console.log("-> client.js başlatıldı.");

// 1. DOM Elementlerini HTML ile tam uyumlu seçiyoruz
const video = document.getElementById('video');
const statCdn = document.getElementById('stat-cdn');
const statP2pDl = document.getElementById('stat-p2p-dl');
const statP2pUl = document.getElementById('stat-p2p-ul');
const btnCrash = document.getElementById('btn-crash-p2p');
const alertCrash = document.getElementById('alert-crash');

let totalCdn = 0, totalP2pDl = 0, totalP2pUl = 0;

// UI Güncelleme Fonksiyonu
function updateDashboardUI() {
    if(statCdn) statCdn.innerText = (totalCdn / 1048576).toFixed(2);
    if(statP2pDl) statP2pDl.innerText = (totalP2pDl / 1048576).toFixed(2);
    if(statP2pUl) statP2pUl.innerText = (totalP2pUl / 1048576).toFixed(2);
}

// 2. Sistem Destek Kontrolü ve Başlatma
if (Hls.isSupported() && p2pml.hlsjs.Engine.isSupported()) {
    console.log("-> Hls.js tarayıcı tarafından destekleniyor, P2P motoru başlatılıyor...");

    // Motoru Başlat (Resmi Trackerlar ile)
    window.p2pEngine = new p2pml.hlsjs.Engine({
        segments: { swarmId: 'p2p-bitirme-projesi-v1' },
        loader: {
            trackerAnnounce: [
                "wss://tracker.novage.com.ua",
                "wss://tracker.openwebtorrent.com"
            ],
            rtcConfig: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
        }
    });

    // İstatistik ve Log Eventleri
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

    // 3. HLS Oynatıcıyı Başlat ve P2P'ye Bağla
    const hls = new Hls({
        loader: window.p2pEngine.createLoaderClass()
    });

    p2pml.hlsjs.initHlsJsPlayer(hls);
    //https://demo.unified-streaming.com/k8s/features/stable/#!/mpd/dashjs:3.0.3/path=live.mpd.pure_live_number/url=https%3A%2F%2Fdemo.unified-streaming.com%2Fk8s%2Flive%2Fstable%2Flive.isml%2F.mpd%3Fmpd_minimum_fragment_length%3D1920%2F100
    hls.loadSource('https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8');
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

    // 4. Şov Kısmı: Fallback Çökertme Butonu
    if(btnCrash) {
        btnCrash.addEventListener('click', () => {
            console.error('Kritik: P2P motoru imha edildi, Fallback mekanizması devrede');
            window.p2pEngine.destroy();
            alertCrash.style.display = 'block'; // Uyarı kutusunu göster
            btnCrash.disabled = true;
            btnCrash.innerText = 'SİSTEM CDN ÜZERİNDE ÇALIŞIYOR';
        });
    }

} else {
    console.error("Tarayıcı WebRTC veya HLS desteklemiyor.");
}