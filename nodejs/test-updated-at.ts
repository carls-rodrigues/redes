import { userService, chatService, messageService } from './dist/services/index.js';

async function testUpdatedAt() {
  console.log('Testing updated_at functionality...');

  try {
    // Create test users with unique names
    const timestamp = Date.now();
    const user1 = await userService.createUser(`testuser1_${timestamp}`, 'password1');
    const user2 = await userService.createUser(`testuser2_${timestamp}`, 'password2');
    const user3 = await userService.createUser(`testuser3_${timestamp}`, 'password3');
    console.log('Created users:', user1.username, user2.username, user3.username);

    // Create a DM
    const dmId = await chatService.createOrGetDM(user1.id, user2.id);
    console.log('Created DM with ID:', dmId);

    // Check initial updated_at
    const dmChat = await chatService.getChat(dmId);
    console.log('DM initial updated_at:', dmChat.updated_at);

    // Send a message
    await messageService.sendMessage(dmId, user1.id, 'Test message');
    console.log('Sent message');

    // Check updated_at after message
    const dmChatAfterMessage = await chatService.getChat(dmId);
    console.log('DM updated_at after message:', dmChatAfterMessage.updated_at);

    // Create a group
    const groupResult = await chatService.createGroup(`Test Group ${timestamp}`, user1.id, [user2.id]);
    console.log('Created group:', groupResult.name);

    // Check group chat updated_at
    const groupChat = await chatService.getChat(groupResult.chat_id);
    console.log('Group chat initial updated_at:', groupChat.updated_at);

    // Add another member
    await chatService.addGroupMember(groupResult.group_id, user3.id);
    console.log('Added member to group');

    // Check updated_at after adding member
    const groupChatAfterAdd = await chatService.getChat(groupResult.chat_id);
    console.log('Group chat updated_at after adding member:', groupChatAfterAdd.updated_at);

    // Send message to group
    await messageService.sendMessage(groupResult.chat_id, user1.id, 'Group message');
    console.log('Sent message to group');

    // Check updated_at after group message
    const groupChatAfterMessage = await chatService.getChat(groupResult.chat_id);
    console.log('Group chat updated_at after message:', groupChatAfterMessage.updated_at);

    // Update group name
    await chatService.updateGroupName(groupResult.group_id, `Updated Test Group ${timestamp}`);
    console.log('Updated group name');

    // Check updated_at after name change
    const groupChatAfterNameChange = await chatService.getChat(groupResult.chat_id);
    console.log('Group chat updated_at after name change:', groupChatAfterNameChange.updated_at);

    console.log('All tests passed!');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testUpdatedAt();