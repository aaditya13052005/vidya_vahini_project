from flask import Flask, render_template
from config import Config
from supabase import create_client
from supabase_integration import get_media_url
from supabase_queries import get_all_stories, get_story_data, get_dictionary_for_story

app = Flask(__name__)
app.config.from_object(Config)

# Supabase Client Setup
supabase = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)

# Home Page Route – Lists All Stories
@app.route('/')
def home():
    stories = get_all_stories()
    return render_template('Home.html', stories=stories)

# Story Reader Route – Load Story by ID with word-level timestamps
@app.route('/story/<int:story_id>')
def read_story(story_id):
    story_data = get_story_data(story_id)
    if not story_data:
        return "Story not found", 404

    slides = story_data['slides']
    dict_map = get_dictionary_for_story(story_id)

    # Create highlighted text for each slide, wrapping dictionary words with images
    for slide in slides:
        highlighted_words = []
        for ts in slide['timestamps']:
            word = ts['word']
            start = ts['start_time']
            end = ts['end_time']
            lower_word = word.lower()

            if lower_word in dict_map:
                image_url = get_media_url(dict_map[lower_word])
                span = (
                    f'<span class="highlight word dict-word" data-start="{start}" '
                    f'data-end="{end}" data-image="{image_url}">{word}</span>'
                )
            else:
                span = (
                    f'<span class="highlight word" data-start="{start}" '
                    f'data-end="{end}">{word}</span>'
                )
            highlighted_words.append(span)

        slide['highlighted_text'] = ' '.join(highlighted_words)
        # Add media URLs if available
        slide['image_url'] = get_media_url(slide.get('image_path')) if slide.get('image_path') else None
        slide['audio_url'] = get_media_url(slide.get('audio_path')) if slide.get('audio_path') else None
        slide['video_url'] = get_media_url(slide.get('video_path')) if slide.get('video_path') else None

    return render_template('Storyreader.html', slides=slides, story_title=story_data['title'])

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False, port=5001)
