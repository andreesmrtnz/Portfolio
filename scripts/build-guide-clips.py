"""Cut green-screen clips (made with Gemini/Veo) into the guide's clips: transparent WebM + WebP stills.

usage:
  python scripts/build-guide-clips.py public/guide path/to/ffmpeg a1=video1.mp4 a2=video2.mp4 a3=video3.mp4

Needs opencv-python and numpy. CLIPS below lists, for each clip, the source, a frame range and a mode:
  once      - plays the range as is
  pingpong  - forward then backward: loops with no seam
  loopfade  - crossfades the last frames into the first so it loops (range must start and end in the same pose)
Every source video starts and ends in the same neutral pose, so clips chain cleanly.

Framing: the full width of the video is kept (arms never get cut off at the sides) and only the empty space
above the head is cropped. If you change CROP_*, update VIDEO_ASPECT / VIDEO_HEAD_* in src/CharacterGuide.tsx.
"""
import cv2, sys, os, subprocess, shutil, numpy as np

out, ff = sys.argv[1], sys.argv[2]
SOURCES = dict(arg.split('=', 1) for arg in sys.argv[3:])
FPS = 24
OUT_W = 400
# crop of the 720x1280 source: rows 260..1280 (the head top sits at row 320 in every source video)
CROP_Y0, CROP_Y1 = 260, 1280
os.makedirs(out, exist_ok=True)
tmp = os.path.join(os.environ.get('TEMP', '/tmp'), 'guide-clips-cut')
shutil.rmtree(tmp, ignore_errors=True)

# name: (source, first, last, mode)
CLIPS = {
    'idle': ('a2', 0, 78, 'loopfade'),
    'wave': ('a2', 78, 150, 'once'),
    'talk': ('a1', 96, 138, 'pingpong'),
    'point': ('a1', 144, 180, 'once'),  # ends with the arm still out: the player holds that last frame
    'thumbs': ('a3', 0, 56, 'once'),
    'laptop': ('a3', 54, 166, 'once'),
}
MIRROR = {'point'}  # also written mirrored (-m): pointing toward the other side
# still frames for browsers without transparent video: (source, frame)
STILLS = {'idle': ('a2', 0), 'talk': ('a1', 108), 'wave': ('a2', 108), 'point': ('a1', 174),
          'thumbs': ('a3', 36), 'laptop': ('a3', 90)}

frames = {}
def source(name):
    if name not in frames:
        cap = cv2.VideoCapture(SOURCES[name])
        fs = []
        while True:
            ok, f = cap.read()
            if not ok:
                break
            f = f[CROP_Y0:CROP_Y1]
            h, w = f.shape[:2]
            fs.append(cv2.resize(f, (OUT_W, round(h * OUT_W / w / 2) * 2), interpolation=cv2.INTER_AREA))
        frames[name] = fs
        print('source', name, len(fs), 'frames', fs[0].shape[1], 'x', fs[0].shape[0])
    return frames[name]


def key(f):
    f = f.astype(np.float32)
    b, g, r = f[..., 0], f[..., 1], f[..., 2]
    spill = g - np.maximum(r, b)
    a = 1 - np.clip((spill - 16) / (50 - 16), 0, 1)
    a = cv2.GaussianBlur(a, (3, 3), 0)
    # choke the matte a little so no light-green rim survives around the hair
    a = np.clip((a - .22) / .78, 0, 1)
    a[a < .04] = 0
    lim = np.maximum(r, b)
    g2 = np.where(g > lim, lim + (g - lim) * .08, g)
    # edge pixels: pull toward a neutral dark so the rim reads as outline, not halo
    edge = (a > 0) & (a < .95)
    k = np.where(edge, .35, 0)[..., None]
    rgb = np.dstack([b, g2, r])
    rgb = rgb * (1 - k) + rgb.mean(axis=2, keepdims=True) * .55 * k
    rgb = rgb.clip(0, 255).astype(np.uint8)
    # the generated hair is a red-ish brown: bring it closer to a very dark brown (head area only)
    hsv = cv2.cvtColor(rgb, cv2.COLOR_BGR2HSV).astype(np.float32)
    head = np.zeros(hsv.shape[:2], bool)
    head[:int(rgb.shape[0] * .33)] = True
    hair = head & (hsv[..., 2] < 150) & (hsv[..., 1] > 70) & ((hsv[..., 0] < 22) | (hsv[..., 0] > 170))
    hsv[..., 2] = np.where(hair, hsv[..., 2] * .62, hsv[..., 2])
    hsv[..., 1] = np.where(hair, hsv[..., 1] * .85, hsv[..., 1])
    rgb = cv2.cvtColor(hsv.clip(0, 255).astype(np.uint8), cv2.COLOR_HSV2BGR)
    return np.dstack([rgb, (a * 255).clip(0, 255).astype(np.uint8)])


def loopfade(fs, blend=8):
    seq = [f.astype(np.float32) for f in fs]
    for t in range(blend):
        w = (t + 1) / (blend + 1)
        i = len(seq) - blend + t
        seq[i] = seq[i] * (1 - w) + seq[t] * w
    return [f.clip(0, 255).astype(np.uint8) for f in seq[blend:]]


def encode(name, seq):
    d = os.path.join(tmp, name)
    os.makedirs(d, exist_ok=True)
    for n, im in enumerate(seq):
        cv2.imwrite(os.path.join(d, 'f%04d.png' % n), im)
    dst = os.path.join(out, name + '.webm')
    subprocess.run([ff, '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', os.path.join(d, 'f%04d.png'),
                    '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '38', '-row-mt', '1',
                    '-deadline', 'good', '-an', dst], check=True)
    print(name, len(seq), 'frames', os.path.getsize(dst) // 1024, 'KB')


for name, (src, a, b, mode) in CLIPS.items():
    fs = source(src)
    raw = fs[a:b + 1]
    if mode == 'pingpong':
        raw = raw + raw[-2:0:-1]
    elif mode == 'loopfade':
        d = np.abs(cv2.cvtColor(raw[0], cv2.COLOR_BGR2GRAY).astype(float) - cv2.cvtColor(raw[-1], cv2.COLOR_BGR2GRAY)).mean()
        print('  loop seam difference %.1f' % d)
        raw = loopfade(raw)
    seq = [key(f) for f in raw]
    encode(name, seq)
    if name in MIRROR:
        encode(name + '-m', [cv2.flip(im, 1) for im in seq])

for name, (src, i) in STILLS.items():
    im = key(source(src)[i])
    cv2.imwrite(os.path.join(out, name + '.webp'), im, [cv2.IMWRITE_WEBP_QUALITY, 82])
    if name in MIRROR or name == 'point':
        cv2.imwrite(os.path.join(out, name + '-m.webp'), cv2.flip(im, 1), [cv2.IMWRITE_WEBP_QUALITY, 82])

# where the head sits in the cropped frame (fractions), for the layout in src/CharacterGuide.tsx
a = key(source('a2')[0])[..., 3]
ys = np.where(a.max(1) > 128)[0]
xs = np.where(a[:int(ys[0] + (ys[-1] - ys[0]) * .2)].max(0) > 128)[0]
print('frame', a.shape[1], 'x', a.shape[0], 'aspect %.4f' % (a.shape[1] / a.shape[0]), 'head top %.3f' % (ys[0] / a.shape[0]))
