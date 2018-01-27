FROM node
ADD . /app
WORKDIR /app
RUN npm i
CMD node index.js
