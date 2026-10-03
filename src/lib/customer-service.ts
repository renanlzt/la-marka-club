import { prisma } from './db';
import { getCustomerBalance, CustomerBalanceInfo } from './fifo-engine';

export interface CustomerWalletData {
  customer: {
    id: string;
    name: string;
    firstName: string;
    maskedPhone: string;
    birthDay: number | null;
    birthMonth: number | null;
  };
  balanceInfo: CustomerBalanceInfo;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    balanceAfter: number;
    description: string;
    createdAt: Date;
  }>;
}

/**
 * Ofusca número de telefone preservando apenas DDD e final para privacidade
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    const ddd = digits.slice(-11, -9);
    const last4 = digits.slice(-4);
    return `(${ddd}) 9****-${last4}`;
  }
  return 'Telefone cadastrado';
}

/**
 * Busca a carteira digital da cliente pelo token de alta segurança
 */
export async function getCustomerWalletByToken(
  magicToken: string
): Promise<CustomerWalletData | null> {
  if (!magicToken || magicToken.trim().length === 0) return null;

  const customer = await prisma.customer.findUnique({
    where: { magicToken: magicToken.trim() },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 30,
      },
    },
  });

  if (!customer) return null;

  const balanceInfo = await getCustomerBalance(customer.id);
  const firstName = customer.name.trim().split(' ')[0];

  return {
    customer: {
      id: customer.id,
      name: customer.name,
      firstName,
      maskedPhone: maskPhone(customer.phone),
      birthDay: customer.birthDay,
      birthMonth: customer.birthMonth,
    },
    balanceInfo,
    transactions: customer.transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      balanceAfter: t.balanceAfter,
      description: t.description,
      createdAt: t.createdAt,
    })),
  };
}
