function toHex(red, green, blue) {
  return `#${[red, green, blue].map((channel) => Math.round(channel).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

function mixColor(color, target, amount) {
  const channels = [1, 3, 5].map((offset) => parseInt(color.slice(offset, offset + 2), 16));
  return toHex(...channels.map((channel) => channel * (1 - amount) + target * amount));
}

export function extractImagePalette(source) {
  return new Promise((resolve, reject) => {
    if (!source) return reject(new Error("Choose a background image first."));
    if (/\.(mp4|webm|mov)(?:[?#].*)?$/i.test(source)) return reject(new Error("Palette sync needs an image background."));

    const image = new Image();
    if (/^https?:\/\//i.test(source) && new URL(source).origin !== window.location.origin) {
      image.crossOrigin = "anonymous";
    }
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 48;
        canvas.height = 48;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) throw new Error("Could not read the background image.");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        const buckets = new Map();
        let totalBrightness = 0;
        let totalPixels = 0;

        for (let index = 0; index < pixels.length; index += 4) {
          const alpha = pixels[index + 3] / 255;
          if (alpha < 0.18) continue;
          const red = pixels[index];
          const green = pixels[index + 1];
          const blue = pixels[index + 2];
          const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
          const saturation = Math.max(red, green, blue) - Math.min(red, green, blue);
          totalBrightness += brightness;
          totalPixels += 1;

          if (brightness < 10 || brightness > 250) continue;
          const minSaturation = saturation < 12 ? 8 : 12;
          if (saturation < minSaturation) continue;

          const bucketKey = [red, green, blue].map((channel) => Math.floor(channel / 24)).join(":");
          const bucket = buckets.get(bucketKey) || { count: 0, red: 0, green: 0, blue: 0 };
          bucket.count += 1;
          bucket.red += red;
          bucket.green += green;
          bucket.blue += blue;
          buckets.set(bucketKey, bucket);
        }

        let dominant = [...buckets.values()].sort((left, right) => right.count - left.count)[0];
        if (!dominant && totalPixels > 0) {
          const average = { red: 0, green: 0, blue: 0 };
          for (let index = 0; index < pixels.length; index += 4) {
            const alpha = pixels[index + 3] / 255;
            if (alpha < 0.18) continue;
            average.red += pixels[index];
            average.green += pixels[index + 1];
            average.blue += pixels[index + 2];
          }
          dominant = {
            count: totalPixels,
            red: average.red,
            green: average.green,
            blue: average.blue,
          };
        }

        if (!dominant) throw new Error("Could not find a usable accent color in this image.");

        const averageRed = dominant.red / dominant.count;
        const averageGreen = dominant.green / dominant.count;
        const averageBlue = dominant.blue / dominant.count;
        let accent = toHex(averageRed, averageGreen, averageBlue);

        const avgBrightness = totalPixels > 0 ? totalBrightness / totalPixels : 0;
        if (avgBrightness > 200) {
          accent = mixColor(accent, 12, 0.65);
        }

        resolve({
          accent_color: accent,
          glow_color: accent,
          card_border_color: accent,
          card_bg_color: mixColor(accent, 8, 0.86),
          text_color: "#F5F7FA",
          desc_color: "#C5CBD3",
          link_bg_color: mixColor(accent, 8, 0.78),
          link_text_color: "#F5F7FA",
          bg_tint_color: mixColor(accent, 0, 0.75),
        });
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(new Error("Could not load the background image."));
    image.src = source;
  });
}
