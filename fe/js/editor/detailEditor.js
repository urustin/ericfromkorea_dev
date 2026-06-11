// Entry point for the project detail editor — Notion-style block editor.
import { mountBlockEditor } from './blockedit/editor.js';

export function editDetail(slug, blocks) {
  mountBlockEditor(slug, blocks);
}
