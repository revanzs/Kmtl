// Impor pustaka Web3 dan TelegramBot
const Web3 = require('web3');
const TelegramBot = require('node-telegram-bot-api');

// --- Konfigurasi ---
// Alamat RPC publik untuk Binance Smart Chain (BSC)
const bscRpcUrl = 'https://bsc-dataseed.binance.org/';

// Alamat wallet yang ingin Anda pantau
const addressToMonitor = '0xe91b564eb8dff305ff8efa332f84c487b9da5171';

// Interval pengecekan (dalam milidetik)
const checkInterval = 15000; // 15 detik

// Ambang batas minimal saldo untuk notifikasi
const notificationThreshold = 0.0001; // Hanya kirim notif jika saldo di atas nilai ini

// --- Konfigurasi Telegram (GANTI INI!) ---
// Token bot Anda dari @BotFather
const telegramBotToken = 'MASUKKAN_TOKEN_BOT_ANDA_DI_SINI';

// Chat ID Anda dari @userinfobot
const telegramChatId = 'MASUKKAN_CHAT_ID_ANDA_DI_SINI';
// --- Akhir Konfigurasi ---

// Inisialisasi koneksi Web3 ke BSC
const web3 = new Web3(new Web3.providers.HttpProvider(bscRpcUrl));

// Inisialisasi Bot Telegram
// Kita tidak perlu polling karena bot ini hanya untuk MENGIRIM pesan
const bot = new TelegramBot(telegramBotToken);

// Variabel untuk menyimpan saldo terakhir
let lastKnownBalance = null;

/**
 * Fungsi untuk mengirim pesan ke Telegram.
 * @param {string} message - Pesan yang akan dikirim.
 */
async function sendTelegramMessage(message) {
    try {
        await bot.sendMessage(telegramChatId, message, { parse_mode: 'Markdown' });
        console.log(`[${new Date().toLocaleString()}] Notifikasi Telegram terkirim!`);
    } catch (error) {
        console.error(`[${new Date().toLocaleString()}] Gagal mengirim pesan Telegram:`, error.message);
    }
}

/**
 * Fungsi untuk memeriksa saldo BNB.
 */
async function checkBnbBalance() {
    try {
        // Dapatkan saldo dalam satuan WEI
        const balanceInWei = await web3.eth.getBalance(addressToMonitor);
        // Konversi saldo dari WEI ke BNB
        const balanceInBnb = web3.utils.fromWei(balanceInWei, 'ether');
        const currentBalance = parseFloat(balanceInBnb);

        const timestamp = new Date().toLocaleString();
        
        // Cetak saldo ke konsol (seperti sebelumnya)
        console.log(`[${timestamp}] Saldo saat ini: ${currentBalance.toFixed(6)} BNB`);

        // Logika untuk mengirim notifikasi HANYA JIKA ADA PERUBAHAN
        if (lastKnownBalance === null) {
            // Ini adalah pengecekan pertama, kirim saldo awal
            console.log(`[${timestamp}] Pengecekan awal. Saldo terdeteksi: ${currentBalance.toFixed(6)} BNB`);
            
            // Hanya kirim notif jika saldo awal di atas threshold
            if (currentBalance > notificationThreshold) {
                console.log(`[${timestamp}] Saldo awal DI ATAS threshold (${notificationThreshold} BNB), mengirim notif...`);
                await sendTelegramMessage(`🤖 *Bot Pemantau Aktif* 🤖\n\nAlamat:\n\`${addressToMonitor}\`\n\nSaldo Awal:\n*${currentBalance.toFixed(6)} BNB*`);
            } else {
                console.log(`[${timestamp}] Saldo awal DI BAWAH threshold, notif tidak dikirim.`);
            }
            
            lastKnownBalance = currentBalance;
        } else if (currentBalance !== lastKnownBalance) {
            // Saldo telah berubah!
            console.log(`[${timestamp}] PERUBAHAN SALDO TERDETEKSI!`);
            
            const diff = currentBalance - lastKnownBalance;
            const sign = diff > 0 ? '+' : '';
            const emoji = diff > 0 ? '🟢' : '🔴';

            // Hanya kirim notif jika saldo BARU di atas threshold
            if (currentBalance > notificationThreshold) {
                console.log(`[${timestamp}] Saldo baru DI ATAS threshold (${notificationThreshold} BNB), mengirim notif...`);
                const message = 
                    `${emoji} *Perubahan Saldo Terdeteksi* ${emoji}\n\n` +
                    `Saldo Lama: \`${lastKnownBalance.toFixed(6)} BNB\`\n` +
                    `Saldo Baru: *${currentBalance.toFixed(6)} BNB*\n` +
                    `Perubahan: \`${sign}${diff.toFixed(6)} BNB\`\n\n` +
                    `Alamat:\n\`${addressToMonitor}\``;

                await sendTelegramMessage(message);
            } else {
                console.log(`[${timestamp}] Saldo baru DI BAWAH threshold, notif tidak dikirim.`);
            }
            
            // Perbarui saldo terakhir yang diketahui
            lastKnownBalance = currentBalance;
        } else {
            // Saldo tidak berubah, cek apakah masih di atas threshold (untuk logging)
            if (currentBalance > notificationThreshold) {
                console.log(`[${timestamp}] Saldo stabil (di atas threshold).`);
            }
        }
        
    } catch (error) {
        // Tangani jika terjadi error
        console.error(`[${new Date().toLocaleString()}] Gagal mengambil saldo:`, error.message);
    }
}

/**
 * Fungsi utama untuk memulai pemantauan.
 */
function startMonitoring() {
    console.log(`--- Memulai Pemantauan Saldo BNB ---`);
    console.log(`Alamat: ${addressToMonitor}`);
    console.log(`Interval: ${checkInterval / 1000} detik`);
    console.log(`Notifikasi Telegram: Aktif`);
    console.log(`----------------------------------------`);

    // Lakukan pengecekan pertama kali saat skrip dijalankan
    // Pesan Telegram akan dikirim dari dalam checkBnbBalance() pada proses pertama
    checkBnbBalance();

    // Atur pengecekan berkala sesuai interval
    setInterval(checkBnbBalance, checkInterval);
}

// Validasi konfigurasi Telegram sebelum memulai
if (telegramBotToken === 'MASUKKAN_TOKEN_BOT_ANDA_DI_SINI' || telegramChatId === 'MASUKKAN_CHAT_ID_ANDA_DI_SINI') {
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("ERROR: Harap masukkan 'telegramBotToken' dan 'telegramChatId'");
    console.error("di dalam file monitorBnb.js sebelum menjalankan skrip.");
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    process.exit(1); // Keluar dari skrip
} else {
    // Jalankan fungsi utama
    startMonitoring();
}