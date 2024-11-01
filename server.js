const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

// Создаем HTTP-сервер
const server = http.createServer((req, res) => {
    // Обслуживание статической HTML-страницы
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

// Создаем WebSocket-сервер
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Новый клиент подключен');

    ws.on('message', (message) => {
        // Парсим сообщение из JSON
        const messageObject = JSON.parse(message);
        
        // Извлекаем текст сообщения
        const textMessage = messageObject.text;

        // Выводим текстовое сообщение в консоль
        console.log(`Получено сообщение: ${textMessage}`);
        
        // Рассылаем текстовое сообщение всем клиентам
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(textMessage); // Отправляем только текст сообщения всем подключенным клиентам
            }
        });
    });

    ws.on('close', () => {
        console.log('Клиент отключился');
    });
});

// Запускаем сервер на порту 8080
server.listen(8080, () => {
    console.log('Сервер запущен на http://localhost:8080');
});