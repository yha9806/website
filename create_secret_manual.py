#!/usr/bin/env python3
"""
Manual script to create secret-key in Google Cloud Secret Manager
使用本地 gcloud 命令创建缺失的 secret-key
"""

import subprocess
import secrets
import string
import sys

def generate_secure_secret_key(length=64):
    """Generate a secure random secret key"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def create_secret_key():
    """Create the secret-key using gcloud command"""
    project_id = "wenxin-moyun-prod"
    secret_id = "secret-key"
    
    # Generate secure secret value
    secret_value = generate_secure_secret_key()
    
    print(f"[*] Generating secure secret key for project: {project_id}")
    print(f"[*] Secret ID: {secret_id}")
    
    try:
        # First check if secret already exists
        check_cmd = [
            "gcloud", "secrets", "describe", secret_id,
            "--project", project_id
        ]
        
        result = subprocess.run(check_cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"[!] Secret '{secret_id}' already exists!")
            print("[+] Adding new version to existing secret...")
            
            # Add new version to existing secret
            add_version_cmd = [
                "gcloud", "secrets", "versions", "add", secret_id,
                "--data-file=-",
                "--project", project_id
            ]
            
            result = subprocess.run(
                add_version_cmd,
                input=secret_value,
                text=True,
                capture_output=True
            )
            
            if result.returncode == 0:
                print(f"[SUCCESS] New version added to secret '{secret_id}'!")
            else:
                print(f"[ERROR] Failed to add version: {result.stderr}")
                return False
                
        else:
            print(f"[+] Creating new secret '{secret_id}'...")
            
            # Create new secret
            create_cmd = [
                "gcloud", "secrets", "create", secret_id,
                "--data-file=-",
                "--project", project_id
            ]
            
            result = subprocess.run(
                create_cmd,
                input=secret_value,
                text=True,
                capture_output=True
            )
            
            if result.returncode == 0:
                print(f"[SUCCESS] Secret '{secret_id}' created successfully!")
            else:
                print(f"[ERROR] Failed to create secret: {result.stderr}")
                return False
        
        # Verify the secret was created/updated
        print("[*] Verifying secret...")
        verify_cmd = [
            "gcloud", "secrets", "describe", secret_id,
            "--project", project_id
        ]
        
        result = subprocess.run(verify_cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("[SUCCESS] Secret verification successful!")
            print(f"[INFO] You can now re-run the GitHub Actions deployment.")
            return True
        else:
            print(f"[ERROR] Secret verification failed: {result.stderr}")
            return False
            
    except FileNotFoundError:
        print("[ERROR] gcloud command not found!")
        print("[TIP] Please install Google Cloud SDK first:")
        print("https://cloud.google.com/sdk/docs/install")
        return False
        
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Google Cloud Secret Manager - Secret Key Creator")
    print("=" * 60)
    
    success = create_secret_key()
    
    if success:
        print("\n[NEXT STEPS]")
        print("1. Re-run the failed GitHub Actions deployment")
        print("2. The deployment should now succeed with the secret-key available")
        sys.exit(0)
    else:
        print("\n[FAILED]")
        print("Please check the error messages above and try again.")
        sys.exit(1)