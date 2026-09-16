#!/usr/bin/env python3
import subprocess
import os

os.makedirs("public/assets/videos", exist_ok=True)
os.makedirs("tmp_video", exist_ok=True)

font_path = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"

scenes = [
    {
        "img": "public/assets/images/smart_kit_hero.jpg",
        "dur": 3.5,
        "title": "STREESURE",
        "sub": "AI-Assisted Women Health Screening and Care Ecosystem",
        "sub_color": "0xf472b6",
        "out": "tmp_video/seg0.mp4"
    },
    {
        "img": "public/assets/images/smart_kit_sample.jpg",
        "dur": 3.5,
        "title": "SAMPLE DETECTED",
        "sub": "Optical Biosensor Chamber - Colorimetric Telemetry",
        "sub_color": "0x34d399",
        "out": "tmp_video/seg1.mp4"
    },
    {
        "img": "public/assets/images/smart_kit_sync.jpg",
        "dur": 3.5,
        "title": "SMART KIT PROFILE CONNECTED",
        "sub": "Voice Saathi (Sakhi) BLE 5.3 Enclave Sync",
        "sub_color": "0x38bdf8",
        "out": "tmp_video/seg2.mp4"
    },
    {
        "img": "public/assets/images/smart_kit_empower.jpg",
        "dur": 4.5,
        "title": "Women Health - Understood Differently",
        "sub": "Addressed Differently - Accessible and Compassionate",
        "sub_color": "0xf472b6",
        "out": "tmp_video/seg3.mp4"
    }
]

for idx, s in enumerate(scenes):
    vf = (
        f"scale=1280:720,setsar=1,"
        f"drawtext=fontfile='{font_path}':text='{s['title']}':fontcolor=white:fontsize=44:x=(w-text_w)/2:y=60:shadowcolor=black@0.9:shadowx=3:shadowy=3,"
        f"drawtext=fontfile='{font_path}':text='{s['sub']}':fontcolor={s['sub_color']}:fontsize=24:x=(w-text_w)/2:y=120:shadowcolor=black@0.9:shadowx=2:shadowy=2"
    )
    cmd = [
        "ffmpeg", "-y",
        "-loop", "1", "-t", str(s["dur"]), "-i", s["img"],
        "-f", "lavfi", "-t", str(s["dur"]), "-i", "anoisesrc=c=pink:r=44100:a=0.012,lowpass=f=350,volume=0.3",
        "-vf", vf,
        "-c:v", "libx264", "-preset", "ultrafast", "-crf", "22", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "128k",
        s["out"]
    ]
    print(f"Rendering segment {idx}...")
    subprocess.run(cmd, check=True)

# Concat segments
with open("tmp_video/list.txt", "w") as f:
    for s in scenes:
        f.write(f"file '{os.path.abspath(s['out'])}'\n")

print("Concatenating into final MP4...")
concat_cmd = [
    "ffmpeg", "-y",
    "-f", "concat", "-safe", "0", "-i", "tmp_video/list.txt",
    "-c", "copy",
    "-movflags", "+faststart",
    "public/assets/videos/streesure_smart_kit_demo.mp4"
]
subprocess.run(concat_cmd, check=True)

size_mb = os.path.getsize("public/assets/videos/streesure_smart_kit_demo.mp4") / (1024 * 1024)
print(f"Done! Created public/assets/videos/streesure_smart_kit_demo.mp4 ({size_mb:.2f} MB)")
