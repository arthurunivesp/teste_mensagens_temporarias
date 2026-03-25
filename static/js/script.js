// Configuração da API
const API_BASE_URL = 'https://5000-i1cgvle8sn8gozm653cp3-a2a545ba.us1.manus.computer';

// Estado da aplicação
const appState = {
    sentCount: 0,
    expiredCount: 0,
    activeMessages: new Map(),
    timers: new Map()
};

// Elementos do DOM
const messageForm = document.getElementById('messageForm');
const messagesContainer = document.getElementById('messagesContainer');
const sentCountEl = document.getElementById('sentCount');
const expiredCountEl = document.getElementById('expiredCount');
const successRateEl = document.getElementById('successRate');
const runTestsBtn = document.getElementById('runTestsBtn');
const terminalOutput = document.getElementById('terminalOutput');
const themeToggleBtn = document.getElementById('themeToggle');

// Event Listeners
messageForm.addEventListener('submit', handleFormSubmit);
runTestsBtn.addEventListener('click', runBackendTests);
if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);

// Init
initTheme();

// Função para enviar mensagem
async function handleFormSubmit(e) {
    e.preventDefault();

    const sender = document.getElementById('sender').value;
    const recipient = document.getElementById('recipient').value;
    const content = document.getElementById('content').value;
    const expires_in_seconds = parseInt(document.getElementById('expires_in_seconds').value);

    try {
        const response = await fetch(`${API_BASE_URL}/api/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sender,
                recipient,
                content,
                expires_in_seconds
            })
        });

        if (!response.ok) {
            throw new Error('Erro ao enviar mensagem');
        }

        const data = await response.json();
        const message = data.message;

        // Adicionar à UI
        addMessageToUI(message, expires_in_seconds);

        // Atualizar estatísticas
        appState.sentCount++;
        updateStats();

        // Disparar testes backend automaticamente ao enviar
        runBackendTests();

        // Limpar formulário
        messageForm.reset();
        document.getElementById('sender').value = 'Alice';
        document.getElementById('recipient').value = 'Bob';
        document.getElementById('expires_in_seconds').value = '10';

    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao enviar mensagem: ' + error.message);
    }
}

// Função para adicionar mensagem à UI
function addMessageToUI(message, expiresInSeconds) {
    // Remover mensagem vazia se existir
    const emptyState = messagesContainer.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }

    const messageCard = document.createElement('div');
    messageCard.className = 'message-card';
    messageCard.id = `card-${message.id}`;

    const startTime = Date.now();
    const endTime = startTime + (expiresInSeconds * 1000);

    messageCard.innerHTML = `
        <div class="message-header">
            <span class="message-from">De: <strong>${message.sender}</strong> para <strong>${message.recipient}</strong></span>
            <span class="message-timer" id="timer-${message.id}">${expiresInSeconds}s</span>
        </div>
        <div class="message-content">${escapeHtml(message.content)}</div>
        <div class="message-progress">
            <div class="message-progress-bar" id="progress-${message.id}" style="width: 100%;"></div>
        </div>
    `;

    messagesContainer.appendChild(messageCard);

    // Armazenar mensagem ativa
    appState.activeMessages.set(message.id, {
        element: messageCard,
        expiresAt: endTime,
        expiresInSeconds: expiresInSeconds
    });

    // Iniciar contagem regressiva
    startCountdown(message.id, expiresInSeconds, startTime, endTime);
}

// Função para contagem regressiva
function startCountdown(messageId, totalSeconds, startTime, endTime) {
    const timerEl = document.getElementById(`timer-${messageId}`);
    const progressEl = document.getElementById(`progress-${messageId}`);
    const card = document.getElementById(`card-${messageId}`);

    const updateTimer = () => {
        const now = Date.now();
        const timeRemaining = Math.max(0, endTime - now);
        const secondsRemaining = Math.ceil(timeRemaining / 1000);
        const percentageRemaining = (timeRemaining / (totalSeconds * 1000)) * 100;

        // Atualizar timer
        timerEl.textContent = `${secondsRemaining}s`;

        // Atualizar barra de progresso
        progressEl.style.width = `${percentageRemaining}%`;

        // Mudar cores conforme tempo passa
        if (secondsRemaining <= 3) {
            timerEl.classList.add('danger');
            timerEl.classList.remove('warning');
            card.classList.add('expiring');
        } else if (secondsRemaining <= 5) {
            timerEl.classList.add('warning');
            timerEl.classList.remove('danger');
        }

        // Se ainda há tempo, agendar próxima atualização
        if (timeRemaining > 0) {
            const timerId = setTimeout(updateTimer, 100);
            appState.timers.set(messageId, timerId);
        } else {
            // Mensagem expirou
            expireMessage(messageId);
        }
    };

    updateTimer();
}

// Função para expirar mensagem
function expireMessage(messageId) {
    const card = document.getElementById(`card-${messageId}`);
    
    if (card) {
        card.classList.add('expired');
        
        // Remover após animação
        setTimeout(() => {
            card.remove();
            
            // Se não há mais mensagens, mostrar empty state
            if (messagesContainer.children.length === 0) {
                const emptyState = document.createElement('p');
                emptyState.className = 'empty-state';
                emptyState.textContent = 'Nenhuma mensagem ativa. Envie uma acima!';
                messagesContainer.appendChild(emptyState);
            }
        }, 600);

        // Limpar timer
        if (appState.timers.has(messageId)) {
            clearTimeout(appState.timers.get(messageId));
            appState.timers.delete(messageId);
        }

        // Remover de mensagens ativas
        appState.activeMessages.delete(messageId);

        // Atualizar estatísticas
        appState.expiredCount++;
        updateStats();

        // Disparar testes backend automaticamente ao expirar
        runBackendTests();
    }
}

// Função para atualizar estatísticas
function updateStats() {
    sentCountEl.textContent = appState.sentCount;
    expiredCountEl.textContent = appState.expiredCount;

    const successRate = appState.sentCount > 0 
        ? Math.round((appState.expiredCount / appState.sentCount) * 100) 
        : 0;
    
    successRateEl.textContent = `${successRate}%`;
}

// Função para escapar HTML (segurança)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function setTheme(theme) {
    const body = document.body;
    if (theme === 'light') {
        body.classList.add('theme-light');
        themeToggleBtn.textContent = '🌙 Modo Escuro';
    } else {
        body.classList.remove('theme-light');
        themeToggleBtn.textContent = '🌞 Modo Claro';
    }
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    const currentTheme = document.body.classList.contains('theme-light') ? 'light' : 'dark';
    setTheme(currentTheme === 'light' ? 'dark' : 'light');
}

function initTheme() {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'light') {
        setTheme('light');
    } else {
        setTheme('dark');
    }
}

// Função para executar testes backend
async function runBackendTests() {
    // Se já estiver executando, não dispara outro
    if (runTestsBtn.disabled) return;

    runTestsBtn.disabled = true;
    runTestsBtn.textContent = 'Executando...';
    
    terminalOutput.innerHTML = '<span class="terminal-prompt">ubuntu@api-server:~$</span> <span class="terminal-info">Iniciando Pytest no backend...</span>\n';
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/run-tests`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        // Verifica se a resposta é JSON antes de tentar parsear
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const data = await response.json();
            
            if (data.success) {
                terminalOutput.innerHTML += `<span class="terminal-success">${escapeHtml(data.output)}</span>`;
                terminalOutput.innerHTML += '\n<span class="terminal-prompt">ubuntu@api-server:~$</span> <span class="terminal-success">Testes concluídos com sucesso!</span>';
            } else {
                terminalOutput.innerHTML += `<span class="terminal-error">${escapeHtml(data.output || data.error)}</span>`;
                terminalOutput.innerHTML += '\n<span class="terminal-prompt">ubuntu@api-server:~$</span> <span class="terminal-error">Falha nos testes. Verifique a saída acima.</span>';
            }
        } else {
            const text = await response.text();
            if (response.status === 404) {
                terminalOutput.innerHTML += `<span class="terminal-error">Erro 404: O endpoint de testes não foi encontrado. Reiniciando o servidor...</span>`;
            } else {
                terminalOutput.innerHTML += `<span class="terminal-error">Erro do Servidor (${response.status}): ${escapeHtml(text.substring(0, 100))}...</span>`;
            }
        }
    } catch (error) {
        terminalOutput.innerHTML += `<span class="terminal-error">Erro de conexão: ${error.message}</span>`;
    } finally {
        runTestsBtn.disabled = false;
        runTestsBtn.textContent = 'Executar Pytest';
        // Scroll para o final do terminal
        const container = terminalOutput.parentElement;
        container.scrollTop = container.scrollHeight;
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    console.log('Aplicação de Mensagens Temporárias iniciada!');
    updateStats();
});