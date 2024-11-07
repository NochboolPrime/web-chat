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
const clients = new Map(); 

wss.on('connection', (ws) => {
    console.log('Новый клиент подключен');

    ws.on('message', (message) => {
        const messageObject = JSON.parse(message);

        if (messageObject.type === 'join') {
            clients.set(ws, messageObject.username); 
            
            const welcomeMessage = clients.size === 1 
                ? `Добро пожаловать. Вы первый в чате.` 
                : `Добро пожаловать. В чате уже присутствуют: ${Array.from(clients.values()).join(', ')}`;
            

            ws.send(JSON.stringify({ text: welcomeMessage })); 
            
     
            const joinMessage = `${messageObject.username} к нам присоединился.`;
            broadcast(joinMessage); 
            
            ws.send(JSON.stringify({ text: joinMessage })); 
            
            broadcastUserList();
        } else if (messageObject.type === 'privateMessage') {
            
            for (const [clientWs, clientUsername] of clients.entries()) {
                if (clientUsername === messageObject.to) {
                    clientWs.send(JSON.stringify({
                        username: messageObject.from,
                        text: messageObject.text,
                        color: messageObject.color,
                    }));
                    break; 
                }
            }
        } else { 
            const textMessage = JSON.stringify({
                username: clients.get(ws),
                text: messageObject.text,
                color: messageObject.color,
            });
            broadcast(textMessage); 
            
            console.log(textMessage);
        }
    });

    ws.on('close', () => {
        const username = clients.get(ws);
        clients.delete(ws); 
        
        const leaveMessage = `${username} нас покинул.`; 
        broadcast(leaveMessage); 
        
        console.log(leaveMessage); 
        
        broadcastUserList(); 
    });
});


function broadcast(data) {
    wss.clients.forEach((client) => {
         if (client.readyState === WebSocket.OPEN) {
             client.send(data);
         }
     });
}


function broadcastUserList() {
     const userListMessage = JSON.stringify({
         type: 'userList',
         users: Array.from(clients.values())
     });
    
     broadcast(userListMessage);
}


server.listen(8080, () => {
     console.log('Сервер запущен на http://localhost:8080');
});