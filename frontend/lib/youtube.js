// Extracts an 11-char YouTube video id from a URL or a bare id. Returns null if none.
export function extractYouTubeId(url) {
  if (!url) return null
  const str = String(url).trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str
  const m = str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/|shorts\/))([a-zA-Z0-9_-]{11})/)
    || str.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

// Video id embedded in a stored YouTube thumbnail URL (img.youtube.com / i.ytimg.com)
export function youtubeIdFromThumbnail(url) {
  const m = typeof url === 'string' && url.match(/(?:img\.youtube\.com|i\.ytimg\.com)\/vi\/([a-zA-Z0-9_-]{11})\//)
  return m ? m[1] : null
}
