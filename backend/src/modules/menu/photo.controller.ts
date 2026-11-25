import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import prisma from "../../shared/config/prisma.client";
import { getUploadedFileUrl } from "../../middleware/upload";
import { redisService } from "../../shared/services/redis.service";

const invalidateMenu = () => redisService.invalidateMenuCache().catch(() => {});

export const uploadPhotos = async (req: Request, res: Response) => {
    try {
        const { itemId } = req.params;
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) return res.status(400).json({ message: "No files uploaded" });

        // Make the first photo primary if the item has none yet
        const hasPrimary = await prisma.menuItemPhoto.count({ where: { menuItemId: itemId, isPrimary: true } });
        const photoData = files.map((file, i) => ({
            menuItemId: itemId,
            url: getUploadedFileUrl(file),
            isPrimary: hasPrimary === 0 && i === 0,
        }));

        await prisma.menuItemPhoto.createMany({ data: photoData });
        await invalidateMenu();

        res.status(201).json({ message: "Photos uploaded successfully" });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "Failed to upload photos" });
    }
};

export const setPrimaryPhoto = async (req: Request, res: Response) => {
    try {
        const { photoId, itemId } = req.body;
        if (!photoId || !itemId) return res.status(400).json({ message: "photoId and itemId are required" });

        await prisma.$transaction([
            prisma.menuItemPhoto.updateMany({
                where: { menuItemId: itemId },
                data: { isPrimary: false },
            }),
            prisma.menuItemPhoto.update({
                where: { id: photoId },
                data: { isPrimary: true },
            }),
        ]);
        await invalidateMenu();

        res.json({ message: "Primary photo updated" });
    } catch (error) {
        console.error("Set primary photo error:", error);
        res.status(500).json({ message: "Failed to update primary photo" });
    }
};

export const deletePhoto = async (req: Request, res: Response) => {
    try {
        const { photoId } = req.params;

        const photo = await prisma.menuItemPhoto.findUnique({ where: { id: photoId } });
        if (!photo) return res.status(404).json({ message: "Photo not found" });

        await prisma.menuItemPhoto.delete({ where: { id: photoId } });

        // Promote another photo to primary if we removed the primary one
        if (photo.isPrimary) {
            const next = await prisma.menuItemPhoto.findFirst({ where: { menuItemId: photo.menuItemId } });
            if (next) await prisma.menuItemPhoto.update({ where: { id: next.id }, data: { isPrimary: true } });
        }

        // Remove locally stored files (Cloudinary assets are left in place)
        if (photo.url.includes("/uploads/")) {
            const fileName = path.basename(photo.url);
            const filePath = path.join(__dirname, "../../../uploads", fileName);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        await invalidateMenu();

        res.json({ message: "Photo deleted" });
    } catch (error) {
        console.error("Delete photo error:", error);
        res.status(500).json({ message: "Failed to delete photo" });
    }
};
