from __future__ import annotations
import os
from pathlib import Path
from datetime import datetime

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle, PageBreak, Image

ROOT = Path(__file__).resolve().parents[2]
OUTPUT_PDF = ROOT / 'docs' / 'security-audit' / 'relatorio-auditoria-seguranca.pdf'
OUTPUT_MD = ROOT / 'docs' / 'security-audit' / 'relatorio-auditoria-seguranca.md'

SEVERITY_COLORS = {
    'Crítica': '#B91C1C',
    'Alta': '#EA580C',
    'Média': '#D97706',
    'Baixa': '#2563EB',
    'Ponto forte': '#059669',
}

project_name = 'Casa do Hambúrguer'
project_scope = 'Stack detectada: Node.js + Express + Bun, Prisma ORM + PostgreSQL, JWT via jose em cookie httpOnly, React + Vite + TypeScript, Firebase Auth no frontend e Firebase Admin no backend.'
method_note = 'Mapeamento por categoria: (1) tenant isolation: N/A em app single-tenant; (2) permissão no navegador: validada no servidor; (3) IDOR: checagens de posse por userId; (4) segredos: validação de env e ausência de segredos hardcoded; (5) XSS: busca por sinks perigosos sem resultados.'

severity_totals = {'Crítica': 0, 'Alta': 0, 'Média': 0, 'Baixa': 0, 'Ponto forte': 3}
category_totals = {'Banco sem tranca': 0, 'Permissão no navegador': 0, 'IDOR': 0, 'Chaves expostas': 0, 'Inputs sem tratamento': 0, 'Pontos fortes': 3}


def add_donut_chart(path: str):
    labels = list(severity_totals.keys())
    sizes = list(severity_totals.values())
    colors = [SEVERITY_COLORS[k] for k in labels]
    fig, ax = plt.subplots(figsize=(4.2, 4.2))
    ax.pie(sizes, labels=labels, colors=colors, startangle=90, wedgeprops={'linewidth': 1, 'edgecolor': 'white'}, autopct='%1.0f')
    ax.set_title('Achados por severidade', fontsize=12)
    ax.axis('equal')
    fig.tight_layout()
    fig.savefig(path, dpi=200)
    plt.close(fig)


def add_bar_chart(path: str):
    labels = list(category_totals.keys())
    values = list(category_totals.values())
    colors = [
        '#B91C1C' if lbl == 'Banco sem tranca' else
        '#EA580C' if lbl == 'Permissão no navegador' else
        '#D97706' if lbl == 'IDOR' else
        '#2563EB' if lbl == 'Chaves expostas' else
        '#059669' if lbl == 'Pontos fortes' else '#111827'
        for lbl in labels
    ]
    fig, ax = plt.subplots(figsize=(6.6, 3.2))
    ax.bar(labels, values, color=colors)
    ax.set_title('Categoria x evidência', fontsize=11)
    ax.set_ylabel('Quantidade')
    ax.tick_params(axis='x', rotation=20)
    for spine in ['top', 'right']:
        ax.spines[spine].set_visible(False)
    fig.tight_layout()
    fig.savefig(path, dpi=200)
    plt.close(fig)


def build_md():
    lines = []
    lines.append(f'# Relatório de Auditoria de Segurança — {project_name}')
    lines.append('')
    lines.append(f'- Data: {datetime.now().strftime("%d/%m/%Y")}')
    lines.append(f'- Escopo auditado: {project_scope}')
    lines.append(f'- Nota metodológica: {method_note}')
    lines.append('')
    lines.append('## Resumo executivo')
    lines.append('')
    lines.append('| Severidade | Quantidade |')
    lines.append('| --- | ---: |')
    for k, v in severity_totals.items():
        lines.append(f'| {k} | {v} |')
    lines.append('')
    lines.append('### Pontos fortes')
    lines.append('- `back-end/src/routes/order.routes.ts` e `back-end/src/services/orderServices/order.service.ts` defendem posse do pedido e acesso administrativo em nível do servidor.')
    lines.append('- `back-end/src/repositories/cart.repository.ts` filtra consultas por `userId` ao atualizar/deletar itens do carrinho.')
    lines.append('- `back-end/src/config/env.ts` exige variáveis sensíveis no bootstrap, e o Git não registra segredos reais no histórico.')
    lines.append('')
    lines.append('### Pontos fracos')
    lines.append('- Nenhum achado acionável de severidade crítica/alta foi verificado no código atual; a stack é single-tenant e não implementa RLS/tenant isolation como requisito.')
    lines.append('- O único valor sensível exposto no cliente é a Firebase API key pública, que é pública por desenho do SDK do Firebase e não constitui segredo de assinatura.')
    lines.append('')
    lines.append('## Tabela de achados detalhados')
    lines.append('| Severidade | Arquivo:linha | Descrição |')
    lines.append('| --- | --- | --- |')
    lines.append('| Sem achado | — | Não houve evidência verificável de vulnerabilidades em banco sem tranca, permissões no navegador, IDOR, secrets hardcoded ou XSS no código atual. |')
    lines.append('')
    lines.append('## Recomendações priorizadas')
    lines.append('- P1: manter validação server-side em todos os endpoints sensíveis e limitar alterações a `userId` autenticado; continuar usando `requiredAdmin` e `where: { userId }`.')
    lines.append('- P2: continuar usando `helmet()` e `cors` restritivo em `back-end/src/app.ts`; revisar tokens expiração e monitoramento de infraestrutura.')
    lines.append('- P3: manter `.env` fora do Git e validar `FIREBASE_PRIVATE_KEY`/`JWT_SECRET` no bootstrap; reduzir risco de drift entre ambiente local e produção.')
    lines.append('')
    lines.append('## ISSUES PARA O GITHUB')
    lines.append('')
    lines.append('Nenhuma issue de segurança acionável com evidência verificável foi encontrada no código atual para a stack detectada. Contudo, seguem recomendações de hardening que podem ser trackadas como tarefas operacionais:')
    lines.append('')
    lines.append('--- ISSUE 0 ---')
    lines.append('**Título:** [Segurança] Hardening contínuo de autenticação e segredo por ambiente')
    lines.append('**Labels sugeridas:** security + baixa')
    lines.append('**Descrição do problema:** A aplicação está corretamente validação do bootstrap e da autorização server-side, mas o ambiente de produção deve ser monitorado para garantir que variáveis sensíveis como `JWT_SECRET`, `FIREBASE_PRIVATE_KEY` e `RESEND_API_KEY` sempre venham do ambiente e nunca do Git.')
    lines.append('**Evidência:** `back-end/src/config/env.ts:3-10`, `back-end/src/config/firebaseAdmin.ts:21-38`, `back-end/src/config/jwt.ts:3-8`.')
    lines.append('**Impacto:** Reduz risco de regressão de configuração em deploys e evita vazamento acidental em repositórios ou logs.')
    lines.append('**Sugestão de correção:** manter validação de startup, secret scanning no CI e `.env` fora do Git; usar secret manager da plataforma de deploy.')
    lines.append('**Critérios de aceite:** checklist de segredos no CI; validação de env no boot; ausência de `.env` no histórico.')
    lines.append('--- FIM ISSUE 0 ---')
    return '\n'.join(lines)


def main():
    txt = build_md()
    OUTPUT_MD.write_text(txt, encoding='utf-8')

    donut_path = ROOT / 'docs' / 'security-audit' / 'severity_donut.png'
    bar_path = ROOT / 'docs' / 'security-audit' / 'category_bar.png'
    add_donut_chart(str(donut_path))
    add_bar_chart(str(bar_path))

    styles = getSampleStyleSheet()
    story = []
    title_style = ParagraphStyle('Title', parent=styles['Title'], fontSize=20, leading=24, alignment=1, textColor=colors.HexColor('#111827'))
    h2 = ParagraphStyle('H2', parent=styles['Heading2'], leading=20, textColor=colors.HexColor('#111827'))
    body = ParagraphStyle('Body', parent=styles['BodyText'], fontSize=10, leading=15)
    small = ParagraphStyle('Small', parent=styles['BodyText'], fontSize=8, leading=12)

    story.append(Paragraph(f'Relatório de Auditoria de Segurança — {project_name}', title_style))
    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph(f'Data: {datetime.now().strftime("%d/%m/%Y")}', body))
    story.append(Paragraph(f'Escopo: {project_scope}', body))
    story.append(Paragraph(f'Nota metodológica: {method_note}', body))
    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph('Resumo executivo', h2))
    table_data = [['Severidade', 'Quantidade'], ['Crítica', '0'], ['Alta', '0'], ['Média', '0'], ['Baixa', '0'], ['Ponto forte', '3']]
    table = Table(table_data, colWidths=[60 * mm, 25 * mm])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#E5E7EB')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#D1D5DB')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (1,1), (-1,-1), 'CENTER'),
    ]))
    story.append(table)
    story.append(Spacer(1, 6 * mm))
    story.append(Image(str(donut_path), width=80 * mm, height=80 * mm))
    story.append(Spacer(1, 6 * mm))
    story.append(Image(str(bar_path), width=120 * mm, height=60 * mm))
    story.append(PageBreak())

    story.append(Paragraph('Pontos fortes', h2))
    story.append(Paragraph('- `back-end/src/routes/order.routes.ts` valida a rota de pedidos e usa `requiredAdmin` para admin-only.', body))
    story.append(Paragraph('- `back-end/src/services/orderServices/order.service.ts` checa posse e retorna 404 para recursos de terceiros, mitigando IDOR.', body))
    story.append(Paragraph('- `back-end/src/repositories/cart.repository.ts` filtra queries por `userId` em atualizações/deleções.', body))
    story.append(Paragraph('- `back-end/src/config/env.ts` valida `CLOUDINARY_*` no startup e evita carga com variáveis vazias.', body))
    story.append(Paragraph('- `back-end/src/app.ts` usa Helmet, CORS restritivo e `trust proxy` para proteger a app.', body))
    story.append(Spacer(1, 8 * mm))

    story.append(Paragraph('Pontos fracos', h2))
    story.append(Paragraph('- Nenhum achado acionável de severidade crítica/alta foi verificado no código atual; a aplicação é single-tenant e não exige RLS de tenant.', body))
    story.append(Paragraph('- O único valor sensível do cliente é uma Firebase API key pública, que é esperada no SDK do cliente e não é segredo de assinatura.', body))
    story.append(Spacer(1, 8 * mm))

    story.append(Paragraph('Tabela de achados detalhados por categoria', h2))
    details = [
        ['Severidade', 'Arquivo:linha', 'Descrição'],
        ['Sem achado', '—', 'Nenhuma evidência verificável de banco sem tranca, permissão no navegador, IDOR, hardcoded secret ou XSS na stack atual.'],
        ['Ponto forte', 'back-end/src/services/orderServices/order.service.ts:47-52', 'Checagem de posse do pedido por `requester.id` e `order.userId`, com resposta 404 para recursos alheios.'],
        ['Ponto forte', 'back-end/src/repositories/cart.repository.ts:31-44', 'Deleção/atualização do carrinho filtram por `where: { id: cartItemId, userId }`.'],
        ['Ponto forte', 'back-end/src/config/env.ts:3-10', 'Validação de ambiente no bootstrap protege carregamento de segredos ausentes.'],
    ]
    detail_rows = [[Paragraph(str(cell), small) for cell in row] for row in details]
    detail_table = Table(detail_rows, colWidths=[25 * mm, 55 * mm, 90 * mm])
    detail_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#E5E7EB')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#D1D5DB')),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(detail_table)
    story.append(PageBreak())

    story.append(Paragraph('Recomendações priorizadas', h2))
    recs = [
        'P1: Manter o padrão de validação de posse por `userId` autenticado em todos os endpoints de leitura/escrita sensíveis.',
        'P2: Continuar com `helmet()`, `cors` restritivo e revisão periódica de expiração dos tokens e observabilidade de logs.',
        'P3: Manter `.env` fora do Git e usar secret manager da plataforma; validar `JWT_SECRET`, `FIREBASE_PRIVATE_KEY`, `RESEND_API_KEY` no boot.',
    ]
    for idx, item in enumerate(recs, 1):
        story.append(Paragraph(f'{idx}. {item}', body))
    story.append(Spacer(1, 8 * mm))

    story.append(Paragraph('ISSUES PARA O GITHUB', h2))
    issue_block = '''Nenhuma issue de segurança acionável com evidência verificável foi encontrada no código atual. Como medida de hardening contínuo, recomenda-se rastrear a seguinte tarefa operacional:

--- ISSUE 0 ---
Título: [Segurança] Hardening contínuo de autenticação e segredos por ambiente
Labels sugeridas: security + baixa
Descrição do problema: A aplicação já valida autorização e segredos no bootstrap, porém o ambiente deve continuar monitorado para garantir que `JWT_SECRET`, `FIREBASE_PRIVATE_KEY` e `RESEND_API_KEY` nunca saiam do ambiente e nunca entrem no Git.
Evidência: `back-end/src/config/env.ts:3-10`, `back-end/src/config/firebaseAdmin.ts:21-38`, `back-end/src/config/jwt.ts:3-8`.
Impacto: Reduz risco de regressão de configuração em deploys e evita vazamento acidental em repositórios e logs.
Sugestão de correção: manter `secret scanning` no CI, `.env` no `.gitignore` e secret manager da plataforma.
Critérios de aceite: checklist no CI; validação no boot; ausência de `.env` no histórico.
--- FIM ISSUE 0 ---'''
    story.append(Paragraph(issue_block, body))

    doc = SimpleDocTemplate(str(OUTPUT_PDF), pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm, topMargin=15 * mm, bottomMargin=15 * mm)
    doc.build(story)


if __name__ == '__main__':
    main()
