# Redes Chat Backend - College Deployment Guide

## 🎓 College Download & Deployment

Your chat application backend is now published and ready for college deployment!

### 📦 What to Download

**Option 1: Pull from Docker Hub (Recommended)**
```bash
# College server commands:
docker pull cerfdotdev/redes_backend:latest
```

**Option 2: Download Files**
- `docker-compose.deploy.yml` - Deployment configuration
- `README.md` - This guide

### 🚀 Quick Deployment

1. **Create deployment directory:**
   ```bash
   mkdir redes-chat-backend
   cd redes-chat-backend
   ```

2. **Download the compose file:**
   ```bash
   # Copy docker-compose.deploy.yml to this directory
   ```

3. **Deploy:**
   ```bash
   docker-compose -f docker-compose.deploy.yml up -d
   ```

4. **Check status:**
   ```bash
   docker-compose -f docker-compose.deploy.yml ps
   docker-compose -f docker-compose.deploy.yml logs
   ```

### 🔧 Configuration

**Default Settings:**
- **Port**: 5000
- **Database**: SQLite (auto-created in `./data/`)
- **WebSocket**: `ws://localhost:5000/ws`

**Change Port (if 5000 is busy):**
```yaml
ports:
  - "8080:5000"  # Use port 8080 instead
```

### 📊 Features Included

- ✅ **WebSocket Chat Server** - Real-time messaging
- ✅ **User Authentication** - Session management
- ✅ **SQLite Database** - Persistent storage
- ✅ **Group Chats** - Multi-user conversations
- ✅ **Read Receipts** - Message read status
- ✅ **File Upload Support** - Ready for attachments
- ✅ **Health Checks** - Automatic monitoring

### 🛠️ Management Commands

```bash
# Start service
docker-compose -f docker-compose.deploy.yml up -d

# Stop service
docker-compose -f docker-compose.deploy.yml down

# View logs
docker-compose -f docker-compose.deploy.yml logs -f

# Restart service
docker-compose -f docker-compose.deploy.yml restart

# Update to new version
docker pull cerfdotdev/redes_backend:latest
docker-compose -f docker-compose.deploy.yml up -d
```

### 🔍 Troubleshooting

**Port already in use:**
```bash
# Check what's using port 5000
sudo lsof -i :5000

# Change port in docker-compose.deploy.yml
ports:
  - "5001:5000"
```

**Permission issues:**
```bash
# Fix data directory permissions
sudo chown -R $USER:$USER ./data
```

**Database issues:**
```bash
# Reset database
docker-compose -f docker-compose.deploy.yml down
sudo rm -rf ./data
docker-compose -f docker-compose.deploy.yml up -d
```

### 🌐 College Network Setup

- **Firewall**: Ensure port 5000 (or your chosen port) is open
- **WebSocket**: The app uses WebSocket connections for real-time chat
- **Database**: SQLite file persists in `./data/redes_chat.db`
- **No external dependencies**: Self-contained Docker container

### 📞 Support

**Check application logs:**
```bash
docker-compose -f docker-compose.deploy.yml logs --tail=50
```

**Test connection:**
```bash
# Test WebSocket connection
curl -I http://localhost:5000
```

**Database inspection:**
```bash
# Access database (if needed)
docker exec -it <container_name> sqlite3 /app/data/redes_chat.db
```

---

## 🎓 For College IT/Admin

**System Requirements:**
- Docker & Docker Compose
- Linux/Windows/Mac server
- 512MB RAM minimum
- 200MB disk space

**Security Notes:**
- Runs as non-root user inside container
- SQLite database (no external DB required)
- No sensitive data exposed
- WebSocket connections only

**Backup:**
```bash
# Backup database
cp ./data/redes_chat.db ./backup/redes_chat_$(date +%Y%m%d).db
```

---

**Ready to deploy at your college! 🚀**

*Published by: cerf*
*Version: 1.0.0*
*Date: November 9, 2025*