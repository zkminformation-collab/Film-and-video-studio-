import React, { useState } from 'react';
import { 
  FolderSync, 
  Globe, 
  Code2, 
  Send, 
  Check, 
  Copy, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { FilmProject } from '../../types';
import { soundFx } from '../../utils/audioSynth';

interface WordPressIntegrationProps {
  activeFilm: FilmProject;
}

export const WordPressIntegration: React.FC<WordPressIntegrationProps> = ({ activeFilm }) => {
  const [siteUrl, setSiteUrl] = useState('https://cinema-production.example.com');
  const [apiKey, setApiKey] = useState('wp_sec_9938217349182374');
  const [shortcodeFilm, setShortcodeFilm] = useState(activeFilm.id);
  const [shortcodeRatio, setShortcodeRatio] = useState('2.39:1');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedShortcode, setCopiedShortcode] = useState(false);

  const generatedShortcode = `[film_studio_player film="${shortcodeFilm}" aspect="${shortcodeRatio}" autoplay="false" theme="cinema_dark"]`;

  const phpPluginCode = `<?php
/**
 * Plugin Name: Film & Video Studio Connector
 * Plugin URI:  https://filmvideostudio.pro
 * Description: Real-time synchronization between Film & Video Studio Workstation, Android App and WordPress posts.
 * Version:     3.8.0
 * Author:      Film & Video Studio
 * License:     GPL-2.0+
 */

defined('ABSPATH') || exit;

// Register REST API Route for instant studio sync
add_action('rest_api_init', function () {
    register_rest_route('film-studio/v1', '/sync', [
        'methods'             => 'POST',
        'callback'            => 'fvs_handle_studio_sync',
        'permission_callback' => function ($request) {
            $auth = $request->get_header('X-FVS-API-Key');
            return !empty($auth) && $auth === get_option('fvs_api_key', 'wp_sec_default');
        },
    ]);
});

function fvs_handle_studio_sync($request) {
    $params = $request->get_json_params();
    $film_title = sanitize_text_field($params['filmTitle'] ?? 'Untitled Feature');
    $aspect = sanitize_text_field($params['aspectRatio'] ?? '2.39:1');
    
    // Create or update film custom post type
    $post_id = wp_insert_post([
        'post_title'   => $film_title,
        'post_content' => wp_kses_post($params['synopsis'] ?? ''),
        'post_status'  => 'publish',
        'post_type'    => 'film_production',
    ]);
    
    update_post_meta($post_id, '_fvs_aspect_ratio', $aspect);
    update_post_meta($post_id, '_fvs_master_url', esc_url_raw($params['masterUrl'] ?? ''));
    
    return new WP_REST_Response([
        'success'   => true,
        'post_id'   => $post_id,
        'permalink' => get_permalink($post_id),
    ], 200);
}

// Shortcode: [film_studio_player]
add_shortcode('film_studio_player', function ($atts) {
    $a = shortcode_atts(['film' => '', 'aspect' => '2.39:1'], $atts);
    return '<div class="fvs-cinema-player" data-aspect="' . esc_attr($a['aspect']) . '"></div>';
});
`;

  const handleTestSync = async () => {
    setIsSyncing(true);
    soundFx.playScannerBeep();
    try {
      const res = await fetch('/api/wordpress/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteUrl,
          apiKey,
          action: 'publish_film',
          payload: {
            filmTitle: activeFilm.title,
            aspectRatio: activeFilm.aspectRatio,
            synopsis: activeFilm.tagline,
            director: activeFilm.director,
            itemsCount: 1,
          },
        }),
      });
      const data = await res.json();
      setSyncResult(data);
      soundFx.playCinematicImpact();
    } catch (e: any) {
      setSyncResult({ success: false, message: e.message });
    } finally {
      setIsSyncing(false);
    }
  };

  const copyPhpCode = () => {
    navigator.clipboard?.writeText(phpPluginCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyShortcode = () => {
    navigator.clipboard?.writeText(generatedShortcode);
    setCopiedShortcode(true);
    setTimeout(() => setCopiedShortcode(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-950 text-slate-100 space-y-6">
      {/* Top Banner */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-xs text-amber-400 font-mono-cinema">
          <span>WordPress CMS & Headless REST API Sync</span>
          <span aria-hidden="true">·</span>
          <span>Plugin: film-video-studio.php</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-cinzel">
          WordPress Plugin & Webhook Integration
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Cols: Webhook Config & Shortcode Builder */}
        <div className="lg:col-span-6 space-y-6">
          {/* Live REST API Sync Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-sm font-bold text-white font-mono-cinema uppercase">
              <Globe className="w-4 h-4 text-sky-400" />
              <span>WordPress REST API Sync Tester</span>
            </div>

            <div className="space-y-3 text-xs font-mono-cinema">
              <div>
                <label className="text-[10px] text-slate-400 uppercase block mb-1">
                  WordPress Target Site URL
                </label>
                <input
                  type="text"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 uppercase block mb-1">
                  Plugin Application Secret Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-amber-300 outline-none"
                />
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded text-slate-300 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block font-sans font-bold">
                  Target Endpoint
                </span>
                <code className="text-amber-400 text-xs break-all">
                  POST {siteUrl}/wp-json/film-studio/v1/sync
                </code>
              </div>

              <button
                onClick={handleTestSync}
                disabled={isSyncing}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSyncing ? 'Synchronizing...' : `Sync "${activeFilm.title}" to WordPress`}</span>
              </button>

              {/* Sync Response Result */}
              {syncResult && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded text-xs space-y-1 font-mono">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Sync Response Received (HTTP 200 OK)</span>
                  </div>
                  <p className="text-slate-300 text-[11px] break-all">
                    {syncResult.message}
                  </p>
                  <div className="text-slate-400 text-[10px]">
                    WordPress Post ID #{syncResult.wpPostId} · Status: {syncResult.status}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Shortcode Generator */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono-cinema">
                WordPress Embed Shortcode Generator
              </span>
              <button
                onClick={copyShortcode}
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-medium"
              >
                {copiedShortcode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedShortcode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded font-mono text-amber-300 break-all select-all">
                {generatedShortcode}
              </div>
              <p className="text-[11px] text-slate-400">
                Paste this shortcode anywhere into your WordPress Gutenberg or Elementor blocks to embed the cinema video player with 2.39:1 scope aspect ratio!
              </p>
            </div>
          </div>
        </div>

        {/* Right 6 Cols: Complete PHP Plugin Source Code */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono-cinema">
              WordPress Plugin Source (film-video-studio.php)
            </span>
            <button
              onClick={copyPhpCode}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-medium"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied PHP Code' : 'Copy PHP Plugin'}</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="p-3 bg-slate-950 border-b border-slate-800 text-[11px] font-mono-cinema text-slate-400 flex items-center justify-between">
              <span>wordpress-plugin/film-video-studio.php</span>
              <span className="text-emerald-400">GPL-2.0+ Compatible</span>
            </div>
            <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-[500px] leading-relaxed">
              {phpPluginCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
