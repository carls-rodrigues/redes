import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from database.db import Database
from models import User
import hashlib


class AuthService:
  def __init__(self, db=None):
    self.db = db or Database()

  def register(self, username, password):
    user_exists = self.db.get_user_by_username(username)
    if user_exists:
      raise ValueError("Username already exists.")
    user = User(username)
    hashed = hashlib.sha256(password.encode()).hexdigest()
    print("Registering user:", username)
    return self.db.register_user(user, hashed)
  
  def login(self, username, password):
    print("Logging in user:", username)
    result = self.db.login_user(username)
    if not result or result[1] != hashlib.sha256(password.encode()).hexdigest():
        raise ValueError("Invalid credentials.")
    return result[0]  # return user_id
    

# if __name__ == "__main__":
#     auth = AuthService(Database())
#     auth.register("testuser2", "password123")
#     # assert auth.login("testuser", "password123") == True