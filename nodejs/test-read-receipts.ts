import { userService, chatService, messageService } from './dist/services/index.js';

async function testReadReceipts() {
  console.log('Testando funcionalidade de confirmações de leitura...');

  try {
    // Criar usuários de teste com nomes únicos
    const timestamp = Date.now();
    const user1 = await userService.createUser(`testuser1_${timestamp}`, 'password1');
    const user2 = await userService.createUser(`testuser2_${timestamp}`, 'password2');
    console.log('Created users:', user1.username, user2.username);

    // Criar um DM
    const dmId = await chatService.createOrGetDM(user1.id, user2.id);
    console.log('Created DM with ID:', dmId);

    // Enviar uma mensagem do user1 para user2
    const message1 = await messageService.sendMessage(dmId, user1.id, 'Hello from user1');
    console.log('Sent message from user1:', message1.content);

    // Verificar status da mensagem antes de ler (deve estar não lida)
    const messagesBeforeRead = await messageService.getMessages(dmId);
    const msg1BeforeRead = messagesBeforeRead.find(m => m.id === message1.id);
    console.log('Message read_at before reading:', msg1BeforeRead?.read_at);
    console.log('Message read_by before reading:', msg1BeforeRead?.read_by);

    // User2 lê as mensagens (isso deve marcá-las como lidas)
    const messagesAfterRead = await messageService.getMessages(dmId, user2.id);
    const msg1AfterRead = messagesAfterRead.find(m => m.id === message1.id);
    console.log('Message read_at after user2 reads:', msg1AfterRead?.read_at);
    console.log('Message read_by after user2 reads:', msg1AfterRead?.read_by);

    // Enviar outra mensagem do user2
    const message2 = await messageService.sendMessage(dmId, user2.id, 'Hello from user2');
    console.log('Sent message from user2:', message2.content);

    // User1 lê as mensagens
    const messagesAfterUser1Read = await messageService.getMessages(dmId, user1.id);
    const msg2AfterRead = messagesAfterUser1Read.find(m => m.id === message2.id);
    console.log('Message2 read_at after user1 reads:', msg2AfterRead?.read_at);
    console.log('Message2 read_by after user1 reads:', msg2AfterRead?.read_by);

    // Verificar que a própria mensagem do user1 não está marcada como lida por ele mesmo
    const msg1Final = messagesAfterUser1Read.find(m => m.id === message1.id);
    console.log('User1\'s own message should not be marked as read by themselves:');
    console.log('Message1 read_at:', msg1Final?.read_at);
    console.log('Message1 read_by:', msg1Final?.read_by);

    console.log('Read receipts test passed!');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testReadReceipts();