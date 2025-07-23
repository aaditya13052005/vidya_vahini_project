from supabase import create_client
from config import Config
from collections import defaultdict
from supabase_integration import get_media_url

# Initialize Supabase client
supabase = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)

# Fetch all stories (story_id, title, author)
def get_all_stories():
    try:
        response = supabase.table("stories").select("story_id, title, author").order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        print(f"Error fetching all stories: {e}")
        return []

# Fetch full story data by story_id (with slides and timestamps)
def get_story_data(story_id):
    try:
        # Fetch the story metadata
        story_resp = supabase.table("stories").select("story_id, title, author").eq("story_id", story_id).single().execute()
        story = story_resp.data

        if not story:
            return None

        # Fetch the slides
        slides_resp = supabase.table("slides").select("slide_id, text, image_path, audio_path, video_path").eq("story_id", story_id).order("slide_id").execute()
        slides = slides_resp.data

        # Fetch the timestamps for all slide_ids
        slide_ids = [slide['slide_id'] for slide in slides]
        timestamp_map = defaultdict(list)

        if slide_ids:
            ts_resp = supabase.table("timestamps").select("slide_id, word, start_time, end_time").in_("slide_id", slide_ids).execute()
            for row in ts_resp.data:
                timestamp_map[row['slide_id']].append({
                    'word': row['word'],
                    'start_time': float(row['start_time']),
                    'end_time': float(row['end_time'])
                })

        # Attach timestamps to slides
        for slide in slides:
            slide['timestamps'] = timestamp_map.get(slide['slide_id'], [])

        return {
            'story_id': story['story_id'],
            'title': story['title'],
            'author': story.get('author'),
            'slides': slides
        }

    except Exception as e:
        print(f"Error fetching story data: {e}")
        return None

# Fetch dictionary entries for a story
def get_dictionary_for_story(story_id):
    try:
        dict_resp = supabase.table("word_dictionary").select("word, image_path").eq("story_id", story_id).execute()
        return {row['word'].lower(): row['image_path'] for row in dict_resp.data}
    except Exception as e:
        print(f"Error fetching dictionary: {e}")
        return {}
