# 关丹3 语音通话系统 - 部署文档

## 系统架构

### 技术栈
- **前端**: HTML5 + JavaScript (WebRTC API)
- **后端**: Node.js + WebSocket (ws库)
- **通信协议**: WebSocket (信令) + WebRTC (P2P语音传输)
- **STUN服务器**: Google Public STUN (stun.l.google.com:19302)

### 系统组件
1. **信令服务器** (Node.js): 处理房间管理、用户连接、WebRTC信令交换
2. **前端客户端**: 浏览器端WebRTC语音通话界面
3. **STUN服务器**: 用于NAT穿透（使用Google公共STUN）

---

## 环境要求

### 服务器要求
- **操作系统**: Linux (Ubuntu 20.04+ 推荐) / Windows Server 2019+
- **Node.js**: v16.0.0 或更高版本
- **内存**: 最低 2GB，推荐 4GB+
- **CPU**: 2核心或更高
- **网络**: 公网IP，带宽 10Mbps+

### 客户端要求
- **浏览器**: Chrome 90+、Edge 90+、Firefox 88+
- **移动端**: iOS Safari 14+、Android Chrome 90+
- **网络**: Wi-Fi 或 4G/5G
- **权限**: 麦克风访问权限

---

## 端口配置

### 必需端口
| 端口 | 协议 | 用途 | 是否必需 |
|------|------|------|----------|
| 8080 | TCP | WebSocket信令服务器 | 是 |
| 443 | TCP | HTTPS (生产环境) | 是 |
| 80 | TCP | HTTP重定向 | 推荐 |

### WebRTC动态端口范围
WebRTC会自动选择可用端口进行P2P连接，无需额外配置。

---

## 防火墙配置

### Linux (Ubuntu/Debian)

#### 使用 UFW (Uncomplicated Firewall)
```bash
# 允许SSH
sudo ufw allow 22/tcp

# 允许HTTP
sudo ufw allow 80/tcp

# 允许HTTPS
sudo ufw allow 443/tcp

# 允许WebSocket端口
sudo ufw allow 8080/tcp

# 启用防火墙
sudo ufw enable

# 查看状态
sudo ufw status
```

#### 使用 iptables
```bash
# 允许已建立的连接
sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# 允许SSH
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# 允许HTTP
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT

# 允许HTTPS
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# 允许WebSocket
sudo iptables -A INPUT -p tcp --dport 8080 -j ACCEPT

# 保存规则
sudo iptables-save | sudo tee /etc/iptables/rules.v4
```

### Windows Server

#### 使用 PowerShell
```powershell
# 允许WebSocket端口
New-NetFirewallRule -DisplayName "WebSocket Server" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow

# 允许HTTP
New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow

# 允许HTTPS
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow

# 查看规则
Get-NetFirewallRule | Where-Object {$_.Enabled -eq 'True'}
```

#### 使用 Windows Defender Firewall
1. 打开 "Windows Defender Firewall with Advanced Security"
2. 点击 "Inbound Rules" -> "New Rule"
3. 选择 "Port" -> "TCP" -> 输入端口 8080
4. 选择 "Allow the connection"
5. 应用到所有网络类型
6. 命名规则为 "WebSocket Server"

---

## HTTPS证书配置

### 方案一: Let's Encrypt (免费，推荐)

#### 安装 Certbot
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot

# CentOS/RHEL
sudo yum install certbot
```

#### 获取证书
```bash
# 停止服务器（如果正在运行）
sudo systemctl stop voice-chat

# 获取证书（需要域名）
sudo certbot certonly --standalone -d yourdomain.com

# 证书位置
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

#### 自动续期
```bash
# 测试续期
sudo certbot renew --dry-run

# 添加自动续期任务
sudo crontab -e
# 添加以下行（每月1号凌晨3点）
0 3 1 * * certbot renew --quiet && systemctl reload nginx
```

### 方案二: 自签名证书（测试环境）

#### 生成自签名证书
```bash
# 创建证书目录
sudo mkdir -p /etc/ssl/voice-chat

# 生成私钥
sudo openssl genrsa -out /etc/ssl/voice-chat/server.key 2048

# 生成证书
sudo openssl req -new -x509 -key /etc/ssl/voice-chat/server.key \
  -out /etc/ssl/voice-chat/server.crt -days 365 \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=YourCompany/CN=yourdomain.com"

# 设置权限
sudo chmod 600 /etc/ssl/voice-chat/server.key
sudo chmod 644 /etc/ssl/voice-chat/server.crt
```

### 方案三: 使用 Nginx 反向代理

#### 安装 Nginx
```bash
sudo apt update
sudo apt install nginx
```

#### 配置 Nginx
```nginx
# /etc/nginx/sites-available/voice-chat
server {
    listen 80;
    server_name yourdomain.com;
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL证书配置
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL优化配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # WebSocket代理配置
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时配置
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # 静态文件服务
    location /voice-chat/ {
        alias /path/to/voice-chat/client/;
        index index.html;
    }
}
```

#### 启用配置
```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/voice-chat /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

---

## 部署步骤

### 1. 准备服务器环境

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js (使用NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node --version
npm --version
```

### 2. 部署信令服务器

```bash
# 创建项目目录
sudo mkdir -p /opt/voice-chat
cd /opt/voice-chat

# 上传服务器文件
# 将 server/package.json 和 server/server.js 上传到 /opt/voice-chat/

# 安装依赖
npm install --production

# 创建系统服务
sudo nano /etc/systemd/system/voice-chat.service
```

#### Systemd 服务配置
```ini
[Unit]
Description=GuanDan3 Voice Chat Signaling Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/voice-chat
ExecStart=/usr/bin/node /opt/voice-chat/server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=voice-chat

# 环境变量
Environment=NODE_ENV=production
Environment=PORT=8080

# 安全设置
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/voice-chat

[Install]
WantedBy=multi-user.target
```

#### 启动服务
```bash
# 重载systemd配置
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start voice-chat

# 设置开机自启
sudo systemctl enable voice-chat

# 查看状态
sudo systemctl status voice-chat

# 查看日志
sudo journalctl -u voice-chat -f
```

### 3. 部署前端客户端

```bash
# 创建Web目录
sudo mkdir -p /var/www/voice-chat

# 上传前端文件
# 将 client/index.html 上传到 /var/www/voice-chat/

# 设置权限
sudo chown -R www-data:www-data /var/www/voice-chat
sudo chmod -R 755 /var/www/voice-chat
```

### 4. 配置Nginx（如使用）

```bash
# 复制Nginx配置
sudo cp /path/to/nginx-config /etc/nginx/sites-available/voice-chat

# 启用配置
sudo ln -s /etc/nginx/sites-available/voice-chat /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

### 5. 验证部署

```bash
# 检查服务状态
sudo systemctl status voice-chat
sudo systemctl status nginx

# 检查端口监听
sudo netstat -tlnp | grep -E '80|443|8080'

# 测试WebSocket连接
wscat -c ws://yourdomain.com:8080

# 访问前端
# 浏览器打开: https://yourdomain.com/voice-chat/
```

---

## 性能优化

### 服务器端优化

#### Node.js 优化
```javascript
// 在 server.js 开头添加
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  console.log(`主进程 ${process.pid} 正在运行`);
  
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    console.log(`工作进程 ${worker.process.pid} 已退出`);
    cluster.fork();
  });
} else {
  // 原有服务器代码
}
```

#### WebSocket 优化
```javascript
const wss = new WebSocket.Server({ 
  port: PORT,
  perMessageDeflate: false, // 禁用压缩以减少CPU
  clientTracking: true,
  maxPayload: 1024 * 1024 // 1MB
});
```

### 网络优化

#### TCP 优化
```bash
# /etc/sysctl.conf
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.ipv4.tcp_congestion_control = bbr

# 应用配置
sudo sysctl -p
```

---

## 监控和日志

### 日志管理

#### 配置日志轮转
```bash
# /etc/logrotate.d/voice-chat
/var/log/voice-chat/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl reload voice-chat
    endscript
}
```

### 性能监控

#### 使用 PM2
```bash
# 安装PM2
npm install -g pm2

# 启动服务
pm2 start server.js --name voice-chat

# 监控
pm2 monit

# 查看日志
pm2 logs voice-chat

# 设置开机自启
pm2 startup
pm2 save
```

---

## 故障排查

### 常见问题

#### 1. WebSocket连接失败
```bash
# 检查防火墙
sudo ufw status

# 检查端口监听
sudo netstat -tlnp | grep 8080

# 检查服务日志
sudo journalctl -u voice-chat -n 50
```

#### 2. 音频无法传输
- 检查浏览器麦克风权限
- 确认HTTPS已正确配置（WebRTC需要HTTPS）
- 检查STUN服务器连接

#### 3. 高延迟问题
- 检查网络带宽
- 优化STUN服务器选择
- 考虑部署TURN服务器

#### 4. 服务崩溃
```bash
# 查看详细日志
sudo journalctl -u voice-chat -f

# 检查内存使用
free -h

# 检查CPU使用
top
```

---

## 安全建议

1. **使用HTTPS**: WebRTC必须使用HTTPS（localhost除外）
2. **限制访问**: 使用防火墙限制IP访问
3. **定期更新**: 保持Node.js和依赖包更新
4. **监控日志**: 定期检查异常访问
5. **备份配置**: 定期备份配置文件和证书

---

## 维护计划

### 日常维护
- 每日检查服务状态
- 每周检查日志文件
- 每月更新依赖包

### 定期维护
- 每季度检查SSL证书有效期
- 每半年进行性能测试
- 每年进行安全审计

---

## 联系支持

如有问题，请联系技术支持团队。
