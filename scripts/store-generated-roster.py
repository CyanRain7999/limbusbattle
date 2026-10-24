"""Persist one completed built-in imagegen result and its prompt record."""
import json
import shutil
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
record = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
folder = root / 'public/characters' / record['sinner'] / record['persona']
folder.mkdir(parents=True, exist_ok=True)
shutil.copyfile(record['generated'], folder / 'source-sheet.png')
print(record['key'], 'saved')
