"""
AI 수학 첫걸음 앱 아이콘 만들기 도구

남색 바탕에 흰 Σ, 노란 'AI' 딱지가 들어간 아이콘을 docs/icons/ 에 만든다.
  icon-192.png, icon-512.png       일반 아이콘
  icon-maskable-512.png            안드로이드가 둥글게 잘라 쓰는 아이콘 (여백 10%)
  apple-touch-icon.png (180px)     아이폰 홈 화면 아이콘

사용법 (저장소 맨 위 폴더에서, 윈도우 PC):
    pip install pillow
    python tools/make_icons.py
아이콘을 바꾼 뒤에는 docs/sw.js 의 VERSION 도 올려야 폰에 반영된다.
"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs', 'icons')
FONT_SIGMA = 'C:/Windows/Fonts/cambria.ttc'   # Σ
FONT_AI = 'C:/Windows/Fonts/arialbd.ttf'      # AI
NAVY, WHITE, SUN = '#2f3e9e', '#ffffff', '#f2b632'


def make(size, pad=0.0):
    """1024px로 그린 뒤 줄인다. pad는 가장자리 여백 비율 (maskable 아이콘용)."""
    S = 1024
    im = Image.new('RGB', (S, S), NAVY)
    d = ImageDraw.Draw(im)
    k, o = 1 - pad * 2, S * pad
    P = lambda x, y: (o + x * k, o + y * k)   # 여백을 반영한 좌표
    d.text(P(450, 470), 'Σ', font=ImageFont.truetype(FONT_SIGMA, int(640 * k)), fill=WHITE, anchor='mm')
    # 오른쪽 아래 노란 'AI' 딱지
    d.rounded_rectangle([P(600, 640), P(900, 860)], radius=60 * k, fill=SUN)
    d.text(P(750, 752), 'AI', font=ImageFont.truetype(FONT_AI, int(170 * k)), fill=NAVY, anchor='mm')
    return im.resize((size, size), Image.LANCZOS)


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, size, pad in [('icon-192.png', 192, 0), ('icon-512.png', 512, 0),
                            ('apple-touch-icon.png', 180, 0), ('icon-maskable-512.png', 512, 0.1)]:
        make(size, pad).save(os.path.join(OUT, name))
        print('docs/icons/' + name)


if __name__ == '__main__':
    main()
