# GUIA DE INSTALAÇÃO — AGROMÁQUINAS PWA
## Do zero ao app no celular em ~15 minutos

---

## PASSO 1 — Criar conta no GitHub
1. Acesse: https://github.com
2. Clique em "Sign up"
3. Crie seu usuário e senha
4. Confirme o e-mail

---

## PASSO 2 — Criar repositório e subir os arquivos
1. Após entrar no GitHub, clique em "New" (botão verde)
2. Nome do repositório: `agromaquinas`
3. Marque "Public"
4. Clique em "Create repository"
5. Na próxima tela, clique em "uploading an existing file"
6. Arraste TODOS os arquivos desta pasta:
   - index.html
   - app.js
   - manifest.json
   - sw.js
   - icon-192.svg
7. Clique em "Commit changes"

---

## PASSO 3 — Criar conta no Vercel e publicar
1. Acesse: https://vercel.com
2. Clique em "Sign Up" → escolha "Continue with GitHub"
3. Autorize o acesso
4. Na tela principal, clique em "Add New Project"
5. Encontre o repositório "agromaquinas" e clique "Import"
6. Não mude nada — clique em "Deploy"
7. Aguarde ~1 minuto
8. Vercel vai te dar um link como: https://agromaquinas.vercel.app

---

## PASSO 4 — Instalar no celular como app

### Android (Chrome):
1. Abra o link no Chrome
2. Toque nos 3 pontos (canto superior direito)
3. "Adicionar à tela inicial"
4. Confirme — o app aparece na tela como qualquer app instalado

### iPhone (Safari):
1. Abra o link no Safari (obrigatório — não funciona no Chrome do iPhone)
2. Toque no ícone de compartilhar (retângulo com seta para cima)
3. "Adicionar à Tela de Início"
4. Confirme

---

## RESULTADO
- App instalado na tela inicial do celular
- Funciona offline
- Dados salvos no dispositivo (não se perdem ao fechar)
- Para atualizar o app no futuro: basta substituir os arquivos no GitHub

---

## DÚVIDAS COMUNS

**"Posso usar no computador também?"**
Sim. O link do Vercel funciona em qualquer navegador.

**"E se eu trocar de celular?"**
Os dados ficam salvos no aparelho. Você perde ao trocar. 
Solução futura: adicionar exportação/importação de dados.

**"O app some se eu formatar o celular?"**
O app some, mas você reinstala pelo link. Os dados cadastrados somem.
