FROM node:current-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf 
EXPOSE 80
# CMD ["npm","run","dev","--","--host","0.0.0.0"]
# CMD ["npm","run","dev"]
CMD ["nginx","-g","daemon off;"]