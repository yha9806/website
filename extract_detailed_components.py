#!/usr/bin/env python3
"""
Extract detailed component data from Figma iOS 26 design system
"""

import json
import requests
import os
from typing import Dict, Any, List

# Configuration
FIGMA_API_KEY = "figd_VtCkQDgpoHkhsT7gTIpzyDbe8GOET6kPT1_k9M5T"
FILE_ID = "TPvwBSnWMLwNoPGJKmDG5L"

def get_figma_file():
    """Get the full Figma file structure"""
    headers = {
        "X-Figma-Token": FIGMA_API_KEY
    }
    
    url = f"https://api.figma.com/v1/files/{FILE_ID}"
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching file: {response.status_code}")
        return None

def find_components(node: Dict[str, Any], components: List[Dict[str, Any]], path: str = "") -> None:
    """Recursively find all components in the node tree"""
    
    # Track current path
    current_path = f"{path}/{node.get('name', '')}" if path else node.get('name', '')
    
    # Check if this is a component or component set
    if node.get("type") in ["COMPONENT", "COMPONENT_SET"]:
        component_data = {
            "id": node.get("id"),
            "name": node.get("name"),
            "type": node.get("type"),
            "path": current_path,
            "description": node.get("description", ""),
        }
        
        # Extract styling properties
        if "fills" in node:
            component_data["fills"] = node["fills"]
        if "effects" in node:
            component_data["effects"] = node["effects"]
        if "cornerRadius" in node:
            component_data["cornerRadius"] = node["cornerRadius"]
        if "strokeWeight" in node:
            component_data["strokeWeight"] = node["strokeWeight"]
        if "strokes" in node:
            component_data["strokes"] = node["strokes"]
        if "blendMode" in node:
            component_data["blendMode"] = node["blendMode"]
        
        # Look for glass morphism properties
        if "effects" in node:
            for effect in node["effects"]:
                if effect.get("type") == "LAYER_BLUR":
                    component_data["blur_radius"] = effect.get("radius", 0)
                if effect.get("type") == "DROP_SHADOW":
                    component_data["shadow"] = {
                        "offset_x": effect.get("offset", {}).get("x", 0),
                        "offset_y": effect.get("offset", {}).get("y", 0),
                        "radius": effect.get("radius", 0),
                        "color": effect.get("color", {}),
                        "spread": effect.get("spread", 0)
                    }
        
        components.append(component_data)
    
    # Recursively process children
    if "children" in node:
        for child in node["children"]:
            find_components(child, components, current_path)

def main():
    print("Fetching Figma file data...")
    file_data = get_figma_file()
    
    if not file_data:
        print("Failed to fetch file data")
        return
    
    # Extract all components
    components = []
    
    # Process all pages
    if "document" in file_data and "children" in file_data["document"]:
        for page in file_data["document"]["children"]:
            print(f"Processing page: {page.get('name')}")
            find_components(page, components)
    
    # Filter for our target components
    target_keywords = [
        "tab bar", "tabbar", "tab-bar",
        "slider", "range slider",
        "sheet", "bottom sheet",
        "segment", "segmented control",
        "popup", "popup button",
        "notification", "notification list",
        "context menu", "contextmenu",
        "action sheet", "actionsheet",
        "liquid glass", "glass", "blur"
    ]
    
    filtered_components = []
    for component in components:
        name_lower = component["name"].lower()
        if any(keyword in name_lower for keyword in target_keywords):
            filtered_components.append(component)
    
    # Save detailed component data
    output_file = "ios26_detailed_components.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump({
            "total_components": len(components),
            "filtered_components": len(filtered_components),
            "components": filtered_components
        }, f, indent=2, ensure_ascii=False)
    
    print(f"\n[OK] Extracted {len(components)} total components")
    print(f"[OK] Found {len(filtered_components)} matching components")
    print(f"[OK] Data saved to {output_file}")
    
    # Print summary of findings
    print("\n[INFO] Component Summary:")
    for comp in filtered_components[:10]:  # Show first 10
        print(f"  - {comp['name']}")
        if "cornerRadius" in comp:
            print(f"    Corner Radius: {comp['cornerRadius']}")
        if "blur_radius" in comp:
            print(f"    Blur Radius: {comp['blur_radius']}")
        if "shadow" in comp:
            print(f"    Shadow: {comp['shadow']}")
        if "blendMode" in comp:
            print(f"    Blend Mode: {comp['blendMode']}")

if __name__ == "__main__":
    main()