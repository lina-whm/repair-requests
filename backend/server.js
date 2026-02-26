const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// создаем папку data, если её нет
const dataDir = path.join(__dirname, 'data');
const fs = require('fs');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// подключаемся к базе данных
const dbPath = path.join(dataDir, 'repairs.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Ошибка подключения к БД:', err.message);
    } else {
        console.log('Подключено к SQLite базе по пути:', dbPath);
        
        // создаем таблицы
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT,
                role TEXT CHECK(role IN ('dispatcher', 'master'))
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                clientName TEXT NOT NULL,
                phone TEXT NOT NULL,
                address TEXT NOT NULL,
                problemText TEXT NOT NULL,
                status TEXT DEFAULT 'new' 
                    CHECK(status IN ('new', 'assigned', 'in_progress', 'done', 'canceled')),
                assignedTo INTEGER,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                version INTEGER DEFAULT 1,
                FOREIGN KEY(assignedTo) REFERENCES users(id)
            )
        `, (err) => {
            if (err) {
                console.error('Ошибка создания таблицы requests:', err);
            } else {
                console.log('Таблицы созданы или уже существуют');
                
                // добавляем тестовых пользователей
                const users = [
                    ['dispatcher', '123', 'dispatcher'],
                    ['master1', '123', 'master'],
                    ['master2', '123', 'master']
                ];

                users.forEach(([username, password, role]) => {
                    db.run(
                        'INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)',
                        [username, password, role],
                        function(err) {
                            if (err) {
                                console.error('Ошибка вставки пользователя:', err);
                            }
                        }
                    );
                });
            }
        });
    }
});

// ---------- API РОУТЫ ----------

// получить всех пользователей
app.get('/api/users', (req, res) => {
    db.all('SELECT id, username, role FROM users', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// получить все заявки
app.get('/api/requests', (req, res) => {
    db.all(`
        SELECT r.*, u.username as masterName 
        FROM requests r
        LEFT JOIN users u ON r.assignedTo = u.id
        ORDER BY r.createdAt DESC
    `, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows);
        }
    });
});

// создать новую заявку
app.post('/api/requests', (req, res) => {
    const { clientName, phone, address, problemText } = req.body;
    
    if (!clientName || !phone || !address || !problemText) {
        return res.status(400).json({ error: 'Все поля обязательны' });
    }
    
    db.run(
        `INSERT INTO requests (clientName, phone, address, problemText, status) 
         VALUES (?, ?, ?, ?, 'new')`,
        [clientName, phone, address, problemText],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                res.status(201).json({ id: this.lastID });
            }
        }
    );
});

// назначить мастера
app.post('/api/requests/:id/assign', (req, res) => {
    const { id } = req.params;
    const { masterId } = req.body;
    
    db.run(
        `UPDATE requests 
         SET assignedTo = ?, status = 'assigned', updatedAt = CURRENT_TIMESTAMP 
         WHERE id = ? AND status = 'new'`,
        [masterId, id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else if (this.changes === 0) {
                res.status(400).json({ error: 'Заявка уже не в статусе new' });
            } else {
                res.json({ success: true });
            }
        }
    );
});

// отменить заявку
app.post('/api/requests/:id/cancel', (req, res) => {
    const { id } = req.params;
    
    db.run(
        `UPDATE requests 
         SET status = 'canceled', updatedAt = CURRENT_TIMESTAMP 
         WHERE id = ? AND status IN ('new', 'assigned')`,
        [id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else if (this.changes === 0) {
                res.status(400).json({ error: 'Заявку нельзя отменить' });
            } else {
                res.json({ success: true });
            }
        }
    );
});

// взять в работу (с защитой)
app.post('/api/requests/:id/take', (req, res) => {
    const { id } = req.params;
    const { masterId } = req.body;
    
    // используем транзакцию
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        db.get(
            'SELECT status, version FROM requests WHERE id = ? AND assignedTo = ?',
            [id, masterId],
            (err, row) => {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: err.message });
                }
                
                if (!row) {
                    db.run('ROLLBACK');
                    return res.status(404).json({ error: 'Заявка не найдена или не назначена этому мастеру' });
                }
                
                if (row.status !== 'assigned') {
                    db.run('ROLLBACK');
                    return res.status(409).json({ 
                        error: 'Заявка уже не в статусе assigned',
                        currentStatus: row.status 
                    });
                }
                
                db.run(
                    `UPDATE requests 
                     SET status = 'in_progress', 
                         version = version + 1,
                         updatedAt = CURRENT_TIMESTAMP 
                     WHERE id = ? AND status = 'assigned' AND version = ?`,
                    [id, row.version],
                    function(err) {
                        if (err) {
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: err.message });
                        }
                        
                        if (this.changes === 0) {
                            db.run('ROLLBACK');
                            return res.status(409).json({ 
                                error: 'Заявка была изменена другим запросом' 
                            });
                        }
                        
                        db.run('COMMIT');
                        res.json({ success: true });
                    }
                );
            }
        );
    });
});

// завершить заявку
app.post('/api/requests/:id/complete', (req, res) => {
    const { id } = req.params;
    const { masterId } = req.body;
    
    db.run(
        `UPDATE requests 
         SET status = 'done', updatedAt = CURRENT_TIMESTAMP 
         WHERE id = ? AND assignedTo = ? AND status = 'in_progress'`,
        [id, masterId],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else if (this.changes === 0) {
                res.status(400).json({ error: 'Нельзя завершить эту заявку' });
            } else {
                res.json({ success: true });
            }
        }
    );
});

// запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});