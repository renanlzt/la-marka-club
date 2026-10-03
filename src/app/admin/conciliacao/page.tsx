'use client';

import React, { useState } from 'react';
import {
  FileCheck2,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';
import { ReconciliationResult } from '@/lib/reconciliation';

export default function AdminConciliacaoPage() {
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [reconciliation, setReconciliation] = useState<ReconciliationResult | null>(null);
  const [activeTab, setActiveTab] = useState<'MATCHED' | 'UNMATCHED_ERP' | 'UNMATCHED_CLUB'>('MATCHED');
  const [creditingPhone, setCreditingPhone] = useState<string | null>(null);

  const handlePasteDemo = () => {
    setCsvText(
      `Cupom;Data;Valor;Telefone;Cliente\n` +
      `CUP-2001;03/10/2026;R$ 300,00;11987654321;Mariana Silva\n` +
      `CUP-2002;03/10/2026;R$ 150,00;11977778888;Carolina Santos\n` +
      `CUP-2003;03/10/2026;R$ 420,00;11966665555;Renata Souza`
    );
  };

  const handleProcess = async () => {
    if (!csvText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/conciliacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'parse_and_match',
          csvText,
        }),
      });
      const data = await res.json();
      if (res.ok && data.result) {
        setReconciliation(data.result);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetroactiveCredit = async (item: any) => {
    if (!item.customerPhone) {
      const phoneInput = prompt('Informe o telefone da cliente para vincular o crédito:');
      if (!phoneInput) return;
      item.customerPhone = phoneInput;
    }

    setCreditingPhone(item.saleIdentifier);
    try {
      const res = await fetch('/api/admin/conciliacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'retroactive_credit',
          phone: item.customerPhone,
          amount: item.grossAmount,
          customerName: item.customerName,
        }),
      });

      if (res.ok) {
        alert(`Cashback de R$ ${(item.grossAmount * 0.05).toFixed(2)} concedido com sucesso para a cliente!`);
        // Re-processa
        handleProcess();
      }
    } finally {
      setCreditingPhone(null);
    }
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-lamarka-200/80 text-lamarka-800 text-xs font-semibold uppercase tracking-wider mb-2">
          <FileCheck2 className="w-3.5 h-3.5 text-lamarka-600" /> Auditoria & Conciliação
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-lamarka-900">
          Conciliação Independente de Vendas
        </h1>
        <p className="text-xs sm:text-sm text-lamarka-600 font-light mt-1">
          Importe ou cole o relatório de vendas do sistema comercial da loja para cruzar com os lançamentos do La Marka Club e identificar clientes não cadastradas.
        </p>
      </div>

      {/* Caixa de Importação */}
      <div className="bg-white rounded-3xl border border-lamarka-200/90 p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-lamarka-800">
            Importar Relatório de Vendas (CSV ou Texto de Cupons)
          </h2>
          <button
            type="button"
            onClick={handlePasteDemo}
            className="text-xs text-lamarka-600 hover:text-lamarka-900 underline font-light"
          >
            Colar dados de exemplo
          </button>
        </div>

        <textarea
          rows={5}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder="Cole aqui o conteúdo do relatório de vendas exportado (linhas com: Cupom;Data;Valor;Telefone;Cliente)..."
          className="w-full p-4 rounded-2xl border border-lamarka-200 text-xs font-mono text-lamarka-900 focus:outline-none focus:border-lamarka-500 focus:ring-1 focus:ring-lamarka-400 bg-lamarka-50/40"
        />

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-lamarka-500 font-light">
            Formato aceito: separado por ponto-e-vírgula (;) ou vírgula (,)
          </span>
          <button
            type="button"
            onClick={handleProcess}
            disabled={loading || !csvText.trim()}
            className="px-6 py-2.5 rounded-xl bg-lamarka-800 hover:bg-lamarka-900 text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-2"
          >
            <Upload className="w-3.5 h-3.5" />
            {loading ? 'Processando Cruzamento...' : 'Processar Conciliação'}
          </button>
        </div>
      </div>

      {/* Resultados da Conciliação */}
      {reconciliation && (
        <div className="flex flex-col gap-4">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setActiveTab('MATCHED')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                activeTab === 'MATCHED'
                  ? 'border-emerald-500 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-500/20'
                  : 'border-lamarka-200 bg-white hover:bg-lamarka-50'
              }`}
            >
              <span className="text-xs font-medium text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Vendas Conciliadas
              </span>
              <span className="text-2xl font-serif font-bold text-emerald-950 block mt-1">
                {reconciliation.matched.length}
              </span>
              <span className="text-[11px] text-emerald-700/80 font-light">
                Batidas 100% com o caixa
              </span>
            </button>

            <button
              onClick={() => setActiveTab('UNMATCHED_ERP')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                activeTab === 'UNMATCHED_ERP'
                  ? 'border-amber-500 bg-amber-50/80 shadow-xs ring-2 ring-amber-500/20'
                  : 'border-lamarka-200 bg-white hover:bg-lamarka-50'
              }`}
            >
              <span className="text-xs font-medium text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Sem Cadastro no Clube
              </span>
              <span className="text-2xl font-serif font-bold text-amber-950 block mt-1">
                {reconciliation.unmatchedErp.length}
              </span>
              <span className="text-[11px] text-amber-700/80 font-light">
                Oportunidades no balcão
              </span>
            </button>

            <button
              onClick={() => setActiveTab('UNMATCHED_CLUB')}
              className={`p-4 rounded-2xl border text-left transition-all ${
                activeTab === 'UNMATCHED_CLUB'
                  ? 'border-lamarka-500 bg-lamarka-100/60 shadow-xs ring-2 ring-lamarka-400/20'
                  : 'border-lamarka-200 bg-white hover:bg-lamarka-50'
              }`}
            >
              <span className="text-xs font-medium text-lamarka-800 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-lamarka-600" /> Apenas no Clube
              </span>
              <span className="text-2xl font-serif font-bold text-lamarka-950 block mt-1">
                {reconciliation.unmatchedClub.length}
              </span>
              <span className="text-[11px] text-lamarka-600 font-light">
                Vendas registradas no balcão
              </span>
            </button>
          </div>

          {/* Tabela de Detalhes da Aba Ativa */}
          <div className="bg-white rounded-3xl border border-lamarka-200/90 p-6 shadow-sm">
            {activeTab === 'MATCHED' && (
              <div>
                <h3 className="text-sm font-semibold text-emerald-900 mb-3">
                  Vendas Conciliadas com Sucesso ({reconciliation.matched.length})
                </h3>
                {reconciliation.matched.length === 0 ? (
                  <p className="text-xs text-lamarka-500 py-6 text-center">Nenhuma venda conciliada.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-lamarka-100 text-lamarka-500 uppercase text-[10px]">
                          <th className="pb-2">Cupom / ID</th>
                          <th className="pb-2">Cliente</th>
                          <th className="pb-2 text-right">Valor Venda</th>
                          <th className="pb-2 text-right">Cashback Gerado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-lamarka-100 text-lamarka-800">
                        {reconciliation.matched.map((m, idx) => (
                          <tr key={idx} className="hover:bg-lamarka-50/50">
                            <td className="py-2.5 font-mono text-[11px] font-semibold">{m.saleIdentifier}</td>
                            <td className="py-2.5">{m.customerName || 'Cliente'} ({m.customerPhone || 's/ tel'})</td>
                            <td className="py-2.5 text-right font-medium">R$ {m.grossAmount.toFixed(2)}</td>
                            <td className="py-2.5 text-right font-bold text-emerald-700">R$ {m.cashbackEarned.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'UNMATCHED_ERP' && (
              <div>
                <h3 className="text-sm font-semibold text-amber-900 mb-3">
                  Vendas Fiscais Sem Registro no Clube ({reconciliation.unmatchedErp.length})
                </h3>
                <p className="text-xs text-lamarka-600 font-light mb-4">
                  Estas compras ocorreram na loja mas não foram lançadas no balcão (a atendente esqueceu ou a cliente ainda não participava). Você pode creditar agora com 1 clique!
                </p>
                {reconciliation.unmatchedErp.length === 0 ? (
                  <p className="text-xs text-lamarka-500 py-6 text-center">Todas as vendas fiscais foram registradas no clube!</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-lamarka-100 text-lamarka-500 uppercase text-[10px]">
                          <th className="pb-2">Cupom</th>
                          <th className="pb-2">Cliente / Tel</th>
                          <th className="pb-2 text-right">Valor Compra</th>
                          <th className="pb-2 text-right">Ação Retroativa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-lamarka-100 text-lamarka-800">
                        {reconciliation.unmatchedErp.map((u, idx) => (
                          <tr key={idx} className="hover:bg-amber-50/30">
                            <td className="py-2.5 font-mono text-[11px] font-semibold">{u.saleIdentifier}</td>
                            <td className="py-2.5">{u.customerName || 'Não identificado'} ({u.customerPhone || 'Sem tel'})</td>
                            <td className="py-2.5 text-right font-bold text-lamarka-900">R$ {u.grossAmount.toFixed(2)}</td>
                            <td className="py-2.5 text-right">
                              <button
                                onClick={() => handleRetroactiveCredit(u)}
                                disabled={creditingPhone === u.saleIdentifier}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors"
                              >
                                <PlusCircle className="w-3 h-3" />
                                {creditingPhone === u.saleIdentifier ? 'Creditando...' : 'Creditar Cashback'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'UNMATCHED_CLUB' && (
              <div>
                <h3 className="text-sm font-semibold text-lamarka-900 mb-3">
                  Lançadas Apenas no Clube ({reconciliation.unmatchedClub.length})
                </h3>
                {reconciliation.unmatchedClub.length === 0 ? (
                  <p className="text-xs text-lamarka-500 py-6 text-center">Nenhuma venda isolada no clube.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-lamarka-100 text-lamarka-500 uppercase text-[10px]">
                          <th className="pb-2">Cliente</th>
                          <th className="pb-2">Telefone</th>
                          <th className="pb-2 text-right">Valor Informado</th>
                          <th className="pb-2 text-right">Cashback Concedido</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-lamarka-100 text-lamarka-800">
                        {reconciliation.unmatchedClub.map((c) => (
                          <tr key={c.creditId} className="hover:bg-lamarka-50/50">
                            <td className="py-2.5 font-medium">{c.customerName}</td>
                            <td className="py-2.5 text-lamarka-600">{c.customerPhone}</td>
                            <td className="py-2.5 text-right font-medium">R$ {c.purchaseAmount.toFixed(2)}</td>
                            <td className="py-2.5 text-right font-bold text-emerald-700">R$ {c.cashbackAmount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
