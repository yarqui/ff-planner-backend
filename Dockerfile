# Set the baseImage to use for subsequent instructions. FROM must be the first instruction in a Dockerfile
FROM node

# Set the working directory for any subsequent ADD, COPY, CMD, ENTRYPOINT, or RUN instructions that follow it in the Dockerfile
WORKDIR /app

# Copy files or folders from source to the dest path in the image's filesystem.
# COPY <src> <dest>
COPY . .

# Add node modules. Execute any commands on top of the current image as a new layer and commit the results.
RUN npm install

# Define network ports for this container to listen on at runtime.
EXPOSE 3000

# Difine the default command to be run when a container is started from the image. 
# CMD ["executable","param1","param2"]
CMD ["node", "server.js"]
