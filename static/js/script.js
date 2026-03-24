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

// Event Listeners
messageForm.addEventListener('submit', handleFormSubmit);

// Função para enviar mensagem
async function handleFormSubmit(e) {
    e.preventDefault();

    const sender = document.getElementById('sender').value;
    const recipient = document.getElementById('recipient').value;
    const content = document.getElementById('content').value;
    const expires_in_seconds = parseInt(document.getElementById('expires_in_seconds').value);

    try {
        const response = await fetch('/api/messages', {
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

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    console.log('Aplicação de Mensagens Temporárias iniciada!');
    updateStats();
});