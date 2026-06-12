export function assertAdmin(role: string): asserts role is 'admin' {
  if (role !== 'admin') {
    throw new Error('Solo un administrador puede consultar documentos sensibles.');
  }
}
