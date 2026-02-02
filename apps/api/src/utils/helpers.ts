import bcrypt from 'bcrypt';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSerialNumber(prefix: string, number: number): string {
  return `${prefix}-${number.toString().padStart(6, '0')}`;
}

export function calculateTotal(items: Array<{ amount: number }>): number {
  return items.reduce((sum, item) => sum + Number(item.amount), 0);
}
