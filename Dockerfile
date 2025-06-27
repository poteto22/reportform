# ใช้ Node.js image
FROM node:18

# ตั้ง working directory
WORKDIR /app

# คัดลอก package.json และ package-lock.json
COPY package*.json ./

# ติดตั้ง dependencies
RUN npm install

# คัดลอกไฟล์โปรเจคทั้งหมด
COPY . .

# เปิดพอร์ต 3000
EXPOSE 3000

# คำสั่งรันแอป
CMD ["npm", "start"]