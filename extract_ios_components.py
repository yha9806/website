#!/usr/bin/env python3
"""
Extract and convert specific iOS 26 components to React component code
"""
import json
import os
import requests
from typing import Dict, List, Any
from pathlib import Path

FIGMA_API_KEY = "figd_VtCkQDgpoHkhsT7gTIpzyDbe8GOET6kPT1_k9M5T"
FILE_ID = "TPvwBSnWMLwNoPGJKmDG5L"

# Key component nodes from the iOS kit
COMPONENT_PAGES = {
    "buttons": "1:9015",  # Buttons page
    "toggles": "1:9103",  # Toggles page  
    "sliders": "1:10951", # Sliders page
    "action_sheets": "1:54200",  # Action Sheets
    "alerts": "1:54203",  # Alerts
    "lists": "1:54204",  # Lists
    "menus": "1:54205",  # Menus
    "sheets": "6:55724",  # Sheets
    "tab_bars": "6:55730",  # Tab Bars
    "segmented_controls": "6:55734",  # Segmented Controls
    "popovers": "6:55738",  # Popovers
}

# API Headers
headers = {
    "X-Figma-Token": FIGMA_API_KEY
}

def extract_component_nodes(node_ids):
    """Extract multiple component nodes"""
    node_ids_str = ",".join(node_ids)
    url = f"https://api.figma.com/v1/files/{FILE_ID}/nodes?ids={node_ids_str}"
    
    print(f"Fetching {len(node_ids)} component nodes...")
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        
        # Save component data
        with open("ios26_components_detailed.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print("Component data saved to ios26_components_detailed.json")
        return data
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return None

def extract_component_images(node_ids):
    """Extract images for specific components"""
    url = f"https://api.figma.com/v1/images/{FILE_ID}"
    params = {
        "ids": ",".join(node_ids),
        "format": "svg",  # Use SVG for better quality
        "scale": 2
    }
    
    print("Fetching component images...")
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        data = response.json()
        
        # Save image URLs
        with open("ios26_component_images.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print("Component image URLs saved")
        
        # Download images
        if "images" in data:
            os.makedirs("ios26_components", exist_ok=True)
            
            for node_id, image_url in data["images"].items():
                if image_url:
                    # Find component name
                    component_name = "unknown"
                    for name, comp_id in COMPONENT_PAGES.items():
                        if comp_id == node_id:
                            component_name = name
                            break
                    
                    print(f"Downloading {component_name}...")
                    img_response = requests.get(image_url)
                    if img_response.status_code == 200:
                        filename = f"ios26_components/{component_name}.svg"
                        with open(filename, "wb") as f:
                            f.write(img_response.content)
                        print(f"  Saved to {filename}")
        
        return data
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return None

def parse_component_styles(component_data):
    """Parse and extract style information from components"""
    styles = {
        "colors": {},
        "typography": {},
        "effects": {},
        "spacing": {}
    }
    
    if not component_data or "nodes" not in component_data:
        return styles
    
    for node_id, node_info in component_data["nodes"].items():
        if node_info and "document" in node_info:
            doc = node_info["document"]
            
            # Extract fills (colors)
            if "fills" in doc:
                for fill in doc["fills"]:
                    if fill.get("type") == "SOLID":
                        color = fill.get("color", {})
                        hex_color = "#{:02x}{:02x}{:02x}".format(
                            int(color.get("r", 0) * 255),
                            int(color.get("g", 0) * 255),
                            int(color.get("b", 0) * 255)
                        )
                        styles["colors"][f"{node_id}_fill"] = hex_color
            
            # Extract strokes
            if "strokes" in doc:
                for stroke in doc["strokes"]:
                    if stroke.get("type") == "SOLID":
                        color = stroke.get("color", {})
                        hex_color = "#{:02x}{:02x}{:02x}".format(
                            int(color.get("r", 0) * 255),
                            int(color.get("g", 0) * 255),
                            int(color.get("b", 0) * 255)
                        )
                        styles["colors"][f"{node_id}_stroke"] = hex_color
            
            # Extract effects (shadows, blur, etc)
            if "effects" in doc:
                for effect in doc["effects"]:
                    effect_type = effect.get("type")
                    if effect_type:
                        styles["effects"][f"{node_id}_{effect_type}"] = effect
    
    return styles

def generate_html_preview():
    """Generate an HTML preview of extracted components"""
    html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>iOS 26 Components Library</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif;
            background: #f2f2f7;
            padding: 20px;
            margin: 0;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            font-size: 34px;
            font-weight: 700;
            margin-bottom: 20px;
        }
        .component-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .component-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .component-card h3 {
            font-size: 17px;
            font-weight: 600;
            margin: 0 0 15px 0;
            text-transform: capitalize;
        }
        .component-preview {
            background: #f5f5f7;
            border-radius: 8px;
            padding: 20px;
            min-height: 150px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .component-preview img {
            max-width: 100%;
            height: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>iOS 26 Components Library</h1>
        <p>Extracted from Figma design system</p>
        
        <div class="component-grid">
"""
    
    # Add component cards
    for component_name in COMPONENT_PAGES.keys():
        svg_file = f"ios26_components/{component_name}.svg"
        if os.path.exists(svg_file):
            html += f"""
            <div class="component-card">
                <h3>{component_name.replace('_', ' ')}</h3>
                <div class="component-preview">
                    <img src="{svg_file}" alt="{component_name}">
                </div>
            </div>
"""
    
    html += """
        </div>
    </div>
</body>
</html>"""
    
    with open("ios26_components_preview.html", "w", encoding="utf-8") as f:
        f.write(html)
    
    print("HTML preview saved to ios26_components_preview.html")

def main():
    print("Starting iOS 26 component extraction...")
    print("-" * 50)
    
    # Extract component data
    node_ids = list(COMPONENT_PAGES.values())
    component_data = extract_component_nodes(node_ids)
    
    # Extract component images
    image_data = extract_component_images(node_ids)
    
    # Parse styles
    if component_data:
        styles = parse_component_styles(component_data)
        with open("ios26_component_styles.json", "w", encoding="utf-8") as f:
            json.dump(styles, f, indent=2)
        print("Component styles saved to ios26_component_styles.json")
    
    # Generate HTML preview
    generate_html_preview()
    
    print("-" * 50)
    print("Extraction complete!")
    print("Files created:")
    print("  - ios26_components_detailed.json")
    print("  - ios26_component_images.json")
    print("  - ios26_component_styles.json")
    print("  - ios26_components_preview.html")
    print("  - ios26_components/ (SVG files)")

if __name__ == "__main__":
    main()