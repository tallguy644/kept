# Captioned Play screenshots, 1080x1920
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import sys, os
F='/usr/share/fonts/opentype/inter/'
H1=ImageFont.truetype(F+'InterDisplay-ExtraBold.otf',78)
H2=ImageFont.truetype(F+'Inter-Medium.otf',38)
W,HT=1080,1920
SHOTS=[
 ('1-miles','Free GPS mileage tracker','Tap Start, drive, and your miles add up','dark'),
 ('2-home','See what you really keep','After gas and costs, Lyft and Uber side by side','dark'),
 ('3-insights','Your month at a glance','Earnings, rides, hours and miles by week','dark'),
 ('4-cpm','Your real cost per mile','Gas, repairs and the wear on your car','dark'),
 ('5-log','Log your day in a minute','Earnings, tips, rides, hours and gas','dark'),
 ('6-days','Every day in one place','Edit anytime, with totals for each month','dark'),
 ('7-dark','Easy on your eyes at night','Dark mode, one tap away on More','light'),
 ('8-more','Free backup, no ads','Google Drive backup, Excel export, app lock','dark'),
]
def bg(theme):
    im=Image.new('RGB',(W,HT))
    top,bot=((22,58,42),(12,36,26)) if theme=='dark' else ((236,244,238),(214,232,220))
    d=ImageDraw.Draw(im)
    for y in range(HT):
        t=y/HT; d.line([(0,y),(W,y)],fill=tuple(int(top[i]+(bot[i]-top[i])*t) for i in range(3)))
    glow=Image.new('L',(W,HT),0); ImageDraw.Draw(glow).ellipse((W*0.1,500,W*0.9,1500),fill=90 if theme=='dark' else 120)
    glow=glow.filter(ImageFilter.GaussianBlur(160))
    col=(60,140,95) if theme=='dark' else (255,255,255)
    im.paste(Image.new('RGB',(W,HT),col),(0,0),glow)
    return im
def rr(size,r): m=Image.new('L',size,0); ImageDraw.Draw(m).rounded_rectangle((0,0,size[0]-1,size[1]-1),r,fill=255); return m
def fit(text,font,maxw,start):
    f=font; s=start
    while ImageDraw.Draw(Image.new('L',(1,1))).textlength(text,font=f)>maxw: s-=2; f=ImageFont.truetype(f.path,s)
    return f
def make(name,h1,h2,theme,out):
    im=bg(theme); d=ImageDraw.Draw(im)
    fg=(255,255,255) if theme=='dark' else (16,48,34); sub=(170,214,188) if theme=='dark' else (52,98,72)
    f1=fit(h1,H1,W-110,78); f2=fit(h2,H2,W-110,38)
    d.text((W/2,150),h1,font=f1,fill=fg,anchor='mm'); d.text((W/2,232),h2,font=f2,fill=sub,anchor='mm')
    scr=Image.open(f'raw/{name}.png').convert('RGB')
    sw=760; sh=int(scr.height*sw/scr.width); scr=scr.resize((sw,sh),Image.LANCZOS)
    bez=22; pw,ph=sw+2*bez,sh+2*bez; px=(W-pw)//2; py=330
    sh_=Image.new('L',(W,HT),0); ImageDraw.Draw(sh_).rounded_rectangle((px+10,py+30,px+pw+10,py+ph+30),90,fill=150)
    im.paste(Image.new('RGB',(W,HT),(4,16,10)),(0,0),sh_.filter(ImageFilter.GaussianBlur(40)))
    body=Image.new('RGB',(pw,ph),(18,22,20)); im.paste(body,(px,py),rr((pw,ph),92))
    ImageDraw.Draw(im).rounded_rectangle((px,py,px+pw-1,py+ph-1),92,outline=(70,80,74),width=3)
    im.paste(scr,(px+bez,py+bez),rr((sw,sh),72))
    # camera dot
    cx=W//2; ImageDraw.Draw(im).ellipse((cx-11,py+bez+16,cx+11,py+bez+38),fill=(12,12,12))
    im.save(out)
os.makedirs('final',exist_ok=True)
for i,(n,a,b,t) in enumerate(SHOTS): make(n,a,b,t,f'final/phone-{n}.png')
