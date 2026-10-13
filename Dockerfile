# Production Dockerfile for Feed App (Nginx)
FROM nginx:alpine
COPY apps/feed-app/nginx.conf /etc/nginx/conf.d/default.conf
COPY apps/feed-app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
