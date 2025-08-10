#!/usr/bin/env python3
"""
Extract iOS 26 design system components from Figma
"""
import requests
import json
import os
from pathlib import Path

# Configuration
FIGMA_API_KEY = "figd_VtCkQDgpoHkhsT7gTIpzyDbe8GOET6kPT1_k9M5T"
FILE_ID = "TPvwBSnWMLwNoPGJKmDG5L"
NODE_ID = "221-56229"  # iOS and iPadOS 26 Community

# API Headers
headers = {
    "X-Figma-Token": FIGMA_API_KEY
}

def extract_figma_file():
    """Extract the entire Figma file structure"""
    url = f"https://api.figma.com/v1/files/{FILE_ID}"
    
    print("Fetching Figma file structure...")
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        
        # Save raw data
        with open("ios26_figma_data.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print("File structure saved to ios26_figma_data.json")
        return data
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return None

def extract_specific_node():
    """Extract specific node details"""
    url = f"https://api.figma.com/v1/files/{FILE_ID}/nodes?ids={NODE_ID}"
    
    print(f" Fetching node {NODE_ID}...")
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        
        # Save node data
        with open("ios26_node_data.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(" Node data saved to ios26_node_data.json")
        return data
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return None

def extract_styles():
    """Extract styles from the file"""
    url = f"https://api.figma.com/v1/files/{FILE_ID}/styles"
    
    print(" Fetching styles...")
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        
        # Save styles
        with open("ios26_styles.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(" Styles saved to ios26_styles.json")
        return data
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return None

def extract_components():
    """Extract component metadata"""
    url = f"https://api.figma.com/v1/files/{FILE_ID}/components"
    
    print(" Fetching components...")
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        
        # Save components
        with open("ios26_components.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(" Components saved to ios26_components.json")
        return data
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return None

def extract_images():
    """Extract images/assets from specific nodes"""
    # First get the node IDs we want to export
    node_ids = [NODE_ID]  # Can add more specific component IDs
    
    # Request image URLs
    url = f"https://api.figma.com/v1/images/{FILE_ID}"
    params = {
        "ids": ",".join(node_ids),
        "format": "png",
        "scale": 2
    }
    
    print(" Fetching image URLs...")
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        data = response.json()
        
        # Save image URLs
        with open("ios26_images.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(" Image URLs saved to ios26_images.json")
        
        # Download images
        if "images" in data:
            os.makedirs("ios26_assets", exist_ok=True)
            for node_id, image_url in data["images"].items():
                if image_url:
                    print(f" Downloading image for node {node_id}...")
                    img_response = requests.get(image_url)
                    if img_response.status_code == 200:
                        filename = f"ios26_assets/{node_id.replace(':', '_')}.png"
                        with open(filename, "wb") as f:
                            f.write(img_response.content)
                        print(f" Saved to {filename}")
        
        return data
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return None

def main():
    print("Starting Figma iOS 26 extraction...")
    print(f"File ID: {FILE_ID}")
    print(f"Node ID: {NODE_ID}")
    print("-" * 50)
    
    # Extract everything
    file_data = extract_figma_file()
    node_data = extract_specific_node()
    styles_data = extract_styles()
    components_data = extract_components()
    images_data = extract_images()
    
    print("-" * 50)
    print("Extraction complete!")
    
    # Create summary
    summary = {
        "file_id": FILE_ID,
        "node_id": NODE_ID,
        "extraction_date": str(Path.cwd()),
        "files_created": [
            "ios26_figma_data.json",
            "ios26_node_data.json", 
            "ios26_styles.json",
            "ios26_components.json",
            "ios26_images.json"
        ]
    }
    
    with open("ios26_extraction_summary.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    
    print("Summary saved to ios26_extraction_summary.json")

if __name__ == "__main__":
    main()