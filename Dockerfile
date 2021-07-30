# Specifies where to get the base image (Node v12 in our case) and creates a new container for it
FROM node:13-alpine

# Set working directory. Paths will be relative this WORKDIR.
WORKDIR /app

# Copy source files from host computer to the container
ADD . .


# Install dependencies
ADD package*.json ./

RUN npm install --save-dev @types/node
RUN npm install && npm install typescript dotenv -g
RUN tsc

# Run the app
CMD [ "npm", "start" ]