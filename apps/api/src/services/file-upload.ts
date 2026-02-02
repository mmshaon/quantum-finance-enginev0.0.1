import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { AppError } from '../plugins/error-handler';

const uploadSchema = z.object({
  entityType: z.string().optional(),
  entityId: z.string().optional(),
});

export const fileUploadService: FastifyPluginAsync = async (server) => {
  // Ensure upload directory exists
  const uploadDir = path.join(process.cwd(), 'uploads');
  await fs.mkdir(uploadDir, { recursive: true });

  // POST /api/files/upload
  server.post('/upload', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const data = await request.file();
    
    if (!data) {
      throw new AppError('No file uploaded', 400, 'NO_FILE');
    }

    const userId = (request.user as any).id;
    const { entityType, entityId } = uploadSchema.parse(request.body || {});

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(data.mimetype)) {
      throw new AppError('Invalid file type', 400, 'INVALID_FILE_TYPE');
    }

    const buffer = await data.toBuffer();
    if (buffer.length > maxSize) {
      throw new AppError('File too large', 400, 'FILE_TOO_LARGE');
    }

    // Generate unique filename
    const ext = path.extname(data.filename);
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
    const filePath = path.join(uploadDir, filename);

    // Process image if needed
    let processedBuffer = buffer;
    if (data.mimetype.startsWith('image/')) {
      processedBuffer = await sharp(buffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
    }

    // Save file
    await fs.writeFile(filePath, processedBuffer);

    // Save to database
    const fileRecord = await server.prisma.fileUpload.create({
      data: {
        filename: filename,
        originalName: data.filename,
        mimetype: data.mimetype,
        size: processedBuffer.length,
        path: filePath,
        uploadedById: userId,
        companyId: (request.user as any).companyId,
      },
    });

    return reply.send({
      success: true,
      data: {
        id: fileRecord.id,
        filename: fileRecord.filename,
        originalName: fileRecord.originalName,
        url: `/api/files/${fileRecord.filename}`,
        size: fileRecord.size,
      },
    });
  });

  // GET /api/files/:filename
  server.get('/:filename', async (request, reply) => {
    const { filename } = request.params as { filename: string };
    
    const fileRecord = await server.prisma.fileUpload.findFirst({
      where: { fileName: filename },
    });

    if (!fileRecord) {
      throw new AppError('File not found', 404, 'FILE_NOT_FOUND');
    }

    try {
      const fileBuffer = await fs.readFile(fileRecord.path);
      
      reply.type(fileRecord.mimetype);
      return reply.send(fileBuffer);
    } catch (error) {
      throw new AppError('File not accessible', 500, 'FILE_ACCESS_ERROR');
    }
  });

  // DELETE /api/files/:id
  server.delete('/:id', {
    onRequest: [server.authenticate],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = (request.user as any).id;

    const fileRecord = await server.prisma.fileUpload.findUnique({
      where: { id },
    });

    if (!fileRecord) {
      throw new AppError('File not found', 404, 'FILE_NOT_FOUND');
    }

    if (fileRecord.uploadedById !== userId) {
      throw new AppError('Unauthorized', 403, 'UNAUTHORIZED');
    }

    // Delete file from filesystem
    try {
      await fs.unlink(fileRecord.path);
    } catch (error) {
      // File might already be deleted, continue
    }

    // Delete from database
    await server.prisma.fileUpload.delete({
      where: { id },
    });

    return reply.send({
      success: true,
      data: { message: 'File deleted successfully' },
    });
  });
};