// services/menu-service/src/services/image.service.ts
// #image-upload #resize #s3-storage

import sharp from 'sharp';
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  region: process.env.AWS_REGION || 'us-east-1',
});

export class ImageService {
  // #resize-and-upload
  static async processAndUpload(
    buffer: Buffer,
    filename: string,
    cafeId: string
  ): Promise<string> {
    const resized = await sharp(buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    const key = `menus/${cafeId}/${Date.now()}-${filename}`;
    
    await s3.upload({
      Bucket: process.env.S3_BUCKET_MENU_IMAGES || 'cafe-menu-images',
      Key: key,
      Body: resized,
      ContentType: 'image/jpeg',
      CacheControl: 'public, max-age=31536000',
    }).promise();

    return `${process.env.S3_CDN_URL || ''}/${key}`;
  }
}
