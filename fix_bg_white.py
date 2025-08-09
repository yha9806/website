#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fix bg-white to bg-neutral-50 in all TSX files"""

import os
import glob

def replace_bg_white(file_path):
    """Replace bg-white with bg-neutral-50 in a file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if 'bg-white' in content:
            new_content = content.replace('bg-white', 'bg-neutral-50')
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True
        return False
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    """Main function"""
    root_dir = r'I:\website\wenxin-moyun\src'
    pattern = os.path.join(root_dir, '**', '*.tsx')
    
    files = glob.glob(pattern, recursive=True)
    
    fixed_count = 0
    for file_path in files:
        if replace_bg_white(file_path):
            print(f"Fixed: {os.path.basename(file_path)}")
            fixed_count += 1
    
    print(f"\n[OK] Fixed {fixed_count} files")
    
    # Also check CSS files
    css_pattern = os.path.join(root_dir, '**', '*.css')
    css_files = glob.glob(css_pattern, recursive=True)
    
    for file_path in css_files:
        if replace_bg_white(file_path):
            print(f"Fixed CSS: {os.path.basename(file_path)}")
            fixed_count += 1
    
    print(f"[OK] Total files fixed: {fixed_count}")

if __name__ == "__main__":
    main()