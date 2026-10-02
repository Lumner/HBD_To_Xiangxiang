"""本地生成生日旋律的钟琴与轻钢琴伴奏，不使用任何第三方录音。"""
from pathlib import Path
import wave
import numpy as np

RATE = 24000
BEAT = 60 / 84
# 经典生日歌旋律，采用自己的和声、音色与伴奏编排。
MELODY = [(67,.75),(67,.25),(69,1),(67,1),(72,1),(71,2),
          (67,.75),(67,.25),(69,1),(67,1),(74,1),(72,2),
          (67,.75),(67,.25),(79,1),(76,1),(72,1),(71,1),(69,1),
          (77,.75),(77,.25),(76,1),(72,1),(74,1),(72,2)]
LENGTH = 48 * BEAT
track = np.zeros((round((LENGTH + 3) * RATE), 2), dtype=np.float64)

def note(midi, start, beats, volume, pan=0, soft=False):
    duration = max(beats * BEAT + .55, 1.3)
    t = np.arange(round(duration * RATE)) / RATE
    frequency = 440 * 2 ** ((midi - 69) / 12)
    envelope = (1 - np.exp(-t * 65)) * np.exp(-t / (1.1 if soft else .85))
    envelope *= np.minimum(1, (duration-t) / .15)
    wavelet = np.sin(2*np.pi*frequency*t)
    wavelet += .25*np.sin(2*np.pi*frequency*2*t)*np.exp(-t*3)
    wavelet += .09*np.sin(2*np.pi*frequency*3*t)*np.exp(-t*6)
    sound = wavelet * envelope * volume
    offset = round(start * BEAT * RATE)
    end = min(offset + len(sound), len(track))
    for channel, gain in enumerate([np.sqrt((1-pan)/2),np.sqrt((1+pan)/2)]):
        track[offset:end,channel] += sound[:end-offset]*gain

for repeat in range(2):
    position=repeat*24
    for i,(pitch,length) in enumerate(MELODY):
        note(pitch,position,length,.20 if repeat==0 else .17,pan=.18)
        if repeat==1: note(pitch-12,position,length,.055,pan=-.2,soft=True)
        position+=length
    chords=[(48,55,60,64),(55,59,62,67),(55,59,62,65),(48,55,60,64),
            (48,55,60,64),(53,57,60,65),(55,59,62,65),(48,55,60,64)]
    for bar,chord in enumerate(chords):
        start=repeat*24+bar*3
        note(chord[0],start,3,.07,pan=-.25,soft=True)
        for beat in [0,1,2]:
            note(chord[1+(beat%3)],start+beat,1,.043,pan=-.4,soft=True)

# 轻微回声，尾音折回开头，保持循环接缝平滑。
dry=track.copy()
for seconds,gain in [(.17,.12),(.29,.08),(.43,.045)]:
    delay=round(seconds*RATE);track[delay:]+=dry[:-delay,::-1]*gain
count=round(LENGTH*RATE)
track[:len(track)-count]+=track[count:]
track=track[:count]
peak=np.max(np.abs(track));track*=.72/max(peak,.001)
track=np.tanh(track*.9)
output=Path(__file__).resolve().parents[1]/'dist'/'birthday-music.wav'
with wave.open(str(output),'wb') as f:
    f.setnchannels(2);f.setsampwidth(2);f.setframerate(RATE)
    f.writeframes((track*32767).astype('<i2').tobytes())
print(f'Generated {len(track)/RATE:.2f}s stereo birthday accompaniment; peak={np.max(np.abs(track)):.3f}, RMS={np.sqrt(np.mean(track**2)):.3f}')
