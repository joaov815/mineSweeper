FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .
ARG ENV=production
RUN npx ng build --configuration=${ENV}

FROM nginx:alpine

COPY --from=builder /app/dist/minesweeper/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
