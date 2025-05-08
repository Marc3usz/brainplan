/*
  BrainRot Video Generator – minimalna, DZIAŁAJĄCA wersja (audio + napisy)
  -----------------------------------------------------------------------
  ✔ Single MP3 (ElevenLabs) + SRT → mux z gameplay.mp4.
  ✔ Używa -c:a copy, więc MP3 trafia 1-do-1 do MP4.
  ✔ Napisy dodawane przez libx264 (re-encode wideo).

  WYMAGANE:
  ─ gameplay.mp4 w ./video_assets
  ─ npm i fluent-ffmpeg ffmpeg-static @ffprobe-installer/ffprobe axios dotenv
*/

import 'dotenv/config';
import fs from 'fs';

import axios from 'axios';
import dotenv from 'dotenv';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';

dotenv.config();
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobeInstaller.path);


const API_KEY  = process.env.ELEVEN_LABS_API_KEY  || 'sk_0865190b3c7d666a07dc4a66010b982ed1e64795cca8c15d';
const VOICE_ID = process.env.ELEVEN_LABS_VOICE_ID || 'onwK4e9ZLuTAKqWW03F9';

async function textToMp3(text, outPath) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`;
  const payload = { text, model_id: 'eleven_turbo_v2' };
  const res = await axios.post(url, payload, {
    headers: { 'xi-api-key': API_KEY },
    responseType: 'arraybuffer'
  });
  fs.writeFileSync(outPath, res.data);
}

function makeSrt(text, outPath, duration = 30) {
  // proste SRT – jeden blok na cały tekst
  fs.writeFileSync(
    outPath,
    `1\n00:00:00,000 --> 00:00:${String(duration).padStart(2, '0')},000\n${text}\n`
  );
}

async function muxVideo(mp3, srt) {
  const gameplay = './video_assets/gameplay.mp4';
  if (!fs.existsSync(gameplay)) throw new Error('Brak gameplay.mp4 w ./video_assets');
  fs.mkdirSync('./output', { recursive: true });
  const out = './output/final.mp4';

  await new Promise((res, rej) => {
    ffmpeg()
      .input(gameplay)       // 0:v
      .input(mp3)            // 1:a (MP3)
      .outputOptions([
        '-map', '0:v',
        '-map', '1:a',
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', '23',
        '-c:a', 'copy',
        '-shortest',
        '-movflags', 'faststart',
        '-vf', `subtitles=${srt.replace(/\\/g, '/')}`
      ])
      .save(out)
      .on('end', res)
      .on('error', rej);
  });
  console.log('✔ Gotowy plik z dźwiękiem:', out);
}

async function main(rawPrompt) {
  if (!/^text to brainrot:/i.test(rawPrompt)) throw new Error('Prompt MUSI zaczynać się od "Text to Brainrot:"');
  const text = rawPrompt.replace(/^text to brainrot:[\\s]*/i, '').trim();
  fs.mkdirSync('./temp', { recursive: true });
  const mp3 = './temp/tts.mp3';
  const srt = './temp/subs.srt';
  await textToMp3(text, mp3);
  makeSrt(text, srt);
  await muxVideo(mp3, srt);
}

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.argv[1] === __filename) {
  const arg = process.argv.slice(2).join(' ').trim();
  main(arg).catch(e => console.error('ERROR:', e.message));
}

