import React, { useState, useEffect } from 'react';
import RequestList from '../components/RequestList';
import { getRequests, getUsers, assignMaster, cancelRequest } from '../services/api';
import { Request, User } from '../types';

const DispatcherPanel: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [requestsRes, usersRes] = await Promise.all([
        getRequests(),
        getUsers()
      ]);
      setRequests(requestsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    }
  };

  const handleAssign = async (requestId: number, masterId: number) => {
    try {
      await assignMaster(requestId, masterId);
      loadData();
    } catch (error) {
      alert('Ошибка при назначении мастера');
    }
  };

  const handleCancel = async (requestId: number) => {
    if (window.confirm('Отменить заявку?')) {
      try {
        await cancelRequest(requestId);
        loadData();
      } catch (error) {
        alert('Ошибка при отмене');
      }
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  return (
    <div>
      <h1>Панель диспетчера</h1>
      
      <div className="filter-bar">
        <label>Фильтр по статусу:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Все</option>
          <option value="new">Новые</option>
          <option value="assigned">Назначенные</option>
          <option value="in_progress">В работе</option>
          <option value="done">Выполненные</option>
          <option value="canceled">Отмененные</option>
        </select>
      </div>

      <RequestList
        requests={filteredRequests}
        users={users}
        currentUser={{ id: 1, username: 'dispatcher', role: 'dispatcher' }}
        onAssign={handleAssign}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default DispatcherPanel;