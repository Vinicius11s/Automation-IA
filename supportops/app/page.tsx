import Link from "next/link";
import { ArrowRight, Headphones, Megaphone, Wallet } from "lucide-react";

export default function PainelPage() {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="max-w-2xl mx-auto px-8 py-12 flex flex-col gap-10">

        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-[#ededed] tracking-tight">
            SupportOps
          </h1>
          <p className="text-sm text-[#737373] mt-1">
            Painel interno de automação
          </p>
        </div>

        {/* Department cards */}
        <div className="flex flex-col gap-2">

          {/* Suporte — ativo */}
          <div className="p-5 bg-[#111111] border border-[#262626] rounded-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <Headphones className="size-4 text-[#525252] mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-[#ededed]">
                      Suporte / Atendimento
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-[#1a1a1a] border border-[#262626] text-[#525252] rounded font-mono">
                      ativo
                    </span>
                  </div>
                  <p className="text-xs text-[#525252] mt-1.5 leading-relaxed">
                    Triagem e gestão de tickets do Academy e Zendesk. Automação
                    de respostas, liberação de licenças e análise de prioridades
                    via Claude.
                  </p>
                </div>
              </div>
              <Link
                href="/suporte"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#ededed] bg-[#161616] border border-[#262626] rounded-md hover:bg-[#1c1c1c] hover:border-[#333333] transition-colors duration-100 shrink-0"
              >
                Abrir
                <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>

          {/* Financeiro — em breve */}
          <ComingSoonCard
            icon={<Wallet className="size-4" />}
            title="Financeiro"
            description="Gestão de cobranças, inadimplência e relatórios financeiros automatizados."
          />

          {/* Marketing — em breve */}
          <ComingSoonCard
            icon={<Megaphone className="size-4" />}
            title="Marketing / Vendas"
            description="Acompanhamento de leads, campanhas e métricas de conversão."
          />
        </div>

      </div>
    </div>
  );
}

function ComingSoonCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-5 bg-[#0d0d0d] border border-[#161616] rounded-lg">
      <div className="flex items-start gap-3">
        <span className="text-[#2a2a2a] mt-0.5 shrink-0">{icon}</span>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#333333]">{title}</span>
            <span className="text-[10px] text-[#2a2a2a] font-mono">
              em breve
            </span>
          </div>
          <p className="text-xs text-[#2a2a2a] mt-1.5 leading-relaxed max-w-sm">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
