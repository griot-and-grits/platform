# Adding New Videos to Griot and Grits

This guide provides step-by-step instructions for adding new video interviews to the Griot and Grits website.

## Overview

Adding a new video involves four main steps:
1. Generate metadata using AI tools (description, tags, context)
2. Upload and configure the video on YouTube using the AI-generated content
3. Update the videos.yaml metadata file
4. Update the filters.yaml file with new tags and people

## Step 1: Generate Metadata with AI Tools

**Before uploading to YouTube**, use AI tools (CoPilot, Gemini, ChatGPT, Claude) to generate content that you'll use both on YouTube and in the website metadata.

### Get the Transcription

1. If the video is already on YouTube, use YouTube's auto-generated transcription feature
2. Otherwise, use a transcription service to create a transcript of the interview

### Generate Description

Feed the transcription to an AI tool and ask it to create a 1-paragraph synopsis:

**Example Prompt:**
```
Based on this interview transcription, create a concise 1-paragraph synopsis (2-4 sentences) that captures the main themes and subject matter of this interview.
```

**Use this description for:**
- YouTube video description
- The `description` field in videos.yaml

### Extract Historical Context

Ask the AI to identify relevant years and locations discussed. Make sure to verify the content and the coordinates:

**Example Prompt:**
```
From the interview transcript, extract all historical context as a structured list. Each entry must follow this exact format:
- year: <four‑digit year or null if not explicitly stated> 
  location: 
    name: <place name as stated or clearly implied in the transcript> coordinates: [<latitude or null>, <longitude or null>]

Rules:
- Only include years explicitly mentioned or directly inferable from the transcript.
- If year is null, exclude the field from the entry.
- Locations must be real places referenced in the transcript.
- If coordinates are unknown, set them to null; do not guess.
- Do not add information not supported by the transcript.
- Keep the final output valid YAML.
- Use a service to extract the latitude and longitude based on the location names. Do not guess if you do not know.
- List them in chronological order.
```

**Use this information for:**
- The `historicalContext` field in videos.yaml

### Generate Tags

Ask the AI to suggest relevant tags based on existing categories:

**Example Prompt:**
```
Based on this interview transcription, suggest relevant tags that match these existing categories: https://raw.githubusercontent.com/griot-and-grits/gng-web/refs/heads/main/metadata/filters.yaml. If there are important themes not covered by these existing tags, suggest new ones that would help users discover similar content.

The format must be exactly as follows: 

tags: 
  - "tag1" 
  - "tag2" 
  - "tag3"

```

**Use these tags for:**
- YouTube SEO tags
- The `tags` field in videos.yaml
- Adding to filters.yaml

### Determine Title

Create titles for both YouTube and the website:

**YouTube Title (with prefix):**
Use the "Griot and Grits - [Subject/Topic]" format:
- "Griot and Grits - Mrs. Clark Talks Black Prisoner Cadavers"
- "Griot and Grits - The Storied Life of Ms. Gladys M. Williams"

**Website Title (without prefix):**
Use ONLY the [Subject/Topic] part for the `videos.yaml` file:
- "Mrs. Clark Talks Black Prisoner Cadavers"
- "The Storied Life of Ms. Gladys M. Williams"

**Example Prompt:**
```
Create a title for the video based on the transcript. Use exactly this format: "[name] — Chapter One: [title]" Example: "Irene Clark — Chapter Two: Confronting the Stereotypes of Africa"
```

## Step 2: Upload Video to YouTube

Now that you have your AI-generated content, upload your video to the [Griot and Grits YouTube channel](https://www.youtube.com/@GriotandGrits).

### Video Configuration

Configure the following settings when uploading to YouTube:

#### Basic Details

1. **Title**: Use the **YouTube title with the "Griot and Grits - " prefix** (e.g., "Griot and Grits - Mrs. Clark Talks Black Prisoner Cadavers")
   - Reference example: [https://youtu.be/Y48ON7_lUXE](https://youtu.be/Y48ON7_lUXE?si=rv1pGsnk-2Hu9zd9)

2. **Description**: Use the AI-generated 1-paragraph synopsis

3. **Tags**: Add the AI-generated SEO tags for discoverability

4. **Thumbnail**: Use YouTube's auto-generated thumbnails

#### Visibility & Audience

5. **Visibility**: Set to **Public**

6. **Audience**: Mark that the video is **NOT made for kids**

#### Playlist

7. **Add to Playlist**: Add the video to the **"Griot and Grits - Black Voices Worth Remembering, Black History Worth Sharing"** playlist

#### Advanced Settings

8. **License**: Select the **YouTube license agreement** (Standard YouTube License)

9. **AI Content Disclosure**: If the video contains AI elements such as:
   - AI-generated narration
   - AI-generated pictures or videos
   - Other AI-generated content

   **Check the box to flag it as having "Altered Content"**

10. **Automatic Features**: Enable the following:
    - ✅ Allow automatic chapters
    - ✅ Allow featured places
    - ✅ Allow automatic concepts

11. **Remixing**: **DO NOT** allow remixing (keep this disabled)

#### Comments & Engagement

12. **Comments**: Allow comments but set to **strict moderation**

13. **Likes**: Check the box to **show how many users like the video**

## Step 3: Update videos.yaml

The `metadata/videos.yaml` file contains all video metadata. Use the content you generated in Step 1 to populate these fields.

### Required Fields

```yaml
- id: "aB3dE5fG7hI"  # Use a random 11-character YouTube-style ID
  thumbnail: "URL"  # Cloudinary or image hosting URL
  title: "Video Title"
  interviewees:
    - "Person Name"
  description: "One paragraph synopsis"
  duration: "MM:SS"
  createdDate: "YYYY-MM-DDTHH:MM:SSZ"
  videoUrl: "https://www.youtube.com/watch?v=VIDEO_ID"
  featured: true/false
  historicalContext:
    - year: YYYY
      location:
        name: "City, State/Country"
        coordinates: [latitude, longitude]
  tags:
    - "Tag 1"
    - "Tag 2"
  people:
    - "Person Name"
```

### Field Details

#### `id`
- Must be a unique random string in YouTube video ID format
- Use 11 characters consisting of uppercase letters, lowercase letters, numbers, hyphens (-), and underscores (_)
- Example: "mE7xK2qR9Ld", "Bw5yP8vV3mN", "Y4xON7_lXUe"
- You can use an online random string generator or create one manually
- Ensure the ID doesn't already exist in the videos.yaml file

#### `title`
- Use the **website title WITHOUT the "Griot and Grits - " prefix**
- **Format**: `[Storyteller Name] — Chapter [Number]: [Thematic Subtitle]`
  - Use an em dash (—) not a hyphen (-)
  - Example: "Irene Clark — Chapter One: Black Prisoner Cadavers"
  - Example: "Dr. Oliver T. Reid — Chapter One: Growing Up Between Danger and Sanctuary"
  - Example: "Rickey Thomas — Chapter One: Roots, Work, and Quiet Strength"
  - Example: "Lynette Richardson — Chapter One: The Lessons of Home and the Lower East Side"
- For single-part stories (not part of a series), omit the chapter designation
- **Important**: This is just the title content, NOT "Griot and Grits - [Title]"

#### `description`
Use the 1-paragraph synopsis you generated in Step 1 with AI tools.

#### `historicalContext`
Use the years and locations you extracted in Step 1:
1. Find coordinates for each location using Google Maps or a geocoding service
2. Format: `[latitude, longitude]`

#### `tags`
Use the tags you generated in Step 1:
- **Important**: These should be based on existing tags in `metadata/filters.yaml`
- Ensure tags fit into existing categories when possible
- If new tags are needed, add them to `filters.yaml` (see Step 4)

#### `featured`
- Set to `true` only if this should be a featured video on the home page
- **Limit**: Try to keep no more than 6 featured videos
- If adding a new featured video, consider setting an existing one to `false`

#### `people`
- List all interviewees and people significantly discussed in the video
- These names will be added to filters.yaml as person filters

## Step 4: Update filters.yaml

The `metadata/filters.yaml` file contains all available tags and their popularity scores.

### Adding New Tags

If you created new tags in `videos.yaml` that don't exist in `filters.yaml`, add them:

```yaml
tags:
  - name: "New Tag Name"
    popularity: 0.5  # Adjust based on expected usage (0.0-1.0)
```

### Popularity Scoring

The `popularity` field determines the sort order of tags and topics on the collection page. Higher popularity values appear first in filter lists, making them more discoverable to users.

**Scoring Guidelines:**
- `1.0`: Very common/important tags used across many videos (appears first)
- `0.7-0.9`: Moderately common tags
- `0.4-0.6`: Less common but specific tags
- `0.1-0.3`: Rare or very specific tags (appears last)

**Use Cases:**
- Set higher popularity (`0.8-1.0`) for broad, frequently-used categories like "Personal Stories" or "Education"
- Set moderate popularity (`0.5-0.7`) for specific but recurring themes like "Medical History" or "Migration"
- Set lower popularity (`0.3-0.5`) for location-specific or person-specific tags
- Adjust popularity to prioritize certain topics/tags in the collection page filter ordering

### Adding People

**At minimum, add the interviewee's name to the filters.**

People are also added as tags in the filters.yaml file. Add each person mentioned in the `people` field of your video entry:

```yaml
tags:
  - name: "Person Name"
    popularity: 0.X  # Based on how many videos feature this person
```

## Example Workflow

### Complete Example

1. **Generate AI Content First**
   ```
   Prompt to AI: "Based on this transcription, create a 1-paragraph synopsis of this interview with Gladys Williams"

   Result: "Gladys Williams shares her journey from her early years in Washington, North Carolina, to her experiences in Brooklyn and beyond. She reflects on her dedication to work, education, and personal values, emphasizing resilience and integrity."

   Prompt to AI: "Extract the years and locations discussed in this interview"

   Result:
   - 1924: Washington, North Carolina
   - 1960: Brooklyn, New York

   Prompt to AI: "Suggest relevant tags for this interview based on these existing categories: [list from filters.yaml]"

   Result: Personal Stories, Work & Employment, Education, Resilience, Brooklyn, North Carolina
   ```

2. **Upload to YouTube**
   - Title: "Griot and Grits - The Storied Life of Ms. Gladys M. Williams" (WITH prefix)
   - Description: Use the AI-generated synopsis
   - Tags: Add the AI-generated tags (Personal Stories, Work & Employment, etc.)
   - Select license, choose thumbnail

3. **Add to videos.yaml**
   ```yaml
   - id: "Bw5yP8vV3mN"  # Generate a random 11-character YouTube-style ID
     thumbnail: "https://res.cloudinary.com/ducxigdil/image/upload/v1739470989/image_vfqft9.png"
     title: "The Storied Life of Ms. Gladys M. Williams"  # WITHOUT "Griot and Grits - " prefix
     interviewees:
       - "Gladys M. Williams"
     description: "Gladys Williams shares her journey from her early years in Washington, North Carolina, to her experiences in Brooklyn and beyond. She reflects on her dedication to work, education, and personal values, emphasizing resilience and integrity."
     duration: "12:56"
     createdDate: "2023-09-14T10:25:00Z"
     videoUrl: "https://www.youtube.com/watch?v=Bwk5yovVvmM"
     featured: true
     historicalContext:
       - year: 1924
         location:
           name: "Washington, North Carolina"
           coordinates: [35.5468, -77.0522]
       - year: 1960
         location:
           name: "Brooklyn, New York"
           coordinates: [40.6782, -73.9442]
     tags:
       - "Personal Stories"
       - "Work & Employment"
       - "Education"
       - "Resilience"
       - "Brooklyn"
       - "North Carolina"
     people:
       - "Gladys M. Williams"
   ```

4. **Update filters.yaml**
   ```yaml
   tags:
     # ... existing tags ...
     - name: "Gladys M. Williams"
       popularity: 0.5
     - name: "Brooklyn"
       popularity: 0.4
     - name: "North Carolina"
       popularity: 0.4
   ```

## Testing

After updating the files:

1. Save both `metadata/videos.yaml` and `metadata/filters.yaml`
2. Run the development server: `npm run dev`
3. Navigate to the Collection page
4. Verify your new video appears
5. Test filtering by the new tags and person names
6. Check that featured videos display correctly on the home page (if applicable)

## Tips

- Keep descriptions concise but informative (2-4 sentences or one paragraph)
- Use consistent tag capitalization (Title Case)
- Double-check YAML indentation (use spaces, not tabs)
- Verify coordinates are in the correct format: `[latitude, longitude]`
- Review the video on the site before committing changes
- Consider the user experience: will these tags help people find related content?

## Sharing Direct Video Links

You can share direct links to specific videos on the collection page using the `video` URL parameter. This will automatically open the video player when someone visits the link.

### Link Format

```
https://yourwebsite.com/collection?video=VIDEO_ID
```

### Example

For a video with ID "Ue1a7sw8xW0":
```
https://griotandgrits.org/collection?video=Ue1a7sw8xW0
```

When users click this link, they will:
1. Land on the collection page
2. See the video player automatically open with that specific video
3. Be able to close the player and browse other videos

### Use Cases

- Share specific interviews on social media
- Link to videos from blog posts or newsletters
- Reference particular stories in emails or presentations
- Create curated playlists by sharing multiple links

## Common Issues

**Video doesn't appear**: Check that the YAML syntax is valid (proper indentation, quotes, etc.)

**Filters don't work**: Ensure tags in `videos.yaml` exactly match names in `filters.yaml`

**Featured video limit exceeded**: Set older featured videos to `featured: false`

**Build errors**: Validate your YAML using an online YAML validator

**Direct link not working**: Verify the video ID matches exactly with the `id` field in videos.yaml
