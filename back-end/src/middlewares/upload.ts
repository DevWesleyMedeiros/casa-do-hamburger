import type { NextFunction, Request, Response } from 'express';
import { fileTypeFromBuffer } from 'file-type';
import multer from 'multer';
import { AppError } from '../errors/AppError.js';

const ACCEPTED_MIME_TYPES = new Set<string>(['image/png', 'image/jpeg', 'image/webp']);
const MAX_FILE_SIZE = 1024 * 1024 * 5;

export const uploadProductImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ACCEPTED_MIME_TYPES.has(file.mimetype)) {
      return cb(new AppError(400, 'Formato de imagem inválido. Use PNG, JPG ou WEBP'));
    }
    return cb(null, true);
  },
}).single('image');

// função para multipartformdate do avatar
/**
 * função para upload de avatar do usuário
 * @param req requisição
 * @param file arquivo do upload
 * @param cb callback para verificar o arquivo
 * @returns void
 */
export const uploadAvatarImg = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ACCEPTED_MIME_TYPES.has(file.mimetype)) {
      return cb(new AppError(400, 'Formato de imagem inválido. Use PNG, JPG ou WEBP'));
    }
    return cb(null, true);
  },
}).single('avatar');

export const validateImageMagicBytes = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    if (!req.file) return next();
    const detected = await fileTypeFromBuffer(req.file.buffer);
    if (!detected || !ACCEPTED_MIME_TYPES.has(detected.mime)) {
      throw new AppError(400, 'Arquivo corrumpido ou não encontrado');
    }
    next();
  } catch (error) {
    next(error);
  }
};
