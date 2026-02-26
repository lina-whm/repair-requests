const request = require('supertest');
const app = require('../server'); 

// тест 1: получение списка пользователей
describe('GET /api/users', () => {
  it('должен вернуть список пользователей', async () => {
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

// тест 2: создание заявки
describe('POST /api/requests', () => {
  it('должен создать новую заявку', async () => {
    const newRequest = {
      clientName: 'Тест Клиент',
      phone: '123456789',
      address: 'Тестовый адрес',
      problemText: 'Тестовая проблема'
    };
    const res = await request(app)
      .post('/api/requests')
      .send(newRequest);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
  });
});