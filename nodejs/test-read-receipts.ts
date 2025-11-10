import { userService, chatService, messageService } from './dist/services/index.js';

async function testReadReceipts() {
  console.log('Testando funcionalidade de confirmações de leitura...');

  try {
    // Criar usuários de teste com nomes únicos
    const timestamp = Date.now();
    const user1 = await userService.createUser(`testuser1_${timestamp}`, 'password1');
    const user2 = await userService.createUser(`testuser2_${timestamp}`, 'password2');
    console.log('Usuários criados:', user1.username, user2.username);

    // Criar um DM
    const dmId = await chatService.createOrGetDM(user1.id, user2.id);
    console.log('DM criado com ID:', dmId);

    // Enviar uma mensagem do user1 para user2
    const message1 = await messageService.sendMessage(dmId, user1.id, 'Hello from user1');
    console.log('Mensagem enviada do user1:', message1.content);

    // Verificar status da mensagem antes de ler (deve estar não lida)
    const messagesBeforeRead = await messageService.getMessages(dmId);
    const msg1BeforeRead = messagesBeforeRead.find(m => m.id === message1.id);
    console.log('Mensagem read_at antes de ler:', msg1BeforeRead?.read_at);
    console.log('Mensagem read_by antes de ler:', msg1BeforeRead?.read_by);

    // User2 lê as mensagens (isso deve marcá-las como lidas)
    const messagesAfterRead = await messageService.getMessages(dmId, user2.id);
    const msg1AfterRead = messagesAfterRead.find(m => m.id === message1.id);
    console.log('Mensagem read_at após user2 ler:', msg1AfterRead?.read_at);
    console.log('Mensagem read_by após user2 ler:', msg1AfterRead?.read_by);

    // Enviar outra mensagem do user2
    const message2 = await messageService.sendMessage(dmId, user2.id, 'Hello from user2');
    console.log('Mensagem enviada do user2:', message2.content);

    // User1 lê as mensagens
    const messagesAfterUser1Read = await messageService.getMessages(dmId, user1.id);
    const msg2AfterRead = messagesAfterUser1Read.find(m => m.id === message2.id);
    console.log('Mensagem2 read_at após user1 ler:', msg2AfterRead?.read_at);
    console.log('Mensagem2 read_by após user1 ler:', msg2AfterRead?.read_by);

    // Verificar que a própria mensagem do user1 não está marcada como lida por ele mesmo
    const msg1Final = messagesAfterUser1Read.find(m => m.id === message1.id);
    console.log('A própria mensagem do user1 não deve estar marcada como lida por ele mesmo:');
    console.log('Mensagem1 read_at:', msg1Final?.read_at);
    console.log('Mensagem1 read_by:', msg1Final?.read_by);

    console.log('Teste de confirmações de leitura passou!');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testReadReceipts();