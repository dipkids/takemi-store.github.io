# TAKEMI STORE - Complete Documentation

## 🎮 Overview

TAKEMI STORE adalah platform top-up Robux profesional dengan desain modern berwarna putih dan merah. Sistem ini dilengkapi dengan admin panel lengkap dan siap integrasi dengan Midtrans payment gateway.

## 📦 Package Contents

```
takemi-store/
├── index.html                 # Website utama (Customer-facing)
├── admin/
│   └── index.html            # Admin panel (Management)
└── README.md                 # Dokumentasi ini
```

## 🚀 Quick Start

### 1. Setup Basic
1. Download semua file
2. Upload ke hosting Anda
3. Akses `index.html` untuk website utama
4. Akses `admin/index.html` untuk admin panel

### 2. Test Lokal
```bash
# Buka terminal di folder project
# Gunakan Python
python -m http.server 8000

# Atau gunakan PHP
php -S localhost:8000

# Atau gunakan Node.js
npx http-server
```

Kemudian buka:
- Website: http://localhost:8000
- Admin: http://localhost:8000/admin

## 💳 Midtrans Integration Guide

### Step 1: Registrasi Midtrans
1. Buka https://midtrans.com
2. Klik "Sign Up" atau "Register"
3. Pilih "Starter" untuk mulai gratis
4. Isi data bisnis Anda:
   - Nama bisnis: TAKEMI STORE
   - Kategori: Digital Goods
   - Email bisnis
   - Nomor telepon

### Step 2: Verifikasi Akun (KYC)
1. Login ke dashboard Midtrans
2. Lengkapi data bisnis
3. Upload dokumen:
   - KTP pemilik
   - NPWP (jika ada)
   - Dokumen pendukung lainnya
4. Tunggu approval (1-3 hari kerja)

### Step 3: Get API Keys
1. Login ke Midtrans Dashboard
2. Klik menu "Settings"
3. Pilih "Access Keys"
4. Copy:
   - **Server Key**: SB-Mid-server-xxxxx (untuk backend)
   - **Client Key**: SB-Mid-client-xxxxx (untuk frontend)

### Step 4: Setup di TAKEMI STORE

#### A. Admin Panel Setup
1. Buka `admin/index.html`
2. Login (default password akan Anda buat)
3. Klik menu "Midtrans"
4. Masukkan Server Key dan Client Key
5. Pilih metode pembayaran yang ingin diaktifkan
6. Klik "Test Koneksi"
7. Jika berhasil, klik "Simpan Konfigurasi"

#### B. Backend Implementation (PHP Example)

Buat file `process_payment.php`:

```php
<?php
// Midtrans Configuration
require_once 'midtrans-php/Midtrans.php';

\Midtrans\Config::$serverKey = 'YOUR_SERVER_KEY';
\Midtrans\Config::$isProduction = false; // Set true untuk production
\Midtrans\Config::$isSanitized = true;
\Midtrans\Config::$is3ds = true;

// Get order data from POST
$username = $_POST['username'];
$robux_amount = $_POST['robux_amount'];
$price = $_POST['price'];

// Generate unique order ID
$order_id = 'TK-' . time() . '-' . rand(1000, 9999);

// Prepare transaction details
$transaction_details = array(
    'order_id' => $order_id,
    'gross_amount' => $price,
);

// Item details
$item_details = array(
    array(
        'id' => 'ROBUX-' . $robux_amount,
        'price' => $price,
        'quantity' => 1,
        'name' => $robux_amount . ' Robux untuk ' . $username
    )
);

// Customer details
$customer_details = array(
    'first_name' => $username,
    'email' => $_POST['email'] ?? 'customer@takemistore.com',
    'phone' => $_POST['phone'] ?? '08123456789',
);

// Transaction data
$transaction = array(
    'transaction_details' => $transaction_details,
    'item_details' => $item_details,
    'customer_details' => $customer_details,
);

try {
    // Get Snap Token
    $snapToken = \Midtrans\Snap::getSnapToken($transaction);
    
    // Save to database
    // ... your database code here
    
    // Return snap token
    echo json_encode([
        'status' => 'success',
        'snap_token' => $snapToken,
        'order_id' => $order_id
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
```

#### C. Frontend Implementation

Update `index.html` checkout function:

```javascript
function checkout() {
    const username = document.getElementById('username').value;
    
    if (!username || !selectedPackage) {
        alert('Mohon lengkapi data!');
        return;
    }

    // Show loading
    document.getElementById('checkoutBtn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    document.getElementById('checkoutBtn').disabled = true;

    // Send to backend
    fetch('process_payment.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            robux_amount: selectedPackage.amount,
            price: selectedPackage.price,
            email: 'customer@email.com', // From login
            phone: '08123456789' // From login or input
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Open Midtrans Snap
            snap.pay(data.snap_token, {
                onSuccess: function(result) {
                    alert('✅ Pembayaran berhasil!\\n\\nRobux akan segera dikirim ke akun Anda.');
                    console.log('success', result);
                    // Redirect to success page
                    window.location.href = 'success.html?order_id=' + data.order_id;
                },
                onPending: function(result) {
                    alert('⏳ Menunggu pembayaran...\\n\\nSilakan selesaikan pembayaran Anda.');
                    console.log('pending', result);
                },
                onError: function(result) {
                    alert('❌ Pembayaran gagal!\\n\\nSilakan coba lagi.');
                    console.log('error', result);
                },
                onClose: function() {
                    alert('Anda menutup halaman pembayaran.');
                }
            });
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        alert('Terjadi kesalahan: ' + error);
    })
    .finally(() => {
        document.getElementById('checkoutBtn').innerHTML = 'Bayar Sekarang';
        document.getElementById('checkoutBtn').disabled = false;
    });
}
```

#### D. Add Midtrans Snap Script

Tambahkan di `<head>` dari `index.html`:

```html
<!-- Midtrans Snap -->
<script src="https://app.sandbox.midtrans.com/snap/snap.js" data-client-key="YOUR_CLIENT_KEY"></script>
<!-- For production, use: https://app.midtrans.com/snap/snap.js -->
```

### Step 5: Handle Payment Notification

Buat file `notification_handler.php`:

```php
<?php
require_once 'midtrans-php/Midtrans.php';

\Midtrans\Config::$serverKey = 'YOUR_SERVER_KEY';
\Midtrans\Config::$isProduction = false;

// Get notification from Midtrans
$notif = new \Midtrans\Notification();

$transaction = $notif->transaction_status;
$order_id = $notif->order_id;
$fraud = $notif->fraud_status;

// Handle transaction status
if ($transaction == 'capture') {
    if ($fraud == 'challenge') {
        // Review payment manually
        updateOrderStatus($order_id, 'PENDING');
    } else if ($fraud == 'accept') {
        // Payment success
        updateOrderStatus($order_id, 'SUCCESS');
        // Send Robux to user
        sendRobuxToUser($order_id);
    }
} else if ($transaction == 'settlement') {
    // Payment confirmed
    updateOrderStatus($order_id, 'SUCCESS');
    sendRobuxToUser($order_id);
} else if ($transaction == 'cancel' || $transaction == 'deny' || $transaction == 'expire') {
    // Payment failed
    updateOrderStatus($order_id, 'FAILED');
} else if ($transaction == 'pending') {
    // Waiting for payment
    updateOrderStatus($order_id, 'PENDING');
}

function updateOrderStatus($order_id, $status) {
    // Update database
    // ... your code here
}

function sendRobuxToUser($order_id) {
    // Get order details from database
    // Call Roblox API to send Robux
    // ... your code here
}

echo 'OK';
?>
```

### Step 6: Set Notification URL di Midtrans

1. Login ke Midtrans Dashboard
2. Klik "Settings" → "Configuration"
3. Masukkan Notification URL: `https://yourdomain.com/notification_handler.php`
4. Klik "Update"

## 🗄️ Database Schema

Buat tabel di MySQL/PostgreSQL:

```sql
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    robux_amount VARCHAR(20) NOT NULL,
    price INT NOT NULL,
    status ENUM('PENDING', 'SUCCESS', 'FAILED') DEFAULT 'PENDING',
    snap_token VARCHAR(255),
    payment_type VARCHAR(50),
    transaction_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE robux_packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    amount VARCHAR(20) NOT NULL,
    original_price INT NOT NULL,
    discount_price INT NOT NULL,
    discount_percent INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 🔐 Security Best Practices

### 1. Environment Variables
Jangan hardcode API keys! Gunakan environment variables:

```php
// config.php
$serverKey = getenv('MIDTRANS_SERVER_KEY');
$clientKey = getenv('MIDTRANS_CLIENT_KEY');
```

### 2. Input Validation
```php
function validateInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}
```

### 3. HTTPS Required
Pastikan website menggunakan HTTPS untuk keamanan transaksi.

### 4. Rate Limiting
Batasi request untuk mencegah abuse:
```php
// Contoh simple rate limiting
$max_requests = 10;
$time_window = 60; // seconds
```

## 📊 Admin Panel Features

### Dashboard
- Total pendapatan
- Pesanan hari ini
- Total pesanan
- Pengguna aktif
- Pesanan terbaru

### Kelola Robux
- Tambah/edit/hapus paket
- Atur harga dan diskon
- Toggle aktif/nonaktif paket

### Kelola Pesanan
- Lihat semua pesanan
- Filter by status
- Search by order ID/username
- Proses pesanan manual

### Pengaturan
- Update info website
- Contact details
- Mode maintenance
- Social media links

### Midtrans
- Input API keys
- Toggle production mode
- Pilih metode pembayaran
- Test koneksi

## 🎨 Customization

### Change Colors
Edit di `<style>` section:
```css
:root {
    --primary-red: #dc2626;     /* Main red color */
    --light-red: #fee2e2;       /* Light red background */
    --dark-red: #991b1b;        /* Dark red hover */
}
```

### Add New Robux Package
Di admin panel atau langsung edit JavaScript:
```javascript
robuxPackages.push({
    amount: '5000RBX',
    original: 833000,
    price: 590000
});
```

### Modify Homepage Content
Edit section-section di `index.html` sesuai kebutuhan.

## 🚀 Deployment Checklist

- [ ] Upload semua file ke hosting
- [ ] Setup database MySQL/PostgreSQL
- [ ] Install Midtrans PHP library
- [ ] Konfigurasi API keys (production)
- [ ] Set notification URL di Midtrans
- [ ] Test pembayaran
- [ ] Setup SSL certificate (HTTPS)
- [ ] Configure domain
- [ ] Setup email notifications
- [ ] Create admin login system
- [ ] Test di multiple devices
- [ ] Setup Google Analytics (optional)

## 📞 Support & Troubleshooting

### Payment Failed
1. Check API keys correct?
2. Check notification URL accessible?
3. Check database connection?
4. Check server logs

### Robux Not Sent
1. Check order status in database
2. Check Roblox API integration
3. Manual send via admin panel

### Common Errors
```
Error: Invalid signature
→ Check server key correct

Error: Transaction not found  
→ Check order ID format

Error: Notification URL not accessible
→ Check firewall/server settings
```

## 📚 Resources

- [Midtrans Documentation](https://docs.midtrans.com)
- [Midtrans PHP Library](https://github.com/Midtrans/midtrans-php)
- [Roblox API Documentation](https://create.roblox.com/docs)

## 🔄 Updates & Maintenance

Untuk update harga atau content:
1. Login ke admin panel
2. Edit di section yang sesuai
3. Simpan perubahan
4. Changes langsung aktif

## 💡 Tips

1. **Start with Sandbox**: Test dulu dengan mode sandbox sebelum production
2. **Monitor Transactions**: Check admin panel regularly
3. **Customer Support**: Setup WhatsApp/Discord untuk support
4. **Backup Database**: Regular backup untuk keamanan data
5. **Update Security**: Keep PHP dan library up to date

## 🎉 Ready to Launch!

Setelah setup complete:
1. Test semua fitur
2. Test pembayaran sandbox
3. Switch to production
4. Promote website Anda
5. Monitor orders dan support customers

---

**TAKEMI STORE** - Created with ❤️ for Roblox Community

For questions or support, refer to documentation above or contact your developer.
