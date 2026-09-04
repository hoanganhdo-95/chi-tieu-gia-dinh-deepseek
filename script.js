// Quản lý chi tiêu gia đình
class ExpenseTracker {
    constructor() {
        this.transactions = [];
        this.currentFilter = 'all';
        this.currentCategoryFilter = 'all';
        this.currentTheme = 'light';
        this.loadData();
        this.initialize();
    }

    // Khởi tạo
    initialize() {
        this.setupEventListeners();
        this.setCurrentDate();
        this.loadTheme();
        this.render();
    }

    // Setup event listeners
    setupEventListeners() {
        // Form thêm giao dịch
        document.getElementById('transactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTransaction();
        });

        // Bộ lọc
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

        // Đổi theme
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Reset dữ liệu
        document.getElementById('resetBtn').addEventListener('click', () => {
            if (confirm('Bạn có chắc muốn xóa tất cả dữ liệu?')) {
                this.resetData();
            }
        });
    }

    // Thêm giao dịch
    addTransaction() {
        const description = document.getElementById('description').value.trim();
        const amount = parseFloat(document.getElementById('amount').value);
        const category = document.getElementById('category').value;
        const type = document.getElementById('type').value;
        const date = document.getElementById('date').value;

        if (!description || !amount || amount <= 0 || !date) {
            alert('Vui lòng điền đầy đủ thông tin!');
            return;
        }

        const transaction = {
            id: Date.now(),
            description,
            amount,
            category,
            type,
            date,
            createdAt: new Date().toISOString()
        };

        this.transactions.unshift(transaction);
        this.saveData();
        this.render();
        this.resetForm();

        // Animation feedback
        const btn = document.querySelector('.btn-primary');
        btn.textContent = '✅ Đã thêm!';
        setTimeout(() => {
            btn.textContent = 'Thêm giao dịch';
        }, 1500);
    }

    // Reset form
    resetForm() {
        document.getElementById('description').value = '';
        document.getElementById('amount').value = '';
        document.getElementById('date').value = '';
        document.getElementById('description').focus();
    }

    // Xóa giao dịch
    deleteTransaction(id) {
        if (confirm('Bạn có chắc muốn xóa giao dịch này?')) {
            this.transactions = this.transactions.filter(t => t.id !== id);
            this.saveData();
            this.render();
        }
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

        // Tính phần trăm
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

    // Render giao diện
    render() {
        const filtered = this.getFilteredTransactions();
        const { totalIncome, totalExpense, balance } = this.calculateTotals(filtered);

        // Cập nhật số dư
        document.getElementById('balance').textContent = this.formatCurrency(balance);
        document.getElementById('totalIncome').textContent = this.formatCurrency(totalIncome);
        document.getElementById('totalExpense').textContent = this.formatCurrency(totalExpense);
        document.getElementById('lastUpdate').textContent = new Date().toLocaleDateString('vi-VN');

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
                        </div>
                        <div class="transaction-date">${this.formatDate(t.date)}</div>
                    </div>
                    <div class="transaction-amount ${t.type}">
                        ${t.type === 'income' ? '+' : '-'}${this.formatCurrency(t.amount)}
                    </div>
                    <button class="transaction-delete" onclick="tracker.deleteTransaction(${t.id})" aria-label="Xóa">
                        ✕
                    </button>
                </div>
            `).join('');
        }

        // Render thống kê
        this.renderStatistics(filtered);
    }

    // Render thống kê
    renderStatistics(transactions) {
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

    // Helper: Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    // Helper: Format date
    formatDate(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
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

    // Save data
    saveData() {
        try {
            localStorage.setItem('transactions', JSON.stringify(this.transactions));
        } catch (e) {
            console.error('Lỗi lưu dữ liệu:', e);
        }
    }

    // Load data
    loadData() {
        try {
            const data = localStorage.getItem('transactions');
            if (data) {
                this.transactions = JSON.parse(data);
            }
        } catch (e) {
            console.error('Lỗi tải dữ liệu:', e);
            this.transactions = [];
        }
    }

    // Reset data
    resetData() {
        this.transactions = [];
        this.saveData();
        this.render();
    }
}

// Khởi tạo ứng dụng
let tracker;
document.addEventListener('DOMContentLoaded', () => {
    tracker = new ExpenseTracker();
});

// Service Worker cho PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(() => console.log('Service Worker đã đăng ký'))
        .catch(() => console.log('Service Worker không hỗ trợ'));
}
