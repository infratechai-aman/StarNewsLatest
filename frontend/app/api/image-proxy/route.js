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

    // Block private/internal IPs
    for (const pattern of BLOCKED_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return false;
      }
    }

    // Check against allowed domains
    for (const domain of ALLOWED_DOMAINS) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        return true;
      }
    }

    return false;
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': '',
      },
      // Follow redirects to allow placeholder images
      redirect: 'follow',
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // SECURITY: Only allow image content types
    if (!contentType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Response is not an image' },
        { status: 400 }
      );
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
