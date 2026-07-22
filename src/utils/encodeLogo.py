import base64
import os

with open('D:\\MYP\\intern manager\\public\\logo.png', 'rb') as f:
    b64 = base64.b64encode(f.read()).decode('utf-8')

os.makedirs('D:\\MYP\\intern manager\\src\\utils', exist_ok=True)
with open('D:\\MYP\\intern manager\\src\\utils\\logoBase64.ts', 'w') as f:
    f.write(f'export const LOGO_BASE64 = "data:image/png;base64,{b64}";\n')
print('Created logoBase64.ts')
