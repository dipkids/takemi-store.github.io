// TAKEMI STORE - ENHANCED ROBLOX API JavaScript
const AppState = {
    currentPage: 'home',
    currentLang: 'en',
    currentTheme: 'light',
    selectedMethod: 'gamepass5day',
    selectedPackage: null,
    recipients: [],
    user: null,
    packages: {},
    games: [],
    settings: {},
    transactions: [],
    announcements: [],
    discountCode: null,
    validatedUsers: [] // Store validated user data
};

const ROBLOX_CONFIG = {
    groupId: '651106433',
    groupUrl: 'https://www.roblox.com/communities/651106433/Takemi-Studios#!/about',
    discordUrl: 'https://discord.gg/caZ9E67TPM'
};

const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1469334320048115762/9-w6f27JQvXqxiLZHJeDcr0QhsujpgGBHFgdGEINHbhLYlUjpC6_WKDtIqHwMpJJdAkm';

// ROBLOX API HELPER FUNCTIONS
const RobloxAPI = {
    // Search for user by username
    async searchUser(username) {
        try {
            const response = await fetch(
                `https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(username)}&limit=10`,
                {
                    method: 'GET',
                    mode: 'cors',
                    headers: {
                        'Accept': 'application/json'
                    }
                }
            );
            
            if (!response.ok) {
                console.warn('Roblox API returned non-OK status:', response.status);
                return null;
            }
            
            const data = await response.json();
            
            if (data.data && data.data.length > 0) {
                // Find exact match (case-insensitive)
                const exactMatch = data.data.find(
                    u => u.name.toLowerCase() === username.toLowerCase()
                );
                return exactMatch || null;
            }
            return null;
        } catch (error) {
            // Note: CORS errors are expected when running from file:// protocol
            // This is normal and not a bug. Use a local server (http://localhost) to avoid CORS issues.
            if (error.message.includes('fetch')) {
                console.warn('⚠️ Roblox API request blocked (CORS). This is expected when running from file:// protocol.');
            } else {
                console.error('Error searching user:', error);
            }
            return null;
        }
    },

    // Get user profile details
    async getUserProfile(userId) {
        try {
            const response = await fetch(`https://users.roblox.com/v1/users/${userId}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    },

    // Get user avatar thumbnail
    async getUserAvatar(userId, size = '150x150') {
        try {
            const response = await fetch(
                `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=${size}&format=Png`
            );
            const data = await response.json();
            
            if (data.data && data.data[0]) {
                return data.data[0].imageUrl;
            }
            return `https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=150&height=150&format=png`;
        } catch (error) {
            console.error('Error fetching avatar:', error);
            return null;
        }
    },

    // Get user's presence status
    async getUserPresence(userId) {
        try {
            const response = await fetch(
                `https://presence.roblox.com/v1/presence/users`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ userIds: [userId] })
                }
            );
            const data = await response.json();
            
            if (data.userPresences && data.userPresences[0]) {
                return data.userPresences[0];
            }
            return null;
        } catch (error) {
            console.error('Error fetching presence:', error);
            return null;
        }
    },

    // Check if user is in group
    async checkGroupMembership(userId, groupId) {
        try {
            const response = await fetch(
                `https://groups.roblox.com/v1/users/${userId}/groups/roles`
            );
            const data = await response.json();
            
            if (data.data) {
                return data.data.some(group => group.group.id === parseInt(groupId));
            }
            return false;
        } catch (error) {
            console.error('Error checking group membership:', error);
            return false;
        }
    },

    // Get user badges count
    async getUserBadges(userId) {
        try {
            const response = await fetch(
                `https://badges.roblox.com/v1/users/${userId}/badges?limit=100`
            );
            const data = await response.json();
            return data.data ? data.data.length : 0;
        } catch (error) {
            console.error('Error fetching badges:', error);
            return 0;
        }
    }
};

// ENHANCED USERNAME VALIDATION WITH FULL PROFILE
async function validateUsername(username) {
    const validationEl = document.getElementById('usernameValidation');
    const checkBtn = document.getElementById('checkUsernameBtn');
    
    if (!username || username.length < 3) {
        if (validationEl) validationEl.style.display = 'none';
        return false;
    }
    
    // Show loading state
    if (checkBtn) {
        checkBtn.disabled = true;
        checkBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
    }
    
    if (validationEl) {
        validationEl.className = 'username-validation loading';
        validationEl.innerHTML = `
            <div class="validation-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Checking username with Roblox API...</span>
            </div>
        `;
        validationEl.style.display = 'block';
    }
    
    try {
        // Search for user
        const user = await RobloxAPI.searchUser(username);
        
        if (!user) {
            if (checkBtn) {
                checkBtn.disabled = false;
                checkBtn.innerHTML = 'CEK';
            }
            
            if (validationEl) {
                validationEl.className = 'username-validation invalid';
                validationEl.innerHTML = `
                    <div class="validation-error">
                        <i class="fas fa-times-circle"></i>
                        <div>
                            <strong>User not found</strong>
                            <p>Please check the username and try again.</p>
                        </div>
                    </div>
                `;
            }
            return false;
        }
        
        // Get additional user data
        const [profile, avatar, presence] = await Promise.all([
            RobloxAPI.getUserProfile(user.id),
            RobloxAPI.getUserAvatar(user.id, '150x150'),
            RobloxAPI.getUserPresence(user.id)
        ]);
        
        // Store validated user data
        const validatedUser = {
            id: user.id,
            username: user.name,
            displayName: user.displayName || user.name,
            avatar: avatar,
            profile: profile,
            presence: presence,
            hasVerifiedBadge: user.hasVerifiedBadge || false
        };
        
        // Check group membership if needed
        let inGroup = false;
        if (AppState.selectedMethod === 'robuxGroup') {
            inGroup = await RobloxAPI.checkGroupMembership(user.id, ROBLOX_CONFIG.groupId);
        }
        
        // Display success with profile card
        if (validationEl) {
            validationEl.className = 'username-validation valid';
            validationEl.innerHTML = `
                <div class="validation-success">
                    <div class="user-profile-card">
                        <img src="${avatar}" alt="${user.name}" class="user-avatar">
                        <div class="user-info">
                            <div class="user-name">
                                ${user.name}
                                ${validatedUser.hasVerifiedBadge ? '<i class="fas fa-check-circle verified-badge" style="color: var(--primary); margin-left: 5px;"></i>' : ''}
                            </div>
                            ${user.displayName !== user.name ? `<div class="user-display-name">@${user.displayName}</div>` : ''}
                            <div class="user-id">User ID: ${user.id}</div>
                        </div>
                    </div>
                    
                    ${AppState.selectedMethod === 'robuxGroup' ? `
                        <div class="group-membership">
                            <i class="fas ${inGroup ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
                            <span>${inGroup ? 'Joined Takemi Studios Group' : 'Not in group - Please join first'}</span>
                            ${!inGroup ? `<a href="${ROBLOX_CONFIG.groupUrl}" target="_blank" class="btn-primary btn-sm" style="margin-top: 10px;">Join Group</a>` : ''}
                        </div>
                    ` : ''}
                    
                    <div class="validation-check">
                        <i class="fas fa-check-circle"></i>
                        <strong>Valid Roblox Account</strong>
                    </div>
                </div>
            `;
        }
        
        if (checkBtn) {
            checkBtn.disabled = false;
            checkBtn.innerHTML = 'CEK';
        }
        
        // Store the validated user
        AppState.validatedUsers = [validatedUser];
        
        return true;
    } catch (error) {
        console.error('Validation error:', error);
        
        if (checkBtn) {
            checkBtn.disabled = false;
            checkBtn.innerHTML = 'CEK';
        }
        
        if (validationEl) {
            validationEl.className = 'username-validation invalid';
            validationEl.innerHTML = `
                <div class="validation-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>
                        <strong>Validation Error</strong>
                        <p>Unable to connect to Roblox API. Please try again.</p>
                    </div>
                </div>
            `;
        }
        
        return false;
    }
}

// REAL-TIME USERNAME CHECKING (as user types)
let typingTimer;
const typingDelay = 1500; // Wait 1.5 seconds after user stops typing (increased to reduce API calls)

function setupRealtimeValidation() {
    const usernameInput = document.getElementById('robloxUsername');
    
    if (usernameInput) {
        // Disable real-time validation by default to avoid CORS errors
        // Users can click "CEK" button to manually validate
        usernameInput.addEventListener('input', (e) => {
            clearTimeout(typingTimer);
            const username = e.target.value.trim();
            
            // Only show that validation is available, don't auto-validate
            const validationEl = document.getElementById('usernameValidation');
            if (validationEl && username.length >= 3) {
                validationEl.className = 'username-validation';
                validationEl.innerHTML = `
                    <div style="padding: 10px; color: var(--text-secondary); text-align: center;">
                        <i class="fas fa-info-circle"></i>
                        <span>Click "CEK" button to validate username</span>
                    </div>
                `;
                validationEl.style.display = 'block';
            } else if (validationEl && username.length < 3) {
                validationEl.style.display = 'none';
            }
        });
    }
}

// LANGUAGE TRANSLATIONS
const translations = {
    en: {
        home: 'Home',
        order: 'Order Robux',
        track: 'Track Order',
        login: 'Login',
        orderNow: 'Order Now'
    },
    id: {
        home: 'Beranda',
        order: 'Pesan Robux',
        track: 'Lacak Pesanan',
        login: 'Masuk',
        orderNow: 'Pesan Sekarang'
    }
};

function updateLanguage(lang) {
    document.querySelectorAll('[data-lang-en]').forEach(el => {
        const enText = el.getAttribute('data-lang-en');
        const idText = el.getAttribute('data-lang-id');
        
        if (lang === 'en' && enText) {
            el.textContent = enText;
        } else if (lang === 'id' && idText) {
            el.textContent = idText;
        }
    });
}

function toggleLanguage() {
    const newLang = AppState.currentLang === 'en' ? 'id' : 'en';
    AppState.currentLang = newLang;
    localStorage.setItem('language', newLang);
    updateLanguage(newLang);
    
    const langBtn = document.querySelector('#langSwitch span');
    if (langBtn) langBtn.textContent = newLang === 'en' ? 'EN' : 'ID';
}

// Original initialization and other functions...
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    loadAllData();
    setupEventListeners();
    setupRealtimeValidation(); // Add real-time validation
});

function initializeApp() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    AppState.currentTheme = savedTheme;
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const savedLang = localStorage.getItem('language') || 'en';
    AppState.currentLang = savedLang;
    updateLanguage(savedLang);
    
    const langBtn = document.querySelector('#langSwitch span');
    if (langBtn) langBtn.textContent = savedLang === 'en' ? 'EN' : 'ID';
    
    showPage('home');
}

function loadAllData() {
    AppState.packages = JSON.parse(localStorage.getItem('takemiPackages') || '{"gamepass5day":[],"giftingGamepass":[{"baseRate":85}],"robuxGroup":[],"viaLogin":[]}');
    AppState.games = JSON.parse(localStorage.getItem('takemiFeaturedGames') || '[]');
    AppState.settings = JSON.parse(localStorage.getItem('takemiSettings') || '{"rating":10,"stock":200000,"robuxRate":150,"taxRate":30}');
    AppState.transactions = JSON.parse(localStorage.getItem('takemiTransactions') || '[]');
    AppState.announcements = JSON.parse(localStorage.getItem('takemiAnnouncements') || '[{"text":"PEMBAYARAN AUTOMATIS - KODE DISKON TERBARU","link":"https://instagram.com/takemi_store"}]');
    AppState.discountCodes = JSON.parse(localStorage.getItem('takemiDiscountCodes') || '[]');
    
    renderAll();
}

function renderAll() {
    renderGames();
    renderTimeline();
    renderAnnouncements();
    updateStatsDisplay();
    renderPackages();
}

// ✅ PERBAIKAN UTAMA: Tambahkan rendering untuk semua method packages
function renderPackages() {
    // 1. Gamepass 5 Day
    const gamepassGrid = document.getElementById('gamepass5dayGrid');
    if (gamepassGrid && Array.isArray(AppState.packages.gamepass5day)) {
        if (AppState.packages.gamepass5day.length === 0) {
            gamepassGrid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No packages available</p>';
        } else {
            gamepassGrid.innerHTML = AppState.packages.gamepass5day.map(pkg => `
                <div class="package-card" onclick="selectPackage(${JSON.stringify(pkg).replace(/"/g, '&quot;')})">
                    ${pkg.discount ? `<div class="discount-badge">${pkg.discount}%</div>` : ''}
                    <div class="package-icon">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Robux_logo.svg/200px-Robux_logo.svg.png" alt="Robux" style="width: 32px; height: 32px;">
                    </div>
                    <div class="package-amount">${pkg.amount || pkg.name} Robux</div>
                    <div class="package-price">
                        ${pkg.originalPrice ? `<div class="original-price">Rp${pkg.originalPrice.toLocaleString()}</div>` : ''}
                        <div class="discount-price">Rp${(pkg.price || 0).toLocaleString()}</div>
                    </div>
                </div>
            `).join('');
        }
    }
    
    // 2. Gifting Gamepass
    const giftingGrid = document.getElementById('giftingGamepassGrid');
    if (giftingGrid && Array.isArray(AppState.packages.giftingGamepass)) {
        // Filter out baseRate object and only show actual packages
        const giftingPackages = AppState.packages.giftingGamepass.filter(pkg => pkg.amount && pkg.price);
        
        if (giftingPackages.length === 0) {
            giftingGrid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No packages available</p>';
        } else {
            giftingGrid.innerHTML = giftingPackages.map(pkg => `
                <div class="package-card" onclick="selectPackage(${JSON.stringify(pkg).replace(/"/g, '&quot;')})">
                    ${pkg.discount ? `<div class="discount-badge">${pkg.discount}%</div>` : ''}
                    <div class="package-icon">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Robux_logo.svg/200px-Robux_logo.svg.png" alt="Robux" style="width: 32px; height: 32px;">
                    </div>
                    <div class="package-amount">${pkg.amount || pkg.name} Robux</div>
                    <div class="package-price">
                        ${pkg.originalPrice ? `<div class="original-price">Rp${pkg.originalPrice.toLocaleString()}</div>` : ''}
                        <div class="discount-price">Rp${(pkg.price || 0).toLocaleString()}</div>
                    </div>
                </div>
            `).join('');
        }
    }
    
    // 3. Robux Group
    const groupGrid = document.getElementById('robuxGroupGrid');
    if (groupGrid && Array.isArray(AppState.packages.robuxGroup)) {
        if (AppState.packages.robuxGroup.length === 0) {
            groupGrid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No packages available</p>';
        } else {
            groupGrid.innerHTML = AppState.packages.robuxGroup.map(pkg => `
                <div class="package-card" onclick="selectPackage(${JSON.stringify(pkg).replace(/"/g, '&quot;')})">
                    ${pkg.discount ? `<div class="discount-badge">${pkg.discount}%</div>` : ''}
                    <div class="package-icon">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Robux_logo.svg/200px-Robux_logo.svg.png" alt="Robux" style="width: 32px; height: 32px;">
                    </div>
                    <div class="package-amount">${pkg.amount || pkg.name} Robux</div>
                    <div class="package-price">
                        ${pkg.originalPrice ? `<div class="original-price">Rp${pkg.originalPrice.toLocaleString()}</div>` : ''}
                        <div class="discount-price">Rp${(pkg.price || 0).toLocaleString()}</div>
                    </div>
                </div>
            `).join('');
        }
    }
    
    // 4. Via Login
    const loginGrid = document.getElementById('viaLoginGrid');
    if (loginGrid && Array.isArray(AppState.packages.viaLogin)) {
        if (AppState.packages.viaLogin.length === 0) {
            loginGrid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No packages available</p>';
        } else {
            loginGrid.innerHTML = AppState.packages.viaLogin.map(pkg => `
                <div class="package-card" onclick="selectPackage(${JSON.stringify(pkg).replace(/"/g, '&quot;')})">
                    ${pkg.discount ? `<div class="discount-badge">${pkg.discount}%</div>` : ''}
                    <div class="package-icon">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Robux_logo.svg/200px-Robux_logo.svg.png" alt="Robux" style="width: 32px; height: 32px;">
                    </div>
                    <div class="package-amount">${pkg.amount || pkg.name} Robux</div>
                    <div class="package-price">
                        ${pkg.originalPrice ? `<div class="original-price">Rp${pkg.originalPrice.toLocaleString()}</div>` : ''}
                        <div class="discount-price">Rp${(pkg.price || 0).toLocaleString()}</div>
                    </div>
                </div>
            `).join('');
        }
    }
}

function setupEventListeners() {
    // Navigation links
    document.querySelectorAll('[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showPage(e.currentTarget.getAttribute('data-page'));
        });
    });
    
    const themeBtn = document.getElementById('themeSwitch');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
    
    const langBtn = document.getElementById('langSwitch');
    if (langBtn) langBtn.addEventListener('click', toggleLanguage);
    
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            if (AppState.user) showUserProfile();
            else openModal('authModal');
        });
    }
    
    const checkUsernameBtn = document.getElementById('checkUsernameBtn');
    if (checkUsernameBtn) {
        checkUsernameBtn.addEventListener('click', () => {
            const username = document.getElementById('robloxUsername').value;
            validateUsername(username);
        });
    }
    
    const customAmountLink = document.getElementById('customAmountLink');
    if (customAmountLink) {
        customAmountLink.addEventListener('click', (e) => {
            e.preventDefault();
            const method = AppState.selectedMethod;
            if (method === 'gamepass5day') {
                const section = document.getElementById('customGamepassSection');
                if (section) section.style.display = section.style.display === 'none' ? 'block' : 'none';
            } else if (method === 'robuxGroup') {
                const section = document.getElementById('customGroupSection');
                if (section) section.style.display = section.style.display === 'none' ? 'block' : 'none';
            }
        });
    }
    
    const addRecipientLink = document.getElementById('addAnotherRecipient');
    if (addRecipientLink) {
        addRecipientLink.addEventListener('click', (e) => {
            e.preventDefault();
            const username = document.getElementById('robloxUsername').value.trim();
            if (username) addRecipient();
        });
    }
    
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) checkoutBtn.addEventListener('click', proceedToPayment);
    
    const applyDiscountBtn = document.getElementById('applyDiscountBtn');
    if (applyDiscountBtn) applyDiscountBtn.addEventListener('click', applyDiscountCode);
    
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) closeModal(modal.id);
        });
    });
    
    // METHOD TABS - FIX UNTUK CATEGORY YANG TIDAK BISA DIKLIK
    document.querySelectorAll('.method-tab').forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            selectOrderMethod(e);
        });
    });
    
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', switchAuthTab);
    });
}

// PAGE NAVIGATION
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    const page = document.getElementById(pageName + 'Page');
    if (page) {
        page.classList.add('active');
        AppState.currentPage = pageName;
    }
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageName) {
            link.classList.add('active');
        }
    });
}

function toggleTheme() {
    const newTheme = AppState.currentTheme === 'light' ? 'dark' : 'light';
    AppState.currentTheme = newTheme;
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const icon = document.querySelector('#themeSwitch i');
    if (icon) icon.className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// RENDER FUNCTIONS
function renderGames() {
    const gamesGrid = document.getElementById('featuredGamesGrid');
    if (!gamesGrid) return;
    
    if (AppState.games.length === 0) {
        gamesGrid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); grid-column: 1/-1;">No featured games available</p>';
        return;
    }
    
    gamesGrid.innerHTML = AppState.games.map(game => `
        <div class="game-card">
            <img src="${game.image}" alt="${game.title || game.name}" 
                 onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22200%22%3E%3Crect fill=%22%23e5e7eb%22 width=%22300%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%236b7280%22 font-size=%2220%22%3ENo Image%3C/text%3E%3C/svg%3E'">
            <div class="game-info">
                <h3>${game.title || game.name}</h3>
                <p>${game.description || ''}</p>
                ${game.badge ? `<span class="game-badge">${game.badge}</span>` : ''}
            </div>
        </div>
    `).join('');
}

function renderTimeline() {
    const timeline = document.getElementById('timelineList');
    if (!timeline) return;
    
    const steps = [
        { icon: 'fa-shopping-cart', title: 'Choose Package', desc: 'Select your Robux package' },
        { icon: 'fa-user', title: 'Enter Username', desc: 'Provide Roblox username' },
        { icon: 'fa-credit-card', title: 'Payment', desc: 'Complete secure payment' },
        { icon: 'fa-check-circle', title: 'Receive', desc: 'Get your Robux instantly' }
    ];
    
    timeline.innerHTML = steps.map(step => `
        <div class="timeline-item">
            <div class="timeline-icon">
                <i class="fas ${step.icon}"></i>
            </div>
            <div class="timeline-content">
                <h3>${step.title}</h3>
                <p>${step.desc}</p>
            </div>
        </div>
    `).join('');
}

function renderAnnouncements() {
    const container = document.getElementById('announcementList');
    if (!container) return;
    
    if (AppState.announcements.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No announcements</p>';
        return;
    }
    
    container.innerHTML = AppState.announcements.map(ann => `
        <a href="${ann.link}" target="_blank" class="announcement-item">
            <i class="fas fa-bullhorn"></i>
            <span>${ann.text}</span>
        </a>
    `).join('');
}

function updateStatsDisplay() {
    const ratingEl = document.getElementById('storeRating');
    const stockEl = document.getElementById('robuxStock');
    
    if (ratingEl) ratingEl.textContent = (AppState.settings.rating || 10).toFixed(1);
    if (stockEl) stockEl.textContent = (AppState.settings.stock || 200000).toLocaleString();
}

// ORDER MANAGEMENT
function selectOrderMethod(e) {
    const method = e.currentTarget.getAttribute('data-method');
    AppState.selectedMethod = method;
    
    // Update active tab
    document.querySelectorAll('.method-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    e.currentTarget.classList.add('active');
    
    // Hide all package containers
    document.querySelectorAll('.packages-container').forEach(container => {
        container.style.display = 'none';
    });
    
    // Show the selected method's package container
    const containerId = method + 'Packages';
    const container = document.getElementById(containerId);
    if (container) {
        container.style.display = 'block';
    }
    
    // Reset selections
    AppState.selectedPackage = null;
    updateOrderSummary();
}

function selectPackage(pkg) {
    AppState.selectedPackage = pkg;
    
    // Update selected state
    document.querySelectorAll('.package-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
    
    updateOrderSummary();
}

function addRecipient() {
    const usernameInput = document.getElementById('robloxUsername');
    const username = usernameInput.value.trim();
    
    if (!username) {
        alert('Please enter a username');
        return;
    }
    
    // Check if already in list
    if (AppState.recipients.some(r => r.username === username)) {
        alert('Username already added');
        return;
    }
    
    // Get validated user data if available
    const validatedUser = AppState.validatedUsers.find(u => u.username === username);
    
    AppState.recipients.push({
        username: username,
        avatar: validatedUser?.avatar || null,
        id: validatedUser?.id || null
    });
    
    renderRecipientsList();
    usernameInput.value = '';
    
    // Hide validation
    const validationEl = document.getElementById('usernameValidation');
    if (validationEl) validationEl.style.display = 'none';
}

function removeRecipient(index) {
    AppState.recipients.splice(index, 1);
    renderRecipientsList();
}

function renderRecipientsList() {
    const container = document.getElementById('recipientsList');
    if (!container) return;
    
    if (AppState.recipients.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = `
        <div class="recipients-list">
            ${AppState.recipients.map((recipient, index) => `
                <div class="recipient-item">
                    ${recipient.avatar ? `<img src="${recipient.avatar}" alt="${recipient.username}">` : '<i class="fas fa-user"></i>'}
                    <span>${recipient.username}</span>
                    <button onclick="removeRecipient(${index})" class="btn-remove">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

function updateOrderSummary() {
    const summaryEl = document.getElementById('orderSummaryContent');
    if (!summaryEl) return;
    
    if (!AppState.selectedPackage) {
        summaryEl.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Pilih paket dan tambah penerima</p>';
        return;
    }
    
    const subtotal = AppState.selectedPackage.price || 0;
    const discount = AppState.discountCode ? Math.round(subtotal * AppState.discountCode.discount / 100) : 0;
    const total = subtotal - discount;
    
    summaryEl.innerHTML = `
        <div class="summary-item">
            <span>Package</span>
            <span>${AppState.selectedPackage.name || AppState.selectedPackage.amount + ' Robux'}</span>
        </div>
        <div class="summary-item">
            <span>Subtotal</span>
            <span>Rp${subtotal.toLocaleString()}</span>
        </div>
        ${discount > 0 ? `
            <div class="summary-item" style="color: var(--success);">
                <span>Discount (${AppState.discountCode.discount}%)</span>
                <span>-Rp${discount.toLocaleString()}</span>
            </div>
        ` : ''}
        <div class="summary-total">
            <span>Total</span>
            <span>Rp${total.toLocaleString()}</span>
        </div>
    `;
}

function applyDiscountCode() {
    const codeInput = document.getElementById('discountCode');
    const code = codeInput.value.trim().toUpperCase();
    
    if (!code) {
        alert('Please enter a discount code');
        return;
    }
    
    const discountCode = AppState.discountCodes.find(c => c.code === code && c.active);
    
    if (!discountCode) {
        alert('Invalid or inactive discount code');
        return;
    }
    
    AppState.discountCode = discountCode;
    updateOrderSummary();
    
    alert(`Discount code applied: ${discountCode.discount}% off!`);
}

function proceedToPayment() {
    if (!AppState.selectedPackage) {
        alert('Please select a package');
        return;
    }
    
    const username = document.getElementById('robloxUsername').value.trim();
    if (!username && AppState.recipients.length === 0) {
        alert('Please enter at least one Roblox username');
        return;
    }
    
    // Calculate total
    const subtotal = AppState.selectedPackage.price || 0;
    const discount = AppState.discountCode ? Math.round(subtotal * AppState.discountCode.discount / 100) : 0;
    const total = subtotal - discount;
    
    // Create order
    const order = {
        id: 'ORD' + Date.now(),
        date: new Date().toISOString(),
        method: AppState.selectedMethod,
        package: AppState.selectedPackage.name || `${AppState.selectedPackage.amount} Robux`,
        recipients: username || AppState.recipients.map(r => r.username).join(', '),
        customer: username || AppState.recipients[0]?.username || 'N/A',
        total: total,
        status: 'pending'
    };
    
    // Save order
    const orders = JSON.parse(localStorage.getItem('takemiOrders') || '[]');
    orders.push(order);
    localStorage.setItem('takemiOrders', JSON.stringify(orders));
    
    // Send to Discord webhook
    sendOrderToDiscord(order);
    
    // Show success and redirect
    alert(`Order created successfully!\nOrder ID: ${order.id}\n\nPlease proceed to payment.`);
    
    // Reset form
    AppState.selectedPackage = null;
    AppState.recipients = [];
    AppState.discountCode = null;
    document.getElementById('robloxUsername').value = '';
    updateOrderSummary();
    renderRecipientsList();
}

async function sendOrderToDiscord(order) {
    const embed = {
        title: '🛒 New Robux Order',
        color: 0xff0051,
        fields: [
            { name: 'Order ID', value: order.id, inline: true },
            { name: 'Method', value: order.method, inline: true },
            { name: 'Package', value: order.package, inline: true },
            { name: 'Customer', value: order.customer, inline: true },
            { name: 'Total', value: `Rp${order.total.toLocaleString()}`, inline: true },
            { name: 'Status', value: order.status.toUpperCase(), inline: true }
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'Takemi Store' }
    };
    
    try {
        await fetch(DISCORD_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] })
        });
    } catch (error) {
        console.error('Error sending to Discord:', error);
    }
}

// MODAL FUNCTIONS
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

// CUSTOM AMOUNT CALCULATION FUNCTIONS
function calculateCustomGamepass(amount) {
    const display = document.getElementById('gamepassPriceDisplay');
    if (!display) return;
    
    if (!amount || amount < 1) {
        display.innerHTML = '';
        return;
    }
    
    // Get rate from settings or use default
    const rate = AppState.settings.robuxRate || 150;
    const price = Math.ceil(amount * rate);
    
    display.innerHTML = `
        <div style="background: var(--card-bg); padding: 15px; border-radius: 8px; border: 1px solid var(--border);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>${amount} Robux</span>
                <span style="font-size: 18px; color: var(--primary);">Rp${price.toLocaleString()}</span>
            </div>
            <button onclick="selectCustomPackage('gamepass5day', ${amount}, ${price})" 
                    class="btn-primary" style="width: 100%; margin-top: 10px;">
                Select This Amount
            </button>
        </div>
    `;
}

function calculateCustomGifting(amount) {
    const display = document.getElementById('giftingPriceDisplay');
    if (!display) return;
    
    if (!amount || amount < 1) {
        display.innerHTML = '';
        return;
    }
    
    // Get base rate from giftingGamepass settings or use default
    const baseRate = AppState.packages.giftingGamepass?.[0]?.baseRate || 85;
    const price = Math.ceil(amount * baseRate);
    
    display.innerHTML = `
        <div style="background: var(--card-bg); padding: 15px; border-radius: 8px; border: 1px solid var(--border);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>${amount} Robux</span>
                <span style="font-size: 18px; color: var(--primary);">Rp${price.toLocaleString()}</span>
            </div>
            <button onclick="selectCustomPackage('giftingGamepass', ${amount}, ${price})" 
                    class="btn-primary" style="width: 100%; margin-top: 10px;">
                Select This Amount
            </button>
        </div>
    `;
}

function calculateCustomGroup(amount) {
    const display = document.getElementById('groupPriceDisplay');
    if (!display) return;
    
    if (!amount || amount < 1) {
        display.innerHTML = '';
        return;
    }
    
    // Get rate from settings or use default (usually cheaper than gamepass)
    const rate = AppState.settings.robuxRate || 150;
    const groupRate = Math.ceil(rate * 0.85); // 15% cheaper for group method
    const price = Math.ceil(amount * groupRate);
    
    display.innerHTML = `
        <div style="background: var(--card-bg); padding: 15px; border-radius: 8px; border: 1px solid var(--border);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>${amount} Robux</span>
                <span style="font-size: 18px; color: var(--primary);">Rp${price.toLocaleString()}</span>
            </div>
            <button onclick="selectCustomPackage('robuxGroup', ${amount}, ${price})" 
                    class="btn-primary" style="width: 100%; margin-top: 10px;">
                Select This Amount
            </button>
        </div>
    `;
}

function selectCustomPackage(method, amount, price) {
    const customPackage = {
        name: `${amount} Robux (Custom)`,
        amount: amount,
        price: price,
        method: method
    };
    
    AppState.selectedPackage = customPackage;
    updateOrderSummary();
    
    // Scroll to recipient section
    const recipientSection = document.querySelector('#robloxUsername');
    if (recipientSection) {
        recipientSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// AUTH FUNCTIONS
function switchAuthTab(e) {
    const tab = e.currentTarget.getAttribute('data-tab');
    
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    e.currentTarget.classList.add('active');
    
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.getElementById(tab + 'Form').classList.add('active');
}

// Make functions globally accessible
window.selectOrderMethod = selectOrderMethod;
window.selectPackage = selectPackage;
window.addRecipient = addRecipient;
window.removeRecipient = removeRecipient;
window.applyDiscountCode = applyDiscountCode;
window.proceedToPayment = proceedToPayment;
window.openModal = openModal;
window.closeModal = closeModal;
window.validateUsername = validateUsername;
window.calculateCustomGamepass = calculateCustomGamepass;
window.calculateCustomGifting = calculateCustomGifting;
window.calculateCustomGroup = calculateCustomGroup;
window.selectCustomPackage = selectCustomPackage;