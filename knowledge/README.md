# FitBot knowledge base

Reference material FitBot retrieves from when answering (RAG). Every `.md` and `.txt` file in this
folder (and subfolders) except this README is indexed.

## Adding a source

1. Save it as Markdown or plain text, e.g. `knowledge/issn-protein-2017.md`. For PDFs, copy the text
   (or export to text) first — only the parts you want FitBot to use.
2. Start the file with a title line and a `Source:` line; both are shown to the model and in the
   chat's source list:

   ```markdown
   # ISSN position stand: protein and exercise (2017)
   Source: Jäger R, et al. J Int Soc Sports Nutr. 2017;14:20. https://doi.org/10.1186/s12970-017-0177-8

   ## Recommendations
   ...
   ```

3. Use `##` / `###` headings to split long documents into topics; each section is chunked separately.
4. Rebuild the index (Ollama must be running with the embedding model pulled):

   ```bash
   npm run kb:ingest
   ```

Only add material you're allowed to use (open-access papers, public guidelines, your own notes).
`index.json` is generated — don't edit it; it's gitignored.
