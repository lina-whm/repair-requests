import React, { useState, useEffect } from 'react';
import RequestList from '../components/RequestList';
import { getRequests, getUsers, takeRequest, completeRequest } from '../services/api';
import { Request, User } from '../types';

const MasterPanel: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentMaster] = useState<User>({
    id: 2, // master1
    username: 'master1',
    role: 'master'
  });

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

  const handleTake = async (requestId: number) => {
    try {
      await takeRequest(requestId, currentMaster.id);
      loadData();
    } catch (error: any) {
      if (error.response?.status === 409) {
        alert('Заявка уже была взята другим мастером!');
      } else {
        alert('Ошибка при взятии заявки');
      }
    }
  };

  const handleComplete = async (requestId: number) => {
    try {
      await completeRequest(requestId, currentMaster.id);
      loadData();
    } catch (error) {
      alert('Ошибка при завершении');
    }
  };

  return (
    <div>
      <h1>Панель мастера</h1>
      <RequestList
        requests={requests}
        users={users}
        currentUser={currentMaster}
        onTake={handleTake}
        onComplete={handleComplete}
      />
    </div>
  );
};

export default MasterPanel;