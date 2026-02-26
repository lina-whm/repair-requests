export type User = {
  id: number;
  username: string;
  role: 'dispatcher' | 'master';
};

export type Request = {
  id: number;
  clientName: string;
  phone: string;
  address: string;
  problemText: string;
  status: 'new' | 'assigned' | 'in_progress' | 'done' | 'canceled';
  assignedTo: number | null;
  masterName?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
};