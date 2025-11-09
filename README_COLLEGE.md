# Redes Chat Backend - College Distribution

## 📦 Quick Start for College IT

Your college can deploy the Redes Chat Backend using one of these methods:

### Option 1: Automated Deployment (Recommended)

```bash
# Download and run the automated script
curl -O https://raw.githubusercontent.com/cerfdotdev/redes/main/deploy-college.sh
chmod +x deploy-college.sh
./deploy-college.sh
```

### Option 2: Manual Deployment

```bash
# 1. Download deployment files
curl -O https://raw.githubusercontent.com/cerfdotdev/redes/main/docker-compose.deploy.yml
curl -O https://raw.githubusercontent.com/cerfdotdev/redes/main/COLLEGE_DEPLOYMENT_README.md

# 2. Start the service
docker-compose -f docker-compose.deploy.yml up -d
```

## 🔧 System Requirements

- **Docker**: Version 20.10 or later
- **Docker Compose**: Version 2.0 or later
- **Operating System**: Linux, macOS, or Windows with Docker Desktop
- **Network**: Internet access for initial image download
- **Storage**: Minimum 100MB free space

## 🌐 Access Points

Once deployed, the backend will be available at:

- **WebSocket Endpoint**: `ws://localhost:5000/ws`
- **Health Check**: `http://localhost:5000`
- **Port**: 5000 (configurable in docker-compose.yml)

## 📊 Monitoring

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Stop service
docker-compose down

# Restart service
docker-compose restart
```

## 🛠️ Troubleshooting

### Service Won't Start

```bash
# Check if port 5000 is available
netstat -tlnp | grep :5000

# Check Docker logs
docker-compose logs redes-chat-backend
```

### Database Issues

- Data is stored in `./data/redes_chat.db`
- Ensure the `./data` directory has write permissions

### Network Issues

- Verify firewall allows port 5000
- Check Docker network: `docker network ls`

## 📚 Full Documentation

For detailed setup instructions, see: `COLLEGE_DEPLOYMENT_README.md`

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the full deployment README
3. Contact your college IT administrator

---

**Version**: 1.0.0
**Last Updated**: November 9, 2025
**Docker Image**: `cerfdotdev/redes_backend:latest`