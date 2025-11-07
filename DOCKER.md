# RedES Chat - Deployment

## Docker Setup

### Build and Run with Docker Compose

```bash
# Build and start the backend
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop the services
docker-compose down

# Remove all data (clean slate)
docker-compose down -v
```

### Build and Run Docker Image Manually

```bash
# Build the image
docker build -t redes-chat-backend ./nodejs

# Run the container
docker run -d \
  -p 5000:5000 \
  -e NODE_ENV=production \
  -v redes-data:/app/data \
  --name redes-chat-server \
  redes-chat-backend

# View logs
docker logs -f redes-chat-server

# Stop the container
docker stop redes-chat-server

# Remove the container
docker rm redes-chat-server
```

### Environment Variables

Configure in `.env` or via Docker environment:

- `NODE_ENV` - Environment mode (development/production)
- `DATABASE_PATH` - Path to SQLite database (default: `/app/data/redes_chat.db`)
- `SOCKET_PORT` - Port for socket server (default: 5000)

### Health Check

The container includes a built-in health check that verifies the socket server is listening on port 5000.

```bash
# Check container status
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Volume Management

Data is persisted using Docker volumes:

- `backend-data` - Stores the SQLite database and related files

To backup the database:

```bash
docker run --rm -v redes-data:/data -v $(pwd):/backup alpine tar czf /backup/redes-data-backup.tar.gz -C /data .
```

### Docker Network

To run multiple services (e.g., frontend, database), create a custom network:

```bash
docker network create redes-network

docker run -d \
  --network redes-network \
  --name redes-backend \
  -p 5000:5000 \
  redes-chat-backend
```

### Production Considerations

1. **Resource Limits**: Set memory and CPU limits
   ```bash
   docker run -d \
     --memory="512m" \
     --cpus="1" \
     redes-chat-backend
   ```

2. **Restart Policy**: Already configured in docker-compose.yml as `unless-stopped`

3. **Logging**: Monitor logs with:
   ```bash
   docker logs --tail 100 -f redes-chat-server
   ```

4. **Registry Push**: Push to Docker Hub or private registry:
   ```bash
   docker tag redes-chat-backend your-registry/redes-chat-backend:latest
   docker push your-registry/redes-chat-backend:latest
   ```
