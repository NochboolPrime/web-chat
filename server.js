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
const clients = new Map(); // Хранение подключенных клиентов

wss.on('connection', (ws) => {
    console.log('Новый клиент подключен');

    ws.on('message', (message) => {
        const messageObject = JSON.parse(message);
        
        if (messageObject.type === 'join') {
            clients.set(ws, messageObject.username); // Сохраняем имя пользователя
            const welcomeMessage = clients.size === 1 
                ? `Добро пожаловать. Вы первый в чате.` 
                : `Добро пожаловать. В чате уже присутствуют: ${Array.from(clients.values()).join(', ')}`;
            
            ws.send(welcomeMessage); // Отправляем приветственное сообщение новому пользователю
            
            // Уведомляем остальных о новом пользователе
            broadcast(`${messageObject.username} к нам присоединился.`);
        } else {
            const textMessage = `${clients.get(ws)}: ${messageObject.text}`;
            broadcast(textMessage); // Рассылаем сообщение всем клиентам
        }
    });

    ws.on('close', () => {
        const username = clients.get(ws);
        clients.delete(ws); // Удаляем клиента из списка
        broadcast(`${username} нас покинул.`); // Уведомляем остальных о выходе пользователя
    });
});

// Функция для рассылки сообщений всем подключенным клиентам
function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

// Запуск сервера на порту 8080
server.listen(8080, () => {
    console.log('Сервер запущен на http://localhost:8080');
});
