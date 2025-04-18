# MB Bank Clone App

Ứng dụng giả lập mobile banking sử dụng React và Express.js.

## Cài đặt

1. Clone repository:

```
git clone <repository-url>
cd cloneapp
```

2. Cài đặt dependencies:

```
npm install
```

3. Tạo file `.env` và cấu hình:

```
# Server config
PORT=3000
MONGODB_URI=<mongodb-connection-string>

# API URL for frontend (thay thế bằng URL server thật)
VITE_API_URL=https://cloneweb-uhw9.onrender.com
```

## Chạy ứng dụng

### Chạy development server:

```
npm run dev
```

### Chạy server backend:

```
node server.js
```

### Build cho production:

```
npm run build
```

## Thông tin đăng nhập demo

Nếu không thể kết nối tới server API, ứng dụng sẽ tự động chuyển sang chế độ demo với bất kỳ thông tin đăng nhập nào có:

- Số điện thoại: 10 chữ số
- Mật khẩu: Ít nhất 6 ký tự

## Lưu ý quan trọng

- Ứng dụng được thiết kế chỉ cho mobile view
- Server API được host tại: https://cloneweb-uhw9.onrender.com

## Công nghệ sử dụng

- Frontend: React, React Router, Vite
- Backend: Express.js, MongoDB
- Deployment: Render
