# services/auth-service/app/utils/security.py
# #password-policy #brute-force-protection

import re
from typing import Tuple

def validate_password_strength(password: str) -> Tuple[bool, str]:
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain lowercase letter"
    
    if not re.search(r'[0-9]', password):
        return False, "Password must contain a number"
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain special character"
    
    return True, "Password meets requirements"

def is_common_password(password: str) -> bool:
    common_passwords = [
        "password123", "admin123", "12345678", "qwerty123"
    ]
    return password.lower() in common_passwords
