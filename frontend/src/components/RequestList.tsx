import React from 'react';
import { Request, User } from '../types';
import './RequestList.css';

interface Props {
  requests: Request[];
  users: User[];
  currentUser: User | null;
  onAssign?: (requestId: number, masterId: number) => void;
  onCancel?: (requestId: number) => void;
  onTake?: (requestId: number) => void;
  onComplete?: (requestId: number) => void;
}

const RequestList: React.FC<Props> = ({
  requests,
  users,
  currentUser,
  onAssign,
  onCancel,
  onTake,
  onComplete
}) => {
  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      new: 'Новая', assigned: 'Назначена', in_progress: 'В работе',
      done: 'Выполнена', canceled: 'Отменена'
    };
    return map[status] || status;
  };

  const getStatusClass = (status: string) => {
    const map: Record<string, string> = {
      new: 'status-new', assigned: 'status-assigned',
      in_progress: 'status-progress', done: 'status-done', canceled: 'status-canceled'
    };
    return map[status] || '';
  };

  const filteredRequests = requests.filter(req => {
    if (!currentUser) return false;
    if (currentUser.role === 'dispatcher') return true;
    if (currentUser.role === 'master') {
      return req.assignedTo === currentUser.id || req.status === 'new';
    }
    return false;
  });

  return (
    <div className="request-list">
      {filteredRequests.map(request => (
        <div key={request.id} className={`request-card ${getStatusClass(request.status)}`}>
          <div className="request-header">
            <h3>{request.clientName}</h3>
            <span className={`status-badge ${getStatusClass(request.status)}`}>
              {getStatusText(request.status)}
            </span>
          </div>
          
          <div className="request-details">
            <p><strong>Телефон:</strong> {request.phone}</p>
            <p><strong>Адрес:</strong> {request.address}</p>
            <p><strong>Проблема:</strong> {request.problemText}</p>
            {request.masterName && (
              <p><strong>Мастер:</strong> {request.masterName}</p>
            )}
            <p><small>Создана: {new Date(request.createdAt).toLocaleString()}</small></p>
          </div>

          <div className="request-actions">
            {currentUser?.role === 'dispatcher' && request.status === 'new' && (
              <>
                <select 
                  onChange={(e) => onAssign?.(request.id, Number(e.target.value))}
                  defaultValue=""
                >
                  <option value="" disabled>Назначить мастера</option>
                  {users.filter(u => u.role === 'master').map(master => (
                    <option key={master.id} value={master.id}>
                      {master.username}
                    </option>
                  ))}
                </select>
                <button className="cancel-btn" onClick={() => onCancel?.(request.id)}>
                  Отменить
                </button>
              </>
            )}

            {currentUser?.role === 'master' && 
             request.assignedTo === currentUser.id && 
             request.status === 'assigned' && (
              <button className="take-btn" onClick={() => onTake?.(request.id)}>
                Взять в работу
              </button>
            )}

            {currentUser?.role === 'master' && 
             request.assignedTo === currentUser.id && 
             request.status === 'in_progress' && (
              <button className="complete-btn" onClick={() => onComplete?.(request.id)}>
                Завершить
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RequestList;