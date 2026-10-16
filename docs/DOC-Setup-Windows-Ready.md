# Net-monit V11.3 — Ready setup on Windows (no technical knowledge needed)

This is the easiest way to install Net-monit. You double-click one file and click **Next** a few times. About 5–10 minutes.

## What you need
- A Windows 10, Windows 11 or Windows Server PC that stays switched on (it does the monitoring).
- You must be able to approve "Run as administrator" (ask your IT person if you can't).
- Internet on that PC **only if Python is not installed yet** (the setup downloads it for you). Python is the free program Net-monit runs on.
- A free **port 50113** on that PC. If you installed an older Net-monit, that is fine: V11.3 installs next to it.

## Step by step
1. **Unzip.** Right-click `Net-monit-V11_3.zip`, choose **Extract All**, and extract it somewhere simple such as the Desktop. Do not run anything from inside the zip window.
2. **Open the extracted folder** and find `Setup.bat`.
3. **Double-click `Setup.bat`.** Windows asks "Do you want to allow this app to make changes?" — click **Yes**. A black window opens and shows `[Setup] Running as Administrator - OK`. Leave it open.
4. **If Python is missing,** the black window says it is downloading Python 3.11 (1–2 minutes). Wait. If it says it could not download, install Python from python.org (tick *Add python.exe to PATH*), then run `Setup.bat` again.
5. **The Setup Wizard window opens.** If you can't see it, look at the taskbar.
   - **Welcome:** read it and click **Next >**.
   - **Python check:** it should show Python 3.9 or newer. If not, click **Auto-Install Python 3.11**, then **Retry Detection**.
   - **License agreement:** tick *I have read and agree…* and click **Next >**.
   - **Location:** leave the defaults unless you have a reason to change them:
     - Install folder `C:\NetMonit-V11.3`
     - Dashboard port `50113` (do not use 6000–6063, browsers block them)
     - Windows Service name `Net_Monit_V113`
   - **Summary:** click **Install >**.
   - **Installing:** wait until it reaches 100%. It copies files, creates its own Python environment, installs what it needs and registers the Windows Service.
6. **Your browser opens** at `http://localhost:50113`. If it doesn't, open any browser and type that address yourself.
7. **Log in the first time:**
   - Email: `admin@email.com`
   - Password: a random one-time token. Open `C:\NetMonit-V11.3\data\FIRST-RUN-ADMIN-TOKEN.txt` with Notepad and copy the token. (It is also in `C:\NetMonit-V11.3\logs\service.log`.) The file is deleted after your first login, so keep the token until you have changed your password.
8. **Change the admin password** in the Admin Panel straight away.
9. **Activation screen:** click **Start a trial** (30 days, no key needed) or paste the license key your vendor sent you (see the Setup Guide, "Activation").

## Check that it is really running
Open Command Prompt as administrator and run:
```
sc query Net_Monit_V113
```
You want `STATE : 4 RUNNING`. Or open `http://localhost:50113` in a browser.

## See it from another PC
On the Net-monit PC, open Command Prompt **as administrator** and allow the port once:
```
netsh advfirewall firewall add rule name="Net-monit V11.3" dir=in action=allow protocol=TCP localport=50113
```
Then, on the other PC, open `http://<the-Net-monit-PC's-IP-address>:50113`.

## If something goes wrong
| What you see | What to do |
|---|---|
| The black window closes at once | Right-click `Setup.bat` > Run as administrator. |
| "Python was not found" and the download fails | Install Python from python.org, tick *Add to PATH*, run `Setup.bat` again. |
| The wizard says the port is in use | Pick another port in the Location step, e.g. 51000. |
| Browser says "can't reach this site" | Wait 30 seconds, press F5. Then run `sc query Net_Monit_V113`. If it is not RUNNING, open `C:\NetMonit-V11.3` in Command Prompt as administrator and run `python install_service.py debug`; the error is printed on screen. |
| You lost the first-run token | Look in `C:\NetMonit-V11.3\logs\service.log`. If the file is gone and you cannot log in, ask your vendor for the reset steps. |

## Remove it
Run `Uninstall.bat` from the folder you extracted (it asks for administrator permission). Your monitoring data stays in the install folder until you delete that folder yourself.

More detail: `DOC-Setup-Guide.md`. Running without the installer: `DOC-Setup-Python-Manual.md`.
