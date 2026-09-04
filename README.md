# chi-tieu-gia-dinh-deepseek

# 💰 Quản Lý Chi Tiêu Gia Đình

Ứng dụng web quản lý chi tiêu gia đình cho vợ chồng dùng chung, thiết kế đẹp mắt và thân thiện với điện thoại.

## ✨ Tính năng

- 📊 **Tổng quan**: Xem số dư, tổng thu nhập và chi tiêu
- ➕ **Thêm giao dịch**: Nhập chi tiêu/thu nhập với danh mục
- 🔍 **Lọc**: Lọc theo loại giao dịch và danh mục
- 📋 **Lịch sử**: Xem danh sách giao dịch đầy đủ
- 📊 **Thống kê**: Biểu đồ thống kê theo danh mục
- 🌙 **Chế độ tối/sáng**: Giao diện thân thiện với mắt
- 💾 **Lưu trữ cục bộ**: Dữ liệu được lưu trên thiết bị
- 📱 **Responsive**: Tối ưu cho mọi thiết bị

## 🚀 Cách sử dụng

1. **Truy cập trực tiếp**: Mở file `index.html` trên trình duyệt
2. **Thêm giao dịch**: Điền thông tin và nhấn "Thêm giao dịch"
3. **Xem thống kê**: Cuộn xuống phần "Thống kê theo danh mục"
4. **Lọc dữ liệu**: Sử dụng các nút lọc ở trên cùng

## 📱 Cài đặt trên điện thoại

### iOS (Safari)
1. Mở trang web trong Safari
2. Chạm vào nút Share (hình vuông với mũi tên lên)
3. Chọn "Add to Home Screen"
4. Đặt tên và chạm "Add"

### Android (Chrome)
1. Mở trang web trong Chrome
2. Chạm vào menu (3 chấm)
3. Chọn "Add to Home Screen"
4. Đặt tên và chạm "Add"

## 🎨 Giao diện

- **Màu sắc**: Xanh dương chủ đạo, hiện đại
- **Font**: Hệ thống, tối ưu cho mobile
- **Animation**: Mượt mà, tự nhiên
- **Accessibility**: Hỗ trợ đọc màn hình

## 🛠️ Công nghệ

- HTML5
- CSS3 (Flexbox, Grid, Variables)
- JavaScript (ES6+)
- LocalStorage
- PWA (Progressive Web App)

## 📊 Cấu trúc dữ liệu

```javascript
{
  id: number,
  description: string,
  amount: number,
  category: string, // food, transport, shopping, bills, health, education, entertainment, other
  type: string, // income, expense
  date: string, // YYYY-MM-DD
  createdAt: string // ISO datetime
}
