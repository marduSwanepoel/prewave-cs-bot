import axios from 'axios';
import sharp from 'sharp';
import * as fs from 'fs';

export class ImageHandler {

    static async downloadImageAndResize(url: string): Promise<string> {
        try {
            // Download image using axios
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const imageData: Buffer = Buffer.from(response.data);

            // Check if image size is less than 20MB
            const constrainedImage: Buffer = await this.constrainImage(imageData)

            return constrainedImage.toString('base64');
        } catch (error) {
            console.error('Error:', error)
            throw error
        }
    }

    static async constrainImage(buffer: Buffer, quality = 82, drop = 2): Promise<Buffer> {

        const done = await sharp(buffer).resize({
            width: 1000,
            height: 1000,
            fit: sharp.fit.inside
        }).jpeg({
            quality
        }).toBuffer();

        if (done.byteLength > 2000000) {
            return this.constrainImage(buffer, quality - drop);
        }

        return done;
    }

}
