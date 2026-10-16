# Net-monit — Updating with a patch (no reinstall)

A **patch** is a small zip that contains only the files that changed. You apply it to the Net-monit you already have. Your monitors, history, settings, users and license stay exactly as they are. The port and the Windows Service name do **not** change.

Use a patch for bug fixes and small features. A new full release (new folder, new port, new service) is only needed when the release notes say so.

## Before you start
- You need the patch zip made for **your version** (for example `Net-monit-V11.3-patch-01.zip` is for V11.3).
- Patches go in order: apply 01 before 02.
- You need Python (Net-monit already uses it) and permission to run as administrator.

## Windows, step by step
1. **Extract** the patch zip anywhere (Desktop is fine). You get a folder with `Apply-Patch.bat`, `apply_patch.py`, `PATCH-README.txt` and a `files` folder.
2. Open `PATCH-README.txt` and read the list of files it will change.
3. **Right-click `Apply-Patch.bat` > Run as administrator.** Click Yes.
4. When it asks **Install folder**, type your Net-monit folder (for example `C:\NetMonit-V11.3`) and press Enter. If you installed to a different folder, type that one.
5. The script: checks the folder is the right version, **backs up every file it will replace** (in `patch_backups` inside your install folder), stops the service, copies the files, checks them, and starts the service again.
6. When it says `DONE`, open the dashboard in the browser, press **Ctrl+F5**, then open **About**. **Patches applied** should show the patch number.

If your service has a custom name (you changed it in the wizard), run in Command Prompt as administrator, from the patch folder:
```
python apply_patch.py --target "C:\NetMonit-V11.3" --service Your_Service_Name
```

## Linux
```
sudo bash apply_patch.sh /opt/netmonit-v113
```

## See what it will do first
```
python apply_patch.py --target "C:\NetMonit-V11.3" --dry-run
```
Nothing is changed; it only lists the files.

## If it stops with a message
| Message | Meaning and what to do |
|---|---|
| "this patch is for V11.3 but the folder is V…" | Wrong patch for this install. Use the patch made for your version. |
| "needs patch 01 first" | Apply the earlier patch first. |
| "already applied" | Nothing to do. |
| Conflicts: "was edited on this machine" | Someone changed that file by hand. Keep a copy of it, then re-run with `--force` (the file is backed up first). |
| "damaged (checksum mismatch)" | The zip is incomplete. Download it again. |
| "could not stop it" | Stop the service yourself (`services.msc`), run the patch again with `--no-restart`, then start the service. |

## Undo a patch
The last lines of the output show a command ending in `--rollback "...patch_backups\..."`. Run it, in the patch folder, as administrator. Every replaced file is put back and the patch is removed from the "Patches applied" list.

## What a patch never touches
`data/` (your database), `logs/`, `config.yaml`, `secret.key`, `.env`, `venv/`, and the license. A patch that tries to touch them is refused.

## For the person who maintains the GitHub repository
- **Update the repo from a patch:** extract the patch zip, then
  ```
  python apply_patch.py --target <your repo folder> --repo
  ```
  This also updates `tests/`, `site/`, `README.md` and the docs (installs skip those).
- **Make a patch** between the previous and the new folder (same layout):
  ```
  python tools/make_patch.py OLD_FOLDER NEW_FOLDER --patch 2 --base-version 11.3 --summary "What changed, in one sentence" --out out
  ```
  The result, `out/Net-monit-V11.3-patch-02.zip`, contains only the added, changed and deleted files, each with a checksum.
