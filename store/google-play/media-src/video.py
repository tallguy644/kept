import json, subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter
F='/usr/share/fonts/opentype/inter/'
W,H=1920,1080
d=json.load(open('rec/marks.json')); fr=d['frames']; m=d['marks']; t0=fr[0][1]
END=m['END']-t0
# 1. screen video from frames with real timing
with open('concat.txt','w') as f:
    for i,(n,t) in enumerate(fr):
        nxt=fr[i+1][1] if i+1<len(fr) else m['END']
        f.write(f"file 'frames/{n}'\nduration {max(0.001,nxt-t):.4f}\n")
    f.write(f"file 'frames/{fr[-1][0]}'\n")
subprocess.run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i','concat.txt','-vf','fps=30,format=yuv420p','-c:v','libx264','-crf','16','-preset','fast','screen.mp4'],check=True)
# 2. background with phone body
SW,SH=470,940; bez=16; pw,ph=SW+2*bez,SH+2*bez; px=W-160-pw; py=(H-ph)//2
def rr(size,r): mm=Image.new('L',size,0); ImageDraw.Draw(mm).rounded_rectangle((0,0,size[0]-1,size[1]-1),r,fill=255); return mm
bg=Image.new('RGB',(W,H)); dr=ImageDraw.Draw(bg)
for x in range(W):
    t=x/W; dr.line([(x,0),(x,H)],fill=(int(14+12*t),int(40+18*t),int(29+12*t)))
g=Image.new('L',(W,H),0); ImageDraw.Draw(g).ellipse((px-300,py-100,px+pw+300,py+ph+100),fill=80)
bg.paste(Image.new('RGB',(W,H),(60,140,95)),(0,0),g.filter(ImageFilter.GaussianBlur(170)))
s=Image.new('L',(W,H),0); ImageDraw.Draw(s).rounded_rectangle((px+8,py+24,px+pw+8,py+ph+24),62,fill=150)
bg.paste(Image.new('RGB',(W,H),(3,14,9)),(0,0),s.filter(ImageFilter.GaussianBlur(34)))
bg.paste(Image.new('RGB',(pw,ph),(18,22,20)),(px,py),rr((pw,ph),64))
ImageDraw.Draw(bg).rounded_rectangle((px,py,px+pw-1,py+ph-1),64,outline=(70,80,74),width=3)
bg.save('v_bg.png')
mask=rr((SW,SH),50); mask.save('v_mask.png')
cam=Image.new('RGBA',(W,H),(0,0,0,0)); cx=px+pw//2; ImageDraw.Draw(cam).ellipse((cx-8,py+bez+12,cx+8,py+bez+28),fill=(10,10,10,255)); cam.save('v_cam.png')
# 3. captions
H1=ImageFont.truetype(F+'InterDisplay-ExtraBold.otf',76); H2=ImageFont.truetype(F+'Inter-Medium.otf',36); SM=ImageFont.truetype(F+'Inter-SemiBold.otf',26)
CAPS=[('A','B','Free GPS mileage tracker','Tap Start driving. Kept counts your miles\nwhile you drive for Uber or Lyft.'),
 ('B','C','Miles go straight into your day','Tap End driving and they’re added\nautomatically. Only miles, never your route.'),
 ('C','D','See what you really keep','Earnings after gas and costs,\nLyft and Uber side by side.'),
 ('D','E','Your real cost per mile','Monthly totals, plus gas, repairs\nand the wear on your car.'),
 ('E','F','Log your day in a minute','Earnings, tips, rides and hours.\nOne quick entry per day.'),
 ('F','G','Every day in one place','Edit anytime. Export to Excel\nor Google Sheets.'),
 ('G','END','Light or dark, your choice','Free Google Drive backup.\nNo ads, no bank login.')]
def wrap(txt,font,maxw):
    words=txt.split(); lines=[]; cur=''
    for w_ in words:
        t=(cur+' '+w_).strip()
        if ImageDraw.Draw(Image.new('L',(1,1))).textlength(t,font=font)>maxw and cur: lines.append(cur); cur=w_
        else: cur=t
    return lines+[cur]
LX=150; MAXW=px-LX-120
cap_inputs=[]
for i,(a,b,h1,h2) in enumerate(CAPS):
    im=Image.new('RGBA',(W,H),(0,0,0,0)); dd=ImageDraw.Draw(im)
    l1=wrap(h1,H1,MAXW); y=H//2-60-len(l1)*44
    dd.text((LX,y-70),f'0{i+1}',font=SM,fill=(122,196,150,255))
    for ln in l1: dd.text((LX,y),ln,font=H1,fill=(255,255,255,255)); y+=90
    y+=18
    for ln in h2.split('\n'): dd.text((LX,y),ln,font=H2,fill=(176,216,192,255)); y+=52
    dd.text((LX,H-130),'Kept: Mileage & Earnings Log',font=SM,fill=(122,196,150,255))
    im.save(f'v_cap{i}.png')
    ta=0 if a=='A' else m[a]-t0; tb=END if b=='END' else m[b]-t0
    cap_inputs.append((f'v_cap{i}.png',ta,tb))
# 4. end card
ec=Image.open('v_bg.png').convert('RGB'); ec=Image.new('RGB',(W,H)); dr=ImageDraw.Draw(ec)
for y_ in range(H):
    t=y_/H; dr.line([(0,y_),(W,y_)],fill=(int(22-8*t),int(58-20*t),int(42-14*t)))
g=Image.new('L',(W,H),0); ImageDraw.Draw(g).ellipse((W/2-600,H/2-400,W/2+600,H/2+400),fill=90)
ec.paste(Image.new('RGB',(W,H),(60,140,95)),(0,0),g.filter(ImageFilter.GaussianBlur(170)))
icon=Image.open('/home/claude/kept/store/google-play/app-icon-512.png').convert('RGBA').resize((220,220),Image.LANCZOS)
ec.paste(icon,(W//2-110,250),rr((220,220),50))
dd=ImageDraw.Draw(ec)
dd.text((W//2,560),'Kept: Mileage & Earnings Log',font=ImageFont.truetype(F+'InterDisplay-ExtraBold.otf',84),fill=(255,255,255),anchor='mm')
dd.text((W//2,650),'Free GPS mileage tracker and earnings log for rideshare drivers',font=H2,fill=(176,216,192),anchor='mm')
dd.rounded_rectangle((W//2-230,730,W//2+230,820),45,fill=(255,255,255))
dd.text((W//2,775),'Free on Google Play',font=ImageFont.truetype(F+'Inter-SemiBold.otf',36),fill=(20,60,42),anchor='mm')
ec.save('v_end.png')
EC=3.5; TOT=END+EC
# 5. composite
inp=['-loop','1','-t',f'{TOT}','-i','v_bg.png','-i','screen.mp4','-loop','1','-t',f'{TOT}','-i','v_mask.png','-loop','1','-t',f'{TOT}','-i','v_cam.png']
for c,_,_ in cap_inputs: inp+=['-loop','1','-t',f'{TOT}','-i',c]
inp+=['-loop','1','-t',f'{TOT}','-i','v_end.png']
fc=[f"[1:v]scale={SW}:{SH},format=rgba,tpad=stop_mode=clone:stop_duration={EC+1}[sv]",f"[2:v]format=gray,scale={SW}:{SH}[mk]","[sv][mk]alphamerge[scr]",
    f"[0:v][scr]overlay={px+bez}:{py+bez}[b0]","[b0][3:v]overlay=0:0[b1]"]
last='b1'
for k,(c,ta,tb) in enumerate(cap_inputs):
    idx=4+k; fi=0 if k==0 else ta; 
    fc.append(f"[{idx}:v]format=rgba,fade=in:st={fi:.2f}:d=0.35:alpha=1,fade=out:st={tb-0.3:.2f}:d=0.3:alpha=1[c{k}]")
    fc.append(f"[{last}][c{k}]overlay=0:0:enable='between(t,{max(0,fi-0.01):.2f},{tb:.2f})'[o{k}]"); last=f'o{k}'
ei=4+len(cap_inputs)
fc.append(f"[{ei}:v]format=rgba,fade=in:st={END:.2f}:d=0.5:alpha=1[ec]")
fc.append(f"[{last}][ec]overlay=0:0:enable='gte(t,{END:.2f})',fade=in:st=0:d=0.4,fade=out:st={TOT-0.5:.2f}:d=0.5,format=yuv420p[v]")
subprocess.run(['ffmpeg','-v','error','-y',*inp,'-filter_complex',';'.join(fc),'-map','[v]','-t',f'{TOT}','-r','30','-c:v','libx264','-crf','18','-preset','medium','-movflags','+faststart','Kept-promo-video.mp4'],check=True)
print('total',TOT)
