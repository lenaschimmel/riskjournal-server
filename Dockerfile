FROM node:alpine
EXPOSE 26843
WORKDIR /app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install --production
COPY . .
CMD ["node","index.js"]