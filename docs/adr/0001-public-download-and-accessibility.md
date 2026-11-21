# 0001 — Downloads, métricas e acessibilidade do site público

## Contexto

O site encaminha visitantes para a Mac App Store, downloads e páginas externas. A CF Gauss recebe os contatos por um formulário incorporado. O site também mostra uma contagem pública de downloads e usa animações no início da página.

## Decisões

- Toda saída para download, App Store, código, changelog ou releases passa por um botão que abre o formulário da CF Gauss. O destino fica em `data-dest`; nenhum desses destinos é um link direto. O formulário na seção de inscrição permanece na própria página.
- Aceitar mensagens do formulário apenas da origem `https://cfgauss.com.br`, com `source: cfgauss-embed-form`, e distinguir os dois formulários pelo `e.source`. Após o sucesso no modal, navegar na mesma aba: uma nova aba aberta de forma assíncrona pode ser bloqueada pelo navegador.
- Validar os destinos de rastreamento contra os identificadores conhecidos, além de restringir o domínio. Um identificador trocado no domínio correto também enviaria o visitante ao lugar errado.
- Contar apenas downloads de binários de releases normais; pacotes de código-fonte e versões de teste para Windows não representam os downloads do aplicativo macOS anunciado. Se a API falhar, ocultar o contador em vez de inventar um número.
- Manter o redirecionamento em cache na rede de entrega porque os arquivos de uma release são imutáveis e a API anônima do GitHub limita as consultas por endereço IP. Construir a resposta 302 com os cabeçalhos desde o início, pois os cabeçalhos de `Response.redirect()` são imutáveis.
- Preservar conteúdo visível sem JavaScript e oferecer pausa para o vídeo de mais de cinco segundos. Reduzir movimento quando solicitado pelo sistema, conforme WCAG 2.2.2.

## Consequências

O formulário é uma etapa obrigatória antes da saída do site. As métricas podem ficar ocultas quando a fonte externa não responder. Os testes de contrato cobrem as rotas, os identificadores de destino e as alternativas de acessibilidade.
