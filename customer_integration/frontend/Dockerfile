FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001

# Frontend will auto-detect API URL from browser hostname
CMD ["npm", "run", "dev"]
