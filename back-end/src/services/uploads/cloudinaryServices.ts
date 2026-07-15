import { v2 as cloudinary } from 'cloudinary'
import { Readable } from 'node:stream'
import { envs } from '../../config/env.js'

cloudinary.config({
  cloud_name: envs['CLOUDINARY_CLOUD_NAME'],
  api_key: envs['CLOUDINARY_API_KEY'],
  api_secret: envs['CLOUDINARY_API_SECRET'],
})

interface UploadsResult {
  url: string
  key: string
  mimeType: string
  size: number
}

export const uploadImageToCloudinary = (file: Express.Multer.File): Promise<UploadsResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'casa-do-hamburguer/products', resource_type: 'image' },
      (error, result) => {
        if (error || !result) {
          const rejectionReason =
            error instanceof Error
              ? error
              : new Error('Cloudinary upload failed: no result returned')
          return reject(rejectionReason)
        }
        resolve({
          url: result.secure_url,
          key: result.public_id,
          mimeType: file.mimetype,
          size: file.size,
        })
      },
    )

    Readable.from(file.buffer).pipe(uploadStream)
  })
}
