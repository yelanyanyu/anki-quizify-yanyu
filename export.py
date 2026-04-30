"""Export Quizify card templates as .apkg for Anki testing.

Usage:
    python export.py              # export with default test card
    python export.py --no-card    # export note type only (no sample card)
"""
import genanki, os, sys, argparse

BASE = os.path.dirname(os.path.abspath(__file__))

def read(path):
    with open(os.path.join(BASE, path), 'r', encoding='utf-8') as f:
        return f.read()

def build_model():
    return genanki.Model(
        model_id=1698754321,
        name='quizify-word-by:yelanyanyu',
        fields=[
            {'name': 'Word'},
            {'name': 'Back'},
            {'name': 'Media'},
            {'name': 'ExampleList'},
            {'name': 'Notes'},
            {'name': 'Skip Replace'},
        ],
        templates=[{
            'name': 'Card 1',
            'qfmt': read('Card Template/front1.html'),
            'afmt': read('Card Template/back1.html'),
        }],
        css=read('Style/quizify.css'),
    )

def main():
    parser = argparse.ArgumentParser(description='Export Quizify .apkg')
    parser.add_argument('--no-card', action='store_true', help='Do not include sample card')
    args = parser.parse_args()

    model = build_model()
    deck = genanki.Deck(deck_id=1698754323, name='quizify-word-by:yelanyanyu')

    if not args.no_card:
        note = genanki.Note(model=model, fields=[
            '<b>ephemeral</b>',             # Word
            '<b>ephemeral</b> — transient, short-lived<br><br>'
            'From Greek <i>ephemeros</i> ("lasting one day").<br><br>'
            'Synonyms: transient, fleeting, momentary<br>'
            'Antonyms: permanent, eternal, perpetual',  # Back
            '',                               # Media (empty for now)
            'The beauty of cherry blossoms is ephemeral, lasting only a few days.||'
            'The ephemeral nature of youth is a common theme in poetry.||'
            'Social media trends are often ephemeral, disappearing within weeks.',  # ExampleList
            '<i>From Greek ephemeros — lasting only one day.</i>',  # Notes
            '',                               # Skip Replace
        ], tags=['GRE', 'vocabulary'])
        deck.add_note(note)

    out = os.path.join(BASE, 'Deck', 'quizify-nested-reveal-test.apkg')
    media_path = os.path.join(BASE, 'Card Template', '_quizify.js')
    pkg = genanki.Package(deck, media_files=[media_path])
    pkg.write_to_file(out)
    # Verify
    import zipfile
    with zipfile.ZipFile(out, 'r') as z:
        names = [n for n in z.namelist() if 'quizify' in n.lower() or n == 'media']
        print(f'  apkg contains: {names}')
    print(f'Exported: {out}')

if __name__ == '__main__':
    main()
