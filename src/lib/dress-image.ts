export function getDressImageUrl(imageUrl: string | null | undefined, dressId: string) {
  if (imageUrl) {
    return imageUrl;
  }

  return `/uploads/dresses/${dressId}.missing`;
}