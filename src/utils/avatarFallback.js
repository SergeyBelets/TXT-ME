const buildFallbackInitials = (avatarId) => {
  const source = String(avatarId || '');
  const cleaned = source.replace(/[^a-z0-9]/gi, '').toUpperCase();
  if (cleaned.length >= 2) return cleaned.slice(0, 2);
  if (cleaned.length === 1) return `${cleaned}A`;
  return 'AV';
};

export const getAvatarFallbackDataUrl = (avatarId) => {
  const initials = buildFallbackInitials(avatarId);
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">',
    '<rect width="100%" height="100%" fill="#CBD5E1"/>',
    '<text x="50%" y="54%" font-family="Arial, sans-serif" font-size="24" fill="#1F2937" text-anchor="middle">',
    initials,
    '</text>',
    '</svg>'
  ].join('');
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};
