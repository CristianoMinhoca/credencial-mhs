# Sistema de Credenciais MHS 2025

## Passo a passo completo para publicar no Vercel

---

## PARTE 1 — Configurar o banco de dados (Supabase)

### 1.1 Criar conta no Supabase
1. Acesse **https://supabase.com**
2. Clique em **"Start your project"**
3. Faça login com sua conta Google ou GitHub
4. Clique em **"New project"**
5. Preencha:
   - **Name:** credencial-mhs
   - **Database Password:** anote essa senha em lugar seguro
   - **Region:** South America (São Paulo)
6. Clique em **"Create new project"** e aguarde ~2 minutos

### 1.2 Criar as tabelas e importar os dados
1. No painel do Supabase, clique em **"SQL Editor"** no menu esquerdo
2. Clique em **"New query"**
3. Abra o arquivo `supabase-setup.sql` que está dentro do projeto
4. Copie **todo o conteúdo** e cole no editor do Supabase
5. Clique em **"Run"** (botão verde)
6. Deve aparecer "Success" — isso cria as tabelas e importa todas as credenciais

### 1.3 Pegar as chaves do Supabase
1. No menu esquerdo, clique em **"Project Settings"** (ícone de engrenagem)
2. Clique em **"API"**
3. Anote os seguintes valores (você vai precisar deles no Vercel):
   - **Project URL** → começa com `https://`
   - **anon public** → chave longa que começa com `eyJ`
   - **service_role** → outra chave longa (clique em "Reveal" para ver)

---

## PARTE 2 — Publicar o sistema (Vercel)

### 2.1 Criar conta no GitHub (necessário para o Vercel)
1. Acesse **https://github.com** e crie uma conta gratuita (se não tiver)

### 2.2 Subir o código para o GitHub
1. Acesse **https://github.com/new**
2. Nome do repositório: `credencial-mhs`
3. Deixe como **Private** e clique em **"Create repository"**
4. Na próxima tela, clique em **"uploading an existing file"**
5. Arraste a pasta inteira `credencial-mhs` para a área de upload
6. Clique em **"Commit changes"**

### 2.3 Criar conta e publicar no Vercel
1. Acesse **https://vercel.com**
2. Clique em **"Sign Up"** → entre com sua conta GitHub
3. Clique em **"Add New Project"**
4. Selecione o repositório `credencial-mhs` e clique em **"Import"**
5. Em **"Environment Variables"**, adicione as 4 variáveis abaixo:

| Nome | Valor |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | A URL do seu projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | A chave `anon public` do Supabase |
| `SUPABASE_SERVICE_KEY` | A chave `service_role` do Supabase |
| `TOKEN_SECRET` | Qualquer texto aleatório, ex: `mhs2025-sistema-credencial-xyz` |

6. Clique em **"Deploy"**
7. Aguarde ~2 minutos — o Vercel vai publicar o sistema
8. Ao terminar, você receberá um link como: `https://credencial-mhs.vercel.app`

---

## PARTE 3 — Primeiro acesso

### Login inicial
- **Usuário:** `admin`
- **Senha:** `admin123`

> ⚠️ **Importante:** Troque a senha do admin assim que entrar!
> Para isso, acesse o Supabase → SQL Editor → rode:
> ```sql
> UPDATE usuarios SET senha_hash = '$2a$10$NOVO_HASH' WHERE usuario = 'admin';
> ```
> Gere um novo hash em: **https://bcrypt-generator.com/** (use rounds = 10)

---

## PARTE 4 — Criar mais usuários

Para adicionar novos usuários ao sistema, acesse o Supabase → SQL Editor e rode:

```sql
-- Exemplo: criar usuário "joao" com senha "senha123"
INSERT INTO usuarios (usuario, senha_hash)
VALUES ('joao', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');
```

Para cada novo usuário, gere um hash da senha em **https://bcrypt-generator.com/**

---

## Dúvidas comuns

**O site não abre?**
→ Verifique se as variáveis de ambiente foram adicionadas corretamente no Vercel
→ No Vercel, vá em Settings → Environment Variables

**Erro ao fazer login?**
→ Confirme que o script SQL rodou com sucesso no Supabase
→ Verifique se a tabela `usuarios` foi criada (Supabase → Table Editor)

**Como atualizar o sistema?**
→ Basta editar os arquivos no GitHub — o Vercel republica automaticamente

---

## Estrutura do projeto

```
credencial-mhs/
├── pages/
│   ├── index.tsx          ← Tela principal (lista de credenciais)
│   ├── login.tsx          ← Tela de login
│   └── api/
│       ├── auth/login.ts  ← API de autenticação
│       └── credenciais/   ← API de CRUD das credenciais
├── lib/
│   ├── supabase.ts        ← Conexão com Supabase
│   ├── auth.ts            ← Validação de token
│   └── politica.ts        ← Regra automática de política
├── styles/
│   └── globals.css
└── supabase-setup.sql     ← Script SQL para criar tabelas
```
