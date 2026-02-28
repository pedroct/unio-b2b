# UNIO — Área do Cliente

Área do cliente da plataforma UNIO Performance OS. Permite que clientes acompanhem nutrição, treinos, biometria e hidratação.

## Setup no novo Repl

1. Crie um novo Repl (Node.js / TypeScript)
2. Copie **todo** o conteúdo desta pasta para a raiz do novo Repl
3. Execute `npm install`
4. Configure o workflow "Start application" com o comando `npm run dev`
5. Acesse a aplicação

## Autenticação (mock)

O login aceita qualquer e-mail válido + senha com 6+ caracteres.
O nome do cliente é gerado automaticamente a partir do e-mail.

- **localStorage key**: `unio_cliente_auth`
- **Endpoint**: `POST /api/auth/login`

## Estrutura

```
client/src/
├── App.tsx              → Rotas e layout principal
├── lib/auth.tsx         → AuthProvider (e-mail + senha)
├── components/
│   ├── cliente-sidebar  → Sidebar do cliente
│   └── ui/              → Componentes shadcn (reutilizados)
├── pages/
│   ├── login.tsx        → Tela de login split-screen
│   └── inicio.tsx       → Home com cards dos módulos
server/
├── index.ts             → Express entry point
├── routes.ts            → Mock login endpoint
shared/
└── schema.ts            → Tipos e validação (Zod)
```

## Design System

Reutiliza o design system completo do painel profissional:
- Tema (cores, tipografia, dark mode) via `index.css`
- Componentes shadcn/ui
- ThemeToggle (claro/escuro)
- Sidebar com mesma estrutura visual

## Módulos (placeholder)

As rotas abaixo existem como placeholder — implementar conforme necessidade:

- `/nutricao` — Nutrição
- `/treino` — Treino
- `/biometria` — Biometria
- `/hidratacao` — Hidratação
- `/configuracoes` — Configurações
