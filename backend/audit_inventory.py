import sys
import os
import json

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.main import app

def main():
    os.makedirs("audit", exist_ok=True)
    schema = app.openapi()
    paths = schema.get("paths", {})

    inventory = []
    for path, methods in paths.items():
        for method, details in methods.items():
            method_upper = method.upper()
            summary = details.get("summary") or details.get("description") or "No description provided."
            op_id = details.get("operation_id", "")
            tags = details.get("tags", [])

            auth_required = True
            if path in ["/", "/docs", "/redoc", "/openapi.json", "/api/auth/login", "/api/auth/register", "/api/auth/health"]:
                auth_required = False

            role = "PATIENT / DOCTOR / ADMIN"
            if "/doctor" in path:
                role = "DOCTOR"
            elif "/admin" in path:
                role = "ADMIN"
            elif "/patient" in path or "/consultation" in path or "/profile" in path or "/dashboard" in path or "/history" in path or "/voice" in path:
                role = "PATIENT"

            inventory.append({
                "method": method_upper,
                "path": path,
                "operation_id": op_id,
                "tags": tags,
                "auth_required": auth_required,
                "role": role,
                "description": summary.split("\n")[0]
            })

    md = "# MediAssist API Inventory\n\n"
    md += f"Total Discovered OpenAPI Endpoints: **{len(inventory)}**\n\n"
    md += "| Method | Path | Auth Required | Role | Tags | Summary |\n"
    md += "| :--- | :--- | :--- | :--- | :--- | :--- |\n"
    
    inventory_sorted = sorted(inventory, key=lambda x: (x["path"], x["method"]))
    for item in inventory_sorted:
        auth_str = "YES" if item["auth_required"] else "NO"
        tags_str = ", ".join(item["tags"]) if item["tags"] else "None"
        md += f"| `{item['method']}` | `{item['path']}` | {auth_str} | **{item['role']}** | {tags_str} | {item['description']} |\n"

    with open("audit/API_INVENTORY.md", "w", encoding="utf-8") as f:
        f.write(md)
        
    with open("audit/inventory.json", "w", encoding="utf-8") as f:
        json.dump(inventory, f, indent=2)

    print(f"API Inventory generated successfully with {len(inventory)} OpenAPI routes.")

if __name__ == "__main__":
    main()
