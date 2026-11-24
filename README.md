# ZKMAP Studio

ZKMAP Studio is a film and video production application with a React interface and an Express server.

## Google AI Studio

[Open Google AI Studio Build](https://aistudio.google.com/apps) to prototype with Gemini. For a project already open in AI Studio, use its GitHub sync to connect it to this repository. Review the changes before pushing so project-specific server routes and production workflows are preserved.

- [Google AI Studio repository template](https://github.com/google-gemini/aistudio-repository-template)
- [AI Studio Build documentation](https://ai.google.dev/gemini-api/docs/aistudio-build-mode)

Keep `GEMINI_API_KEY` in the server environment. Use AI Studio Secrets for AI Studio or the hosting service's environment settings for an external deployment. See `.env.example` for supported configuration.

## Run locally

Install Node.js 24 and Bun 1.4.5 to match CI. Install FFmpeg for video rendering.

```sh
bun install --frozen-lockfile
bun run dev
```

The default local port is 3000. A hosting service can supply `PORT`.

## Production preview and export

In Cartoon Creator, generate the film preview in Step 12. Add the scenes to the editing timeline in Step 13 and complete the quality checks in Step 14. Watch the final preview and explicitly approve it in Step 15. Render in Step 16, then download the verified MP4 in Step 17.

For a production build, run `bun run build` and start the server with `NODE_ENV=production bun run start`. The server serves the built frontend and provides the rendering API.

## OpenJarvis on web and mobile

Open [the assistant](https://zkmapstudio.onrender.com/?tool=openjarvis) from the sidebar or command search. Studio Guide offers built-in Kannada and English instructions. OpenJarvis Chat forwards the signed-in user's conversation to a configured OpenJarvis server.

Install the ZKMAP Studio web app from Android Chrome's **Add to Home screen** or **Install app** menu, or from iPhone Safari's **Add to Home Screen** share action. The installed app uses the same studio, including the OpenJarvis shortcut.

### Connect an OpenJarvis server

The integration uses the [OpenJarvis HTTP API](https://github.com/open-jarvis/OpenJarvis) (Apache-2.0), verified with OpenJarvis 1.0.4. Start the OpenJarvis server alongside a local ZKMAP Studio instance using Python 3.11–3.13 and a model available in your Ollama installation.

```sh
uv tool run --from 'OpenJarvis[server]==1.0.4' jarvis serve \
  --host 127.0.0.1 --port 8000 --engine ollama --model YOUR_OLLAMA_MODEL --agent simple
```

Set `OPENJARVIS_BASE_URL=http://127.0.0.1:8000/v1` and `OPENJARVIS_MODEL` to the model passed to `jarvis serve`. For the hosted studio, first deploy an [OpenJarvis server](https://open-jarvis.github.io/OpenJarvis/deployment/render/) with your inference provider or self-host an Ollama-backed instance. In the studio's server environment, set `OPENJARVIS_BASE_URL` to its HTTPS URL ending in `/v1`, `OPENJARVIS_MODEL` to its served model, and `OPENJARVIS_API_KEY` to the server's bearer key. Deploy the updated environment and open the OpenJarvis Chat tab as a signed-in user.
