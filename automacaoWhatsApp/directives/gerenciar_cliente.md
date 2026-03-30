# Gerenciar Cliente — Sub-fluxo CRM

## Objetivo
Executar operações de cadastro, edição ou exclusão de cliente no CRM,
com validação de documento (CPF/CNPJ) e verificação de duplicidade.

---

## Entradas (payload recebido do fluxo principal)
```json
{
  "acao": "cadastrar | editar | excluir",
  "entidade": "cliente",
  "id_advogado": "uuid do advogado",
  "confianca": 0.95,
  "mensagem": "mensagem original do usuário",
  "dados": {
    "nome_completo": "...",
    "cpf": "apenas dígitos ou null",
    "cnpj": "apenas dígitos ou null",
    "... demais campos ...": null
  }
}
```

---

## Ferramentas / Scripts

1. `execution/crm_cliente.py` — função principal `manage_client(payload)`

---

## Fluxo Passo a Passo

### CADASTRAR
1. Validar documento: `cpf` (11 dígitos) ou `cnpj` (14 dígitos) presentes em `dados`
   - Inválido ou ausente → retornar `{return: "mensagem de erro de documento"}`
2. Buscar cliente no Supabase por `cpf` ou `cnpj`
   - Já existe → retornar `{return: "Cliente já cadastrado no sistema."}`
   - Não existe → chamar `POST /api/cliente/staging` com os dados
3. Retornar `{return: "sucesso"}` ou `{return: "erro"}` conforme resposta da API

### EDITAR
1. Validar documento (mesmo fluxo do cadastro)
2. Buscar cliente no Supabase
   - Não existe → retornar `{return: "Nenhum registro encontrado para edição."}`
   - Existe → chamar `PUT /api/cliente/staging` com os dados
3. Retornar resultado

### EXCLUIR
1. Validar documento
2. Buscar cliente no Supabase
   - Não existe → retornar `{return: "Nenhum registro encontrado para exclusão."}`
   - Existe → chamar `DELETE /api/cliente/staging` com os dados
3. Retornar resultado

---

## Campos disponíveis para extração (tabela `cliente`)
```
cpf, cnpj, rg, orgao_expedidor, inscricao_estadual,
nome_completo, razao_social, tipo_cliente,
email, telefone, whatsapp_numero,
cep, estado, cidade, endereco, numero, bairro, complemento,
data_referencia, estado_civil, area_atuacao,
numero_conta, pix, observacoes
```

## Headers da API CRM
```
Content-Type: application/json
X-Master-Service-Key: {CRM_MASTER_KEY}
X-On-Behalf-Of: {id_advogado}
```

---

## Saídas
- `{return: "sucesso"}` → operação realizada com sucesso
- `{return: "Cliente já cadastrado no sistema."}` → duplicidade detectada
- `{return: "Nenhum registro encontrado para edição."}` → não encontrado
- `{return: "Informe um documento válido..."}` → validação falhou
- `{return: "erro"}` → erro na API CRM

---

## Edge Cases
- `dados.cpf` e `dados.cnpj` ambos nulos → exigir documento para cadastrar/editar/excluir
- CPF com menos ou mais de 11 dígitos → inválido
- CNPJ com menos ou mais de 14 dígitos → inválido
- API CRM retornar status != 2xx → retornar `{return: "erro"}`
- Supabase retornar erro de conexão → logar e retornar `{return: "erro"}`

---

## Aprendizados
- A API usa endpoint `/staging` — confirmar quando CRM sair de desenvolvimento
- A busca no Supabase usa `cpf` ou `cnpj` como chave de busca
- `tipo_cliente` não está sendo preenchido pela extratora ainda — pode impactar busca futura
