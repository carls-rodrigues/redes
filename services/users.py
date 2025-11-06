import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from database.db import Database

class UsersService:
  def __init__(self, db=None):
    self.db = db or Database()

  def get_user_by_username(self, username):
    print("Fetching user:", username)
    return self.db.get_user_by_username(username)

  def update_user(self, user_id, user_updates):
    print("Updating user:", user_id, "with", user_updates)
    user = self.get_user_by_id(user_id)
    if not user:
        raise ValueError("User not found.")
    
    if 'connection_id' in user_updates:
        user.connection_id = user_updates['connection_id']
    if 'last_seen' in user_updates:
        user.last_seen = user_updates['last_seen']

    if 'username' in user_updates:
       raise ValueError("Username cannot be changed.")
    if 'id' in user_updates:
        raise ValueError("User ID cannot be changed.")
    
    return self.db.update_user(user_id, user)
  
  def get_user_by_id(self, user_id):
    return self.db.get_user_by_id(user_id)
  
  def delete_user(self, user_id):
    return self.db.delete_user(user_id)