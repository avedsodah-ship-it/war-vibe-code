# How to run War

No build or install step. Run the game in a browser.

## Option 1: Open the file

- **macOS / Linux:** from the repo folder, run:
  ```bash
  open index.html
  ```
- Or double-click `index.html` in Finder / your file manager.

Your default browser will open the game.

## Option 2: Local server (optional)

If you prefer serving the folder (e.g. to avoid `file://` restrictions):

```bash
cd war-vibe-code
python3 -m http.server 8000
```

Then open **http://localhost:8000** in your browser.

Stop the server with `Ctrl+C` in the terminal.

---

## Controls

- **Home:** Choose **One Player** (vs computer) or **Two Player** (same device).
- **One Player:** Click **Battle** to play a round. Click **Reveal** (or Battle) when it’s a war to show the war cards.
- **Two Player:** **A** = Player 1 plays/reveals. **L** = Player 2 plays/reveals. For a war, press **A** and **L** to reveal the war cards.
