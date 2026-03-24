📱 Sistema de Mensagens Temporárias (Desafio Seduc SP)

Este projeto é uma implementação prática e interativa do desafio de arquitetura de testes para um aplicativo de mensagens. A funcionalidade principal permite o envio de mensagens que desaparecem automaticamente após um período definido (simulando a regra de 24 horas).

O projeto une o Backend (Flask), o Frontend (HTML/CSS/JS) e Testes Automatizados (Pytest) para demonstrar como validar uma regra de negócio de forma visual e técnica.




🚀 Como Rodar o Projeto na Sua Máquina

Siga os passos abaixo para configurar o ambiente e executar a aplicação.

1. Pré-requisitos

Certifique-se de ter o Python 3 instalado. Você pode verificar rodando:

Bash


python --version



2. Clonar o Repositório

No seu terminal, clone este repositório:

Bash


git clone https://github.com/arthurunivesp/teste_mensagens_temporarias.git
cd teste_mensagens_temporarias



3. Instalar Dependências

Instale as bibliotecas necessárias (Flask para o servidor e Pytest para os testes ):

Bash


pip install Flask pytest



4. Executar a Aplicação Visual

Para abrir a interface no seu navegador:

Bash


python app.py



•
Após rodar, abra o navegador em: http://127.0.0.1:5000

•
Interação: Digite uma mensagem, defina o tempo (ex: 10 segundos ) e veja a mensagem sumir da tela com uma contagem regressiva!

5. Executar os Testes Automatizados

Para provar que a lógica de "sumir" está funcionando corretamente no backend:

1.
Mantenha o servidor rodando (ou abra um novo terminal).

2.
Execute o comando:

Bash


pytest test_api.py



•
O Pytest validará se a API realmente apaga as mensagens após o tempo expirar.




🛠️ Estrutura do Projeto

•
app.py: Servidor Flask com a lógica de gerenciamento e expiração de mensagens.

•
test_api.py: Testes automatizados que garantem a qualidade da funcionalidade.

•
templates/index.html: Interface visual moderna para interação do usuário.

•
static/js/script.js: Lógica de contagem regressiva e animações de desaparecimento.

•
static/css/style.css: Estilização profissional com gradientes e animações.




🧠 Conceitos Aplicados (Arquitetura de Testes)

Este projeto foi desenvolvido como parte de um exercício de QA (Quality Assurance), cobrindo:

•
Mapeamento de Testes: Testes de Unidade, Integração, API e UI.

•
Priorização de Recursos: Foco nos cenários críticos (expiração correta da mensagem).

•
Feedback Visual: Interface que permite ao aluno ver a "mágica" acontecendo em tempo real.




Desenvolvido por Arthur Camofo
Baseado na situação fictícia produzida pela Seduc SP.

