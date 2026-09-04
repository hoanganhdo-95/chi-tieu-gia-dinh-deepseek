// Quản lý chi tiêu gia đình - với Firebase
class ExpenseTracker {
    constructor() {
        this.transactions = [];
        this.currentFilter = 'all';
        this.currentCategoryFilter = 'all';
        this.currentUserFilter = 'all';
        this.currentTheme = 'light';
        this.users = new Set();
        this.listening = false;
        this.initialized = false;
        
        // Lấy tên người dùng từ localStorage
        this.currentUserName = localStorage.getItem('userName') || '';
        if (this.currentUserName) {
            document.getElementById('userName').value = this.currentUserName;
        }
        
        this.initialize();
    }

    // Khởi tạo
    async initialize() {
        this.setupEventListeners();
        this.setCurrentDate();
        this.loadTheme();
        this.updateConnectionStatus();
        
        // Lắng nghe dữ liệu từ Firebase
        this.listenToTransactions();
        
        // Lắng nghe thay đổi kết nối
        firebase.firestore().enableNetwork().then(() => {
            this.updateConnectionStatus(true);
        }).catch(() => {
            this.updateConnectionStatus(false);
        });
        
        // Khởi tạo user filter
        this.updateUserFilter();
    }

    // Setup event listeners
    setupEventListeners() {
        // Form thêm giao dịch
        document.getElementById('transactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTransaction();
        });

        // Bộ lọc loại
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.render();
            });
        });

        // Lọc theo danh mục
        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.currentCategoryFilter = e.target.value;
            this.render();
        });

        // Lọc theo người dùng
        document.getElementById('userFilter').addEventListener('change', (e) => {
            this.currentUserFilter = e.target.value;
            this.render();
        });

        // Đổi theme
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Reset dữ liệu
        document.getElementById('resetBtn').addEventListener('click', () => {
            if (confirm('Bạn có chắc muốn xóa TẤT CẢ dữ liệu? (Không thể khôi phục)')) {
                this.resetAllData();
            }
        });

        // Lưu tên người dùng khi nhập
        document.getElementById('userName').addEventListener('change', (e) => {
            const name = e.target.value.trim();
            if (name) {
                localStorage.setItem('userName', name);
                this.currentUserName = name;
                this.updateUserFilter();
            }
        });
    }

    // Lắng nghe dữ liệu từ Firebase
    listenToTransactions() {
        if (this.listening) return;
        
        this.listening = true;
        const unsubscribe = db.collection('transactions')
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                this.transactions = [];
                this.users.clear();
                
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    const transaction = {
                        id: doc.id,
                        ...data,
                        amount: Number(data.amount),
                        createdAt: data.createdAt || data.date
                    };
                    this.transactions.push(transaction);
                    
                    if (data.userName) {
                        this.users.add(data.userName);
                    }
                });
                
                this.updateUserFilter();
                this.render();
                this.updateConnectionStatus(true);
            }, (error) => {
                console.error('Lỗi lắng nghe dữ liệu:', error);
                this.updateConnectionStatus(false);
                
                // Thử kết nối lại sau 5 giây
                setTimeout(() => {
                    this.listenToTransactions();
                }, 5000);
            });
            
        // Lưu unsubscribe để dùng sau
        window.unsubscribeFirestore = unsubscribe;
    }

    // Thêm giao dịch
    async addTransaction() {
        const description = document.getElementById('description').value.trim();
        const amount = parseFloat(document.getElementById('amount').value);
        const category = document.getElementById('category').value;
        const type = document.getElementById('type').value;
        const date = document.getElementById('date').value;
        const userName = document.getElementById('userName').value.trim();

        if (!description || !amount || amount <= 0 || !date) {
            alert('Vui lòng điền đầy đủ thông tin!');
            return;
        }

        if (!userName) {
            alert('Vui lòng nhập tên người dùng!');
            document.getElementById('userName').focus();
            return;
        }

        const transaction = {
            description,
            amount,
            category,
            type,
            date,
            userName,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            timestamp: Date.now()
        };

        try {
            // Disable button
            const btn = document.getElementById('submitBtn');
            btn.disabled = true;
            btn.textContent = '⏳ Đang lưu...';

            // Thêm vào Firestore
            await db.collection('transactions').add(transaction);
            
            // Reset form
            this.resetForm();
            
            // Feedback
            btn.textContent = '✅ Đã thêm!';
            setTimeout(() => {
                btn.disabled = false;
                btn.textContent = 'Thêm giao dịch';
            }, 1500);

        } catch (error) {
            console.error('Lỗi thêm giao dịch:', error);
            alert('❌ Không thể thêm giao dịch. Vui lòng kiểm tra kết nối!');
            
            const btn = document.getElementById('submitBtn');
            btn.disabled = false;
            btn.textContent = 'Thêm giao dịch';
        }
    }

    // Xóa giao dịch
    async deleteTransaction(id) {
        if (!confirm('Bạn có chắc muốn xóa giao dịch này?')) return;

        try {
            await db.collection('transactions').doc(id).delete();
            // Dữ liệu sẽ tự động cập nhật qua listener
        } catch (error) {
            console.error('Lỗi xóa giao dịch:', error);
            alert('❌ Không thể xóa giao dịch. Vui lòng thử lại!');
        }
    }

    // Reset form
    resetForm() {
        document.getElementById('description').value = '';
        document.getElementById('amount').value = '';
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
        document.getElementById('description').focus();
    }

    // Lấy dữ liệu đã lọc
    getFilteredTransactions() {
        let filtered = this.transactions;

        // Lọc theo loại
        if (this.currentFilter === 'income') {
            filtered = filtered.filter(t => t.type === 'income');
        } else if (this.currentFilter === 'expense') {
            filtered = filtered.filter(t => t.type === 'expense');
        }

        // Lọc theo danh mục
        if (this.currentCategoryFilter !== 'all') {
            filtered = filtered.filter(t => t.category === this.currentCategoryFilter);
        }

        // Lọc theo người dùng
        if (this.currentUserFilter !== 'all') {
            filtered = filtered.filter(t => t.userName === this.currentUserFilter);
        }

        return filtered;
    }

    // Tính tổng
    calculateTotals(transactions) {
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const balance = totalIncome - totalExpense;

        return { totalIncome, totalExpense, balance };
    }

    // Thống kê theo danh mục
    getCategoryStats(transactions) {
        const stats = {};
        const expenses = transactions.filter(t => t.type === 'expense');
        const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);

        expenses.forEach(t => {
            if (!stats[t.category]) {
                stats[t.category] = 0;
            }
            stats[t.category] += t.amount;
        });

        const categoryNames = {
            food: '🍔 Ăn uống',
            transport: '🚗 Di chuyển',
            shopping: '🛍️ Mua sắm',
            bills: '🧾 Hóa đơn',
            health: '🏥 Sức khỏe',
            education: '📚 Giáo dục',
            entertainment: '🎬 Giải trí',
            other: '📦 Khác'
        };

        const result = Object.entries(stats)
            .map(([key, value]) => ({
                category: key,
                label: categoryNames[key] || key,
                amount: value,
                percentage: totalExpense > 0 ? (value / totalExpense) * 100 : 0
            }))
            .sort((a, b) => b.amount - a.amount);

        return result;
    }

    // Thống kê theo người dùng
    getUserStats(transactions) {
        const stats = {};
        
        transactions.forEach(t => {
            const key = t.userName || 'Không tên';
            if (!stats[key]) {
                stats[key] = {
                    income: 0,
                    expense: 0,
                    net: 0
                };
            }
            
            if (t.type === 'income') {
                stats[key].income += t.amount;
            } else {
                stats[key].expense += t.amount;
            }
            stats[key].net = stats[key].income - stats[key].expense;
        });

        return Object.entries(stats)
            .map(([name, data]) => ({
                name,
                ...data
            }))
            .sort((a, b) => b.net - a.net);
    }

    // Render giao diện
    render() {
        const filtered = this.getFilteredTransactions();
        const { totalIncome, totalExpense, balance } = this.calculateTotals(filtered);

        // Cập nhật số dư
        document.getElementById('balance').textContent = this.formatCurrency(balance);
        document.getElementById('totalIncome').textContent = this.formatCurrency(totalIncome);
        document.getElementById('totalExpense').textContent = this.formatCurrency(totalExpense);
        document.getElementById('lastUpdate').textContent = new Date().toLocaleString('vi-VN');

        // Cập nhật số lượng giao dịch
        document.getElementById('transactionCount').textContent = `${filtered.length} giao dịch`;

        // Render danh sách
        const list = document.getElementById('transactionList');
        if (filtered.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <span>📭</span>
                    <p>Không có giao dịch nào</p>
                    <small>Hãy thêm giao dịch đầu tiên!</small>
                </div>
            `;
        } else {
            list.innerHTML = filtered.map(t => `
                <div class="transaction-item ${t.type}">
                    <div class="transaction-info">
                        <div class="transaction-description">${this.escapeHtml(t.description)}</div>
                        <div class="transaction-category">
                            ${this.getCategoryEmoji(t.category)} ${this.getCategoryName(t.category)}
                            ${t.userName ? ` · 👤 ${this.escapeHtml(t.userName)}` : ''}
                        </div>
                        <div class="transaction-date">${this.formatDate(t.date)}</div>
                    </div>
                    <div class="transaction-amount ${t.type}">
                        ${t.type === 'income' ? '+' : '-'}${this.formatCurrency(t.amount)}
                    </div>
                    <button class="transaction-delete" onclick="tracker.deleteTransaction('${t.id}')" aria-label="Xóa">
                        ✕
                    </button>
                </div>
            `).join('');
        }

        // Render thống kê danh mục
        this.renderCategoryStats(filtered);
        
        // Render thống kê người dùng
        this.renderUserStats(filtered);
    }

    // Render thống kê danh mục
    renderCategoryStats(transactions) {
        const stats = this.getCategoryStats(transactions);
        const container = document.getElementById('categoryStats');

        if (stats.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span>📊</span>
                    <p>Chưa có dữ liệu thống kê</p>
                </div>
            `;
            return;
        }

        container.innerHTML = stats.map(stat => `
            <div class="stat-item">
                <div class="stat-label">
                    <span>${stat.label}</span>
                </div>
                <div class="stat-value">${this.formatCurrency(stat.amount)} (${stat.percentage.toFixed(1)}%)</div>
            </div>
            <div class="stat-bar">
                <div class="stat-bar-fill" style="width: ${stat.percentage}%"></div>
            </div>
        `).join('');
    }

    // Render thống kê người dùng
    renderUserStats(transactions) {
        const stats = this.getUserStats(transactions);
        const container = document.getElementById('userStats');

        if (stats.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span>👥</span>
                    <p>Chưa có dữ liệu</p>
                </div>
            `;
            return;
        }

        container.innerHTML = stats.map(stat => `
            <div class="stat-item">
                <div class="stat-label">
                    <span>👤 ${this.escapeHtml(stat.name)}</span>
                </div>
                <div class="stat-value" style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;">
                    <span style="color:var(--success);font-size:13px;">+${this.formatCurrency(stat.income)}</span>
                    <span style="color:var(--danger);font-size:13px;">-${this.formatCurrency(stat.expense)}</span>
                    <span style="font-weight:700;font-size:15px;">${stat.net >= 0 ? '+' : ''}${this.formatCurrency(stat.net)}</span>
                </div>
            </div>
        `).join('');
    }

    // Cập nhật filter người dùng
    updateUserFilter() {
        const select = document.getElementById('userFilter');
        const currentValue = select.value;
        
        // Giữ lại option "Tất cả"
        select.innerHTML = '<option value="all">Tất cả người dùng</option>';
        
        // Thêm các user
        const sortedUsers = Array.from(this.users).sort();
        sortedUsers.forEach(user => {
            const option = document.createElement('option');
            option.value = user;
            option.textContent = `👤 ${user}`;
            select.appendChild(option);
        });
        
        // Khôi phục giá trị đã chọn
        if (currentValue && this.users.has(currentValue)) {
            select.value = currentValue;
        } else {
            select.value = 'all';
            this.currentUserFilter = 'all';
        }
    }

    // Update connection status
    updateConnectionStatus(isOnline = true) {
        const status = document.getElementById('connectionStatus');
        if (isOnline) {
            status.textContent = '🟢 Online';
            status.style.color = '#10B981';
        } else {
            status.textContent = '🔴 Offline';
            status.style.color = '#EF4444';
        }
    }

    // Helper: Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    // Helper: Format date
    formatDate(dateStr) {
        try {
            const date = new Date(dateStr + 'T00:00:00');
            return date.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    }

    // Helper: Get category emoji
    getCategoryEmoji(category) {
        const emojis = {
            food: '🍔',
            transport: '🚗',
            shopping: '🛍️',
            bills: '🧾',
            health: '🏥',
            education: '📚',
            entertainment: '🎬',
            other: '📦'
        };
        return emojis[category] || '📦';
    }

    // Helper: Get category name
    getCategoryName(category) {
        const names = {
            food: 'Ăn uống',
            transport: 'Di chuyển',
            shopping: 'Mua sắm',
            bills: 'Hóa đơn',
            health: 'Sức khỏe',
            education: 'Giáo dục',
            entertainment: 'Giải trí',
            other: 'Khác'
        };
        return names[category] || category;
    }

    // Helper: Escape HTML
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Set current date
    setCurrentDate() {
        const now = new Date();
        document.getElementById('currentDate').textContent = now.toLocaleDateString('vi-VN', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        document.getElementById('date').value = now.toISOString().split('T')[0];
    }

    // Theme
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        document.getElementById('themeToggle').textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
        localStorage.setItem('theme', this.currentTheme);
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.currentTheme = savedTheme;
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.getElementById('themeToggle').textContent = savedTheme === 'light' ? '🌙' : '☀️';
    }

    // Reset ALL data
    async resetAllData() {
        try {
            const snapshot = await db.collection('transactions').get();
            const batch = db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            alert('✅ Đã xóa tất cả dữ liệu!');
        } catch (error) {
            console.error('Lỗi reset:', error);
            alert('❌ Không thể reset dữ liệu. Vui lòng thử lại!');
        }
    }
}

// Khởi tạo ứng dụng
let tracker;
document.addEventListener('DOMContentLoaded', () => {
    tracker = new ExpenseTracker();
});
