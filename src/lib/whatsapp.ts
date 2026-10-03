import { prisma } from './db';

export interface MessageVariables {
  nome?: string;
  primeiro_nome?: string;
  valor_compra?: string;
  cashback_ganho?: string;
  saldo_utilizado?: string;
  saldo_total?: string;
  validade?: string;
  dias_para_expirar?: string;
  link_carteira?: string;
}

export const DEFAULT_TEMPLATES: Record<string, { title: string; content: string }> = {
  EARN_PURCHASE: {
    title: 'Compra com Cashback Ganho',
    content:
      'Olá, {primeiro_nome}! Que prazer ter você aqui na La Marka hoje! ✨\nNa sua compra de hoje você ganhou *{cashback_ganho} de cashback*.\nSeu saldo disponível agora é de *{saldo_total}*.\n\nAcompanhe sua carteira e extrato quando quiser:\n👉 {link_carteira}',
  },
  REDEEM: {
    title: 'Compra com Resgate de Saldo',
    content:
      'Olá, {primeiro_nome}! Adoramos sua visita à La Marka hoje! 💕\nVocê utilizou *{saldo_utilizado}* do seu cashback nesta compra.\nVocê ainda possui *{saldo_total}* de saldo disponível.\n\nConsulte seu extrato atualizado:\n👉 {link_carteira}',
  },
  BIRTHDAY: {
    title: 'Presente de Aniversário',
    content:
      'Parabéns, {primeiro_nome}! A La Marka comemora o seu dia com você! 🎁✨\nVocê acabou de ganhar um presente especial de *{cashback_ganho} de bônus* para escolher o seu look de aniversário!\n\nVeja seu presente na sua carteira digital:\n👉 {link_carteira}',
  },
  EXPIRATION_ALERT: {
    title: 'Aviso de Expiração Próxima',
    content:
      'Olá, {primeiro_nome}! Passando para lembrar que você tem *{saldo_total}* de cashback disponível na La Marka, e parte desse valor expira em breve (em {dias_para_expirar} dias)!\n\nQue tal nos visitar e garantir aquele look que você amou? 💕\nConfira seu saldo aqui: {link_carteira}',
  },
};

/**
 * Formata a mensagem com as variáveis dinâmicas, utilizando template customizado ou fallback oficial.
 */
export async function formatWhatsAppMessage(
  type: string,
  variables: MessageVariables
): Promise<string> {
  let templateText = DEFAULT_TEMPLATES[type]?.content ?? '';

  try {
    const dbTemplate = await prisma.messageTemplate.findUnique({
      where: { id: type },
    });

    if (dbTemplate && dbTemplate.isCustomized && dbTemplate.content.trim()) {
      templateText = dbTemplate.content;
    }
  } catch (error) {
    // Se o banco de dados não estiver acessível, usa o fallback em memória com segurança
    console.warn(`[whatsapp] Usando template fallback para ${type}`);
  }

  // Preenche primeiro nome automaticamente se só o nome completo foi fornecido
  if (!variables.primeiro_nome && variables.nome) {
    variables.primeiro_nome = variables.nome.trim().split(' ')[0];
  }

  // Interpolação das tags dinâmicas
  return templateText.replace(/{([a-zA-Z0-9_]+)}/g, (_, key) => {
    const val = (variables as any)[key];
    return val !== undefined && val !== null ? String(val) : '';
  });
}

/**
 * Higieniza o número de telefone e gera o link direto do WhatsApp Web (wa.me)
 */
export function generateWhatsAppLink(phone: string, text: string): string {
  let cleanDigits = phone.replace(/\D/g, '');

  // Adiciona o DDI 55 do Brasil se for número de 10 ou 11 dígitos
  if (cleanDigits.length === 10 || cleanDigits.length === 11) {
    cleanDigits = `55${cleanDigits}`;
  }

  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanDigits}?text=${encodedText}`;
}
