import { userService, chatService, messageService } from './dist/services/index.js';

async function testUpdatedAt() {
  console.log('Testando funcionalidade updated_at...');

  try {
    // Criar usuários de teste com nomes únicos
    const timestamp = Date.now();
    const user1 = await userService.createUser(`testuser1_${timestamp}`, 'password1');
    const user2 = await userService.createUser(`testuser2_${timestamp}`, 'password2');
    const user3 = await userService.createUser(`testuser3_${timestamp}`, 'password3');
    console.log('Created users:', user1.username, user2.username, user3.username);

    // Criar um DM
    const dmId = await chatService.createOrGetDM(user1.id, user2.id);
    console.log('Created DM with ID:', dmId);

    // Verificar updated_at inicial
    const dmChat = await chatService.getChat(dmId);
    console.log('DM initial updated_at:', dmChat.updated_at);

    // Enviar uma mensagem
    await messageService.sendMessage(dmId, user1.id, 'Test message');
    console.log('Sent message');

    // Verificar updated_at após mensagem
    const dmChatAfterMessage = await chatService.getChat(dmId);
    console.log('DM updated_at after message:', dmChatAfterMessage.updated_at);

    // Criar um grupo
    const groupResult = await chatService.createGroup(`Test Group ${timestamp}`, user1.id, [user2.id]);
    console.log('Created group:', groupResult.name);

    // Verificar updated_at do chat do grupo
    const groupChat = await chatService.getChat(groupResult.chat_id);
    console.log('Group chat initial updated_at:', groupChat.updated_at);

    // Adicionar outro membro
    await chatService.addGroupMember(groupResult.group_id, user3.id);
    console.log('Added member to group');

    // Verificar updated_at após adicionar membro
    const groupChatAfterAdd = await chatService.getChat(groupResult.chat_id);
    console.log('Group chat updated_at after adding member:', groupChatAfterAdd.updated_at);

    // Enviar mensagem para o grupo
    await messageService.sendMessage(groupResult.chat_id, user1.id, 'Group message');
    console.log('Sent message to group');

    // Verificar updated_at após mensagem do grupo
    const groupChatAfterMessage = await chatService.getChat(groupResult.chat_id);
    console.log('Group chat updated_at after message:', groupChatAfterMessage.updated_at);

    // Atualizar nome do grupo
    await chatService.updateGroupName(groupResult.group_id, `Updated Test Group ${timestamp}`);
    console.log('Updated group name');

    // Verificar updated_at após mudança de nome
    const groupChatAfterNameChange = await chatService.getChat(groupResult.chat_id);
    console.log('Group chat updated_at after name change:', groupChatAfterNameChange.updated_at);

    console.log('All tests passed!');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testUpdatedAt();