![Banner](assets/images/JCT.jpeg)

# Just Creative Tools (JCT)

Just Creative Tools is a collection of super simple design tools. Everything runs completely on your computer inside your web browser. This means your files and photos are 100% safe. They are never sent to any server or stored in the cloud.

## What is inside?

* **Canvas Image & Text Editor**: Add photos and transparent elements onto a multi-layer canvas. Draw sketches with the brush, add custom text layers, and import your own custom font files. Adjust colors using controls for brightness, contrast, saturation, hue, and blur. You can also re-order layers, hide layers, change opacity, and resize elements freely or with a locked aspect ratio.
* **Portable .JCT Project Files**: Save your projects permanently. Similar to Photoshop's `.psd` or Pixlr's `.pxz`, you can export your canvas workspace as a `.jct` file on your hard drive to back it up, share it, or import it later to restore all your layers, data, and custom fonts.
* **Smart Image Resizer**: Resize your photo for any social media site or platform without weird cropping. It fills in the background automatically.
* **Freehand & Shape Cropper**: Crop your photos to standard sizes or draw a freehand line with your mouse to cut out any shape you want.
* **Webcam Photo Cropper**: Take a photo using your computer's webcam and crop it instantly.
* **GIF Creator & Editor**: Make moving pictures (GIFs) and customize them with text overlays, fun emojis, and custom drawings.
* **Secure Local Storage**: All of your layers, custom fonts, drawings, and canvas designs are automatically and securely saved on your device using your browser's local storage. Your progress is restored when you open the page again.

## How does it work?

Unlike other design sites, JCT does not upload your images. It uses modern technology inside your browser to do all the processing locally. This makes the tools extremely fast and completely private.

## How to run the project on your computer

1. Make sure you have Node.js installed on your computer.
2. Open your terminal in the project folder and install the dependencies:
   ```bash
   npm install
   ```
3. Start the local server:
   ```bash
   npm run dev
   ```
4. Open the link shown in your terminal (usually http://localhost:5173) in your web browser.

## Built With

* **Vite + React**: For a fast and responsive interface.
* **idb-keyval**: For saving your progress locally in your browser's IndexedDB.
* **Lucide React**: For clean and simple icons.
