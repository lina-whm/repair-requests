import React, { useState } from 'react';
import { createRequest } from '../services/api';
import './CreateRequest.css';

const CreateRequest: React.FC = () => {
  const [formData, setFormData] = useState({
    clientName: '', phone: '', address: '', problemText: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createRequest(formData);
      setSuccess(true);
      setFormData({ clientName: '', phone: '', address: '', problemText: '' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      alert('Ошибка при создании заявки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-request">
      <h1>Создать заявку</h1>
      {success && <div className="success">Заявка создана!</div>}
      <form onSubmit={handleSubmit}>
        <div><label>Имя клиента *</label><input name="clientName" value={formData.clientName} onChange={handleChange} required /></div>
        <div><label>Телефон *</label><input name="phone" value={formData.phone} onChange={handleChange} required /></div>
        <div><label>Адрес *</label><input name="address" value={formData.address} onChange={handleChange} required /></div>
        <div><label>Описание *</label><textarea name="problemText" value={formData.problemText} onChange={handleChange} required rows={4} /></div>
        <button type="submit" disabled={loading}>{loading ? 'Отправка...' : 'Создать заявку'}</button>
      </form>
    </div>
  );
};

export default CreateRequest;