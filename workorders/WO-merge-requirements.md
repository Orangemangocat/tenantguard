# WO: Merge requirements.txt and requirements_auth.txt

Summary
---
Merge `requirements_auth.txt` into `requirements.txt` to simplify dependency management. Remove the redundant `requirements_auth.txt` file.

Files changed
---
- `requirements.txt` (updated): added `cryptography`, `requests`, and `python-dotenv`, retained existing entries.
- `requirements_auth.txt` (deleted): merged and removed.

Notes
---
- Where there were conflicting version pins, the versions already present in `requirements.txt` were preserved (e.g., `Flask` and `flask-cors`).
- After deployment, run `pip install -r requirements.txt` in your environment.

Verification
---
Run these commands locally:

```bash
python -m pip install -r requirements.txt
python -m pip check
```

If using CI, update workflows that referenced `requirements_auth.txt` to use `requirements.txt` instead.
