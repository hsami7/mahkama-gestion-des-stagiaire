import os

with open('src/pages/InternPortal.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

start_str = "<div className=\"card\" style={{padding:24, marginBottom: 18, borderTop:'3px solid var(--danger)'}}>"
end_str = "</>)}\n          </div>\n\n          {/* PROFILE */}"

start_idx = text.find(start_str)
end_idx = text.find(end_str)

if start_idx != -1 and end_idx != -1:
    with open('temp_intern.txt', 'r', encoding='utf-8') as f:
        replacement = f.read()
    new_text = text[:start_idx] + replacement + '\n' + text[end_idx:]
    with open('src/pages/InternPortal.tsx', 'w', encoding='utf-8') as f:
        f.write(new_text)
    print('Replaced section in InternPortal.')
else:
    print('Failed to find markers')
