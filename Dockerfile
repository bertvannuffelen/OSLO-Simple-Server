FROM node:12

ARG PORT=3000
ENV ENV_PORT=$PORT

ARG FILE_URL
ENV ENV_FILE_URL=$FILE_URL

ARG FALLBACK_TO_INDEX=true
ENV ENV_FALLBACK_TO_INDEX=$FALLBACK_TO_INDEX

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE $PORT
CMD [ "node", "./bin/index.js" ]
