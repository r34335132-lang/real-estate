import { LegalRequest } from './types';

export const MOCK_LEGAL_REQUESTS: LegalRequest[] = [
  {
    id: 'lr-1',
    user_id: 'u-buyer',
    property_id: 'p3',
    lawyer_id: 'u-lawyer',
    request_type: 'validacion_escritura',
    status: 'en_proceso',
    notes: 'Revisión de fideicomiso en Tulum',
    created_at: '2025-05-10T10:00:00Z',
  },
  {
    id: 'lr-2',
    user_id: 'u-buyer',
    property_id: 'p5',
    lawyer_id: 'u-lawyer',
    request_type: 'contrato_compraventa',
    status: 'pendiente',
    notes: 'Borrador de contrato para torre Reforma',
    created_at: '2025-05-15T10:00:00Z',
  },
  {
    id: 'lr-3',
    user_id: 'u-buyer',
    property_id: 'p8',
    lawyer_id: 'u-lawyer',
    request_type: 'validacion_legal',
    status: 'pendiente',
    notes: 'Validación de lote en Los Cabos',
    created_at: '2025-05-20T10:00:00Z',
  },
];
