import React, { useState } from 'react';
import { 
  Code2, 
  Folder, 
  FileCode, 
  Copy, 
  Check, 
  Download, 
  Smartphone,
  ChevronRight,
  FolderOpen
} from 'lucide-react';
import { soundFx } from '../../utils/audioSynth';

interface CodeFile {
  path: string;
  name: string;
  language: string;
  code: string;
}

const KOTLIN_FILES: CodeFile[] = [
  {
    path: 'android-app/app/src/main/java/com/filmvideostudio/MainActivity.kt',
    name: 'MainActivity.kt',
    language: 'kotlin',
    code: `package com.filmvideostudio

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.filmvideostudio.navigation.AppNavigation
import com.filmvideostudio.ui.theme.FilmVideoStudioTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            FilmVideoStudioTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AppNavigation()
                }
            }
        }
    }
}`,
  },
  {
    path: 'android-app/app/src/main/java/com/filmvideostudio/navigation/ScreenRoutes.kt',
    name: 'ScreenRoutes.kt',
    language: 'kotlin',
    code: `package com.filmvideostudio.navigation

sealed class ScreenRoutes(val route: String) {
    object Splash : ScreenRoutes("splash")
    object Home : ScreenRoutes("home")
    object VideoEditor : ScreenRoutes("video_editor")
    object FilmProduction : ScreenRoutes("film_production")
    object Screenplay : ScreenRoutes("screenplay")
    object Storyboard : ScreenRoutes("storyboard")
    object CameraStudio : ScreenRoutes("camera_studio")
    object AudioStudio : ScreenRoutes("audio_studio")
    object Animation : ScreenRoutes("animation")
    object VFX : ScreenRoutes("vfx")
    object Subtitles : ScreenRoutes("subtitles")
    object MediaLibrary : ScreenRoutes("media_library")
    object Export : ScreenRoutes("export")
    object Team : ScreenRoutes("team")
    object Settings : ScreenRoutes("settings")
}`,
  },
  {
    path: 'android-app/app/src/main/java/com/filmvideostudio/screens/videoeditor/VideoEditorScreen.kt',
    name: 'VideoEditorScreen.kt',
    language: 'kotlin',
    code: `package com.filmvideostudio.screens.videoeditor

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.media3.exoplayer.ExoPlayer

@Composable
fun VideoEditorScreen(
    onNavigateBack: () -> Unit
) {
    var currentTimecode by remember { mutableStateOf("00:00:08:14") }
    var isPlaying by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF090D16))
    ) {
        // Cinema Program Monitor
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .background(Color.Black),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "ExoPlayer / Media3 4K Viewport",
                color = Color.White
            )
        }

        // Multi-Track Timeline
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
            color = Color(0xFF0F172A)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Timeline: $currentTimecode",
                    color = Color(0xFFF59E0B),
                    style = MaterialTheme.typography.titleMedium
                )
                Spacer(modifier = Modifier.height(8.dp))
                // Video & Audio Track Composable rows
            }
        }
    }
}`,
  },
  {
    path: 'android-app/build.gradle.kts',
    name: 'build.gradle.kts',
    language: 'kotlin',
    code: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.google.ksp)
}

android {
    namespace = "com.filmvideostudio"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.filmvideostudio"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "3.8.0"
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    // Jetpack Compose & Material 3
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.material3)
    
    // Android Media3 & ExoPlayer
    implementation("androidx.media3:media3-exoplayer:1.5.0")
    implementation("androidx.media3:media3-ui:1.5.0")
    
    // FFmpeg Video Processing & Encoding
    implementation("com.arthenica:ffmpeg-kit-full:6.0-2")
    
    // Room Database
    implementation("androidx.room:room-runtime:2.6.1")
    ksp("androidx.room:room-compiler:2.6.1")
}`,
  },
];

export const CodeExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<CodeFile>(KOTLIN_FILES[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    soundFx.playScannerBeep();
    navigator.clipboard?.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = () => {
    soundFx.playShutterSound();
    const manifest = {
      project: 'Film & Video Studio (Android + Web)',
      technology: 'Kotlin, Jetpack Compose, Material 3, Android Media3, Room, FFmpeg',
      files: KOTLIN_FILES,
    };
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Film_Video_Studio_Android_Kotlin_Source.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-950 text-slate-100">
      {/* File Tree Explorer (Left 72) */}
      <div className="w-full lg:w-80 border-r border-slate-800 bg-slate-900/90 flex flex-col shrink-0 select-none">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold font-mono-cinema text-amber-400">
            <Smartphone className="w-4 h-4" />
            <span>Android Kotlin Source Tree</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Compose M3</span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 px-2 py-1 flex items-center gap-1.5">
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Film-Video-Studio / android-app</span>
          </div>

          {KOTLIN_FILES.map((file) => {
            const isSelected = file.path === selectedFile.path;
            return (
              <button
                key={file.path}
                onClick={() => {
                  soundFx.playScannerBeep();
                  setSelectedFile(file);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-mono rounded-lg transition-colors text-left ${
                  isSelected
                    ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <FileCode className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                <span className="truncate">{file.name}</span>
              </button>
            );
          })}
        </div>

        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleDownloadAll}
            className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export Kotlin Source Zip</span>
          </button>
        </div>
      </div>

      {/* Code Editor / Viewer */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        <div className="h-12 border-b border-slate-800 px-6 bg-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <span className="text-slate-500">Path:</span>
            <span className="text-amber-300 font-semibold">{selectedFile.path}</span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-slate-950">
          <pre className="font-mono text-xs text-slate-200 leading-relaxed overflow-x-auto">
            {selectedFile.code}
          </pre>
        </div>
      </div>
    </div>
  );
};
