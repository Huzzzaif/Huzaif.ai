# Huzaif Khan — portfolio

A lightweight, static portfolio focused on software engineering and applied AI. SenseCLLM is the lead project; DataHub Steward and Medical Text Classification follow. Experience and education live on the Background page, with immersive work secondary.

## Preview

Run from this directory:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173/`. No build step or package installation is required. Relative links work under the GitHub Pages `/Huzaif.ai/` path.

## Content

- `index.html`: introduction and selected work
- `about.html`: professional background and education
- `sensecllm.html`, `steward.html`, `medical-nlp.html`: project case studies
- `knowledge.js`: reviewed guide answers, matching terms, and source links
- `script.js`: guide interactions and illustrative masking toggle
- `styles.css`: responsive layout and reduced-motion support
- `huzaif-khan-resume.pdf`: user-supplied resume, unchanged

## Guide prototype

The guide selects curated answers by matching a question to documented topics. It is **not an LLM or autonomous agent**. The interface states this explicitly. Questions are handled locally, are not transmitted, and are not persisted. Unrecognized or undocumented questions get a fallback pointing to Huzaif.

The knowledge collection is separate from the UI so a future server-side retrieval service can reuse reviewed facts and source links. That integration would require a provider, server-side credentials, usage limits, and evaluated answer grounding. Never place an API key in these public files. Keep the static pages usable when the guide is unavailable.

The SenseCLLM masking interaction uses fixed synthetic text and illustrative placeholders; it does not run the research pipeline in a browser.

## Deployment

The existing GitHub Pages site publishes from the root of `main`. The current redesign is a local preview until explicitly published. Google Fonts supplies the optional web font; a system-font fallback is provided.
