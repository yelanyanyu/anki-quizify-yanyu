/* parse.js — Audio and ExampleList field parsing */

// [sound:file.mp3] in editor → [anki:play:q:N] after Anki rendering → no filename available
// Strip [sound:...] if still present (non-review contexts like test.html)
export function parseAudio(rawAudio) {
    var a = rawAudio;
    if (a.indexOf('[anki:play:') === 0) return null;
    if (a.indexOf('[sound:') === 0 && a.lastIndexOf(']') === a.length - 1) a = a.slice(7, -1);
    return a;
}

// Parse translation field: "翻译1||翻译2||翻译3" (same || delimiter)
export function parseTranslation(raw) {
    if (!raw) return [];
    return raw.split(/\|\|/g).map(function(s) { return s.trim(); });
}

// Parse ExampleList: "text::audio.mp3||text2||text3::audio3.mp3"
export function parseExamples(raw) {
    if (!raw) return [];
    var parts = raw.split(/\|\|/g);
    return parts.filter(function(s) { return s.trim(); }).map(function(line) {
        var idx = line.indexOf('::');
        if (idx > -1) {
            return {
                text: line.substring(0, idx).trim(),
                audio: parseAudio(line.substring(idx + 2).trim())
            };
        }
        return { text: line.trim(), audio: null };
    });
}
