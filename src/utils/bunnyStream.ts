interface BunnyStreamUrls {
  embedUrl: string;
  directPlayUrl: string;
  hlsPlaylistUrl: string;
  thumbnailUrl: string;
  previewAnimationUrl: string;
}

export const getBunnyStreamUrls = (storageUrl: string, videoId: string, libraryId: string): BunnyStreamUrls => {
  const cdnUrl = `${storageUrl}/${videoId}`;
  const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;
  const directPlayUrl = `https://iframe.mediadelivery.net/play/${libraryId}/${videoId}`;

  return {
    embedUrl,
    directPlayUrl,
    hlsPlaylistUrl: `${cdnUrl}/playlist.m3u8`,
    thumbnailUrl: `${cdnUrl}/thumbnail.jpg`,
    previewAnimationUrl: `${cdnUrl}/preview.webp`
  };
};

export const extractVideoIdFromUrl = (url: string): string | null => {
  const embedMatch = url.match(/\/embed\/\d+\/([a-f0-9-]+)/);
  const directMatch = url.match(/\/play\/\d+\/([a-f0-9-]+)/);
  const cdnMatch = url.match(/\/([a-f0-9-]+)\/(?:thumbnail\.jpg|preview\.webp|playlist\.m3u8)/);
  
  return embedMatch?.[1] || directMatch?.[1] || cdnMatch?.[1] || null;
};

export const validateBunnyUrl = (url: string): boolean => {
  if (url.trim() === '-----') return true;

  const patterns = [
    /^https:\/\/iframe\.mediadelivery\.net\/embed\/\d+\/[a-f0-9-]+/,
    /^https:\/\/iframe\.mediadelivery\.net\/play\/\d+\/[a-f0-9-]+/,
    /^https:\/\/vz-[a-f0-9-]+\.b-cdn\.net\/[a-f0-9-]+/
  ];

  return patterns.some(pattern => pattern.test(url.trim()));
};