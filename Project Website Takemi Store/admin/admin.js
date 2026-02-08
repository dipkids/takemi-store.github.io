// TAKEMI STORE - ADMIN PANEL JavaScript
const AdminState = {
    currentSection: 'dashboard',
    currentTheme: 'light',
    currentFilter: 'all',
    orders: [],
    packages: {}, // Keep as object - we'll handle this properly
    games: [],
    settings: {},
    discountCodes: [],
    announcements: []   
};

// AUTHENTICATION CHECK
function checkAdminAuth() {
    const adminAuth = localStorage.getItem('takemiAdminAuth');
    if (!adminAuth) {
        // Simple auth - in production, use proper authentication
        const password = prompt('Enter Admin Password:');
        if (password === 'toko_takemi') { // Change this password!
            localStorage.setItem('takemiAdminAuth', 'true');
        } else {
            alert('Invalid password!');
            window.location.href = 'index.html';
        }
    }
}

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    setupImageUploadHandlers(); // Setup image handlers first
    initializeAdmin();
    loadAdminData();
    setupAdminEventListeners();
    updateDashboard();
});

function setupImageUploadHandlers() {
    const imageFileInput = document.getElementById('gameImageFile');
    const imageUrlInput = document.getElementById('gameImageUrl');
    const preview = document.getElementById('gameImagePreview');
    
    if (imageFileInput) {
        imageFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    preview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
                    preview.classList.add('has-image');
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    if (imageUrlInput) {
        imageUrlInput.addEventListener('input', (e) => {
            const url = e.target.value.trim();
            if (url && isValidUrl(url)) {
                preview.innerHTML = `<img src="${url}" alt="Preview" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-exclamation-triangle\\'></i><p style=\\'color: var(--danger);\\'>Invalid image URL</p>'">`;
                preview.classList.add('has-image');
            }
        });
    }
    
    if (preview) {
        preview.addEventListener('click', () => {
            document.getElementById('gameImageFile').click();
        });
    }
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function initializeAdmin() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    AdminState.currentTheme = savedTheme;
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function loadAdminData() {
    AdminState.orders = JSON.parse(localStorage.getItem('takemiOrders') || '[]');
    AdminState.packages = JSON.parse(localStorage.getItem('takemiPackages') || '{"gamepass5day":[],"giftingGamepass":[{"baseRate":85}],"robuxGroup":[],"viaLogin":[]}');
    AdminState.games = JSON.parse(localStorage.getItem('takemiFeaturedGames') || '[]');
    AdminState.settings = JSON.parse(localStorage.getItem('takemiSettings') || '{"rating":10,"stock":200000,"robuxRate":150,"taxRate":30}');
    AdminState.discountCodes = JSON.parse(localStorage.getItem('takemiDiscountCodes') || '[]');
    AdminState.announcements = JSON.parse(localStorage.getItem('takemiAnnouncements') || '[{"text":"PEMBAYARAN AUTOMATIS - KODE DISKON TERBARU","link":"https://instagram.com/takemi_store"}]');
    
    renderAllAdminSections();
}

function setupAdminEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.currentTarget.getAttribute('data-section');
            showSection(section);
        });
    });
    
    // Theme toggle
    const themeBtn = document.getElementById('themeSwitch');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
    
    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const status = e.currentTarget.getAttribute('data-status');
            filterOrders(status);
        });
    });
    
    // Search
    const orderSearch = document.getElementById('orderSearch');
    if (orderSearch) {
        orderSearch.addEventListener('input', (e) => {
            searchOrders(e.target.value);
        });
    }
    
    // General Settings Form
    const generalSettingsForm = document.getElementById('generalSettingsForm');
    if (generalSettingsForm) {
        generalSettingsForm.addEventListener('submit', saveGeneralSettings);
    }
    
    // Add Package Form
    const addPackageForm = document.getElementById('addPackageForm');
    if (addPackageForm) {
        addPackageForm.addEventListener('submit', addPackage);
    }
    
    // Add Game Form
    const addGameForm = document.getElementById('addGameForm');
    if (addGameForm) {
        addGameForm.addEventListener('submit', addGame);
    }
    
    // Add Discount Form
    const addDiscountForm = document.getElementById('addDiscountForm');
    if (addDiscountForm) {
        addDiscountForm.addEventListener('submit', addDiscountCode);
    }
    
    // Add Announcement Form
    const addAnnouncementForm = document.getElementById('addAnnouncementForm');
    if (addAnnouncementForm) {
        addAnnouncementForm.addEventListener('submit', addAnnouncement);
    }
}

// SECTION NAVIGATION
function showSection(sectionName) {
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const section = document.getElementById(sectionName + 'Section');
    if (section) {
        section.classList.add('active');
        AdminState.currentSection = sectionName;
    }
    
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === sectionName) {
            link.classList.add('active');
        }
    });
    
    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'orders': 'Orders Management',
        'packages': 'Packages Management',
        'games': 'Games Management',
        'settings': 'Settings',
        'discounts': 'Discount Codes',
        'announcements': 'Announcements'
    };
    
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) pageTitle.textContent = titles[sectionName] || sectionName;
}

// DASHBOARD
function updateDashboard() {
    const totalOrders = AdminState.orders.length;
    const pendingOrders = AdminState.orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
    const completedOrders = AdminState.orders.filter(o => o.status === 'completed').length;
    const totalRevenue = AdminState.orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + (o.total || 0), 0);
    
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('pendingOrders').textContent = pendingOrders;
    document.getElementById('completedOrders').textContent = completedOrders;
    document.getElementById('totalRevenue').textContent = 'Rp' + totalRevenue.toLocaleString();
    
    const badge = document.getElementById('pendingOrdersBadge');
    if (badge) {
        badge.textContent = pendingOrders;
        badge.style.display = pendingOrders > 0 ? 'block' : 'none';
    }
    
    renderRecentOrders();
}

function renderRecentOrders() {
    const container = document.getElementById('recentOrdersList');
    if (!container) return;
    
    const recentOrders = AdminState.orders.slice(0, 5);
    
    if (recentOrders.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>No orders yet</p></div>';
        return;
    }
    
    container.innerHTML = recentOrders.map(order => `
        <div class="order-item" onclick="viewOrderDetail('${order.id}')">
            <div class="order-info">
                <div class="order-id">#${order.id}</div>
                <div class="order-customer">${order.customer || 'N/A'}</div>
            </div>
            <div class="order-meta">
                <span class="status-badge status-${order.status}">${order.status}</span>
                <span class="order-total">Rp${order.total.toLocaleString()}</span>
            </div>
        </div>
    `).join('');
}

// ORDERS MANAGEMENT
function renderAllAdminSections() {
    renderOrdersTable();
    renderPackagesAdmin();
    renderGamesAdmin();
    renderSettingsForm();
    renderDiscountsTable();
    renderAnnouncementsAdmin();
}

function renderOrdersTable() {
    const container = document.getElementById('ordersTableBody');
    if (!container) return;
    
    let ordersToShow = AdminState.orders;
    
    // Apply filter
    if (AdminState.currentFilter !== 'all') {
        ordersToShow = ordersToShow.filter(o => o.status === AdminState.currentFilter);
    }
    
    if (ordersToShow.length === 0) {
        container.innerHTML = '<tr><td colspan="9" class="empty-state"><i class="fas fa-inbox"></i><p>No orders found</p></td></tr>';
        return;
    }
    
    container.innerHTML = ordersToShow.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>${order.customer || 'N/A'}</td>
            <td>${order.method || 'N/A'}</td>
            <td>${order.package || 'N/A'}</td>
            <td>${order.recipients || 'N/A'}</td>
            <td>Rp${order.total.toLocaleString()}</td>
            <td><span class="status-badge status-${order.status}">${order.status}</span></td>
            <td>${new Date(order.date).toLocaleDateString()}</td>
            <td>
                <button class="btn-primary btn-sm" onclick="viewOrderDetail('${order.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-danger btn-sm" onclick="deleteOrder('${order.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function filterOrders(status) {
    AdminState.currentFilter = status;
    
    // Update active tab - PERBAIKAN DI SINI
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-status') === status) {
            tab.classList.add('active');
        }
    });
    
    // Re-render orders table - PERBAIKAN: TAMBAHKAN INI!
    renderOrdersTable();
}

function searchOrders(query) {
    const container = document.getElementById('ordersTableBody');
    if (!container) return;
    
    const filtered = AdminState.orders.filter(order => {
        const searchStr = `${order.id} ${order.customer} ${order.package} ${order.status}`.toLowerCase();
        return searchStr.includes(query.toLowerCase());
    });
    
    if (filtered.length === 0) {
        container.innerHTML = '<tr><td colspan="9" class="empty-state"><i class="fas fa-search"></i><p>No orders found</p></td></tr>';
        return;
    }
    
    container.innerHTML = filtered.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>${order.customer || 'N/A'}</td>
            <td>${order.method || 'N/A'}</td>
            <td>${order.package || 'N/A'}</td>
            <td>${order.recipients || 'N/A'}</td>
            <td>Rp${order.total.toLocaleString()}</td>
            <td><span class="status-badge status-${order.status}">${order.status}</span></td>
            <td>${new Date(order.date).toLocaleDateString()}</td>
            <td>
                <button class="btn-primary btn-sm" onclick="viewOrderDetail('${order.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-danger btn-sm" onclick="deleteOrder('${order.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function viewOrderDetail(orderId) {
    const order = AdminState.orders.find(o => o.id === orderId);
    if (!order) return;
    
    const contentContainer = document.getElementById('orderDetailContent');
    if (!contentContainer) return;
    
    contentContainer.innerHTML = `
        <div class="order-detail-grid">
            <div class="detail-item">
                <strong>Order ID:</strong>
                <span id="detailOrderId">${order.id}</span>
            </div>
            <div class="detail-item">
                <strong>Customer:</strong>
                <span>${order.customer || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <strong>Method:</strong>
                <span>${order.method || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <strong>Package:</strong>
                <span>${order.package || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <strong>Recipients:</strong>
                <span>${order.recipients || 'N/A'}</span>
            </div>
            <div class="detail-item">
                <strong>Total:</strong>
                <span>Rp${order.total.toLocaleString()}</span>
            </div>
            <div class="detail-item">
                <strong>Date:</strong>
                <span>${new Date(order.date).toLocaleString()}</span>
            </div>
            <div class="detail-item">
                <strong>Status:</strong>
                <select id="detailStatus" class="form-input">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                    <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </div>
        </div>
        <div class="modal-actions" style="margin-top: 20px;">
            <button class="btn-secondary" onclick="closeModal('orderDetailModal')">Close</button>
            <button class="btn-primary" onclick="updateOrderStatus()">Update Status</button>
        </div>
    `;
    
    openModal('orderDetailModal');
}

function updateOrderStatus() {
    const orderId = document.getElementById('detailOrderId').textContent;
    const newStatus = document.getElementById('detailStatus').value;
    
    const orderIndex = AdminState.orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return;
    
    AdminState.orders[orderIndex].status = newStatus;
    localStorage.setItem('takemiOrders', JSON.stringify(AdminState.orders));
    
    renderAllAdminSections();
    updateDashboard();
    closeModal('orderDetailModal');
    
    alert('Order status updated successfully!');
}

function deleteOrder(orderId) {
    if (!confirm('Are you sure you want to delete this order?')) return;
    
    AdminState.orders = AdminState.orders.filter(o => o.id !== orderId);
    localStorage.setItem('takemiOrders', JSON.stringify(AdminState.orders));
    
    renderAllAdminSections();
    updateDashboard();
    
    alert('Order deleted successfully!');
}

// PACKAGES MANAGEMENT
function renderPackagesAdmin() {
    // Render each package type to its own container
    const packageTypes = ['gamepass5day', 'giftingGamepass', 'robuxGroup', 'viaLogin'];
    
    packageTypes.forEach(type => {
        const container = document.getElementById(`${type}List`);
        if (!container) return;
        
        const packages = AdminState.packages[type];
        
        // For giftingGamepass (which stores base rate)
        if (type === 'giftingGamepass' && packages && packages.length > 0 && packages[0].baseRate !== undefined) {
            container.innerHTML = `
                <div class="package-info">
                    <p><strong>Base Rate:</strong> Rp${packages[0].baseRate}/Robux</p>
                    <button class="btn-secondary btn-sm" onclick="editBaseRate('${type}')">
                        <i class="fas fa-edit"></i> Edit Rate
                    </button>
                </div>
            `;
            return;
        }
        
        // Check if packages is array and has items
        if (!Array.isArray(packages) || packages.length === 0) {
            container.innerHTML = '<p class="empty-text">No packages added</p>';
            return;
        }
        
// Di renderPackagesAdmin() ~line 445
        container.innerHTML = packages.map((pkg, index) => `
            <div class="package-item">
                <div class="package-details">
                    <h4>${pkg.name || 'Unnamed Package'}</h4>
                    <p class="package-price">Rp${(pkg.price || 0).toLocaleString()}</p>
                    ${pkg.originalPrice ? `<p class="package-original">Rp${pkg.originalPrice.toLocaleString()}</p>` : ''}
                    ${pkg.discount ? `<span class="package-discount">${pkg.discount}% OFF</span>` : ''}
                </div>
                <div class="package-actions">
                    <button class="btn-secondary btn-sm" onclick="editPackage('${type}', ${index})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-danger btn-sm" onclick="deletePackage('${type}', ${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    });
}

function renderPackageSection(type, packages) {
    const typeNames = {
        'gamepass5day': '5-Day Gamepass',
        'giftingGamepass': 'Gifting Gamepass',
        'robuxGroup': 'Robux via Group',
        'viaLogin': 'Robux via Login'
    };
    
    const typeName = typeNames[type] || type;
    
    // For giftingGamepass (which stores base rate)
    if (type === 'giftingGamepass' && packages.length > 0 && packages[0].baseRate !== undefined) {
        return `
            <div class="package-category">
                <div class="category-header">
                    <h3>${typeName}</h3>
                    <button class="btn-secondary btn-sm" onclick="editBaseRate('${type}')">
                        <i class="fas fa-edit"></i> Edit Base Rate
                    </button>
                </div>
                <div class="package-info">
                    <p>Base Rate: Rp${packages[0].baseRate}/Robux</p>
                </div>
            </div>
        `;
    }
    
    // PERBAIKAN: Check if packages is array before using .map()
    if (!Array.isArray(packages) || packages.length === 0) {
        return `
            <div class="package-category">
                <div class="category-header">
                    <h3>${typeName}</h3>
                    <button class="btn-primary btn-sm" onclick="openAddPackageModal('${type}')">
                        <i class="fas fa-plus"></i> Add Package
                    </button>
                </div>
                <div class="empty-state">
                    <p>No packages in this category</p>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="package-category">
            <div class="category-header">
                <h3>${typeName}</h3>
                <button class="btn-primary btn-sm" onclick="openAddPackageModal('${type}')">
                    <i class="fas fa-plus"></i> Add Package
                </button>
            </div>
            <div class="packages-grid">
                ${renderPackageList(packages, type)}
            </div>
        </div>
    `;
}

function renderPackageList(packages, type) {
    // PERBAIKAN KRUSIAL: Validasi packages adalah array
    if (!Array.isArray(packages)) {
        console.error('packages is not an array:', packages);
        return '<p>Error: Invalid package data</p>';
    }
    
    return packages.map((pkg, index) => `
        <div class="package-card">
            <div class="package-header">
                <h4>${pkg.name || 'Unnamed'}</h4>
                <div class="package-price">Rp${(pkg.price || 0).toLocaleString()}</div>
            </div>
            <div class="package-details">
                ${pkg.amount ? `<p>Amount: ${pkg.amount} Robux</p>` : ''}
                ${pkg.duration ? `<p>Duration: ${pkg.duration} days</p>` : ''}
                ${pkg.stock !== undefined ? `<p>Stock: ${pkg.stock}</p>` : ''}
            </div>
            <div class="package-actions">
                <button class="btn-secondary btn-sm" onclick="editPackage('${type}', ${index})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger btn-sm" onclick="deletePackage('${type}', ${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function openAddPackageModal(type) {
    const addPackageFormElement = document.getElementById('addPackageForm');
    const packageMethodElement = document.getElementById('packageMethod');
    
    if (addPackageFormElement) {
        addPackageFormElement.reset();
    }
    
    // Set the method/type if provided
    if (packageMethodElement && type) {
        packageMethodElement.value = type;
    }
    
    openModal('addPackageModal');
}

function addPackage(e) {
    e.preventDefault();
    
    const methodElement = document.getElementById('packageMethod');
    const amountElement = document.getElementById('packageAmount');
    const priceElement = document.getElementById('packagePrice');
    
    if (!methodElement || !amountElement || !priceElement) {
        console.error('Required form elements not found');
        alert('Error: Form elements not found. Please check your HTML.');
        return;
    }
    
    const type = methodElement.value;
    const amount = parseInt(amountElement.value);
    const price = parseInt(priceElement.value);
    const originalPrice = parseInt(document.getElementById('packageOriginalPrice')?.value) || null;
    const discount = parseInt(document.getElementById('packageDiscount')?.value) || null;
    
    const newPackage = {
        name: `${amount} Robux`,
        amount: amount,
        price: price
    };
    
    if (originalPrice) newPackage.originalPrice = originalPrice;
    if (discount) newPackage.discount = discount;
    
    // Initialize as array if not exists
    if (!Array.isArray(AdminState.packages[type])) {
        AdminState.packages[type] = [];
    }
    
    AdminState.packages[type].push(newPackage);
    localStorage.setItem('takemiPackages', JSON.stringify(AdminState.packages));
    
    renderPackagesAdmin();
    closeModal('addPackageModal');
    e.target.reset();
    
    alert('Package added successfully!');
}

function editPackage(type, index) {
    const pkg = AdminState.packages[type][index];
    
    document.getElementById('packageMethod').value = type;
    document.getElementById('packageAmount').value = pkg.amount || '';
    document.getElementById('packagePrice').value = pkg.price;
    document.getElementById('packageOriginalPrice').value = pkg.originalPrice || '';
    document.getElementById('packageDiscount').value = pkg.discount || '';
    
    // Delete old package
    AdminState.packages[type].splice(index, 1);
    localStorage.setItem('takemiPackages', JSON.stringify(AdminState.packages));
    renderPackagesAdmin();
    
    openModal('addPackageModal');
}

function deletePackage(type, index) {
    if (!confirm('Are you sure you want to delete this package?')) return;
    
    AdminState.packages[type].splice(index, 1);
    localStorage.setItem('takemiPackages', JSON.stringify(AdminState.packages));
    
    renderPackagesAdmin();
    alert('Package deleted successfully!');
}

function editBaseRate(type) {
    const currentRate = AdminState.packages[type][0]?.baseRate || 85;
    const newRate = prompt('Enter new base rate (Rp/Robux):', currentRate);
    
    if (newRate && !isNaN(newRate)) {
        AdminState.packages[type] = [{ baseRate: parseInt(newRate) }];
        localStorage.setItem('takemiPackages', JSON.stringify(AdminState.packages));
        renderPackagesAdmin();
        alert('Base rate updated successfully!');
    }
}

// GAMES MANAGEMENT
function renderGamesAdmin() {
    const container = document.getElementById('gamesListAdmin');
    if (!container) return;
    
    if (AdminState.games.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-gamepad"></i><p>No games added yet</p></div>';
        return;
    }
    
    container.innerHTML = AdminState.games.map((game, index) => `
        <div class="game-card">
            <img src="${game.image}" alt="${game.title || game.name}" 
        onerror="this.onerror=null; this.style.display='none'; this.parentElement.insertAdjacentHTML('afterbegin', '<div style=\'background:#f3f4f6;width:100%;height:200px;display:flex;align-items:center;justify-content:center;color:#9ca3af\'><i class=\'fas fa-image fa-3x\'></i></div>')">
            <div class="game-info">
                <h4>${game.title || game.name}</h4>
                <p class="game-description">${game.description || ''}</p>
                ${game.badge ? `<span class="game-badge">${game.badge}</span>` : ''}
            </div>
            <div class="game-actions">
                <button class="btn-secondary btn-sm" onclick="editGame(${index})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger btn-sm" onclick="deleteGame(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function openAddGameModal() {
    const addGameFormElement = document.getElementById('addGameForm');
    const gameImagePreviewElement = document.getElementById('gameImagePreview');
    const imageUrlInputElement = document.getElementById('imageUrlInput');
    
    if (addGameFormElement) {
        addGameFormElement.reset();
    }
    
    if (gameImagePreviewElement) {
        gameImagePreviewElement.innerHTML = '<i class="fas fa-image"></i><p>Click to upload image</p>';
        gameImagePreviewElement.classList.remove('has-image');
    }
    
    if (imageUrlInputElement) {
        imageUrlInputElement.style.display = 'none';
    }
    
    openModal('addGameModal');
}

function toggleImageUrlInput() {
    const urlInput = document.getElementById('gameImageUrl');
    
    if (urlInput) {
        if (urlInput.style.display === 'none') {
            urlInput.style.display = 'block';
        } else {
            urlInput.style.display = 'none';
        }
    }
}

function addGame(e) {
    e.preventDefault();
    
    const titleElement = document.getElementById('gameTitle');
    const descElement = document.getElementById('gameDescription');
    const imageFileElement = document.getElementById('gameImageFile');
    const imageUrlElement = document.getElementById('gameImageUrl');
    const categoryUrlElement = document.getElementById('gameCategoryUrl');
    const badgeElement = document.getElementById('gameBadge');
    
    if (!titleElement || !descElement) {
        console.error('Required form elements not found');
        alert('Error: Form elements not found. Please check your HTML.');
        return;
    }
    
    const imageFile = imageFileElement?.files[0];
    const imageUrl = imageUrlElement?.value || '';
    
    // Function to save game with image
    const saveGame = (finalImageUrl) => {
        const newGame = {
            title: titleElement.value,
            description: descElement.value,
            image: finalImageUrl,
            categoryUrl: categoryUrlElement?.value || null,
            badge: badgeElement?.value || null
        };
        
        AdminState.games.push(newGame);
        localStorage.setItem('takemiFeaturedGames', JSON.stringify(AdminState.games));
        
        renderGamesAdmin();
        closeModal('addGameModal');
        e.target.reset();
        
        // Reset preview
        const preview = document.getElementById('gameImagePreview');
        if (preview) {
            preview.innerHTML = '<i class="fas fa-image"></i><p>Click to upload or enter URL below</p>';
            preview.classList.remove('has-image');
        }
        
        alert('Game added successfully!');
    };
    
    // Handle image
    if (imageFile) {
        // Convert file to base64
        const reader = new FileReader();
        reader.onload = function(event) {
            saveGame(event.target.result);
        };
        reader.readAsDataURL(imageFile);
    } else if (imageUrl) {
        // Use URL directly
        saveGame(imageUrl);
    } else {
        // Use base64 placeholder instead of external URL
        saveGame('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22200%22%3E%3Crect fill=%22%23e5e7eb%22 width=%22300%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%236b7280%22 font-size=%2220%22%3ENo Image%3C/text%3E%3C/svg%3E');
    }
}

function editGame(index) {
    const game = AdminState.games[index];
    
    document.getElementById('gameTitle').value = game.title || game.name || '';
    document.getElementById('gameDescription').value = game.description || '';
    document.getElementById('gameImageUrl').value = game.image || '';
    document.getElementById('gameCategoryUrl').value = game.categoryUrl || '';
    document.getElementById('gameBadge').value = game.badge || '';
    
    // Show URL input
    const urlInput = document.getElementById('gameImageUrl');
    if (urlInput) {
        urlInput.style.display = 'block';
    }
    
    const preview = document.getElementById('gameImagePreview');
    if (preview && game.image) {
        preview.innerHTML = `<img src="${game.image}" alt="Preview">`;
        preview.classList.add('has-image');
    }
    
    // Delete old game
    AdminState.games.splice(index, 1);
    localStorage.setItem('takemiFeaturedGames', JSON.stringify(AdminState.games));
    renderGamesAdmin();
    
    openModal('addGameModal');
}

function deleteGame(index) {
    if (!confirm('Are you sure you want to delete this game?')) return;
    
    AdminState.games.splice(index, 1);
    localStorage.setItem('takemiFeaturedGames', JSON.stringify(AdminState.games));
    
    renderGamesAdmin();
    alert('Game deleted successfully!');
}

// SETTINGS
function renderSettingsForm() {
    document.getElementById('settingRating').value = AdminState.settings.rating || 10;
    document.getElementById('settingStock').value = AdminState.settings.stock || 200000;
    document.getElementById('settingRobuxRate').value = AdminState.settings.robuxRate || 150;
    document.getElementById('settingTaxRate').value = AdminState.settings.taxRate || 30;
}

function saveGeneralSettings(e) {
    e.preventDefault();
    
    AdminState.settings = {
        rating: parseInt(document.getElementById('settingRating').value),
        stock: parseInt(document.getElementById('settingStock').value),
        robuxRate: parseInt(document.getElementById('settingRobuxRate').value),
        taxRate: parseInt(document.getElementById('settingTaxRate').value)
    };
    
    localStorage.setItem('takemiSettings', JSON.stringify(AdminState.settings));
    
    alert('Settings saved successfully!');
}

// DISCOUNT CODES
function renderDiscountsTable() {
    const container = document.getElementById('discountsTableBody');
    if (!container) return;
    
    if (AdminState.discountCodes.length === 0) {
        container.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fas fa-tag"></i><p>No discount codes yet</p></td></tr>';
        return;
    }
    
    container.innerHTML = AdminState.discountCodes.map((code, index) => `
        <tr>
            <td><strong>${code.code}</strong></td>
            <td>${code.discount}%</td>
            <td>
                <span class="status-badge status-${code.active ? 'completed' : 'cancelled'}">
                    ${code.active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>${code.uses || 0}</td>
            <td>${new Date(code.createdAt || Date.now()).toLocaleDateString()}</td>
            <td>
                <button class="btn-secondary btn-sm" onclick="toggleDiscountStatus(${index})" title="${code.active ? 'Deactivate' : 'Activate'}">
                    <i class="fas fa-${code.active ? 'toggle-on' : 'toggle-off'}"></i>
                </button>
                <button class="btn-danger btn-sm" onclick="deleteDiscountCode(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function openAddDiscountModal() {
    document.getElementById('addDiscountForm').reset();
    openModal('addDiscountModal');
}

function addDiscountCode(e) {
    e.preventDefault();
    
    const codeElement = document.getElementById('discountCodeInput');
    const percentElement = document.getElementById('discountPercentage');
    const activeElement = document.getElementById('discountActive');
    
    if (!codeElement || !percentElement) {
        console.error('Required form elements not found');
        alert('Error: Form elements not found.');
        return;
    }
    
    const newCode = {
        code: codeElement.value.toUpperCase(),
        discount: parseInt(percentElement.value),
        active: activeElement ? activeElement.checked : true
    };
    
    // Check if code already exists
    if (AdminState.discountCodes.some(c => c.code === newCode.code)) {
        alert('This discount code already exists!');
        return;
    }
    
    AdminState.discountCodes.push(newCode);
    localStorage.setItem('takemiDiscountCodes', JSON.stringify(AdminState.discountCodes));
    
    renderDiscountsTable();
    closeModal('addDiscountModal');
    e.target.reset();
    
    alert('Discount code added successfully!');
}

function toggleDiscountStatus(index) {
    AdminState.discountCodes[index].active = !AdminState.discountCodes[index].active;
    localStorage.setItem('takemiDiscountCodes', JSON.stringify(AdminState.discountCodes));
    
    renderDiscountsTable();
}

function deleteDiscountCode(index) {
    if (!confirm('Are you sure you want to delete this discount code?')) return;
    
    AdminState.discountCodes.splice(index, 1);
    localStorage.setItem('takemiDiscountCodes', JSON.stringify(AdminState.discountCodes));
    
    renderDiscountsTable();
    alert('Discount code deleted successfully!');
}

// ANNOUNCEMENTS
function renderAnnouncementsAdmin() {
    const container = document.getElementById('announcementsListAdmin');
    if (!container) return;
    
    if (AdminState.announcements.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-bullhorn"></i><p>No announcements yet</p></div>';
        return;
    }
    
    container.innerHTML = AdminState.announcements.map((ann, index) => `
        <div class="announcement-item-admin">
            <div class="announcement-content">
                <div class="announcement-text">${ann.text}</div>
                <div class="announcement-link">${ann.link}</div>
            </div>
            <div class="announcement-actions">
                <button class="btn-secondary btn-sm" onclick="editAnnouncement(${index})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger btn-sm" onclick="deleteAnnouncement(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function openAddAnnouncementModal() {
    openModal('addAnnouncementModal');
}

function addAnnouncement(e) {
    e.preventDefault();
    
    const newAnnouncement = {
        text: document.getElementById('announcementText').value,
        link: document.getElementById('announcementLink').value
    };
    
    AdminState.announcements.push(newAnnouncement);
    localStorage.setItem('takemiAnnouncements', JSON.stringify(AdminState.announcements));
    
    renderAnnouncementsAdmin();
    closeModal('addAnnouncementModal');
    document.getElementById('addAnnouncementForm').reset();
    
    alert('Announcement added successfully!');
}

function editAnnouncement(index) {
    const ann = AdminState.announcements[index];
    
    document.getElementById('announcementText').value = ann.text;
    document.getElementById('announcementLink').value = ann.link;
    
    // Delete old announcement
    AdminState.announcements.splice(index, 1);
    localStorage.setItem('takemiAnnouncements', JSON.stringify(AdminState.announcements));
    renderAnnouncementsAdmin();
    
    openModal('addAnnouncementModal');
}

function deleteAnnouncement(index) {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    
    AdminState.announcements.splice(index, 1);
    localStorage.setItem('takemiAnnouncements', JSON.stringify(AdminState.announcements));
    
    renderAnnouncementsAdmin();
    alert('Announcement deleted successfully!');
}

// DATA MANAGEMENT
function exportData() {
    const data = {
        orders: AdminState.orders,
        packages: AdminState.packages,
        games: AdminState.games,
        settings: AdminState.settings,
        discountCodes: AdminState.discountCodes,
        announcements: AdminState.announcements,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `takemi-store-backup-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    alert('Data exported successfully!');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                
                if (confirm('This will replace all current data. Are you sure?')) {
                    localStorage.setItem('takemiOrders', JSON.stringify(data.orders || []));
                    localStorage.setItem('takemiPackages', JSON.stringify(data.packages || {}));
                    localStorage.setItem('takemiFeaturedGames', JSON.stringify(data.games || []));
                    localStorage.setItem('takemiSettings', JSON.stringify(data.settings || {}));
                    localStorage.setItem('takemiDiscountCodes', JSON.stringify(data.discountCodes || []));
                    localStorage.setItem('takemiAnnouncements', JSON.stringify(data.announcements || []));
                    
                    location.reload();
                }
            } catch (error) {
                alert('Error importing data: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

function clearAllData() {
    if (!confirm('This will delete ALL data permanently. Are you absolutely sure?')) return;
    if (!confirm('Last warning: This action cannot be undone!')) return;
    
    localStorage.removeItem('takemiOrders');
    localStorage.removeItem('takemiPackages');
    localStorage.removeItem('takemiFeaturedGames');
    localStorage.removeItem('takemiSettings');
    localStorage.removeItem('takemiDiscountCodes');
    localStorage.removeItem('takemiAnnouncements');
    localStorage.removeItem('takemiTransactions');
    localStorage.removeItem('takemiRatings');
    
    location.reload();
}

// UTILITY FUNCTIONS
function toggleTheme() {
    const newTheme = AdminState.currentTheme === 'light' ? 'dark' : 'light';
    AdminState.currentTheme = newTheme;
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const icon = document.querySelector('#themeSwitch i');
    if (icon) icon.className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function logoutAdmin() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('takemiAdminAuth');
        window.location.href = 'index.html';
    }
}

// Make functions globally accessible
window.showSection = showSection;
window.viewOrderDetail = viewOrderDetail;
window.updateOrderStatus = updateOrderStatus;
window.deleteOrder = deleteOrder;
window.openAddPackageModal = openAddPackageModal;
window.editPackage = editPackage;
window.deletePackage = deletePackage;
window.editBaseRate = editBaseRate;
window.openAddGameModal = openAddGameModal;
window.editGame = editGame;
window.deleteGame = deleteGame;
window.toggleImageUrlInput = toggleImageUrlInput;
window.openAddDiscountModal = openAddDiscountModal;
window.toggleDiscountStatus = toggleDiscountStatus;
window.deleteDiscountCode = deleteDiscountCode;
window.openAddAnnouncementModal = openAddAnnouncementModal;
window.editAnnouncement = editAnnouncement;
window.deleteAnnouncement = deleteAnnouncement;
window.exportData = exportData;
window.importData = importData;
window.clearAllData = clearAllData;
window.openModal = openModal;
window.closeModal = closeModal;
window.logoutAdmin = logoutAdmin;