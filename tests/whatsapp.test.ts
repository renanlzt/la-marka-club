import { describe, it, expect } from 'vitest';
import {
  formatWhatsAppMessage,
  generateWhatsAppLink,
  DEFAULT_TEMPLATES,
} from '../src/lib/whatsapp';

describe('WhatsApp Message Formatter & Templates', () => {
  it('should format EARN_PURCHASE message with dynamic variables and default fallback', async () => {
    const text = await formatWhatsAppMessage('EARN_PURCHASE', {
      primeiro_nome: 'Fernanda',
      valor_compra: 'R$ 300,00',
      cashback_ganho: 'R$ 15,00',
      saldo_total: 'R$ 37,00',
      validade: '15/11/2026',
      link_carteira: 'https://club.lamarka.com.br/c/tk_abc123',
    });

    expect(text).toContain('Fernanda');
    expect(text).toContain('R$ 15,00 de cashback');
    expect(text).toContain('R$ 37,00');
    expect(text).toContain('https://club.lamarka.com.br/c/tk_abc123');
  });

  it('should format REDEEM message properly', async () => {
    const text = await formatWhatsAppMessage('REDEEM', {
      primeiro_nome: 'Camila',
      saldo_utilizado: 'R$ 20,00',
      saldo_total: 'R$ 17,00',
      link_carteira: 'https://club.lamarka.com.br/c/tk_xyz',
    });

    expect(text).toContain('Camila');
    expect(text).toContain('R$ 20,00');
    expect(text).toContain('R$ 17,00');
    expect(text).toContain('https://club.lamarka.com.br/c/tk_xyz');
  });

  it('should format BIRTHDAY gift message', async () => {
    const text = await formatWhatsAppMessage('BIRTHDAY', {
      primeiro_nome: 'Juliana',
      cashback_ganho: 'R$ 30,00',
      link_carteira: 'https://club.lamarka.com.br/c/tk_bday',
    });

    expect(text).toContain('Juliana');
    expect(text).toContain('R$ 30,00 de bônus');
    expect(text).toContain('https://club.lamarka.com.br/c/tk_bday');
  });

  it('should format EXPIRATION_ALERT message', async () => {
    const text = await formatWhatsAppMessage('EXPIRATION_ALERT', {
      primeiro_nome: 'Larissa',
      saldo_total: 'R$ 45,00',
      dias_para_expirar: '5',
      link_carteira: 'https://club.lamarka.com.br/c/tk_exp',
    });

    expect(text).toContain('Larissa');
    expect(text).toContain('R$ 45,00');
    expect(text).toContain('5 dias');
  });

  it('should sanitize phone number and generate valid wa.me URL with country code', () => {
    const rawPhone = '(11) 98765-4321';
    const message = 'Olá, Mariana!';
    const link = generateWhatsAppLink(rawPhone, message);

    expect(link).toBe('https://wa.me/5511987654321?text=Ol%C3%A1%2C%20Mariana!');
  });

  it('should keep country code if already present in phone number', () => {
    const phoneWith55 = '+55 11 98765-4321';
    const link = generateWhatsAppLink(phoneWith55, 'Teste');
    expect(link).toBe('https://wa.me/5511987654321?text=Teste');
  });
});
