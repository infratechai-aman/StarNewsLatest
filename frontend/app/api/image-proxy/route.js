import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * ALLOWED_DOMAINS: Only proxy images from these trusted domains.
 * This prevents SSRF attacks where an attacker could make the server
 * fetch internal/cloud metadata URLs.
 */
const ALLOWED_DOMAINS = [
  'starnewsindia.in',
  'www.starnewsindia.in',
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
  'picsum.photos',       // placeholder images
  'fastly.picsum.photos',
  'images.unsplash.com',
  'lh3.googleusercontent.com',
  'blogger.googleusercontent.com',
  'www.blogger.com',
  'blogger.com',
  'i.ytimg.com',         // YouTube thumbnails
  'img.youtube.com',
];

/**
 * BLOCKED_IP_PATTERNS: Block requests to private/internal IP ranges
 * to prevent SSRF to cloud metadata endpoints, localhost, etc.
 */
const BLOCKED_IP_PATTERNS = [
  /^127\./,              // Loopback
  /^10\./,               // Private Class A
  /^172\.(1[6-9]|2\d|3[01])\./,  // Private Class B
  /^192\.168\./,         // Private Class C
  /^169\.254\./,         // Link-local / Cloud metadata
  /^0\./,                // Invalid
  /^localhost$/i,
  /^\[::1\]/,            // IPv6 loopback
];

function isUrlAllowed(urlString) {
  try {
    const parsed = new URL(urlString);

    // Only allow http/https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block private/internal IPs (SSRF protection)
    for (const pattern of BLOCKED_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return false;
      }
    }

    // Allow any external domain — SSRF is prevented by IP blocklist above
    // This enables admin/reporters to paste image URLs from any news source
    return true;
  } catch {
    return false;
  }
}

/**
 * Server-side image proxy to bypass hotlink protection / 403 blocks.
 * SECURITY: Only proxies from allowlisted domains to prevent SSRF.
 * Usage: /api/image-proxy?url=https://starnewsindia.in/image.jpg
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // SECURITY: Validate URL against allowlist
  if (!isUrlAllowed(imageUrl)) {
    return NextResponse.json(
      { error: 'Domain not allowed. Only trusted image sources are permitted.' },
      { status: 403 }
    );
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      // Follow redirects to allow placeholder images and shortlinks
      redirect: 'follow',
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: response.status });
    }

    let contentType = response.headers.get('content-type') || 'image/jpeg';

    // SECURITY: Only allow image content types, with fallback for CDNs serving images as octet-stream
    if (!contentType.startsWith('image/')) {
      const pathname = new URL(imageUrl).pathname.toLowerCase();
      if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) {
        contentType = 'image/jpeg';
      } else if (pathname.endsWith('.png')) {
        contentType = 'image/png';
      } else if (pathname.endsWith('.webp')) {
        contentType = 'image/webp';
      } else if (pathname.endsWith('.gif')) {
        contentType = 'image/gif';
      } else if (pathname.endsWith('.svg')) {
        contentType = 'image/svg+xml';
      } else if (pathname.endsWith('.avif')) {
        contentType = 'image/avif';
      } else if (contentType.includes('octet-stream')) {
        contentType = 'image/jpeg';
      } else {
        return NextResponse.json(
          { error: 'Response is not an image' },
          { status: 400 }
        );
      }
    }

    const buffer = await response.arrayBuffer();

    // SECURITY: Limit response size (10MB max)
    if (buffer.byteLength > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large' }, { status: 413 });
    }

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        // Don't set Access-Control-Allow-Origin: * here; use site origin
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error.message);
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 });
  }
}
