import { Appointment } from './types';

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-1',
    user_id: 'u-buyer',
    property_id: 'p1',
    broker_id: 'b1',
    date: '2025-06-05',
    time: '11:00',
    status: 'confirmada',
    created_at: '2025-05-18T10:00:00Z',
  },
  {
    id: 'apt-2',
    user_id: 'u-buyer',
    property_id: 'p6',
    broker_id: 'b2',
    date: '2025-06-12',
    time: '16:30',
    status: 'pendiente',
    created_at: '2025-05-22T10:00:00Z',
  },
];
