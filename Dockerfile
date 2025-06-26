FROM node:20

# Install Python 3 and GCC for C language support
RUN apt-get update && apt-get install -y python3 gcc

WORKDIR /app
COPY . .

RUN npm install --legacy-peer-deps
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
