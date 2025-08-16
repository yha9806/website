#!/usr/bin/env python3
"""
Script to create the missing 'secret-key' in Google Cloud Secret Manager
"""

import os
import secrets
import string
import json
from google.cloud import secretmanager
from google.auth import default
from google.oauth2 import service_account

def generate_secure_secret_key(length=64):
    """Generate a secure random secret key"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def create_secret_key():
    """Create the secret-key in Google Cloud Secret Manager"""
    project_id = "wenxin-moyun-prod"
    secret_id = "secret-key"
    
    try:
        # Try to use service account credentials if available
        credentials = None
        
        # Check for service account key in environment variable or file
        if os.environ.get('GOOGLE_APPLICATION_CREDENTIALS_JSON'):
            print("Using service account key from environment variable")
            key_data = json.loads(os.environ['GOOGLE_APPLICATION_CREDENTIALS_JSON'])
            credentials = service_account.Credentials.from_service_account_info(key_data)
        else:
            service_account_files = [
                "github-actions-key.json",
                "service-account-key.json",
                os.path.expanduser("~/.config/gcloud/application_default_credentials.json")
            ]
            
            for key_file in service_account_files:
                if os.path.exists(key_file):
                    print(f"Using service account key: {key_file}")
                    credentials = service_account.Credentials.from_service_account_file(key_file)
                    break
        
        # Initialize the Secret Manager client
        if credentials:
            client = secretmanager.SecretManagerServiceClient(credentials=credentials)
        else:
            print("No service account key found, trying default credentials...")
            client = secretmanager.SecretManagerServiceClient()
        
        # The resource name of the parent project
        parent = f"projects/{project_id}"
        
        # Generate a secure secret value
        secret_value = generate_secure_secret_key()
        
        print(f"[*] Generating secure secret key...")
        print(f"[*] Project: {project_id}")
        print(f"[*] Secret ID: {secret_id}")
        
        # Check if secret already exists
        try:
            secret_name = f"projects/{project_id}/secrets/{secret_id}"
            existing_secret = client.get_secret(request={"name": secret_name})
            print(f"[!] Secret '{secret_id}' already exists!")
            
            # Add a new version to existing secret
            print(f"[+] Adding new version to existing secret...")
            version_parent = secret_name
            payload = {"data": secret_value.encode("UTF-8")}
            
            response = client.add_secret_version(
                request={"parent": version_parent, "payload": payload}
            )
            print(f"[+] Successfully added new version: {response.name}")
            
        except Exception as e:
            if "not found" in str(e).lower():
                # Secret doesn't exist, create it
                print(f"[+] Creating new secret...")
                
                # Create the secret
                secret = {"replication": {"automatic": {}}}
                response = client.create_secret(
                    request={"parent": parent, "secret_id": secret_id, "secret": secret}
                )
                print(f"[+] Secret created: {response.name}")
                
                # Add the secret version
                payload = {"data": secret_value.encode("UTF-8")}
                version_response = client.add_secret_version(
                    request={"parent": response.name, "payload": payload}
                )
                print(f"[+] Secret version added: {version_response.name}")
            else:
                raise e
        
        print(f"[SUCCESS] Secret key successfully created/updated!")
        print(f"[INFO] You can now re-run the GitHub Actions deployment.")
        
    except Exception as e:
        print(f"[ERROR] Error creating secret: {e}")
        
        # Print helpful debugging information
        print(f"\n[DEBUG] Troubleshooting:")
        print(f"1. Make sure you have the correct Google Cloud credentials")
        print(f"2. Verify you have 'Secret Manager Admin' role for project '{project_id}'")
        print(f"3. Check that the project ID '{project_id}' is correct")
        
        # Show authentication info if available
        try:
            credentials, project = default()
            print(f"[DEBUG] Current credentials project: {project}")
        except Exception as auth_e:
            print(f"[DEBUG] Authentication issue: {auth_e}")
            print(f"[TIP] Try running: gcloud auth application-default login")

if __name__ == "__main__":
    create_secret_key()