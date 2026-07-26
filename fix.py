import re
import os

with open('src/pages/Profile.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('style="{', 'style={{')
text = text.replace('}"', '}}')
text = text.replace('{!d .||', '{!d ||')
text = text.replace(']}', '</>)}')

with open('src/pages/Profile.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
print('Fixed Profile.tsx JSX syntax')
