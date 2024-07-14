# 使用官方 Node.js 映像檔作為基礎映像檔
FROM node:alpine3.19

# 設定工作目錄
WORKDIR /app

# 複製 package.json 和 package-lock.json 到工作目錄
COPY package.json package-lock.json ./

# 安裝應用程式的相依套件
RUN npm install

# 複製應用程式的所有檔案到工作目錄
COPY . .

# 對外暴露應用程式使用的端口
# EXPOSE 3002

# 啟動應用程式
CMD ["node", "server/server.js"]
