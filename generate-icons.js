import sharp from 'sharp';
import fs from 'fs';

const sizes = [16, 32, 48, 128];
const input = 'public/icon.svg';

async function generate() {
    for (const size of sizes) {
        await sharp(input)
            .resize(size, size)
            .png()
            .toFile(`public/icon-${size}.png`);
    }
}

generate().catch(console.error);
