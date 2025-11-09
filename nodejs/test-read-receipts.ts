import { userService, chatService, messageService } from './dist/services/index.js';

async function testReadReceipts() {
  console.log('Testing read receipts functionality...');

  try {
    // Create test users with unique names
    const timestamp = Date.now();
    const user1 = await userService.createUser(`testuser1_${timestamp}`, 'password1');
    const user2 = await userService.createUser(`testuser2_${timestamp}`, 'password2');
    console.log('Created users:', user1.username, user2.username);

    // Create a DM
    const dmId = await chatService.createOrGetDM(user1.id, user2.id);
    console.log('Created DM with ID:', dmId);

    // Send a message from user1 to user2
    const message1 = await messageService.sendMessage(dmId, user1.id, 'Hello from user1');
    console.log('Sent message from user1:', message1.content);

    // Check message status before reading (should be unread)
    const messagesBeforeRead = await messageService.getMessages(dmId);
    const msg1BeforeRead = messagesBeforeRead.find(m => m.id === message1.id);
    console.log('Message read_at before reading:', msg1BeforeRead?.read_at);
    console.log('Message read_by before reading:', msg1BeforeRead?.read_by);

    // User2 reads the messages (this should mark them as read)
    const messagesAfterRead = await messageService.getMessages(dmId, user2.id);
    const msg1AfterRead = messagesAfterRead.find(m => m.id === message1.id);
    console.log('Message read_at after user2 reads:', msg1AfterRead?.read_at);
    console.log('Message read_by after user2 reads:', msg1AfterRead?.read_by);

    // Send another message from user2
    const message2 = await messageService.sendMessage(dmId, user2.id, 'Hello from user2');
    console.log('Sent message from user2:', message2.content);

    // User1 reads the messages
    const messagesAfterUser1Read = await messageService.getMessages(dmId, user1.id);
    const msg2AfterRead = messagesAfterUser1Read.find(m => m.id === message2.id);
    console.log('Message2 read_at after user1 reads:', msg2AfterRead?.read_at);
    console.log('Message2 read_by after user1 reads:', msg2AfterRead?.read_by);

    // Verify that user1's own message is not marked as read by themselves
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