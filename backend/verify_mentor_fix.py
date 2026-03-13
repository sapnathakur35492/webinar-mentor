import sys
import os
from datetime import datetime

# Mocking modules for test
sys.path.append(os.getcwd())
try:
    from backend.api import models
    
    print("Checking Mentor model fields...")
    fields = models.Mentor.model_fields
    required_fields = ['user_id', 'name', 'email', 'full_name', 'created_at', 'updated_at']
    
    missing = []
    for f in required_fields:
        if f in fields:
            print(f"  [OK] Field '{f}' found.")
        else:
            print(f"  [MISSING] Field '{f}' not found!")
            missing.append(f)
            
    if not missing:
        print("\nVerification Successful: All required fields are present in the Mentor model.")
    else:
        print(f"\nVerification Failed: Missing fields {missing}")
        sys.exit(1)
        
except Exception as e:
    print(f"Verification Failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
