const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

const server = http.createServer((req, res) => {
    if (req.url === '/') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) {
                res.writeHead(500);
                return res.end('Ошибка загрузки страницы');
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

const wss = new WebSocket.Server({ server });
const clients = new Map(); // Store connected clients

wss.on('connection', (ws) => {
    console.log('Новый клиент подключен');

    ws.on('message', (message) => {
        const messageObject = JSON.parse(message);

        if (messageObject.type === 'join') {
            clients.set(ws, messageObject.username); // Store username
            
            const welcomeMessage = clients.size === 1 
                ? `Добро пожаловать. Вы первый в чате.` 
                : `Добро пожаловать. В чате уже присутствуют: ${Array.from(clients.values()).join(', ')}`;
            
            // Send welcome message to new user
            ws.send(JSON.stringify({ text: welcomeMessage })); 
            
            // Notify others about the new user
            const joinMessage = `${messageObject.username} к нам присоединился.`;
            broadcast(joinMessage); // Broadcast join message to all clients
            
            console.log(joinMessage); // Log to console
            
            // Send updated user list to all clients
            broadcastUserList();
        } else { 
            const textMessage = JSON.stringify({
                username: clients.get(ws),
                text: messageObject.text,
                color: messageObject.color,
            });
            broadcast(textMessage); // Broadcast message to all clients
            
            console.log(textMessage); // Log sent messages
        }
    });

    ws.on('close', () => {
        const username = clients.get(ws);
        clients.delete(ws); // Remove client from list
        
        const leaveMessage = `${username} нас покинул.`; // Message for leaving user
        broadcast(leaveMessage); // Notify others about user's exit
        
        console.log(leaveMessage); // Log exit messages
        
        broadcastUserList(); // Send updated user list to all clients
    });
});

// Function to broadcast messages to all connected clients
function broadcast(data) {
    wss.clients.forEach((client) => {
         if (client.readyState === WebSocket.OPEN) {
             client.send(data);
         }
     });
}

// Function to send user list to all connected clients
function broadcastUserList() {
     const userListMessage = JSON.stringify({
         type: 'userList',
         users: Array.from(clients.values())
     });
    
     broadcast(userListMessage);
}

// Start server on port 8080
server.listen(8080, () => {
     console.log('Сервер запущен на http://localhost:8080');
});