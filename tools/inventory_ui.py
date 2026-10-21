import re,json
from pathlib import Path
files=list(Path('packages').glob('*/index.ts'))+list(Path('apps/web/src').glob('*.tsx'))+[Path('apps/desktop/main.cjs')]
items=set()
for file in files:
    source=file.read_text(encoding='utf-8-sig')
    for m in re.finditer(r"(['\"])((?:\\.|(?!\1).)*?)\1|>([^<>{}\n]+)[<{]",source):
        text=(m[2] or m[3] or '').strip()
        if re.search('[\u3400-\u9fff]',text) and len(text)<300:items.add(text)
Path('private/ui-strings.json').write_text(json.dumps(sorted(items),ensure_ascii=False,indent=2),encoding='utf-8')
print('\n'.join(sorted(items)))
