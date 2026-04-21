# Sử dụng image Node.js chính thức
FROM node:20-alpine

# Thiết lập thư mục làm việc
WORKDIR /app

# Cài đặt dependencies
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

# Copy toàn bộ mã nguồn
COPY . .

RUN npm install -g pnpm

# Build ứng dụng Next.js
RUN npm run build

# Expose port mặc định của Next.js
EXPOSE 3000

# Chạy ứng dụng
CMD ["npm", "start"]
