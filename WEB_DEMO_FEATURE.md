# Web Demo Feature - Tính năng Tạo Demo Trang Web Từ Chat

## Tổng quan

Tính năng Web Demo cho phép AI tự động tạo ra các trang web demo hoàn chỉnh dựa trên yêu cầu của người dùng trong chat. Khi người dùng yêu cầu tạo một trang web, AI sẽ phân tích yêu cầu và tạo ra file HTML/CSS hoàn chỉnh, sau đó lưu vào database và hiển thị trong panel demo.

## Cách hoạt động

### 1. Tự động phát hiện yêu cầu tạo demo

- AI sẽ phân tích tin nhắn của người dùng để xác định xem có phải yêu cầu tạo trang web không
- Các từ khóa được nhận diện: "tạo trang web", "tạo demo", "HTML", "CSS", "website", "trang web", "demo", "landing page", "portfolio", "blog", "dashboard"

### 2. Tạo demo tự động

- Khi phát hiện yêu cầu tạo demo, AI sẽ tự động tạo ra file HTML/CSS hoàn chỉnh
- File được lưu vào database với metadata đầy đủ
- Người dùng nhận được thông báo về demo mới

### 3. Hiển thị và quản lý demo

- Panel Web Demo hiển thị tất cả các demo đã tạo
- Người dùng có thể xem preview, download file, và xem code
- Demo được hiển thị trong iframe để preview trực tiếp

## Cách sử dụng

### 1. Yêu cầu tạo demo

Trong chat, hãy yêu cầu AI tạo một trang web, ví dụ:

- "Hãy tạo demo cho mình trang web với HTML/CSS thuần"
- "Tạo một landing page đẹp cho công ty"
- "Làm một portfolio website cho developer"
- "Tạo trang blog đơn giản"

### 2. Mở Web Demo Panel

- Click vào nút "Web Demos" ở header của chat
- Hoặc đợi thông báo khi có demo mới được tạo

### 3. Xem và quản lý demo

- Chọn demo từ danh sách bên trái
- Xem preview trong iframe bên phải
- Download file HTML để sử dụng offline
- Xem code HTML/CSS (tính năng sắp tới)

## Cấu trúc Database

### Model WebDemo

```prisma
model WebDemo {
  id          String   @id @default(uuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  chatId      String
  chat        Chat     @relation(fields: [chatId], references: [id])
  name        String
  description String?
  htmlContent String   // HTML content của demo
  cssContent  String?  // CSS content (optional)
  isInlineCSS Boolean  @default(true)
  metadata    Json?    // Thông tin bổ sung
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## API Endpoints

### POST /api/projects/[projectId]/chats/[chatId]/web-demo

- Tạo web demo mới
- Phân tích yêu cầu và tạo HTML/CSS
- Lưu vào database

### GET /api/projects/[projectId]/chats/[chatId]/web-demo

- Lấy danh sách web demo của chat
- Trả về metadata và nội dung

## Tính năng nâng cao

### 1. Tự động tạo demo

- Demo được tạo tự động khi AI phát hiện yêu cầu
- Không cần thao tác thủ công

### 2. Thông báo real-time

- Kiểm tra demo mới mỗi 10 giây
- Hiển thị thông báo khi có demo mới

### 3. Preview trực tiếp

- Sử dụng iframe để hiển thị demo
- Hỗ trợ sandbox để bảo mật

### 4. Download và chia sẻ

- Download file HTML để sử dụng offline
- File HTML hoàn chỉnh với CSS embedded

## Ví dụ sử dụng

### Yêu cầu đơn giản

```
User: "Hãy tạo demo cho mình trang web với HTML/CSS thuần"
AI: [Tạo trang web đơn giản với header, content, footer]
→ Demo được tạo tự động và lưu vào database
```

### Yêu cầu phức tạp

```
User: "Tạo một landing page cho startup công nghệ với form đăng ký"
AI: [Tạo landing page hoàn chỉnh với hero section, features, pricing, contact form]
→ Demo được tạo với đầy đủ tính năng
```

## Lưu ý kỹ thuật

### 1. AI Integration

- Sử dụng Google Gemini API để phân tích và tạo demo
- Prompt được tối ưu để tạo HTML/CSS chất lượng cao

### 2. Security

- Iframe sử dụng sandbox để bảo mật
- Chỉ hiển thị demo trong môi trường an toàn

### 3. Performance

- Demo được lưu trong database để truy xuất nhanh
- Lazy loading cho panel demo

### 4. Responsive Design

- AI tạo ra HTML/CSS responsive
- Hỗ trợ mobile và desktop

## Hướng phát triển tương lai

### 1. Tính năng mới

- Editor code để chỉnh sửa demo
- Export sang các format khác (PDF, PNG)
- Chia sẻ demo qua link

### 2. Cải thiện AI

- Hỗ trợ JavaScript và framework
- Tạo demo phức tạp hơn
- Tùy chỉnh theme và style

### 3. Collaboration

- Chia sẻ demo với team
- Comment và feedback
- Version control cho demo

## Troubleshooting

### Demo không được tạo

- Kiểm tra xem yêu cầu có chứa từ khóa tạo web không
- Đảm bảo AI API hoạt động bình thường
- Kiểm tra log để debug

### Demo không hiển thị

- Refresh trang và thử lại
- Kiểm tra quyền truy cập project/chat
- Đảm bảo database connection

### Performance issues

- Giảm tần suất kiểm tra demo mới
- Tối ưu database queries
- Sử dụng caching nếu cần

## Kết luận

Tính năng Web Demo cung cấp một cách mới để tương tác với AI trong việc tạo ra các trang web demo. Với khả năng tự động phát hiện yêu cầu và tạo demo chất lượng cao, người dùng có thể nhanh chóng có được các prototype website để tham khảo hoặc sử dụng.
