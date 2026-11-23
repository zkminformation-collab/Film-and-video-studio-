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
