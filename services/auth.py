import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from database.db import Database
from models import User, Session
import hashlib


class AuthService:
  def __init__(self, db:Database):
    self.db = db

  def register(self, username, password):
    user_exists = self.db.get_user_by_username(username)
    if user_exists:
      raise ValueError("Username already exists.")
    user = User(username)
    hashed = hashlib.sha256(password.encode()).hexdigest()
    print("Registering user:", username)
    return self.db.register_user(user, hashed)
  
  def login(self, username, password):
    result = self.db.login_user(username)
    if not result or result[1] != hashlib.sha256(password.encode()).hexdigest():
        raise ValueError("Invalid credentials.")
    
    session = Session(user_id=result[0], username=username)
    self.db.create_session(session)
    return session
    

  def validate_session(self, session_id: str, user_id: str) -> bool:
    session = self.db.get_session(session_id, user_id)
    return session is not None